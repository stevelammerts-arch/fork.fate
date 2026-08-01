"""Community stat counters: fates dealt, crawls completed, reveal reactions."""
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends, Request
from pydantic import BaseModel, Field, field_validator
from pymongo import ReturnDocument
from pymongo.errors import DuplicateKeyError

from core import db, rate_limit, client_ip

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


# ── Reveal reactions ("Fate chose well" / "Fate failed me") ──────────────────
# One vote per (place, IP) per 30 days, enforced with the same stat_dedupe TTL
# collection the sponsor endpoints use (its `exp` index already auto-expires).
_REACTION_TTL = 30 * 86400
_reaction_dedupe_ready = False


class ReactionVote(BaseModel):
    place_id: str = Field(min_length=1, max_length=200)
    vote: str = Field(max_length=8)

    @field_validator("vote")
    @classmethod
    def _valid_vote(cls, v):
        if v not in ("up", "down"):
            raise ValueError("vote must be up|down")
        return v


async def _reaction_first_vote(key: str) -> bool:
    global _reaction_dedupe_ready
    if not _reaction_dedupe_ready:
        try:
            await db.stat_dedupe.create_index("exp", expireAfterSeconds=0)
        except Exception:
            pass
        _reaction_dedupe_ready = True
    now = datetime.now(timezone.utc)
    try:
        await db.stat_dedupe.update_one(
            {"_id": key, "exp": {"$lte": now}},
            {"$set": {"exp": now + timedelta(seconds=_REACTION_TTL)}},
            upsert=True,
        )
        return True
    except DuplicateKeyError:
        return False


def _reaction_payload(doc: dict | None) -> dict:
    up = int(doc.get("up", 0)) if doc else 0
    down = int(doc.get("down", 0)) if doc else 0
    total = up + down
    return {"up": up, "down": down, "total": total,
            "pct": round(up / total * 100) if total else None}


@router.get("/reactions/{place_id}", dependencies=[Depends(rate_limit(120))])
async def get_reactions(place_id: str):
    doc = await db.reactions.find_one({"place_id": place_id})
    return _reaction_payload(doc)


@router.post("/reactions", dependencies=[Depends(rate_limit(30))])
async def post_reaction(payload: ReactionVote, request: Request):
    if not await _reaction_first_vote(f"rxn:{payload.place_id}:{client_ip(request)}"):
        doc = await db.reactions.find_one({"place_id": payload.place_id})
        return {"counted": False, **_reaction_payload(doc)}
    doc = await db.reactions.find_one_and_update(
        {"place_id": payload.place_id},
        {"$inc": {payload.vote: 1}},
        upsert=True,
        return_document=ReturnDocument.AFTER,
    )
    return {"counted": True, **_reaction_payload(doc)}
