"""Fate Passports — multi-day quests you stamp one stop at a time.

A crawl is one night; a passport is the slow version (parks, trails, museums,
breweries) collected over days or weeks. Stamps live inside the passport doc so
they persist — unlike crawl check-ins, which are ephemeral breadcrumbs.
"""
import base64
import secrets
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Response

from core import db, haversine_miles, rate_limit
from models import PassportCreate, PassportHolder, PassportPhoto, PassportStamp

router = APIRouter()

PASSPORT_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"  # no ambiguous chars
# A GPS stamp must be taken at the place. State parks and trailheads are huge and
# phone GPS drifts, so the ring is generous — manual stamping exists for the rest.
GPS_STAMP_RADIUS_MILES = 0.4
# Anti-cheat. A stamp only counts as "verified on site" if the phone actually knew
# where it was, and if you could plausibly have travelled there since the last
# stamp. Manual stamps are always allowed but are marked self-reported.
GPS_ACCURACY_LIMIT_M = 300
MIN_SECONDS_BETWEEN_STAMPS = 60
MAX_TRAVEL_MPH = 80


def _gen_code(n: int = 6) -> str:
    return "".join(secrets.choice(PASSPORT_CODE_ALPHABET) for _ in range(n))


def _public(doc: dict) -> dict:
    stops = doc.get("stops", [])
    # Photos are heavy — the list only advertises which stops have one; the bytes
    # come from /passports/{code}/photo/{stop_id}.
    stamps = [{k: v for k, v in s.items() if k != "photo"} | {"has_photo": bool(s.get("photo"))} for s in doc.get("stamps", [])]
    verified = sum(1 for s in stamps if s.get("verified"))
    return {
        "code": doc["code"],
        "mode": doc.get("mode", "explore"),
        "label": doc.get("label", ""),
        "stops": stops,
        "stamps": stamps,
        "stamped": len(stamps),
        "verified": verified,
        # Only a passport stamped on site at every stop can wear the seal — or go
        # on the public wall.
        "fully_verified": bool(stops) and verified == len(stops),
        "total": len(stops),
        "completed_at": doc.get("completed_at"),
        "created_at": doc.get("created_at"),
        "holder_name": doc.get("holder_name", ""),
        "has_holder_photo": bool(doc.get("holder_photo")),
        "published_at": doc.get("published_at"),
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


@router.get("/passports/wall")
async def passport_wall(limit: int = 40):
    """The public wall: finished passports their owners chose to post."""
    limit = max(1, min(limit, 60))
    cursor = (
        db.passports.find(
            {"published_at": {"$ne": None}},
            {"_id": 0, "wall_thumb": 0, "holder_photo": 0, "stamps.photo": 0},
        )
        .sort("published_at", -1)
        .limit(limit)
    )
    return {
        "items": [
            {
                "code": d["code"],
                "mode": d.get("mode", "explore"),
                "label": d.get("label", ""),
                "holder_name": d.get("holder_name", ""),
                "stops": len(d.get("stops", [])),
                "verified": sum(1 for s in d.get("stamps", []) if s.get("verified")) if d.get("stamps") else 0,
                "completed_at": d.get("completed_at"),
                "published_at": d.get("published_at"),
            }
            async for d in cursor
        ]
    }


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
    note = None
    now_dt = datetime.now(timezone.utc)
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
        # A fix this fuzzy can't prove you were there — it still stamps, just
        # self-reported.
        if payload.accuracy is not None and payload.accuracy > GPS_ACCURACY_LIMIT_M:
            verified = False
            note = "Your GPS was too fuzzy to verify — stamped as self-reported"

    # Couldn't-have-got-there check: nobody stamps two stops 40 miles apart in a
    # minute, and nobody stamps an entire passport in one breath.
    previous = sorted(doc.get("stamps", []), key=lambda s: s.get("stamped_at", ""))
    if previous:
        last = previous[-1]
        try:
            elapsed = (now_dt - datetime.fromisoformat(last["stamped_at"])).total_seconds()
        except (KeyError, ValueError):
            elapsed = 0  # unreadable timestamp — fail closed and make them wait
        if elapsed < MIN_SECONDS_BETWEEN_STAMPS:
            raise HTTPException(
                status_code=429,
                detail=f"Slow down — wait {int(MIN_SECONDS_BETWEEN_STAMPS - elapsed)}s before stamping the next stop",
            )
        last_stop = next((s for s in doc.get("stops", []) if s.get("id") == last.get("stop_id")), None)
        if (
            verified
            and last.get("verified")
            and last_stop
            and last_stop.get("lat") is not None
            and stop.get("lat") is not None
        ):
            gap = haversine_miles(last_stop["lat"], last_stop["lng"], stop["lat"], stop["lng"])
            needed = gap / MAX_TRAVEL_MPH * 3600
            if elapsed < needed:
                raise HTTPException(
                    status_code=409,
                    detail=(
                        f"That's {gap:.0f} mi from your last stamp in {int(elapsed / 60)} min — "
                        "no one travels that fast. Try again when you get there."
                    ),
                )

    now = now_dt.isoformat()
    stamp = {"stop_id": payload.stop_id, "stamped_at": now, "verified": verified}
    if payload.accuracy is not None:
        stamp["accuracy_m"] = round(payload.accuracy)
    if payload.photo:
        stamp["photo"] = payload.photo
    update = {"$push": {"stamps": stamp}}
    if len(doc.get("stamps", [])) + 1 >= len(doc.get("stops", [])):
        update["$set"] = {"completed_at": now}
    await db.passports.update_one({"code": doc["code"]}, update)
    return {**_public(await _get_or_404(doc["code"])), "just_stamped": stamp, "note": note}


@router.post("/passports/{code}/photo/{stop_id}", dependencies=[Depends(rate_limit(40))])
async def add_stop_photo(code: str, stop_id: str, payload: PassportPhoto):
    """Attach (or replace) the selfie for a stop that's already stamped."""
    doc = await _get_or_404(code)
    if not any(s.get("stop_id") == stop_id for s in doc.get("stamps", [])):
        raise HTTPException(status_code=409, detail="Stamp the stop first, then add your photo")
    await db.passports.update_one(
        {"code": doc["code"], "stamps.stop_id": stop_id},
        {"$set": {"stamps.$.photo": payload.photo}},
    )
    return _public(await _get_or_404(doc["code"]))


def _image_response(data_url: str) -> Response:
    header, _, b64 = data_url.partition(",")
    media = header.split(":")[1].split(";")[0] if ":" in header else "image/jpeg"
    try:
        raw = base64.b64decode(b64)
    except Exception:
        raise HTTPException(status_code=500, detail="Stored photo is corrupt") from None
    return Response(content=raw, media_type=media, headers={"Cache-Control": "private, max-age=3600"})


@router.get("/passports/{code}/photo/{stop_id}")
async def get_stop_photo(code: str, stop_id: str):
    doc = await _get_or_404(code)
    stamp = next((s for s in doc.get("stamps", []) if s.get("stop_id") == stop_id), None)
    if not stamp or not stamp.get("photo"):
        raise HTTPException(status_code=404, detail="No photo for that stop")
    return _image_response(stamp["photo"])


@router.post("/passports/{code}/holder", dependencies=[Depends(rate_limit(40))])
async def set_holder(code: str, payload: PassportHolder):
    """The ID page — the traveller's own portrait and name, printed on the award."""
    doc = await _get_or_404(code)
    fields = {"holder_name": payload.name.strip()}
    if payload.photo:
        fields["holder_photo"] = payload.photo
    await db.passports.update_one({"code": doc["code"]}, {"$set": fields})
    return _public(await _get_or_404(doc["code"]))


@router.get("/passports/{code}/holder-photo")
async def get_holder_photo(code: str):
    doc = await _get_or_404(code)
    if not doc.get("holder_photo"):
        raise HTTPException(status_code=404, detail="No passport photo yet")
    return _image_response(doc["holder_photo"])


@router.post("/passports/{code}/publish", dependencies=[Depends(rate_limit(20))])
async def publish_passport(code: str, payload: PassportPhoto):
    """Post a finished passport to the public wall (the award thumbnail travels with it)."""
    doc = await _get_or_404(code)
    if not doc.get("completed_at"):
        raise HTTPException(status_code=409, detail="Finish every stop before posting to the wall")
    if not _public(doc)["fully_verified"]:
        raise HTTPException(
            status_code=409,
            detail="The wall is for passports stamped on site — every stop needs a GPS stamp",
        )
    await db.passports.update_one(
        {"code": doc["code"]},
        {"$set": {"wall_thumb": payload.photo, "published_at": datetime.now(timezone.utc).isoformat()}},
    )
    return _public(await _get_or_404(doc["code"]))


@router.delete("/passports/{code}/publish", dependencies=[Depends(rate_limit(20))])
async def unpublish_passport(code: str):
    doc = await _get_or_404(code)
    await db.passports.update_one({"code": doc["code"]}, {"$set": {"published_at": None}, "$unset": {"wall_thumb": ""}})
    return _public(await _get_or_404(doc["code"]))


@router.get("/passports/{code}/wall-thumb")
async def get_wall_thumb(code: str):
    doc = await _get_or_404(code)
    if not doc.get("wall_thumb") or not doc.get("published_at"):
        raise HTTPException(status_code=404, detail="Not on the wall")
    return _image_response(doc["wall_thumb"])


@router.delete("/passports/{code}", dependencies=[Depends(rate_limit(30))])
async def delete_passport(code: str):
    """Users own their passports — a code holder can delete the whole quest."""
    doc = await _get_or_404(code)
    await db.passports.delete_one({"code": doc["code"]})
    return {"deleted": doc["code"]}


@router.delete("/passports/{code}/stamp/{stop_id}", dependencies=[Depends(rate_limit(60))])
async def unstamp_passport(code: str, stop_id: str):
    """Undo a mis-tapped stamp (and re-open a passport that was marked complete)."""
    doc = await _get_or_404(code)
    await db.passports.update_one(
        {"code": doc["code"]},
        {"$pull": {"stamps": {"stop_id": stop_id}}, "$set": {"completed_at": None}},
    )
    return _public(await _get_or_404(doc["code"]))
