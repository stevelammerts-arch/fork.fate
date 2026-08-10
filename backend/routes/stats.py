"""Community stat counters: fates dealt, crawls completed, reveal reactions,
plus the anonymous visitor-geography pageview beacon."""
import hashlib
import ipaddress
from datetime import datetime, timezone, timedelta

import httpx
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


# ── Visitor geography (pageview beacon) ──────────────────────────────────────
# One counted view per visitor (hashed IP) per 6h window. Geo comes from a
# free server-side IP lookup (ip-api.com), cached per IP for 30 days, with the
# Cloudflare CF-IPCountry header as a country-only fallback. Raw IPs are never
# stored — only a truncated SHA-256. Views expire after 180 days (TTL).
_PAGEVIEW_TTL_DAYS = 180
_GEO_CACHE_TTL_DAYS = 30
_PAGEVIEW_DEDUPE_HOURS = 6
_pageview_indexes_ready = False


async def _ensure_pageview_indexes():
    global _pageview_indexes_ready
    if _pageview_indexes_ready:
        return
    await db.pageviews.create_index("expire_at", expireAfterSeconds=0)
    await db.pageviews.create_index([("ip_hash", 1), ("ts", -1)])
    await db.pageviews.create_index("ts")
    await db.geo_cache.create_index("expire_at", expireAfterSeconds=0)
    await db.geo_cache.create_index("ip_hash", unique=True)
    _pageview_indexes_ready = True


def _hash_ip(ip: str) -> str:
    return hashlib.sha256(f"ffgeo:{ip}".encode()).hexdigest()[:32]


def _is_private_ip(ip: str) -> bool:
    try:
        return ipaddress.ip_address(ip).is_private or ipaddress.ip_address(ip).is_loopback
    except ValueError:
        return True


async def _geo_for_ip(ip: str, request: Request) -> dict:
    cf_country = request.headers.get("cf-ipcountry", "").strip().upper()
    fallback = {
        "country": cf_country if cf_country and cf_country not in ("XX", "T1") else "Unknown",
        "region": "",
        "city": "",
    }
    if _is_private_ip(ip):
        return fallback
    ip_hash = _hash_ip(ip)
    cached = await db.geo_cache.find_one({"ip_hash": ip_hash}, {"_id": 0})
    if cached:
        return {"country": cached.get("country", "Unknown"), "region": cached.get("region", ""), "city": cached.get("city", "")}
    geo = fallback
    try:
        async with httpx.AsyncClient(timeout=4) as http:
            r = await http.get(f"http://ip-api.com/json/{ip}", params={"fields": "status,country,regionName,city"})
            data = r.json()
        if data.get("status") == "success":
            geo = {
                "country": data.get("country") or fallback["country"],
                "region": data.get("regionName") or "",
                "city": data.get("city") or "",
            }
    except Exception:
        pass  # lookup is best-effort; the fallback still counts the view
    await db.geo_cache.update_one(
        {"ip_hash": ip_hash},
        {"$set": {**geo, "expire_at": datetime.now(timezone.utc) + timedelta(days=_GEO_CACHE_TTL_DAYS)}},
        upsert=True,
    )
    return geo


@router.post("/stats/pageview", dependencies=[Depends(rate_limit(60))])
async def record_pageview(request: Request):
    await _ensure_pageview_indexes()
    ip = client_ip(request)
    ip_hash = _hash_ip(ip)
    now = datetime.now(timezone.utc)
    recent = await db.pageviews.find_one(
        {"ip_hash": ip_hash, "ts": {"$gt": now - timedelta(hours=_PAGEVIEW_DEDUPE_HOURS)}},
        {"_id": 1},
    )
    if recent:
        return {"counted": False}
    geo = await _geo_for_ip(ip, request)
    await db.pageviews.insert_one({
        "ip_hash": ip_hash,
        "country": geo["country"],
        "region": geo["region"],
        "city": geo["city"],
        "ts": now,
        "expire_at": now + timedelta(days=_PAGEVIEW_TTL_DAYS),
    })
    return {"counted": True}
