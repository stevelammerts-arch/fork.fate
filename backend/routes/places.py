"""Google Places search (cost-capped) + photo proxy, and sponsor merging."""
import asyncio
import re
import time
import uuid
from itertools import zip_longest
import httpx
from urllib.parse import quote_plus
from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import Response

from core import (
    db, logger, rate_limit, GOOGLE_API_KEY, FALLBACK_IMG,
    PRICE_ENUM_TO_SYMBOL, SYMBOL_ENUMS, pick_placeholder,
    haversine_miles, prettify_type, maps_url, doordash_url, ubereats_url, grubhub_url, order_url,
    _ZIP_GEO_CACHE, _PLACES_CACHE, _PLACES_TTL, _google_reserve,
    _PHOTO_CACHE, _PHOTO_TTL, _PHOTO_CACHE_MAX, _PHOTO_CACHE_MAX_BYTES,
)

from models import PlacesSearchRequest
from routes.weather import weather_snapshot

router = APIRouter()

# Google primaryType fragments that are food/drink venues — excluded from the Shops
# category so a "record store" search never lands on a steakhouse or brewery.
_NON_SHOP_TYPES = (
    "restaurant", "bar", "pub", "cafe", "coffee", "bakery", "brewery", "brewpub",
    "winery", "food", "meal", "steak", "grill", "diner", "pizz", "deli",
    "night_club", "ice_cream", "dessert", "donut", "fast_food", "sandwich",
)

# Explore with no chips picked: let the sky choose the kind of outing. Anything the
# user explicitly selects always wins over this.
WEATHER_DEFAULT_QUERIES = {
    "outdoor": "state park hiking trail scenic overlook botanical garden playground",
    "indoor": "museum aquarium science center bowling arcade indoor climbing gym",
    "water": "swimming hole public pool water park splash pad lake beach",
    "snow": "ski resort snow tubing ice skating museum indoor climbing gym",
}


async def fetch_active_sponsors(req: PlacesSearchRequest):
    # Only "local" tier sponsors occupy fate-deck slots. Chain-coupon-only
    # sponsors are surfaced through /api/coupons/chains-nearby as a bonus
    # offer strip beside the winner — they never crowd out local hidden gems.
    docs = await db.sponsors.find(
        {
            "active": True,
            "category": req.category,
            "$or": [{"tier": "local"}, {"tier": {"$exists": False}}, {"tier": None}],
        },
        {"_id": 0},
    ).sort("created_at", -1).to_list(100)
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
            "coupon": s.get("coupon"),
        }
        pub["google_url"] = maps_url(pub["name"], pub["address"])
        pub["doordash_url"] = doordash_url(pub["name"], pub["address"])
        pub["ubereats_url"] = ubereats_url(pub["name"], pub["address"])
        pub["grubhub_url"] = grubhub_url(pub["name"], pub["address"])
        pub["order_url"] = order_url(pub["name"], pub["address"])
        out.append(pub)
    # Count one impression per sponsor shown in this search
    ids = [s['id'] for s in out if s.get('id')]
    if ids:
        from routes.sponsors import _log_impression_events
        await db.sponsors.update_many({"id": {"$in": ids}}, {"$inc": {"impressions": 1}})
        await _log_impression_events(ids)
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
    """Return (lat, lng) from explicit coords, a (cached/billed) ZIP geocode,
    or a free-text place query like 'Omaha Nebraska' or 'Yellowstone'."""
    if req.lat is not None and req.lng is not None:
        return req.lat, req.lng
    # Prefer ZIP path when both are provided (5-digit ZIP is more precise).
    if req.zip_code:
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
    # Free-text destination (city, state, landmark) — geocode via Google's
    # 'address' param which accepts anything a user might type into Google Maps.
    if req.place_query:
        cache_key = req.place_query.lower()
        cached = _ZIP_GEO_CACHE.get(cache_key)
        if cached:
            return cached
        if not await _google_reserve():
            raise HTTPException(status_code=503, detail="search-budget-exceeded")
        geo = await http.get("https://maps.googleapis.com/maps/api/geocode/json", params={
            "address": req.place_query,
            "key": GOOGLE_API_KEY,
        })
        gd = geo.json()
        if gd.get("status") != "OK" or not gd.get("results"):
            raise HTTPException(status_code=400, detail=f"Couldn't find '{req.place_query}'. Try adding a state or country.")
        loc = gd["results"][0]["geometry"]["location"]
        latlng = (loc["lat"], loc["lng"])
        _ZIP_GEO_CACHE[cache_key] = latlng
        return latlng
    raise HTTPException(status_code=400, detail="Provide a location, ZIP code, or destination")


def _build_text_query(category: str, cuisines: list) -> str:
    """Compose the Google textQuery from the category + selected cuisines."""
    joined = " ".join(cuisines)
    if category == "drinks":
        return ((joined or "coffee boba tea smoothie") + " cafe drinks").strip()
    if category == "bars":
        if not cuisines:
            return "bar pub liquor store"
        # Liquor / package stores aren't "bars" — don't force the bar/pub suffix,
        # which would bury them in the results.
        if "liquor store" in joined.lower():
            return joined.strip()
        return (joined + " bar pub").strip()
    if category == "desserts":
        return ((joined or "dessert ice cream bakery") + " dessert shop").strip()
    if category == "shops":
        return (joined or "antique thrift vintage consignment resale shop").strip()
    if category == "fuel":
        return (joined or "gas station ev charging station").strip()
    # "explore" = things to DO (outdoor recreation + local attractions). No suffix is
    # appended: these queries are already place-type phrases ("hiking trail",
    # "state park") and bolting a noun on the end pushes Google toward businesses
    # ABOUT the activity (outfitters, gear shops) instead of the place itself.
    if category == "explore":
        return (joined or WEATHER_DEFAULT_QUERIES["outdoor"]).strip()
    # "stay" = somewhere to sleep. Lodging is its own tab rather than an `explore`
    # cuisine because it needs different copy and has no delivery/price semantics.
    if category == "stay":
        return (joined or "campground rv park cabin rental lodge motel").strip()
    return (joined + " restaurant").strip()


# Selecting two chips used to produce ONE mashed-up query ("Breakfast Filipino
# restaurant"), which Google keyword-matches loosely — that's how Subway turned up
# under Breakfast + Filipino. Each chip now gets its own query, and results are
# checked against the chip below. Fragments are matched against Google's
# primaryType and the place name; a chip with no entry here isn't checkable
# (e.g. "Comfort Food") and keeps every result, as before.
_CUISINE_TYPE_HINTS = {
    # food
    "italian": ("italian",), "mexican": ("mexican", "taqueria"), "tex-mex": ("mexican", "tex mex"),
    "chinese": ("chinese", "szechuan", "cantonese"), "japanese": ("japanese", "izakaya"),
    "sushi": ("sushi", "japanese"), "indian": ("indian",), "thai": ("thai",), "korean": ("korean",),
    "vietnamese": ("vietnamese", "pho"), "filipino": ("filipino",), "malaysian": ("malaysian",),
    "indonesian": ("indonesian",), "chicken wings": ("wing", "chicken"), "fried chicken": ("chicken",),
    "burgers": ("hamburger", "burger"), "steakhouse": ("steak",), "diner": ("diner",),
    "southern": ("southern", "soul"), "soul food": ("soul", "southern"), "cajun": ("cajun", "creole"),
    "mediterranean": ("mediterranean",), "greek": ("greek",), "spanish": ("spanish", "tapas"),
    "french": ("french",), "middle eastern": ("middle_eastern", "middle eastern", "halal", "shawarma"),
    "lebanese": ("lebanese", "middle_eastern"), "turkish": ("turkish",), "ethiopian": ("ethiopian", "african"),
    "caribbean": ("caribbean", "jamaican"), "cuban": ("cuban",), "peruvian": ("peruvian",),
    "brazilian": ("brazilian",), "hawaiian": ("hawaiian", "poke"), "seafood": ("seafood", "fish", "oyster", "crab"),
    "poke": ("poke", "hawaiian"), "pizza": ("pizza",), "pasta": ("italian", "pasta"),
    "tacos": ("mexican", "taco"), "sandwiches": ("sandwich", "deli", "sub"), "banh mi": ("vietnamese", "banh mi"),
    "deli": ("deli", "sandwich"), "ramen": ("ramen", "japanese"), "noodles": ("noodle", "ramen", "pho"),
    "pho": ("pho", "vietnamese"), "dumplings": ("dumpling", "chinese"), "breakfast": ("breakfast", "brunch", "diner", "pancake"),
    "brunch": ("brunch", "breakfast"), "salads": ("salad",), "halal": ("halal", "middle_eastern"),
    "vegan": ("vegan", "vegetarian"), "vegetarian": ("vegetarian", "vegan"),
    "bbq": ("barbecue", "bbq", "smokehouse"), "cafe": ("cafe", "coffee"), "gastropub": ("pub", "gastropub", "bar"),
    "hot pot": ("hot pot", "hotpot", "chinese"), "dim sum": ("dim sum", "chinese"), "buffet": ("buffet",),
    "food trucks": ("food truck", "truck"), "fast food": ("fast_food",), "tapas": ("tapas", "spanish"),
    "catering": ("catering", "caterer"),
    # desserts
    "cake shops": ("cake", "bakery", "pastry"), "custom cakes": ("cake", "bakery", "pastry"),
    "wedding cakes": ("cake", "bakery", "pastry"),
    # bars
    "brewery": ("brewery", "brewpub", "brewing"), "beer garden": ("beer", "biergarten", "garten"),
    "taproom": ("tap", "brewery"), "distillery": ("distillery", "distilling"), "beer": ("beer", "brewery", "pub"),
    "wine": ("wine",), "winery": ("winery", "vineyard", "wine"), "wine bar": ("wine",), "wine tasting": ("wine", "vineyard"),
    "champagne bar": ("champagne", "wine"), "cider house": ("cider",), "cocktails": ("cocktail", "bar", "lounge"),
    "whiskey": ("whiskey", "whisky", "bourbon"), "liquor": ("liquor",), "liquor store": ("liquor", "wine", "package"),
    "spirits": ("liquor", "spirits", "distillery"), "margaritas": ("mexican", "margarita", "cantina"),
    "tequila bar": ("tequila", "mexican", "cantina"), "mezcal bar": ("mezcal", "mexican"), "tiki": ("tiki", "polynesian"),
    "pub": ("pub", "tavern"), "sports bar": ("sports", "bar"), "irish bar": ("irish", "pub"),
    "dive bar": ("bar", "tavern"), "rooftop bar": ("rooftop", "bar"), "lounge": ("lounge", "bar"),
    "speakeasy": ("speakeasy", "cocktail", "bar"), "nightclub": ("night_club", "nightclub", "club"),
    "karaoke": ("karaoke",), "cigar bar": ("cigar",), "hookah lounge": ("hookah", "shisha"),
    "live music": ("live music", "music", "concert"), "jazz bar": ("jazz",), "piano bar": ("piano",),
    "comedy club": ("comedy",), "arcade bar": ("arcade", "barcade"), "bowling": ("bowling",),
    "mini golf": ("golf", "putt"), "axe throwing": ("axe",), "pool": ("pool", "billiard"), "darts": ("dart",),
}


_MAX_CUISINE_QUERIES = 4

# Sightseeing chips are English words that businesses also use in their names
# ("The Lighthouse Restaurant", "Lighthouse Care and Counseling"), so for these the
# place's Google primaryType must ALSO look like an attraction.
_SIGHTSEEING_CHIPS = {
    "lighthouses", "national monuments", "landmarks", "observation decks", "roadside attractions",
    "historic sites", "scenic overlooks", "waterfalls",
}
_ATTRACTION_TYPE_FRAGMENTS = (
    "tourist", "attraction", "landmark", "historical", "monument", "observation",
    "park", "museum", "cultural", "point_of_interest", "beach", "natural",
)


def _matches_cuisine(p: dict, cuisine: str) -> bool:
    key = (cuisine or "").lower()
    ptype = (p.get("primaryType") or "").lower()
    if key in _SIGHTSEEING_CHIPS and not any(f in ptype for f in _ATTRACTION_TYPE_FRAGMENTS):
        return False
    hints = _CUISINE_TYPE_HINTS.get(key)
    if not hints:
        return True
    name = ((p.get("displayName") or {}).get("text") or "").lower()
    ptype = ptype.replace("_", " ")
    return any(h.replace("_", " ") in ptype or h.replace("_", " ") in name for h in hints)


def _build_search_payload(req: PlacesSearchRequest, lat: float, lng: float, text_query: str) -> dict:
    payload = {
        "textQuery": text_query,
        "locationBias": {"circle": {"center": {"latitude": lat, "longitude": lng}, "radius": min(req.radius_miles * 1609.34, 50000.0)}},
        "maxResultCount": 20,
    }
    if req.price_levels:
        payload["priceLevels"] = req.price_levels
    if req.open_now:
        payload["openNow"] = True
    return payload


def _place_to_result(p: dict, req: PlacesSearchRequest, lat: float, lng: float, cuisine: str | None = None):
    """Map one Google place to a result dict, or None if it should be filtered out."""
    ploc = p.get("location") or {}
    plat, plng = ploc.get("latitude"), ploc.get("longitude")
    dist = haversine_miles(lat, lng, plat, plng) if plat is not None and plng is not None else 0.0
    if dist > req.radius_miles:
        return None
    # Shops/Explore/Fuel roulettes must not surface food/drink venues that merely
    # match a keyword (e.g. "Vinyl Steakhouse" under Record Store, or "The
    # Lighthouse Restaurant" under Lighthouses).
    if req.category in ("shops", "explore", "fuel"):
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
        "cuisine": cuisine or prettify_type(p.get("primaryType"), req.category),
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
        # Stamp the searched category onto every Google result. Without it the
        # frontend's delivery guards (`r.category !== "shops"` etc.) silently passed
        # for ALL live results, because the field simply didn't exist — so shops and
        # fuel tiles were showing DoorDash links again as soon as a Google key was set.
        "category": req.category,
        "google_url": p.get("googleMapsUri") or maps_url(name, address),
        "doordash_url": doordash_url(name, address),
        "ubereats_url": ubereats_url(name, address),
        "grubhub_url": grubhub_url(name, address),
        "order_url": order_url(name, address),
        "open_now": (p.get("currentOpeningHours") or {}).get("openNow", True),
    }


async def google_places_search(req: PlacesSearchRequest):
    """One Google text search per selected chip, merged.

    A single mashed query ("Breakfast Filipino restaurant") let Google return
    places matching neither chip, so each chip is searched separately and its
    results are relevance-checked against that chip (see _matches_cuisine).
    """
    async with httpx.AsyncClient(timeout=15) as http:
        lat, lng = await _resolve_latlng(http, req)
        # Cap the fan-out: each query is a billed Google call.
        chips = (req.cuisines or [])[:_MAX_CUISINE_QUERIES]
        wx = None
        if req.category == "explore" and not chips:
            # Nothing picked, so let the forecast choose the kind of outing.
            wx = await weather_snapshot(lat, lng)
        queries = [(c, _build_text_query(req.category, [c])) for c in chips] or [
            (None, WEATHER_DEFAULT_QUERIES[wx["bias"]] if wx else _build_text_query(req.category, []))
        ]

        async def run(cuisine, text_query, needs_budget):
            # The first query's budget was already reserved by cached_google_search.
            if needs_budget and not await _google_reserve():
                return []
            pres = await http.post(
                "https://places.googleapis.com/v1/places:searchText",
                headers={
                    "X-Goog-Api-Key": GOOGLE_API_KEY,
                    "X-Goog-FieldMask": _PLACES_FIELD_MASK,
                    "Content-Type": "application/json",
                },
                json=_build_search_payload(req, lat, lng, text_query),
            )
            pd = pres.json()
            if "error" in pd:
                logger.warning(f"Places API error: {str(pd['error'])[:300]}")
                if len(queries) == 1:
                    raise HTTPException(status_code=502, detail="Places search is temporarily unavailable")
                return []
            out = []
            for p in pd.get("places", []):
                if cuisine and not _matches_cuisine(p, cuisine):
                    continue
                if r := _place_to_result(p, req, lat, lng, cuisine):
                    out.append(r)
            return out

        batches = await asyncio.gather(*[run(c, q, i > 0) for i, (c, q) in enumerate(queries)])

        # Interleave the per-chip batches so one chip can't dominate the deck,
        # de-duping places that matched more than one chip.
        seen, out = set(), []
        for row in zip_longest(*batches):
            for r in row:
                if r is None:
                    continue
                key = (r["name"].lower(), r.get("address", "").lower())
                if key in seen:
                    continue
                seen.add(key)
                out.append(r)
        return out, wx


@router.get("/places/photo", dependencies=[Depends(rate_limit(200))])
async def places_photo(name: str):
    """Proxy Google Places photo bytes so the API key is never exposed to the client.

    Photo media fetches are billed by Google exactly like searches, so a cache
    miss must reserve against the same daily budget — otherwise an attacker with
    a handful of valid photo tokens and rotating IPs could run up the bill past
    GOOGLE_SEARCH_DAILY_CAP (SEC-004).
    """
    if not GOOGLE_API_KEY or not re.fullmatch(r"places/[A-Za-z0-9_-]+/photos/[A-Za-z0-9_-]+", name):
        raise HTTPException(status_code=404, detail="Not found")

    now = time.time()
    hit = _PHOTO_CACHE.get(name)
    if hit and now - hit[0] < _PHOTO_TTL:
        return Response(
            content=hit[1],
            media_type=hit[2],
            headers={"Cache-Control": "public, max-age=86400", "X-Photo-Cache": "hit"},
        )

    if not await _google_reserve():
        logger.warning("Google daily cap reached — photo proxy refusing new fetch")
        raise HTTPException(status_code=503, detail="search-budget-exceeded")

    url = f"https://places.googleapis.com/v1/{name}/media?maxWidthPx=800&key={GOOGLE_API_KEY}"
    async with httpx.AsyncClient(timeout=15, follow_redirects=True) as http:
        r = await http.get(url)
        if r.status_code != 200:
            raise HTTPException(status_code=404, detail="Photo unavailable")
        content = r.content
        ctype = r.headers.get("content-type", "image/jpeg")

    # OVERSIZED PHOTOS: anything above the cache ceiling would never be
    # cached — every view would re-bill the Google budget and ship huge
    # originals to phones. Recompress to JPEG so it fits the cache.
    if len(content) > _PHOTO_CACHE_MAX_BYTES:
        try:
            from io import BytesIO
            from PIL import Image as PILImage
            im = PILImage.open(BytesIO(content)).convert("RGB")
            buf = BytesIO()
            im.save(buf, "JPEG", quality=72, optimize=True)
            if buf.tell() < len(content):
                content = buf.getvalue()
                ctype = "image/jpeg"
        except Exception:  # corrupt/unsupported image — serve the original
            logger.warning("photo recompression failed for %s", name)

    if len(content) <= _PHOTO_CACHE_MAX_BYTES:
        if len(_PHOTO_CACHE) >= _PHOTO_CACHE_MAX:
            for k in [k for k, v in list(_PHOTO_CACHE.items()) if now - v[0] >= _PHOTO_TTL]:
                _PHOTO_CACHE.pop(k, None)
            while len(_PHOTO_CACHE) >= _PHOTO_CACHE_MAX:
                _PHOTO_CACHE.pop(next(iter(_PHOTO_CACHE)), None)  # drop oldest inserted
        _PHOTO_CACHE[name] = (now, content, ctype)

    return Response(
        content=content,
        media_type=ctype,
        headers={"Cache-Control": "public, max-age=86400", "X-Photo-Cache": "miss"},
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


# ─── Essentials (Nearby Help) ─────────────────────────────────────────────────
# Non-roulette safety flow: given a location, return the 3 nearest venues for
# each requested emergency/urgent category (ER, urgent care, dentist, vet,
# pharmacy, gas station). No sponsor merging, no cuisine filters — just the
# nearest, sorted by driving distance.
ESSENTIALS_QUERIES = {
    "er": "emergency room hospital",
    "urgent_care": "urgent care walk-in clinic",
    "dentist": "24 hour dentist emergency dental",
    "vet": "veterinarian emergency animal hospital",
    "pharmacy": "24 hour pharmacy",
    "gas": "gas station",
    "food_bank": "food bank food pantry community kitchen soup kitchen",
    "va": "VA hospital veterans affairs medical center outpatient clinic",
}


async def _essentials_resolve_location(lat: float | None, lng: float | None, zip: str | None) -> tuple[float, float]:
    """Resolve lat/lng from explicit coords or a 5-digit US ZIP (cached)."""
    if lat is not None and lng is not None:
        return lat, lng
    if not zip or not re.fullmatch(r"\d{5}", zip.strip()):
        raise HTTPException(status_code=400, detail="Provide lat/lng or a 5-digit US ZIP")
    cached = _ZIP_GEO_CACHE.get(zip.strip())
    if cached:
        return cached
    if not GOOGLE_API_KEY:
        raise HTTPException(status_code=503, detail="Geocoding unavailable")
    if not await _google_reserve():
        raise HTTPException(status_code=503, detail="search-budget-exceeded")
    async with httpx.AsyncClient(timeout=15) as http:
        geo = await http.get("https://maps.googleapis.com/maps/api/geocode/json", params={
            "components": f"postal_code:{zip.strip()}|country:US", "key": GOOGLE_API_KEY,
        })
        gd = geo.json()
        if gd.get("status") != "OK" or not gd.get("results"):
            raise HTTPException(status_code=400, detail="Could not find that ZIP code")
        loc = gd["results"][0]["geometry"]["location"]
        _ZIP_GEO_CACHE[zip.strip()] = (loc["lat"], loc["lng"])
        return loc["lat"], loc["lng"]


def _essential_row(p: dict, lat: float, lng: float) -> dict:
    """Shape one Google place into the essentials response row."""
    loc_v = p.get("location") or {}
    lat2 = loc_v.get("latitude"); lng2 = loc_v.get("longitude")
    miles = round(haversine_miles(lat, lng, lat2, lng2), 1) if lat2 and lng2 else None
    name = (p.get("displayName") or {}).get("text") or ""
    addr = p.get("formattedAddress") or ""
    return {
        "name": name,
        "address": addr,
        "distance": miles,
        "phone": p.get("internationalPhoneNumber") or "",
        "website": p.get("websiteUri") or "",
        "open_now": ((p.get("currentOpeningHours") or {}).get("openNow")),
        "rating": p.get("rating"),
        "reviews": p.get("userRatingCount"),
        "maps_url": maps_url(name, addr),
    }


@router.get("/places/essentials", dependencies=[Depends(rate_limit(20))])
async def places_essentials(lat: float | None = None, lng: float | None = None,
                             zip: str | None = None, categories: str = "",
                             radius_mi: float = 25.0):
    """Return top-3 nearest venues per requested essentials category.

    Query params:
      - lat/lng OR zip (5-digit US) — one is required
      - categories: comma-separated subset of er|urgent_care|dentist|vet|pharmacy|food_bank|gas
                    (empty = all)
      - radius_mi: search radius in miles (default 25, clamped 1-100)
    """
    # Clamp radius and convert to meters for Google's locationBias.circle
    radius_mi = max(1.0, min(100.0, float(radius_mi or 25)))
    radius_m = int(radius_mi * 1609.34)
    lat, lng = await _essentials_resolve_location(lat, lng, zip)

    wanted = [c.strip() for c in categories.split(",") if c.strip()] or list(ESSENTIALS_QUERIES.keys())
    wanted = [c for c in wanted if c in ESSENTIALS_QUERIES]
    if not wanted:
        return {"lat": lat, "lng": lng, "categories": {}}

    if not GOOGLE_API_KEY:
        return {"lat": lat, "lng": lng, "categories": {c: [] for c in wanted}}

    field_mask = "places.displayName,places.formattedAddress,places.location,places.rating,places.userRatingCount,places.currentOpeningHours.openNow,places.internationalPhoneNumber,places.websiteUri"

    async def one_category(cat: str):
        if not await _google_reserve():
            return cat, []
        async with httpx.AsyncClient(timeout=20) as http:
            r = await http.post(
                "https://places.googleapis.com/v1/places:searchText",
                headers={
                    "X-Goog-Api-Key": GOOGLE_API_KEY,
                    "X-Goog-FieldMask": field_mask,
                    "Content-Type": "application/json",
                },
                json={
                    "textQuery": ESSENTIALS_QUERIES[cat],
                    "locationBias": {
                        "circle": {"center": {"latitude": lat, "longitude": lng}, "radius": radius_m},
                    },
                    "maxResultCount": 8,
                    "rankPreference": "DISTANCE",
                },
            )
            pd = r.json()
            if "error" in pd:
                logger.warning(f"Essentials {cat} error: {str(pd['error'])[:200]}")
                return cat, []
            return cat, [_essential_row(p, lat, lng) for p in (pd.get("places") or [])[:3]]

    results = await asyncio.gather(*[one_category(c) for c in wanted])
    return {"lat": lat, "lng": lng, "categories": dict(results)}


def _places_cache_key(req: PlacesSearchRequest):
    lat = round(req.lat, 3) if req.lat is not None else None
    lng = round(req.lng, 3) if req.lng is not None else None
    place_q = (req.place_query or "").strip().lower() or None
    return (
        req.category, req.zip_code, place_q, lat, lng, round(req.radius_miles, 1),
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
    if GOOGLE_API_KEY and (req.zip_code or req.place_query or (req.lat is not None and req.lng is not None)):
        try:
            results, wx = await cached_google_search(req)
            if results:
                out = {"source": "google", "restaurants": merge_sponsors(sponsors, results)}
                if wx:
                    out["weather"] = wx
                return out
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
        r['ubereats_url'] = ubereats_url(r['name'], r.get('address', ''))
        r['grubhub_url'] = grubhub_url(r['name'], r.get('address', ''))
        r['order_url'] = order_url(r['name'], r.get('address', ''))
    return {"source": "curated", "restaurants": merge_sponsors(sponsors, items)}
