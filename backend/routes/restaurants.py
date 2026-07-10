"""Public restaurant endpoints: list, submit, report, cuisines, spin."""
import uuid
import secrets
from typing import List
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Depends

from core import db, rate_limit, maps_url, doordash_url, order_url
from models import Restaurant, RestaurantCreate, ReportCreate, SpinRequest
from seed_data import apply_filters

router = APIRouter()


@router.get("/")
async def root():
    return {"message": "Restaurant Roulette API"}


@router.get("/restaurants", response_model=List[Restaurant])
async def get_restaurants():
    items = await db.restaurants.find({"status": {"$ne": "pending"}}, {"_id": 0}).sort("name", 1).to_list(1000)
    return items


@router.post("/restaurants", response_model=Restaurant, dependencies=[Depends(rate_limit(20))])
async def create_restaurant(payload: RestaurantCreate):
    r = Restaurant(**payload.model_dump())
    r.google_url = maps_url(r.name, r.address)
    r.doordash_url = doordash_url(r.name, r.address)
    r.order_url = order_url(r.name, r.address)
    r.sponsored = False
    r.status = "pending"  # community submissions await admin review
    doc = r.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.restaurants.insert_one(doc)
    return r


@router.post("/reports", dependencies=[Depends(rate_limit(30))])
async def create_report(payload: ReportCreate):
    """Users can suggest a spot be removed (e.g. closed / no longer in service).
    Recorded for review instead of allowing direct deletion."""
    doc = payload.model_dump()
    doc['id'] = str(uuid.uuid4())
    doc['status'] = "open"
    doc['created_at'] = datetime.now(timezone.utc).isoformat()
    await db.reports.insert_one(doc)
    return {"ok": True, "id": doc['id']}


@router.get("/cuisines", response_model=List[str])
async def get_cuisines():
    items = await db.restaurants.find({}, {"_id": 0, "cuisine": 1}).to_list(1000)
    return sorted({i['cuisine'] for i in items})


@router.post("/spin", response_model=Restaurant)
async def spin(req: SpinRequest):
    items = await db.restaurants.find({"status": {"$ne": "pending"}}, {"_id": 0}).to_list(1000)
    filtered = apply_filters(items, req.cuisines, req.prices, req.max_distance)
    if not filtered:
        raise HTTPException(status_code=404, detail="No restaurants match your filters")
    return secrets.choice(filtered)
