"""Shareable multi-stop crawls saved under short link codes."""
import secrets
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, HTTPException, Depends

from typing import Optional

from core import db, rate_limit
from models import CrawlCreate, CrawlCompletionCreate

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


def _clean_entry(doc: dict) -> dict:
    return {
        "team_name": doc.get("team_name", "Anonymous Crew"),
        "stops": doc.get("stops", 0),
        "duration_seconds": doc.get("duration_seconds"),
        "mode": doc.get("mode", "bars"),
        "label": doc.get("label", ""),
        "created_at": doc.get("created_at"),
    }


async def _leaderboard_for(match: dict) -> dict:
    """Top 10 by most stops (fastest as tie-break) and top 10 by fastest time.

    Only GPS-verified crews rank. ``$ne: False`` also matches legacy docs saved
    before verification existed (missing field), so historical entries stay visible.
    """
    match = {**match, "verified": {"$ne": False}}
    docs = [d async for d in db.crawl_completions.find(match, {"_id": 0}).sort("created_at", -1).limit(500)]
    by_stops = sorted(
        docs,
        key=lambda d: (
            -(d.get("stops") or 0),
            d.get("duration_seconds") if isinstance(d.get("duration_seconds"), int) else 10 ** 12,
            d.get("created_at", ""),
        ),
    )[:10]
    fastest_pool = [d for d in docs if isinstance(d.get("duration_seconds"), int)]
    by_fast = sorted(fastest_pool, key=lambda d: (d.get("duration_seconds"), -(d.get("stops") or 0)))[:10]
    return {"stops": [_clean_entry(d) for d in by_stops], "fastest": [_clean_entry(d) for d in by_fast]}


@router.post("/crawls/complete", dependencies=[Depends(rate_limit(30))])
async def complete_crawl(payload: CrawlCompletionCreate):
    """Record a crew's finished crawl for the leaderboard (opt-in from the badge dialog).

    Only GPS-verified crews are ranked. A server-side sanity check downgrades any
    "verified" run whose implied travel speed is physically impossible (> 15 mph),
    or that lacks the distance/duration needed to validate it. Unverified runs are
    still recorded (for the badge + community count) but never appear on the board
    and receive no rank.
    """
    verified = bool(payload.verified)
    dist = payload.distance
    dur = payload.duration_seconds
    if verified:
        if not (isinstance(dur, int) and dur > 0 and isinstance(dist, (int, float)) and dist >= 0):
            verified = False
        elif dist / (dur / 3600.0) > 15.0:  # implied avg speed cap (mph)
            verified = False

    doc = {
        "team_name": payload.team_name,
        "stops": payload.stops,
        "mode": payload.mode,
        "label": payload.label,
        "code": payload.code,
        "duration_seconds": payload.duration_seconds,
        "distance": dist,
        "verified": verified,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.crawl_completions.insert_one(doc)

    # Ranking pool = verified crews only (includes legacy docs missing the field).
    all_docs = [d async for d in db.crawl_completions.find(
        {"verified": {"$ne": False}}, {"_id": 0, "stops": 1, "duration_seconds": 1}
    ).limit(5000)]

    if not verified:
        return {"ok": True, "verified": False, "rank_stops": None, "rank_fastest": None, "total": len(all_docs)}

    my_stops = payload.stops
    my_dur = payload.duration_seconds

    def dur_or(d):
        v = d.get("duration_seconds")
        return v if isinstance(v, int) else 10 ** 12

    my_dur_eff = my_dur if isinstance(my_dur, int) else 10 ** 12
    rank_stops = 1 + sum(
        1 for d in all_docs
        if (d.get("stops", 0) > my_stops) or (d.get("stops", 0) == my_stops and dur_or(d) < my_dur_eff)
    )
    rank_fastest = None
    if isinstance(my_dur, int):
        timed = [d for d in all_docs if isinstance(d.get("duration_seconds"), int)]
        rank_fastest = 1 + sum(
            1 for d in timed
            if (d["duration_seconds"] < my_dur) or (d["duration_seconds"] == my_dur and d.get("stops", 0) > my_stops)
        )
    return {"ok": True, "verified": True, "rank_stops": rank_stops, "rank_fastest": rank_fastest, "total": len(all_docs)}


@router.get("/crawls/leaderboard")
async def crawl_leaderboard(code: Optional[str] = None):
    week_cutoff = (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()
    result = {
        "global": await _leaderboard_for({}),
        "week": await _leaderboard_for({"created_at": {"$gte": week_cutoff}}),
    }
    result["crawl"] = await _leaderboard_for({"code": code.strip().upper()}) if code else None
    return result


@router.get("/crawls/{code}")
async def get_crawl(code: str):
    doc = await db.crawls.find_one({"code": code.upper()}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Crawl not found")
    return doc
