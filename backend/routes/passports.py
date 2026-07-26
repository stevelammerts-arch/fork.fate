"""Fate Passports — multi-day quests you stamp one stop at a time.

A crawl is one night; a passport is the slow version (parks, trails, museums,
breweries) collected over days or weeks. Stamps live inside the passport doc so
they persist — unlike crawl check-ins, which are ephemeral breadcrumbs.
"""
import secrets
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException

from core import db, haversine_miles, rate_limit
from models import PassportCreate, PassportStamp

router = APIRouter()

PASSPORT_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"  # no ambiguous chars
# A GPS stamp must be taken at the place. State parks and trailheads are huge and
# phone GPS drifts, so the ring is generous — manual stamping exists for the rest.
GPS_STAMP_RADIUS_MILES = 0.4


def _gen_code(n: int = 6) -> str:
    return "".join(secrets.choice(PASSPORT_CODE_ALPHABET) for _ in range(n))


def _public(doc: dict) -> dict:
    stops = doc.get("stops", [])
    stamps = doc.get("stamps", [])
    return {
        "code": doc["code"],
        "mode": doc.get("mode", "explore"),
        "label": doc.get("label", ""),
        "stops": stops,
        "stamps": stamps,
        "stamped": len(stamps),
        "total": len(stops),
        "completed_at": doc.get("completed_at"),
        "created_at": doc.get("created_at"),
    }


@router.post("/passports", dependencies=[Depends(rate_limit(20))])
async def create_passport(payload: PassportCreate):
    code = _gen_code()
    for _ in range(6):
        if not await db.passports.find_one({"code": code}):
            break
        code = _gen_code()
    doc = {
        "code": code,
        "mode": payload.mode,
        "label": payload.label,
        "stops": [s.model_dump() for s in payload.stops],
        "stamps": [],
        "completed_at": None,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.passports.insert_one(doc)
    return {"code": code}


async def _get_or_404(code: str) -> dict:
    doc = await db.passports.find_one({"code": (code or "").strip().upper()[:8]}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Passport not found")
    return doc


@router.get("/passports/{code}")
async def get_passport(code: str):
    return _public(await _get_or_404(code))


@router.post("/passports/{code}/stamp", dependencies=[Depends(rate_limit(60))])
async def stamp_passport(code: str, payload: PassportStamp):
    doc = await _get_or_404(code)
    stop = next((s for s in doc.get("stops", []) if s.get("id") == payload.stop_id), None)
    if not stop:
        raise HTTPException(status_code=404, detail="That stop isn't on this passport")
    if any(s.get("stop_id") == payload.stop_id for s in doc.get("stamps", [])):
        return {**_public(doc), "already_stamped": True}

    verified = False
    if payload.source == "gps":
        if payload.lat is None or payload.lng is None:
            raise HTTPException(status_code=400, detail="A GPS stamp needs your location")
        if stop.get("lat") is None or stop.get("lng") is None:
            raise HTTPException(status_code=400, detail="This stop has no coordinates — stamp it manually")
        miles = haversine_miles(payload.lat, payload.lng, stop["lat"], stop["lng"])
        if miles > GPS_STAMP_RADIUS_MILES:
            raise HTTPException(
                status_code=409,
                detail=f"You're about {miles:.1f} mi away — get closer, or stamp it manually",
            )
        verified = True

    now = datetime.now(timezone.utc).isoformat()
    stamp = {"stop_id": payload.stop_id, "stamped_at": now, "verified": verified}
    update = {"$push": {"stamps": stamp}}
    if len(doc.get("stamps", [])) + 1 >= len(doc.get("stops", [])):
        update["$set"] = {"completed_at": now}
    await db.passports.update_one({"code": doc["code"]}, update)
    return {**_public(await _get_or_404(doc["code"])), "just_stamped": stamp}


@router.delete("/passports/{code}/stamp/{stop_id}", dependencies=[Depends(rate_limit(60))])
async def unstamp_passport(code: str, stop_id: str):
    """Undo a mis-tapped stamp (and re-open a passport that was marked complete)."""
    doc = await _get_or_404(code)
    await db.passports.update_one(
        {"code": doc["code"]},
        {"$pull": {"stamps": {"stop_id": stop_id}}, "$set": {"completed_at": None}},
    )
    return _public(await _get_or_404(doc["code"]))
