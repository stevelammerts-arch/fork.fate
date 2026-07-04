from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import secrets
import math
import httpx
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from urllib.parse import quote_plus
from datetime import datetime, timezone


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

logging.basicConfig(level=logging.INFO,
                    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

app = FastAPI()
api_router = APIRouter(prefix="/api")

GOOGLE_API_KEY = os.environ.get('GOOGLE_API_KEY')
FALLBACK_IMG = "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?crop=entropy&cs=srgb&fm=jpg&q=85"
MAX_RADIUS_MILES = 50.0

PRICE_ENUM_TO_SYMBOL = {
    "PRICE_LEVEL_FREE": "$",
    "PRICE_LEVEL_INEXPENSIVE": "$",
    "PRICE_LEVEL_MODERATE": "$$",
    "PRICE_LEVEL_EXPENSIVE": "$$$",
    "PRICE_LEVEL_VERY_EXPENSIVE": "$$$$",
}
SYMBOL_ENUMS = {
    "$": {"PRICE_LEVEL_FREE", "PRICE_LEVEL_INEXPENSIVE"},
    "$$": {"PRICE_LEVEL_MODERATE"},
    "$$$": {"PRICE_LEVEL_EXPENSIVE"},
    "$$$$": {"PRICE_LEVEL_VERY_EXPENSIVE"},
}


def haversine_miles(lat1, lon1, lat2, lon2):
    R = 3958.8
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlmb = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dlmb / 2) ** 2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def prettify_type(t):
    if not t:
        return "Restaurant"
    return t.replace("_restaurant", "").replace("_", " ").title()


def maps_url(name, address=""):
    return f"https://www.google.com/maps/search/?api=1&query={quote_plus((name + ' ' + address).strip())}"


# ---------- Models ----------
class Restaurant(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    cuisine: str
    price: str  # "$", "$$", "$$$"
    rating: float = 4.5
    distance: float = 1.0  # km
    description: str = ""
    address: str = ""
    image: str = ""
    sponsored: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class RestaurantCreate(BaseModel):
    name: str
    cuisine: str
    price: str
    rating: float = 4.5
    distance: float = 1.0
    description: str = ""
    address: str = ""
    image: str = ""
    sponsored: bool = False


class SpinRequest(BaseModel):
    cuisines: List[str] = []
    prices: List[str] = []
    max_distance: Optional[float] = None


class PlacesSearchRequest(BaseModel):
    zip_code: Optional[str] = None
    cuisines: List[str] = []
    price_levels: List[str] = []


# ---------- Seed data ----------
SEED = [
    {"name": "Olive & Ember", "cuisine": "Italian", "price": "$$", "rating": 4.7, "distance": 0.8, "sponsored": True,
     "description": "Wood-fired pizzas and hand-rolled pasta in a warm, candle-lit room.", "address": "12 Maple Ave",
     "image": "https://images.unsplash.com/photo-1564759296729-771e78c26df7?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NTYxODd8MHwxfHNlYXJjaHw0fHxnb3VybWV0JTIwcmVzdGF1cmFudCUyMGZvb2QlMjBkaXNoJTIwcGxhdGVkfGVufDB8fHx8MTc4MzIwNDE1Nnww&ixlib=rb-4.1.0&q=85"},
    {"name": "The Copper Grill", "cuisine": "Steakhouse", "price": "$$$", "rating": 4.8, "distance": 2.3,
     "description": "Dry-aged cuts and bold sauces plated tableside.", "address": "88 Harbor St",
     "image": "https://images.unsplash.com/photo-1663530761401-15eefb544889?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NTYxODd8MHwxfHNlYXJjaHwyfHxnb3VybWV0JTIwcmVzdGF1cmFudCUyMGZvb2QlMjBkaXNoJTIwcGxhdGVkfGVufDB8fHx8MTc4MzIwNDE1Nnww&ixlib=rb-4.1.0&q=85"},
    {"name": "Nori House", "cuisine": "Japanese", "price": "$$", "rating": 4.6, "distance": 1.5,
     "description": "Omakase sushi and salmon donburi from a tiny counter kitchen.", "address": "5 Lantern Ln",
     "image": "https://images.unsplash.com/photo-1467003909585-2f8a72700288?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NTYxODd8MHwxfHNlYXJjaHwxfHxnb3VybWV0JTIwcmVzdGF1cmFudCUyMGZvb2QlMjBkaXNoJTIwcGxhdGVkfGVufDB8fHx8MTc4MzIwNDE1Nnww&ixlib=rb-4.1.0&q=85"},
    {"name": "Barrel & Bean", "cuisine": "Cafe", "price": "$", "rating": 4.4, "distance": 0.4,
     "description": "Slow-brew coffee, sourdough toasts and all-day brunch.", "address": "3 Corner Rd",
     "image": "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzMzV8MHwxfHNlYXJjaHwxfHxyZXN0YXVyYW50JTIwaW50ZXJpb3IlMjBhbWJpYW5jZXxlbnwwfHx8fDE3ODMyMDQxNTZ8MA&ixlib=rb-4.1.0&q=85"},
    {"name": "Casa Verde", "cuisine": "Mexican", "price": "$", "rating": 4.5, "distance": 1.1,
     "description": "Street tacos, smoky salsas and fresh lime margaritas.", "address": "44 Sol Blvd",
     "image": "https://images.unsplash.com/photo-1590846406792-0adc7f938f1d?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzMzV8MHwxfHNlYXJjaHwzfHxyZXN0YXVyYW50JTIwaW50ZXJpb3IlMjBhbWJpYW5jZXxlbnwwfHx8fDE3ODMyMDQxNTZ8MA&ixlib=rb-4.1.0&q=85"},
    {"name": "Saffron Route", "cuisine": "Indian", "price": "$$", "rating": 4.7, "distance": 2.9,
     "description": "Slow-cooked curries, tandoor breads and fragrant biryanis.", "address": "21 Spice Way",
     "image": "https://images.unsplash.com/photo-1585937421612-70a008356fbe?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3MHx8fGVufDB8fHx8&ixlib=rb-4.1.0&q=85"},
    {"name": "Golden Wok", "cuisine": "Chinese", "price": "$", "rating": 4.3, "distance": 1.8,
     "description": "Hand-pulled noodles and blistered dumplings from the wok.", "address": "9 Jade St",
     "image": "https://images.unsplash.com/photo-1552611052-33e04de081de?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3MHx8fGVufDB8fHx8&ixlib=rb-4.1.0&q=85"},
    {"name": "The Green Fork", "cuisine": "Vegan", "price": "$$", "rating": 4.6, "distance": 0.9,
     "description": "Plant-forward bowls, house ferments and cold-pressed juices.", "address": "17 Garden Pl",
     "image": "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3MHx8fGVufDB8fHx8&ixlib=rb-4.1.0&q=85"},
    {"name": "Harborline", "cuisine": "Seafood", "price": "$$$", "rating": 4.9, "distance": 3.4, "sponsored": True,
     "description": "Daily catch, chilled towers and coastal white wines.", "address": "1 Pier View",
     "image": "https://images.unsplash.com/photo-1559737558-2f5a35f4523b?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3MHx8fGVufDB8fHx8&ixlib=rb-4.1.0&q=85"},
    {"name": "Smoke & Stack", "cuisine": "Burgers", "price": "$", "rating": 4.4, "distance": 1.3,
     "description": "Smashed patties, house pickles and thick-cut fries.", "address": "30 Grill Rd",
     "image": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3MHx8fGVufDB8fHx8&ixlib=rb-4.1.0&q=85"},
    {"name": "Petit Marais", "cuisine": "French", "price": "$$$", "rating": 4.8, "distance": 2.0,
     "description": "Bistro classics, buttery pastries and natural wine.", "address": "7 Rue Belle",
     "image": "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3MHx8fGVufDB8fHx8&ixlib=rb-4.1.0&q=85"},
    {"name": "Mezze Lane", "cuisine": "Mediterranean", "price": "$$", "rating": 4.6, "distance": 1.6,
     "description": "Charred flatbreads, dips and slow-roasted lamb.", "address": "58 Cedar Ct",
     "image": "https://images.unsplash.com/photo-1544025162-d76694265947?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3MHx8fGVufDB8fHx8&ixlib=rb-4.1.0&q=85"},
    {"name": "Bangkok Orchid", "cuisine": "Thai", "price": "$$", "rating": 4.7, "distance": 4.2,
     "description": "Fiery green curry, pad thai and mango sticky rice.", "address": "62 Lotus St",
     "image": "https://images.unsplash.com/photo-1559314809-0d155014e29e?crop=entropy&cs=srgb&fm=jpg&q=85"},
    {"name": "Seoul Kitchen", "cuisine": "Korean", "price": "$$", "rating": 4.6, "distance": 6.5,
     "description": "Sizzling bibimbap, tabletop BBQ and kimchi stews.", "address": "9 Hangang Rd",
     "image": "https://images.unsplash.com/photo-1498654896293-37aacf113fd9?crop=entropy&cs=srgb&fm=jpg&q=85"},
    {"name": "Slice District", "cuisine": "Pizza", "price": "$", "rating": 4.5, "distance": 2.7,
     "description": "Blistered Neapolitan pies from a 900° oven.", "address": "14 Dough Ave",
     "image": "https://images.unsplash.com/photo-1513104890138-7c749659a591?crop=entropy&cs=srgb&fm=jpg&q=85"},
    {"name": "The Diner on 5th", "cuisine": "American", "price": "$", "rating": 4.3, "distance": 3.1,
     "description": "All-day pancakes, milkshakes and bottomless coffee.", "address": "5th & Main",
     "image": "https://images.unsplash.com/photo-1550547660-d9450f859349?crop=entropy&cs=srgb&fm=jpg&q=85"},
    {"name": "Pho Saigon", "cuisine": "Vietnamese", "price": "$", "rating": 4.6, "distance": 7.8,
     "description": "Steaming pho, crisp banh mi and iced coffee.", "address": "23 Mekong Ln",
     "image": "https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?crop=entropy&cs=srgb&fm=jpg&q=85"},
    {"name": "Ember & Oak BBQ", "cuisine": "BBQ", "price": "$$", "rating": 4.8, "distance": 12.4, "sponsored": True,
     "description": "Low-and-slow brisket, ribs and burnt ends.", "address": "40 Smokehouse Rd",
     "image": "https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?crop=entropy&cs=srgb&fm=jpg&q=85"},
    {"name": "Santorini Blue", "cuisine": "Greek", "price": "$$", "rating": 4.7, "distance": 9.3,
     "description": "Grilled octopus, souvlaki and honey-drizzled baklava.", "address": "11 Aegean Way",
     "image": "https://images.unsplash.com/photo-1600335895229-6e75511892c8?crop=entropy&cs=srgb&fm=jpg&q=85"},
    {"name": "Tokyo Ramen Bar", "cuisine": "Japanese", "price": "$", "rating": 4.7, "distance": 5.6,
     "description": "Rich tonkotsu broth and springy hand-cut noodles.", "address": "8 Shinjuku St",
     "image": "https://images.unsplash.com/photo-1557872943-16a5ac26437e?crop=entropy&cs=srgb&fm=jpg&q=85"},
    {"name": "El Pastor", "cuisine": "Mexican", "price": "$$", "rating": 4.6, "distance": 15.2,
     "description": "Al pastor off the trompo, elote and mezcal flights.", "address": "77 Agave Blvd",
     "image": "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?crop=entropy&cs=srgb&fm=jpg&q=85"},
    {"name": "The Oyster Club", "cuisine": "Seafood", "price": "$$$", "rating": 4.9, "distance": 22.0,
     "description": "Raw bar, lobster rolls and crisp muscadet.", "address": "2 Wharf Rd",
     "image": "https://images.unsplash.com/photo-1615141982883-c7ad0e69fd62?crop=entropy&cs=srgb&fm=jpg&q=85"},
    {"name": "Verde Cantina", "cuisine": "Vegan", "price": "$", "rating": 4.4, "distance": 34.5,
     "description": "Jackfruit tacos, cashew queso and kombucha on tap.", "address": "90 Fern Hill",
     "image": "https://images.unsplash.com/photo-1540914124281-342587941389?crop=entropy&cs=srgb&fm=jpg&q=85"},
]


async def seed_db():
    count = await db.restaurants.count_documents({})
    if count == 0:
        docs = []
        for item in SEED:
            r = Restaurant(**item)
            doc = r.model_dump()
            doc['created_at'] = doc['created_at'].isoformat()
            docs.append(doc)
        await db.restaurants.insert_many(docs)
        logging.info(f"Seeded {len(docs)} restaurants")


def apply_filters(items, cuisines, prices, max_distance):
    result = items
    if cuisines:
        result = [r for r in result if r['cuisine'] in cuisines]
    if prices:
        result = [r for r in result if r['price'] in prices]
    if max_distance is not None:
        result = [r for r in result if r['distance'] <= max_distance]
    return result


# ---------- Routes ----------
@api_router.get("/")
async def root():
    return {"message": "Restaurant Roulette API"}


@api_router.get("/restaurants", response_model=List[Restaurant])
async def get_restaurants():
    items = await db.restaurants.find({}, {"_id": 0}).sort("name", 1).to_list(1000)
    return items


@api_router.post("/restaurants", response_model=Restaurant)
async def create_restaurant(payload: RestaurantCreate):
    r = Restaurant(**payload.model_dump())
    doc = r.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.restaurants.insert_one(doc)
    return r


@api_router.delete("/restaurants/{restaurant_id}")
async def delete_restaurant(restaurant_id: str):
    res = await db.restaurants.delete_one({"id": restaurant_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    return {"deleted": restaurant_id}


@api_router.get("/cuisines", response_model=List[str])
async def get_cuisines():
    items = await db.restaurants.find({}, {"_id": 0, "cuisine": 1}).to_list(1000)
    return sorted({i['cuisine'] for i in items})


@api_router.post("/spin", response_model=Restaurant)
async def spin(req: SpinRequest):
    items = await db.restaurants.find({}, {"_id": 0}).to_list(1000)
    filtered = apply_filters(items, req.cuisines, req.prices, req.max_distance)
    if not filtered:
        raise HTTPException(status_code=404, detail="No restaurants match your filters")
    return secrets.choice(filtered)


async def google_places_search(req: "PlacesSearchRequest"):
    async with httpx.AsyncClient(timeout=15) as http:
        geo = await http.get("https://maps.googleapis.com/maps/api/geocode/json", params={
            "components": f"postal_code:{req.zip_code}|country:US",
            "key": GOOGLE_API_KEY,
        })
        gd = geo.json()
        if gd.get("status") != "OK" or not gd.get("results"):
            raise HTTPException(status_code=400, detail="Could not find that ZIP code")
        loc = gd["results"][0]["geometry"]["location"]
        lat, lng = loc["lat"], loc["lng"]

        query = (" ".join(req.cuisines) + " restaurant").strip()
        headers = {
            "X-Goog-Api-Key": GOOGLE_API_KEY,
            "X-Goog-FieldMask": "places.displayName,places.rating,places.priceLevel,places.primaryType,places.formattedAddress,places.location,places.photos,places.googleMapsUri",
            "Content-Type": "application/json",
        }
        payload = {
            "textQuery": query,
            "locationBias": {"circle": {"center": {"latitude": lat, "longitude": lng}, "radius": 50000.0}},
            "maxResultCount": 20,
        }
        if req.price_levels:
            payload["priceLevels"] = req.price_levels
        pres = await http.post("https://places.googleapis.com/v1/places:searchText", headers=headers, json=payload)
        pd = pres.json()
        if "error" in pd:
            raise HTTPException(status_code=502, detail=pd["error"].get("message", "Places API error"))

        out = []
        for p in pd.get("places", []):
            ploc = p.get("location") or {}
            plat, plng = ploc.get("latitude"), ploc.get("longitude")
            dist = haversine_miles(lat, lng, plat, plng) if plat is not None and plng is not None else 0.0
            if dist > MAX_RADIUS_MILES:
                continue
            photos = p.get("photos") or []
            image = ""
            if photos:
                image = f"https://places.googleapis.com/v1/{photos[0]['name']}/media?maxWidthPx=800&key={GOOGLE_API_KEY}"
            name = p.get("displayName", {}).get("text", "Unknown")
            address = p.get("formattedAddress", "")
            out.append({
                "id": str(uuid.uuid4()),
                "name": name,
                "cuisine": prettify_type(p.get("primaryType")),
                "price": PRICE_ENUM_TO_SYMBOL.get(p.get("priceLevel"), "$$"),
                "rating": float(p.get("rating") or 0.0),
                "distance": round(dist, 1),
                "address": address,
                "description": address,
                "image": image or FALLBACK_IMG,
                "sponsored": False,
                "google_url": p.get("googleMapsUri") or maps_url(name, address),
            })
        out.sort(key=lambda r: r["distance"])
        return out


@api_router.post("/places/search")
async def places_search(req: PlacesSearchRequest):
    if GOOGLE_API_KEY and req.zip_code:
        try:
            results = await google_places_search(req)
            if results:
                return {"source": "google", "restaurants": results}
        except HTTPException as e:
            if e.status_code == 400:
                raise
            logger.warning(f"Places search fell back to curated: {e.detail}")

    # Fallback to curated seed data
    items = await db.restaurants.find({}, {"_id": 0}).to_list(1000)
    if req.cuisines:
        items = [r for r in items if r['cuisine'] in req.cuisines]
    if req.price_levels:
        allowed = set()
        for lvl in req.price_levels:
            allowed |= {s for s, enums in SYMBOL_ENUMS.items() if lvl in enums}
        items = [r for r in items if r['price'] in allowed]
    items.sort(key=lambda r: (not r.get('sponsored', False), r['distance']))
    for r in items:
        r['google_url'] = maps_url(r['name'], r.get('address', ''))
    return {"source": "curated", "restaurants": items}


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup_event():
    await seed_db()


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
