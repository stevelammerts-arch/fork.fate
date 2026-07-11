"""Shareable multi-stop crawls saved under short link codes."""
import secrets
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Depends

from core import db, rate_limit
from models import CrawlCreate

router = APIRouter()

CRAWL_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"  # no ambiguous chars


def _gen_crawl_code(n: int = 8) -> str:
    return "".join(secrets.choice(CRAWL_CODE_ALPHABET) for _ in range(n))


@router.post("/crawls", dependencies=[Depends(rate_limit(30))])
async def create_crawl(payload: CrawlCreate):
    """Save a crawl so the whole group can open the same fixed route via a short link."""
    code = _gen_crawl_code()
    for _ in range(6):
        if not await db.crawls.find_one({"code": code}):
            break
        code = _gen_crawl_code()
    doc = {
        "code": code,
        "mode": payload.mode,
        "label": payload.label,
        "stops": [s.model_dump() for s in payload.stops],
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.crawls.insert_one(doc)
    return {"code": code}


@router.get("/crawls/{code}")
async def get_crawl(code: str):
    doc = await db.crawls.find_one({"code": code.upper()}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Crawl not found")
    return doc
