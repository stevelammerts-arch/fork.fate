from fastapi import FastAPI, APIRouter, HTTPException, Request, Depends
from fastapi.responses import Response
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import re
import time
import secrets
import math
import httpx
import logging
from collections import defaultdict, deque
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, field_validator
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

# Simple in-memory per-IP rate limiter (coarse abuse/cost protection)
_RL_BUCKETS = defaultdict(deque)

# Cache ZIP -> (lat, lng) to cut repeat geocoding calls
_ZIP_GEO_CACHE = {}


def rate_limit(max_requests: int, window_seconds: int = 60):
    def _dep(request: Request):
        ip = request.client.host if request.client else "unknown"
        now = time.time()
        bucket = _RL_BUCKETS[ip]
        while bucket and bucket[0] < now - window_seconds:
            bucket.popleft()
        if len(bucket) >= max_requests:
            raise HTTPException(status_code=429, detail="Too many requests, please slow down")
        bucket.append(now)
    return _dep

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


def doordash_url(name, address=""):
    return f"https://www.doordash.com/search/store/{quote_plus(name)}"


def order_url(name, address=""):
    return f"https://www.google.com/search?q={quote_plus((name + ' ' + address + ' order online delivery').strip())}"


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
    category: str = "food"  # "food" | "drinks"
    google_url: str = ""
    doordash_url: str = ""
    order_url: str = ""
    open_now: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class RestaurantCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    cuisine: str = Field(min_length=1, max_length=60)
    price: str = Field(default="$$", max_length=4)
    rating: float = Field(default=4.5, ge=0, le=5)
    distance: float = Field(default=1.0, ge=0, le=100)
    description: str = Field(default="", max_length=1000)
    address: str = Field(default="", max_length=300)
    image: str = Field(default="", max_length=1000)
    sponsored: bool = False
    category: str = "food"

    @field_validator("category")
    @classmethod
    def _valid_category(cls, v):
        return v if v in ("food", "drinks", "bars", "desserts") else "food"


class SpinRequest(BaseModel):
    cuisines: List[str] = []
    prices: List[str] = []
    max_distance: Optional[float] = None


class ReportCreate(BaseModel):
    restaurant_id: str = Field(min_length=1, max_length=100)
    restaurant_name: str = Field(default="", max_length=160)
    reason: str = Field(default="No longer in service", max_length=300)


class SponsorshipRequest(BaseModel):
    business_name: str = Field(min_length=1, max_length=160)
    contact_email: str = Field(min_length=3, max_length=160)
    category: str = Field(default="food", max_length=20)
    message: str = Field(default="", max_length=1000)

    @field_validator("contact_email")
    @classmethod
    def _valid_email(cls, v):
        if not re.fullmatch(r"[^@\s]+@[^@\s]+\.[^@\s]+", v.strip()):
            raise ValueError("Please enter a valid email address")
        return v.strip()


class PlacesSearchRequest(BaseModel):
    zip_code: Optional[str] = None
    lat: Optional[float] = Field(default=None, ge=-90, le=90)
    lng: Optional[float] = Field(default=None, ge=-180, le=180)
    cuisines: List[str] = Field(default_factory=list, max_length=25)
    price_levels: List[str] = Field(default_factory=list, max_length=6)
    category: str = "food"
    open_now: bool = False

    @field_validator("zip_code")
    @classmethod
    def _valid_zip(cls, v):
        if v in (None, ""):
            return None
        if not re.fullmatch(r"\d{5}", v.strip()):
            raise ValueError("zip_code must be a 5-digit US ZIP")
        return v.strip()

    @field_validator("category")
    @classmethod
    def _valid_category(cls, v):
        return v if v in ("food", "drinks", "bars", "desserts") else "food"


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
    {"name": "Buffalo Junction", "cuisine": "Chicken Wings", "price": "$$", "rating": 4.6, "distance": 3.2, "sponsored": True,
     "description": "Crispy buffalo wings, dry rubs and blue-cheese dip.", "address": "48 Coop Ave",
     "image": "https://images.unsplash.com/photo-1608039755401-742074f0548d?crop=entropy&cs=srgb&fm=jpg&q=85"},
    {"name": "Cluck & Fire", "cuisine": "Chicken Wings", "price": "$", "rating": 4.5, "distance": 6.7,
     "description": "Nashville-hot wings and loaded fries.", "address": "12 Flame St",
     "image": "https://images.unsplash.com/photo-1527477396000-e27163b481c2?crop=entropy&cs=srgb&fm=jpg&q=85"},
    {"name": "Corner Deli & Co", "cuisine": "Deli", "price": "$", "rating": 4.6, "distance": 1.9, "sponsored": True,
     "description": "Stacked pastrami subs, house pickles and fresh bagels.", "address": "33 Market St",
     "image": "https://images.unsplash.com/photo-1509722747041-616f39b57569?crop=entropy&cs=srgb&fm=jpg&q=85"},
    {"name": "Rye & Slice", "cuisine": "Deli", "price": "$$", "rating": 4.5, "distance": 4.4,
     "description": "Classic reubens, matzo ball soup and egg creams.", "address": "7 Rye Ln",
     "image": "https://images.unsplash.com/photo-1553909489-cd47e0ef937f?crop=entropy&cs=srgb&fm=jpg&q=85"},
    {"name": "Sunrise Diner", "cuisine": "Breakfast", "price": "$", "rating": 4.6, "distance": 1.7, "sponsored": True,
     "description": "Fluffy pancakes, skillets and bottomless coffee all morning.", "address": "6 Dawn St",
     "image": "https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?crop=entropy&cs=srgb&fm=jpg&q=85"},
    {"name": "The Morning Table", "cuisine": "Breakfast", "price": "$$", "rating": 4.7, "distance": 5.3,
     "description": "Avocado toast, shakshuka and fresh-pressed juices.", "address": "22 Brunch Ave",
     "image": "https://images.unsplash.com/photo-1525351484163-7529414344d8?crop=entropy&cs=srgb&fm=jpg&q=85"},
    {"name": "Scoops & Swirls", "cuisine": "Ice Cream", "price": "$", "rating": 4.8, "distance": 1.5, "category": "desserts", "sponsored": True,
     "description": "Small-batch gelato, waffle cones and sundae bar.", "address": "5 Sugar Ln",
     "image": "https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?crop=entropy&cs=srgb&fm=jpg&q=85"},
    {"name": "Frostbite Creamery", "cuisine": "Ice Cream", "price": "$", "rating": 4.6, "distance": 4.7, "category": "desserts",
     "description": "Rolled ice cream, milkshakes and vegan scoops.", "address": "40 Frost St",
     "image": "https://images.unsplash.com/photo-1501443762994-82bd5dace89a?crop=entropy&cs=srgb&fm=jpg&q=85"},
    {"name": "Sweet Tooth Co", "cuisine": "Candy Shops", "price": "$", "rating": 4.7, "distance": 2.2, "category": "desserts", "sponsored": True,
     "description": "Bulk candy walls, chocolate truffles and nostalgic sweets.", "address": "18 Confection Ct",
     "image": "https://images.unsplash.com/photo-1499195333224-3ce974eecb47?crop=entropy&cs=srgb&fm=jpg&q=85"},
    {"name": "The Candy Jar", "cuisine": "Candy Shops", "price": "$", "rating": 4.5, "distance": 6.9, "category": "desserts",
     "description": "Handmade fudge, taffy and old-fashioned lollipops.", "address": "3 Toffee Way",
     "image": "https://images.unsplash.com/photo-1582058091505-f87a2e55a40f?crop=entropy&cs=srgb&fm=jpg&q=85"},
    {"name": "Flour & Butter Bakery", "cuisine": "Bakery", "price": "$$", "rating": 4.8, "distance": 2.0, "category": "desserts", "sponsored": True,
     "description": "Croissants, layer cakes and fresh-from-the-oven pastries.", "address": "11 Baker St",
     "image": "https://images.unsplash.com/photo-1509440159596-0249088772ff?crop=entropy&cs=srgb&fm=jpg&q=85"},
    {"name": "Rise & Crumb", "cuisine": "Bakery", "price": "$", "rating": 4.6, "distance": 5.8, "category": "desserts",
     "description": "Sourdough loaves, cookies and cinnamon rolls.", "address": "27 Dough Ave",
     "image": "https://images.unsplash.com/photo-1486427944299-d1955d23e34d?crop=entropy&cs=srgb&fm=jpg&q=85"},
    {"name": "Berry Swirl", "cuisine": "Frozen Yogurt", "price": "$", "rating": 4.5, "distance": 3.4, "category": "desserts",
     "description": "Self-serve froyo with 40 toppings and fresh fruit.", "address": "9 Tart Ln",
     "image": "https://images.unsplash.com/photo-1488900128323-21503983a07e?crop=entropy&cs=srgb&fm=jpg&q=85"},
    {"name": "Chill Yo", "cuisine": "Frozen Yogurt", "price": "$", "rating": 4.4, "distance": 7.1, "category": "desserts",
     "description": "Tart froyo swirls, boba toppings and sorbet.", "address": "52 Swirl Rd",
     "image": "https://images.unsplash.com/photo-1560008581-09826d1de69e?crop=entropy&cs=srgb&fm=jpg&q=85"},
    {"name": "Cloud Nine Coffee", "cuisine": "Coffee", "price": "$", "rating": 4.7, "distance": 0.6, "category": "drinks", "sponsored": True,
     "description": "Single-origin pour-overs, flat whites and flaky croissants.", "address": "6 Bean St",
     "image": "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?crop=entropy&cs=srgb&fm=jpg&q=85"},
    {"name": "Roast & Co", "cuisine": "Coffee", "price": "$$", "rating": 4.6, "distance": 2.1, "category": "drinks",
     "description": "Small-batch roasters with nitro cold brew on tap.", "address": "19 Ember Ave",
     "image": "https://images.unsplash.com/photo-1447933601403-0c6688de566e?crop=entropy&cs=srgb&fm=jpg&q=85"},
    {"name": "Pearl & Pour", "cuisine": "Boba Tea", "price": "$", "rating": 4.8, "distance": 1.4, "category": "drinks", "sponsored": True,
     "description": "Brown-sugar boba, fruit teas and cheese foam.", "address": "8 Tapioca Ln",
     "image": "https://images.unsplash.com/photo-1558857563-b371033873b8?crop=entropy&cs=srgb&fm=jpg&q=85"},
    {"name": "Boba Lab", "cuisine": "Boba Tea", "price": "$", "rating": 4.5, "distance": 3.7, "category": "drinks",
     "description": "Build-your-own milk teas with popping pearls.", "address": "27 Pearl Rd",
     "image": "https://images.unsplash.com/photo-1525803377221-4f6ccf6f0d1a?crop=entropy&cs=srgb&fm=jpg&q=85"},
    {"name": "Sip Society", "cuisine": "Smoothie", "price": "$$", "rating": 4.6, "distance": 2.8, "category": "drinks",
     "description": "Cold-pressed juices and protein-packed smoothie bowls.", "address": "51 Blend Blvd",
     "image": "https://images.unsplash.com/photo-1502741224143-90386d7f8c82?crop=entropy&cs=srgb&fm=jpg&q=85"},
    {"name": "Green Blend", "cuisine": "Smoothie", "price": "$", "rating": 4.4, "distance": 5.9, "category": "drinks",
     "description": "Acai bowls, green smoothies and chia parfaits.", "address": "3 Kale Ct",
     "image": "https://images.unsplash.com/photo-1610970881699-44a5587cabec?crop=entropy&cs=srgb&fm=jpg&q=85"},
    {"name": "The Daily Grind", "cuisine": "Coffee", "price": "$", "rating": 4.5, "distance": 8.2, "category": "drinks",
     "description": "Neighborhood espresso bar with house oat milk.", "address": "72 Roast Row",
     "image": "https://images.unsplash.com/photo-1442512595331-e89e73853f31?crop=entropy&cs=srgb&fm=jpg&q=85"},
    {"name": "Tapioca Town", "cuisine": "Boba Tea", "price": "$", "rating": 4.3, "distance": 11.5, "category": "drinks",
     "description": "Classic milk teas, taro slushies and mochi bites.", "address": "14 Chew St",
     "image": "https://images.unsplash.com/photo-1571091718767-18b5b1457add?crop=entropy&cs=srgb&fm=jpg&q=85"},
    {"name": "The Tap House", "cuisine": "Beer", "price": "$$", "rating": 4.7, "distance": 1.2, "category": "bars", "sponsored": True,
     "description": "40 rotating craft taps and wood-fired pretzels.", "address": "5 Hops Ave",
     "image": "https://images.unsplash.com/photo-1436076863939-06870fe779c2?crop=entropy&cs=srgb&fm=jpg&q=85"},
    {"name": "Barrel & Bourbon", "cuisine": "Whiskey", "price": "$$$", "rating": 4.8, "distance": 2.6, "category": "bars",
     "description": "200-bottle whiskey library and craft old fashioneds.", "address": "88 Rye Rd",
     "image": "https://images.unsplash.com/photo-1569924995012-c4c706bfcd51?crop=entropy&cs=srgb&fm=jpg&q=85"},
    {"name": "O'Malley's", "cuisine": "Irish Bar", "price": "$$", "rating": 4.6, "distance": 3.9, "category": "bars", "sponsored": True,
     "description": "Perfectly poured stout, live trad music and pub grub.", "address": "17 Shamrock St",
     "image": "https://images.unsplash.com/photo-1514933651103-005eec06c04b?crop=entropy&cs=srgb&fm=jpg&q=85"},
    {"name": "The End Zone", "cuisine": "Sports Bar", "price": "$$", "rating": 4.4, "distance": 5.1, "category": "bars",
     "description": "30 screens, wings and ice-cold buckets on game day.", "address": "42 Stadium Way",
     "image": "https://images.unsplash.com/photo-1543007630-9710e4a00a20?crop=entropy&cs=srgb&fm=jpg&q=85"},
    {"name": "Agave Nights", "cuisine": "Margaritas", "price": "$$", "rating": 4.7, "distance": 4.3, "category": "bars",
     "description": "Frozen and fresh-lime margaritas with 60 tequilas.", "address": "9 Lime Blvd",
     "image": "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?crop=entropy&cs=srgb&fm=jpg&q=85"},
    {"name": "Tiki Lagoon", "cuisine": "Tiki", "price": "$$$", "rating": 4.6, "distance": 7.2, "category": "bars",
     "description": "Flaming mai tais and rum flights under bamboo.", "address": "3 Palm Cove",
     "image": "https://images.unsplash.com/photo-1470337458703-46ad1756a187?crop=entropy&cs=srgb&fm=jpg&q=85"},
    {"name": "The Liquor Room", "cuisine": "Liquor", "price": "$$$", "rating": 4.5, "distance": 6.4, "category": "bars",
     "description": "Speakeasy cocktails and a top-shelf back bar.", "address": "21 Vault Ln",
     "image": "https://images.unsplash.com/photo-1551024709-8f23befc6f87?crop=entropy&cs=srgb&fm=jpg&q=85"},
    {"name": "The Copper Still", "cuisine": "Spirits", "price": "$$$", "rating": 4.7, "distance": 8.8, "category": "bars",
     "description": "Small-batch spirits tastings and craft cocktails.", "address": "60 Distillery Rd",
     "image": "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?crop=entropy&cs=srgb&fm=jpg&q=85"},
    {"name": "Last Call", "cuisine": "Bars", "price": "$", "rating": 4.3, "distance": 9.5, "category": "bars",
     "description": "Neighborhood dive with cheap drafts and a jukebox.", "address": "1 Corner Tap",
     "image": "https://images.unsplash.com/photo-1572116469696-31de0f17cc34?crop=entropy&cs=srgb&fm=jpg&q=85"},
    {"name": "Rack 'Em Billiards", "cuisine": "Pool", "price": "$$", "rating": 4.5, "distance": 3.3, "category": "bars", "sponsored": True,
     "description": "A dozen pro pool tables, craft beer and late-night eats.", "address": "24 Cue St",
     "image": "https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?crop=entropy&cs=srgb&fm=jpg&q=85"},
    {"name": "Bullseye Tavern", "cuisine": "Darts", "price": "$", "rating": 4.4, "distance": 4.8, "category": "bars",
     "description": "Electronic and steel-tip dart leagues nightly.", "address": "18 Oche Rd",
     "image": "https://images.unsplash.com/photo-1595265677860-9a3ca5c8e5c0?crop=entropy&cs=srgb&fm=jpg&q=85"},
    {"name": "Sand Bar", "cuisine": "Volleyball", "price": "$$", "rating": 4.6, "distance": 7.9, "category": "bars",
     "description": "Sand volleyball courts, frozen drinks and beach vibes.", "address": "9 Dune Way",
     "image": "https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?crop=entropy&cs=srgb&fm=jpg&q=85"},
    {"name": "The Encore", "cuisine": "Music", "price": "$$", "rating": 4.7, "distance": 5.5, "category": "bars", "sponsored": True,
     "description": "Live bands every night and a stacked cocktail list.", "address": "31 Stage Ln",
     "image": "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?crop=entropy&cs=srgb&fm=jpg&q=85"},
    {"name": "Dill Dinkers", "cuisine": "Pickle Ball", "price": "$$", "rating": 4.6, "distance": 6.1, "category": "bars",
     "description": "Indoor pickleball courts with a full bar and food.", "address": "12 Paddle Ct",
     "image": "https://images.unsplash.com/photo-1687204209659-3bded6aecd79?crop=entropy&cs=srgb&fm=jpg&q=85"},
    {"name": "Player One", "cuisine": "Games", "price": "$", "rating": 4.5, "distance": 8.4, "category": "bars",
     "description": "Retro arcade barcade with pinball and craft brews.", "address": "1 Arcade Alley",
     "image": "https://images.unsplash.com/photo-1511512578047-dfb367046420?crop=entropy&cs=srgb&fm=jpg&q=85"},
    {"name": "Strike & Spare", "cuisine": "Bowling", "price": "$$", "rating": 4.5, "distance": 10.2, "category": "bars",
     "description": "Boutique bowling lanes, cocktails and shareable plates.", "address": "77 Lane Ave",
     "image": "https://images.unsplash.com/photo-1538511246516-427062a4e9e6?crop=entropy&cs=srgb&fm=jpg&q=85"},
    {"name": "The Wine Cellar", "cuisine": "Wine", "price": "$$$", "rating": 4.8, "distance": 2.4, "category": "bars", "sponsored": True,
     "description": "300 labels by the glass and a candle-lit tasting room.", "address": "14 Vine St",
     "image": "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?crop=entropy&cs=srgb&fm=jpg&q=85"},
    {"name": "Shaker & Spoon", "cuisine": "Cocktails", "price": "$$$", "rating": 4.7, "distance": 3.6, "category": "bars",
     "description": "Craft cocktails and seasonal infusions by master mixologists.", "address": "29 Bitters Blvd",
     "image": "https://images.unsplash.com/photo-1470337458703-46ad1756a187?crop=entropy&cs=srgb&fm=jpg&q=85"},
]


async def seed_db():
    count = await db.restaurants.count_documents({})
    if count == 0:
        docs = []
        for idx, item in enumerate(SEED):
            r = Restaurant(**item)
            r.open_now = (idx % 4 != 0)  # ~25% shown as closed for the Open-now filter
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


@api_router.post("/restaurants", response_model=Restaurant, dependencies=[Depends(rate_limit(20))])
async def create_restaurant(payload: RestaurantCreate):
    r = Restaurant(**payload.model_dump())
    r.google_url = maps_url(r.name, r.address)
    r.doordash_url = doordash_url(r.name, r.address)
    r.order_url = order_url(r.name, r.address)
    doc = r.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.restaurants.insert_one(doc)
    return r


@api_router.post("/reports", dependencies=[Depends(rate_limit(30))])
async def create_report(payload: ReportCreate):
    """Users can suggest a spot be removed (e.g. closed / no longer in service).
    Recorded for review instead of allowing direct deletion."""
    doc = payload.model_dump()
    doc['id'] = str(uuid.uuid4())
    doc['status'] = "open"
    doc['created_at'] = datetime.now(timezone.utc).isoformat()
    await db.reports.insert_one(doc)
    return {"ok": True, "id": doc['id']}


@api_router.post("/sponsorship-requests", dependencies=[Depends(rate_limit(10))])
async def create_sponsorship_request(payload: SponsorshipRequest):
    """Businesses can request a sponsored spot. Stored for review/follow-up."""
    doc = payload.model_dump()
    doc['id'] = str(uuid.uuid4())
    doc['status'] = "new"
    doc['created_at'] = datetime.now(timezone.utc).isoformat()
    await db.sponsorship_requests.insert_one(doc)
    return {"ok": True, "id": doc['id']}


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
        if req.lat is not None and req.lng is not None:
            lat, lng = req.lat, req.lng
        else:
            cached = _ZIP_GEO_CACHE.get(req.zip_code)
            if cached:
                lat, lng = cached
            else:
                geo = await http.get("https://maps.googleapis.com/maps/api/geocode/json", params={
                    "components": f"postal_code:{req.zip_code}|country:US",
                    "key": GOOGLE_API_KEY,
                })
                gd = geo.json()
                if gd.get("status") != "OK" or not gd.get("results"):
                    raise HTTPException(status_code=400, detail="Could not find that ZIP code")
                loc = gd["results"][0]["geometry"]["location"]
                lat, lng = loc["lat"], loc["lng"]
                _ZIP_GEO_CACHE[req.zip_code] = (lat, lng)

        if req.category == "drinks":
            base = " ".join(req.cuisines) if req.cuisines else "coffee boba tea smoothie"
            query = (base + " cafe drinks").strip()
        elif req.category == "bars":
            base = " ".join(req.cuisines) if req.cuisines else "bar pub"
            query = (base + " bar pub").strip()
        elif req.category == "desserts":
            base = " ".join(req.cuisines) if req.cuisines else "dessert ice cream bakery"
            query = (base + " dessert shop").strip()
        else:
            query = (" ".join(req.cuisines) + " restaurant").strip()
        headers = {
            "X-Goog-Api-Key": GOOGLE_API_KEY,
            "X-Goog-FieldMask": "places.displayName,places.rating,places.priceLevel,places.primaryType,places.formattedAddress,places.location,places.photos,places.googleMapsUri,places.currentOpeningHours.openNow",
            "Content-Type": "application/json",
        }
        payload = {
            "textQuery": query,
            "locationBias": {"circle": {"center": {"latitude": lat, "longitude": lng}, "radius": 50000.0}},
            "maxResultCount": 20,
        }
        if req.price_levels:
            payload["priceLevels"] = req.price_levels
        if req.open_now:
            payload["openNow"] = True
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
                image = f"/api/places/photo?name={quote_plus(photos[0]['name'])}"
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
                "doordash_url": doordash_url(name, address),
                "order_url": order_url(name, address),
                "open_now": (p.get("currentOpeningHours") or {}).get("openNow", True),
            })
        out.sort(key=lambda r: r["distance"])
        return out


@api_router.get("/places/photo")
async def places_photo(name: str):
    """Proxy Google Places photo bytes so the API key is never exposed to the client."""
    if not GOOGLE_API_KEY or not name.startswith("places/"):
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


@api_router.post("/places/search", dependencies=[Depends(rate_limit(60))])
async def places_search(req: PlacesSearchRequest):
    if GOOGLE_API_KEY and (req.zip_code or (req.lat is not None and req.lng is not None)):
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
    items = [r for r in items if r.get('category', 'food') == req.category]
    if req.cuisines:
        items = [r for r in items if r['cuisine'] in req.cuisines]
    if req.open_now:
        items = [r for r in items if r.get('open_now', True)]
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
    return {"source": "curated", "restaurants": items}


app.include_router(api_router)

_cors_origins = os.environ.get('CORS_ORIGINS', '*').split(',')
app.add_middleware(
    CORSMiddleware,
    allow_credentials=False,
    allow_origins=_cors_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup_event():
    await seed_db()


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
