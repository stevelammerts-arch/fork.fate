from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import random
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")


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


class SpinRequest(BaseModel):
    cuisines: List[str] = []
    prices: List[str] = []
    max_distance: Optional[float] = None


# ---------- Seed data ----------
SEED = [
    {"name": "Olive & Ember", "cuisine": "Italian", "price": "$$", "rating": 4.7, "distance": 0.8,
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
    {"name": "Harborline", "cuisine": "Seafood", "price": "$$$", "rating": 4.9, "distance": 3.4,
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
    return random.choice(filtered)


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO,
                    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


@app.on_event("startup")
async def startup_event():
    await seed_db()


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
