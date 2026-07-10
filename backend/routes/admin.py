"""Admin portal: auth, sponsor CRUD/stats, submissions moderation, reconcile."""
import uuid
import hmac
from typing import List
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Depends

from core import db, rate_limit, require_admin, create_admin_token, admin_login_throttle, ADMIN_PASSWORD, SPONSOR_PRICE, FALLBACK_IMG
from models import AdminLogin, SponsorCreate, SponsorUpdate, SponsorClick, Restaurant
from routes.sponsors import reconcile_sponsors

router = APIRouter()


@router.post("/admin/login", dependencies=[Depends(rate_limit(10))])
async def admin_login(payload: AdminLogin):
    admin_login_throttle()  # global cap across all IPs (anti distributed brute-force)
    if not ADMIN_PASSWORD or not hmac.compare_digest(payload.password, ADMIN_PASSWORD):
        raise HTTPException(status_code=401, detail="Incorrect password")
    return {"token": create_admin_token()}


@router.get("/admin/verify", dependencies=[Depends(require_admin)])
async def admin_verify():
    return {"ok": True}


@router.get("/admin/sponsors", dependencies=[Depends(require_admin)])
async def list_sponsors():
    return await db.sponsors.find({}, {"_id": 0}).sort("created_at", -1).to_list(200)


@router.get("/admin/sponsors/stats", dependencies=[Depends(require_admin)])
async def sponsor_stats():
    """Aggregate MRR + subscriber counts for the admin dashboard."""
    sponsors = await db.sponsors.find({}, {"_id": 0}).to_list(500)
    price = float(SPONSOR_PRICE)
    active = [s for s in sponsors if s.get("active")]
    paying = [s for s in sponsors if s.get("sub_status") == "active"]
    total_impressions = sum(int(s.get("impressions", 0) or 0) for s in sponsors)
    total_clicks = sum(int(s.get("clicks", 0) or 0) for s in sponsors)
    return {
        "total_sponsors": len(sponsors),
        "active_sponsors": len(active),
        "paying_subscribers": len(paying),
        "mrr": round(len(paying) * price, 2),
        "arr": round(len(paying) * price * 12, 2),
        "price": price,
        "total_impressions": total_impressions,
        "total_clicks": total_clicks,
    }


@router.post("/admin/sponsors", dependencies=[Depends(require_admin)])
async def create_sponsor(payload: SponsorCreate):
    doc = payload.model_dump()
    doc['id'] = str(uuid.uuid4())
    doc['image'] = doc['image'] or FALLBACK_IMG
    doc['open_now'] = True
    doc['impressions'] = 0
    doc['clicks'] = 0
    doc['created_at'] = datetime.now(timezone.utc).isoformat()
    await db.sponsors.insert_one(doc)
    doc.pop('_id', None)
    return doc


@router.patch("/admin/sponsors/{sponsor_id}", dependencies=[Depends(require_admin)])
async def update_sponsor(sponsor_id: str, payload: SponsorUpdate):
    updates = {k: v for k, v in payload.model_dump().items() if v is not None}
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")
    res = await db.sponsors.update_one({"id": sponsor_id}, {"$set": updates})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Sponsor not found")
    return await db.sponsors.find_one({"id": sponsor_id}, {"_id": 0})


@router.delete("/admin/sponsors/{sponsor_id}", dependencies=[Depends(require_admin)])
async def delete_sponsor(sponsor_id: str):
    res = await db.sponsors.delete_one({"id": sponsor_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Sponsor not found")
    return {"ok": True}


@router.post("/track/sponsor-click", dependencies=[Depends(rate_limit(120))])
async def track_sponsor_click(payload: SponsorClick):
    """Public: record a click on a sponsored spot's outbound link."""
    await db.sponsors.update_one({"id": payload.sponsor_id}, {"$inc": {"clicks": 1}})
    return {"ok": True}


@router.get("/admin/submissions", response_model=List[Restaurant], dependencies=[Depends(require_admin)])
async def list_submissions():
    """Community-submitted spots awaiting review."""
    return await db.restaurants.find({"status": "pending"}, {"_id": 0}).sort("created_at", -1).to_list(500)


@router.post("/admin/submissions/{restaurant_id}/approve", dependencies=[Depends(require_admin)])
async def approve_submission(restaurant_id: str):
    res = await db.restaurants.update_one({"id": restaurant_id}, {"$set": {"status": "approved"}})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Submission not found")
    return {"ok": True}


@router.delete("/admin/submissions/{restaurant_id}", dependencies=[Depends(require_admin)])
async def reject_submission(restaurant_id: str):
    res = await db.restaurants.delete_one({"id": restaurant_id, "status": "pending"})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Submission not found")
    return {"ok": True}


@router.post("/admin/sponsors/reconcile", dependencies=[Depends(require_admin)])
async def admin_reconcile_sponsors():
    return await reconcile_sponsors()
