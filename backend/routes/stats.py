"""Community stat counters: fates dealt and crawls completed."""
from fastapi import APIRouter, Depends
from pymongo import ReturnDocument

from core import db, rate_limit

router = APIRouter()


@router.get("/stats/fates")
async def get_fates_dealt():
    doc = await db.stats.find_one({"key": "fates_dealt"})
    return {"count": doc["count"] if doc else 1042}


@router.post("/stats/fate-dealt", dependencies=[Depends(rate_limit(120))])
async def increment_fates_dealt():
    doc = await db.stats.find_one_and_update(
        {"key": "fates_dealt"},
        {"$inc": {"count": 1}},
        upsert=True,
        return_document=ReturnDocument.AFTER,
    )
    return {"count": doc.get("count", 1)}


@router.get("/stats/crawls")
async def get_crawls_completed():
    doc = await db.stats.find_one({"key": "crawls_completed"})
    return {"count": doc["count"] if doc else 0}


@router.post("/stats/crawl-completed", dependencies=[Depends(rate_limit(60))])
async def increment_crawls_completed():
    doc = await db.stats.find_one_and_update(
        {"key": "crawls_completed"},
        {"$inc": {"count": 1}},
        upsert=True,
        return_document=ReturnDocument.AFTER,
    )
    return {"count": doc.get("count", 1)}
