"""Google Places search (cost-capped) + photo proxy, and sponsor merging."""
import re
import time
import uuid
import httpx
from urllib.parse import quote_plus
from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import Response

from core import (
    db, logger, rate_limit, GOOGLE_API_KEY, FALLBACK_IMG,
    PRICE_ENUM_TO_SYMBOL, SYMBOL_ENUMS, pick_placeholder,
    haversine_miles, prettify_type, maps_url, doordash_url, order_url,
    _ZIP_GEO_CACHE, _PLACES_CACHE, _PLACES_TTL, _google_reserve,
)

from models import PlacesSearchRequest

router = APIRouter()

# Google primaryType fragments that are food/drink venues — excluded from the Shops
# category so a "record store" search never lands on a steakhouse or brewery.
_NON_SHOP_TYPES = (
    "restaurant", "bar", "pub", "cafe", "coffee", "bakery", "brewery", "brewpub",
    "winery", "food", "meal", "steak", "grill", "diner", "pizz", "deli",
    "night_club", "ice_cream", "dessert", "donut", "fast_food", "sandwich",
)


async def fetch_active_sponsors(req: PlacesSearchRequest):
    docs = await db.sponsors.find({"active": True, "category": req.category}, {"_id": 0}).sort("created_at", -1).to_list(100)
    out = []
    for s in docs:
        if req.cuisines and s['cuisine'] not in req.cuisines:
            continue
        if req.price_levels:
            allowed = set()
            for lvl in req.price_levels:
                allowed |= {sym for sym, enums in SYMBOL_ENUMS.items() if lvl in enums}
            if s['price'] not in allowed:
                continue
        s = dict(s)
        # Public allowlist — never expose internal/PII fields.
        pub = {
            "id": s.get("id"), "name": s.get("name"), "cuisine": s.get("cuisine"),
            "price": s.get("price"), "category": s.get("category"),
            "address": s.get("address", ""), "description": s.get("description", ""),
            "rating": s.get("rating", 4.7), "distance": s.get("distance", 0.5),
            "website": s.get("website", ""),
            "sponsored": True,
            "open_now": s.get("open_now", True),
            "image": s.get("image") or FALLBACK_IMG,
        }
        pub["google_url"] = maps_url(pub["name"], pub["address"])
        pub["doordash_url"] = doordash_url(pub["name"], pub["address"])
        pub["order_url"] = order_url(pub["name"], pub["address"])
        out.append(pub)
    # Count one impression per sponsor shown in this search
    ids = [s['id'] for s in out if s.get('id')]
    if ids:
        await db.sponsors.update_many({"id": {"$in": ids}}, {"$inc": {"impressions": 1}})
    return out


def merge_sponsors(sponsors, items):
    names = {sp['name'].lower() for sp in sponsors}
    return sponsors + [r for r in items if r.get('name', '').lower() not in names]


_PLACES_FIELD_MASK = (
    "places.displayName,places.rating,places.priceLevel,places.primaryType,"
    "places.formattedAddress,places.location,places.photos,places.googleMapsUri,"
    "places.currentOpeningHours.openNow"
)


async def _resolve_latlng(http, req: PlacesSearchRequest):
    """Return (lat, lng) from explicit coords or a (cached/billed) ZIP geocode."""
    if req.lat is not None and req.lng is not None:
        return req.lat, req.lng
    cached = _ZIP_GEO_CACHE.get(req.zip_code)
    if cached:
        return cached
    # The geocode leg is a separate billed Google call — reserve it against
    # today's cap so cold-ZIP searches can't quietly double our spend.
    if not await _google_reserve():
        raise HTTPException(status_code=503, detail="search-budget-exceeded")
    geo = await http.get("https://maps.googleapis.com/maps/api/geocode/json", params={
        "components": f"postal_code:{req.zip_code}|country:US",
        "key": GOOGLE_API_KEY,
    })
    gd = geo.json()
    if gd.get("status") != "OK" or not gd.get("results"):
        raise HTTPException(status_code=400, detail="Could not find that ZIP code")
    loc = gd["results"][0]["geometry"]["location"]
    latlng = (loc["lat"], loc["lng"])
    _ZIP_GEO_CACHE[req.zip_code] = latlng
    return latlng


def _build_text_query(req: PlacesSearchRequest) -> str:
    """Compose the Google textQuery from the category + selected cuisines."""
    cuisines = " ".join(req.cuisines)
    if req.category == "drinks":
        return ((cuisines or "coffee boba tea smoothie") + " cafe drinks").strip()
    if req.category == "bars":
        if not req.cuisines:
            return "bar pub liquor store"
        # Liquor / package stores aren't "bars" — don't force the bar/pub suffix,
        # which would bury them in the results.
        if "liquor store" in cuisines.lower():
            return cuisines.strip()
        return (cuisines + " bar pub").strip()
    if req.category == "desserts":
        return ((cuisines or "dessert ice cream bakery") + " dessert shop").strip()
    if req.category == "shops":
        return (cuisines or "antique thrift vintage consignment resale shop").strip()
    if req.category == "fuel":
        return (cuisines or "gas station ev charging station").strip()
    return (cuisines + " restaurant").strip()


def _build_search_payload(req: PlacesSearchRequest, lat: float, lng: float) -> dict:
    payload = {
        "textQuery": _build_text_query(req),
        "locationBias": {"circle": {"center": {"latitude": lat, "longitude": lng}, "radius": min(req.radius_miles * 1609.34, 50000.0)}},
        "maxResultCount": 20,
    }
    if req.price_levels:
        payload["priceLevels"] = req.price_levels
    if req.open_now:
        payload["openNow"] = True
    return payload


def _place_to_result(p: dict, req: PlacesSearchRequest, lat: float, lng: float):
    """Map one Google place to a result dict, or None if it should be filtered out."""
    ploc = p.get("location") or {}
    plat, plng = ploc.get("latitude"), ploc.get("longitude")
    dist = haversine_miles(lat, lng, plat, plng) if plat is not None and plng is not None else 0.0
    if dist > req.radius_miles:
        return None
    # Shops roulette must not surface food/drink venues that merely match a
    # store-ish keyword (e.g. "Vinyl Steakhouse" under Record Store).
    if req.category == "shops":
        ptype = (p.get("primaryType") or "").lower()
        if any(k in ptype for k in _NON_SHOP_TYPES):
            return None
    photos = p.get("photos") or []
    photo_url = f"/api/places/photo?name={quote_plus(photos[0]['name'])}" if photos else ""
    name = p.get("displayName", {}).get("text", "Unknown")
    address = p.get("formattedAddress", "")
    return {
        "id": str(uuid.uuid4()),
        "name": name,
        "cuisine": prettify_type(p.get("primaryType"), req.category),
        "price": PRICE_ENUM_TO_SYMBOL.get(p.get("priceLevel"), "$$"),
        "rating": float(p.get("rating") or 0.0),
        "distance": round(dist, 1),
        "lat": plat,
        "lng": plng,
        "address": address,
        "description": address,
        # Free placeholder for grid/deck; real (billed) Google photo only for the reveal.
        "image": pick_placeholder(req.category, name),
        "photo_url": photo_url,
        "sponsored": False,
        "google_url": p.get("googleMapsUri") or maps_url(name, address),
        "doordash_url": doordash_url(name, address),
        "order_url": order_url(name, address),
        "open_now": (p.get("currentOpeningHours") or {}).get("openNow", True),
    }


async def google_places_search(req: PlacesSearchRequest):
    async with httpx.AsyncClient(timeout=15) as http:
        lat, lng = await _resolve_latlng(http, req)
        pres = await http.post(
            "https://places.googleapis.com/v1/places:searchText",
            headers={
                "X-Goog-Api-Key": GOOGLE_API_KEY,
                "X-Goog-FieldMask": _PLACES_FIELD_MASK,
                "Content-Type": "application/json",
            },
            json=_build_search_payload(req, lat, lng),
        )
        pd = pres.json()
        if "error" in pd:
            logger.warning(f"Places API error: {str(pd['error'])[:300]}")
            raise HTTPException(status_code=502, detail="Places search is temporarily unavailable")
        out = [r for p in pd.get("places", []) if (r := _place_to_result(p, req, lat, lng))]
        out.sort(key=lambda r: r["distance"])
        return out


@router.get("/places/photo", dependencies=[Depends(rate_limit(200))])
async def places_photo(name: str):
    """Proxy Google Places photo bytes so the API key is never exposed to the client."""
    if not GOOGLE_API_KEY or not re.fullmatch(r"places/[A-Za-z0-9_-]+/photos/[A-Za-z0-9_-]+", name):
        raise HTTPException(status_code=404, detail="Not found")
    url = f"https://places.googleapis.com/v1/{name}/media?maxWidthPx=800&key={GOOGLE_API_KEY}"
    async with httpx.AsyncClient(timeout=15, follow_redirects=True) as http:
        r = await http.get(url)
        if r.status_code != 200:
            raise HTTPException(status_code=404, detail="Photo unavailable")
        return Response(
            content=r.content,
            media_type=r.headers.get("content-type", "image/jpeg"),
            headers={"Cache-Control": "public, max-age=86400"},
        )


@router.get("/geocode", dependencies=[Depends(rate_limit(30))])
async def geocode_zip(zip: str):
    """Resolve a US ZIP to lat/lng (cached, cost-capped). Used for multi-point crawls."""
    z = (zip or "").strip()
    if not re.fullmatch(r"\d{5}", z):
        raise HTTPException(status_code=400, detail="zip must be 5 digits")
    cached = _ZIP_GEO_CACHE.get(z)
    if cached:
        return {"lat": cached[0], "lng": cached[1]}
    if not GOOGLE_API_KEY:
        raise HTTPException(status_code=503, detail="Geocoding unavailable")
    if not await _google_reserve():
        raise HTTPException(status_code=503, detail="search-budget-exceeded")
    async with httpx.AsyncClient(timeout=15) as http:
        geo = await http.get("https://maps.googleapis.com/maps/api/geocode/json", params={
            "components": f"postal_code:{z}|country:US", "key": GOOGLE_API_KEY,
        })
        gd = geo.json()
        if gd.get("status") != "OK" or not gd.get("results"):
            raise HTTPException(status_code=400, detail="Could not find that ZIP code")
        loc = gd["results"][0]["geometry"]["location"]
    _ZIP_GEO_CACHE[z] = (loc["lat"], loc["lng"])
    return {"lat": loc["lat"], "lng": loc["lng"]}


def _places_cache_key(req: PlacesSearchRequest):
    lat = round(req.lat, 3) if req.lat is not None else None
    lng = round(req.lng, 3) if req.lng is not None else None
    return (
        req.category, req.zip_code, lat, lng, round(req.radius_miles, 1),
        tuple(sorted(req.cuisines or [])), tuple(sorted(req.price_levels or [])), bool(req.open_now),
    )


async def cached_google_search(req: PlacesSearchRequest):
    """Serve billed Google Places results from a short-lived cache to curb cost abuse."""
    key = _places_cache_key(req)
    now = time.time()
    hit = _PLACES_CACHE.get(key)
    if hit and now - hit[0] < _PLACES_TTL:
        return hit[1]
    if not await _google_reserve():
        logger.warning("Google daily search cap reached — serving curated fallback")
        raise HTTPException(status_code=503, detail="search-budget-exceeded")
    results = await google_places_search(req)
    _PLACES_CACHE[key] = (now, results)
    if len(_PLACES_CACHE) > 2000:
        for k in [k for k, v in list(_PLACES_CACHE.items()) if now - v[0] >= _PLACES_TTL]:
            _PLACES_CACHE.pop(k, None)
    return results


@router.post("/places/search", dependencies=[Depends(rate_limit(20))])
async def places_search(req: PlacesSearchRequest):
    sponsors = await fetch_active_sponsors(req)
    if GOOGLE_API_KEY and (req.zip_code or (req.lat is not None and req.lng is not None)):
        try:
            results = await cached_google_search(req)
            if results:
                return {"source": "google", "restaurants": merge_sponsors(sponsors, results)}
        except HTTPException as e:
            if e.status_code == 400:
                raise
            logger.warning(f"Places search fell back to curated: {e.detail}")
        except (httpx.HTTPError, ValueError, KeyError) as e:
            # Real Google failures (timeout, connection reset, bad/HTML JSON body) must
            # not 500 the core roulette — degrade gracefully to curated seed data.
            logger.warning(f"Places search fell back to curated (google error): {type(e).__name__}: {e}")

    # Fallback to curated seed data
    items = await db.restaurants.find({"status": {"$ne": "pending"}}, {"_id": 0}).to_list(1000)
    items = [r for r in items if r.get('category', 'food') == req.category]
    if req.cuisines:
        items = [r for r in items if r['cuisine'] in req.cuisines]
    if req.open_now:
        items = [r for r in items if r.get('open_now', True)]
    items = [r for r in items if r.get('distance', 0) <= req.radius_miles]
    if req.price_levels:
        allowed = set()
        for lvl in req.price_levels:
            allowed |= {s for s, enums in SYMBOL_ENUMS.items() if lvl in enums}
        items = [r for r in items if r['price'] in allowed]
    items.sort(key=lambda r: (not r.get('sponsored', False), r['distance']))
    for r in items:
        r['google_url'] = maps_url(r['name'], r.get('address', ''))
        r['doordash_url'] = doordash_url(r['name'], r.get('address', ''))
        r['order_url'] = order_url(r['name'], r.get('address', ''))
    return {"source": "curated", "restaurants": merge_sponsors(sponsors, items)}
