"""Fate Duels: a challenger locks in fate's pick and sends a short link —
the friend lets fate deal theirs FOR THE SAME LOCATION, then fate crowns a
winner via a fate-score (deterministic from code+name so both phones agree)."""
import hashlib
import secrets
from datetime import datetime, timezone
from typing import List, Optional

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field

from core import db, rate_limit

router = APIRouter()

DUEL_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"  # no ambiguous chars


class DuelPick(BaseModel):
    id: str = Field(default="", max_length=80)
    name: str = Field(min_length=1, max_length=120)
    cuisine: str = Field(default="", max_length=80)
    address: str = Field(default="", max_length=200)
    image: str = Field(default="", max_length=600)


class DuelSearch(BaseModel):
    """The challenger's search context, replayed by the responder so both
    fates are dealt for the SAME location and filters."""
    zip_code: Optional[str] = Field(default=None, max_length=10)
    place_query: Optional[str] = Field(default=None, max_length=120)
    lat: Optional[float] = Field(default=None, ge=-90, le=90)
    lng: Optional[float] = Field(default=None, ge=-180, le=180)
    cuisines: List[str] = Field(default_factory=list, max_length=25)
    price_levels: List[str] = Field(default_factory=list, max_length=6)
    category: str = Field(default="food", max_length=20)
    open_now: bool = False
    radius_miles: float = Field(default=15.0, ge=1, le=150)


class DuelCreate(BaseModel):
    challenger: str = Field(default="A challenger", max_length=40)
    pick: DuelPick
    search: Optional[DuelSearch] = None


class DuelRespond(BaseModel):
    name: str = Field(default="The challenged", max_length=40)
    pick: DuelPick


def _fate_score(code: str, role: str, name: str) -> float:
    """Deterministic 55.0-99.9 fate-score from the duel code + pick, so every
    device computes the identical verdict without storing anything extra."""
    digest = hashlib.sha256(f"{code}:{role}:{name}".encode()).hexdigest()
    return round(55.0 + (int(digest[:12], 16) % 4490) / 100.0, 2)


def _with_verdict(doc: dict) -> dict:
    cp, rp = doc.get("challenger_pick"), doc.get("responder_pick")
    if cp and rp:
        cs = _fate_score(doc["code"], "challenger", cp.get("name", ""))
        rs = _fate_score(doc["code"], "responder", rp.get("name", ""))
        doc["verdict"] = {
            "challenger_score": cs,
            "responder_score": rs,
            "winner": "challenger" if cs >= rs else "responder",
        }
    else:
        doc["verdict"] = None
    return doc


@router.post("/duels", dependencies=[Depends(rate_limit(30))])
async def create_duel(payload: DuelCreate):
    code = "".join(secrets.choice(DUEL_CODE_ALPHABET) for _ in range(6))
    await db.duels.insert_one({
        "code": code,
        "challenger": payload.challenger.strip() or "A challenger",
        "challenger_pick": payload.pick.model_dump(),
        "search": payload.search.model_dump() if payload.search else None,
        "responder": None,
        "responder_pick": None,
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    return {"code": code}


@router.get("/duels/{code}")
async def get_duel(code: str):
    doc = await db.duels.find_one({"code": (code or "").strip().upper()[:8]}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Duel not found")
    return _with_verdict(doc)


@router.post("/duels/{code}/respond", dependencies=[Depends(rate_limit(30))])
async def respond_duel(code: str, payload: DuelRespond):
    clean = (code or "").strip().upper()[:8]
    doc = await db.duels.find_one({"code": clean})
    if not doc:
        raise HTTPException(status_code=404, detail="Duel not found")
    if doc.get("responder_pick"):
        raise HTTPException(status_code=409, detail="This duel has already been answered")
    await db.duels.update_one(
        {"code": clean},
        {"$set": {
            "responder": payload.name.strip() or "The challenged",
            "responder_pick": payload.pick.model_dump(),
            "answered_at": datetime.now(timezone.utc).isoformat(),
        }},
    )
    fresh = await db.duels.find_one({"code": clean}, {"_id": 0})
    return _with_verdict(fresh)
