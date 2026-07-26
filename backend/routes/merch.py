"""Merch store: collect pre-launch 'notify me when it drops' interest."""
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, Request

from core import db, rate_limit, require_admin, client_ip
from models import MerchNotify

router = APIRouter()


@router.post("/merch/notify", dependencies=[Depends(rate_limit(20))])
async def merch_notify(payload: MerchNotify, request: Request):
    """Public: capture an email interested in a merch design before launch."""
    email = payload.email.strip().lower()
    await db.merch_interest.update_one(
        {"email": email, "design": payload.design},
        {"$setOnInsert": {
            "email": email,
            "design": payload.design,
            "product_key": payload.product_key,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "ip": client_ip(request),
        }},
        upsert=True,
    )
    return {"ok": True, "count": await db.merch_interest.count_documents({})}


@router.get("/admin/merch-interest", dependencies=[Depends(require_admin)])
async def list_merch_interest():
    """Admin: list all merch interest signups + per-design tally."""
    docs = await db.merch_interest.find({}, {"_id": 0}).sort("created_at", -1).to_list(5000)
    by_design = {}
    for d in docs:
        key = d.get("design") or "—"
        by_design[key] = by_design.get(key, 0) + 1
    return {"signups": docs, "count": len(docs), "by_design": by_design}
