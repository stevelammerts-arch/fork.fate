"""Admin portal: auth, sponsor CRUD/stats, submissions moderation, reconcile."""
import uuid
import hmac
from typing import List
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Depends, Request

from core import (db, rate_limit, require_admin, create_admin_token, client_ip,
                  check_login_lockout, record_login_failure, clear_login_failures,
                  ADMIN_PASSWORD, SPONSOR_PRICE, FALLBACK_IMG, GOOGLE_SEARCH_DAILY_CAP,
                  GOOGLE_SEARCH_ALERT_PCT, send_email)
from models import AdminLogin, SponsorCreate, SponsorUpdate, SponsorClick, Restaurant
from routes.sponsors import reconcile_sponsors

router = APIRouter()


@router.post("/admin/login", dependencies=[Depends(rate_limit(10))])
async def admin_login(payload: AdminLogin, request: Request):
    ip = client_ip(request)
    check_login_lockout(ip)  # per-IP failed-attempt lockout + generous global backstop
    if not ADMIN_PASSWORD or not hmac.compare_digest(payload.password, ADMIN_PASSWORD):
        record_login_failure(ip)
        raise HTTPException(status_code=401, detail="Incorrect password")
    clear_login_failures(ip)
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


@router.get("/admin/cost-status", dependencies=[Depends(require_admin)])
async def cost_status():
    """Today's billed Google search/geocode usage vs the daily cost cap, plus recent history."""
    today = datetime.now(timezone.utc).date().isoformat()
    doc = await db.config.find_one({"key": "google_budget", "date": today}, {"_id": 0})
    used = int(doc.get("searches", 0)) if doc else 0
    recent = await db.config.find({"key": "google_budget"}, {"_id": 0}).sort("date", -1).to_list(7)
    history = [{"date": d.get("date"), "searches": int(d.get("searches", 0) or 0)} for d in recent]
    cap = GOOGLE_SEARCH_DAILY_CAP
    return {
        "date": today,
        "used": used,
        "cap": cap,
        "remaining": max(0, cap - used),
        "pct": round((used / cap) * 100, 1) if cap else 0,
        "alert_pct": GOOGLE_SEARCH_ALERT_PCT,
        "alerted": bool(doc.get("alerted")) if doc else False,
        "history": history,
    }



async def build_sponsor_summary():
    """Build the (subject, html) for the sponsor performance summary email."""
    sponsors = await db.sponsors.find({}, {"_id": 0}).to_list(500)
    price = float(SPONSOR_PRICE)
    paying = [s for s in sponsors if s.get("sub_status") == "active"]
    active = [s for s in sponsors if s.get("active")]
    total_impressions = sum(int(s.get("impressions", 0) or 0) for s in sponsors)
    total_clicks = sum(int(s.get("clicks", 0) or 0) for s in sponsors)
    mrr = round(len(paying) * price, 2)
    arr = round(mrr * 12, 2)
    ctr = round(total_clicks / total_impressions * 100, 1) if total_impressions else 0
    month = datetime.now(timezone.utc).strftime("%B %Y")
    top = sorted(sponsors, key=lambda s: int(s.get("clicks", 0) or 0), reverse=True)[:5]
    if top and total_clicks:
        rows = "".join(
            f"<tr><td style='padding:7px 12px;border-bottom:1px solid #eee'>{i+1}. {(s.get('name') or 'Sponsor')}</td>"
            f"<td style='padding:7px 12px;border-bottom:1px solid #eee;text-align:right'>{int(s.get('clicks',0) or 0)}</td>"
            f"<td style='padding:7px 12px;border-bottom:1px solid #eee;text-align:right'>{int(s.get('impressions',0) or 0)}</td></tr>"
            for i, s in enumerate(top))
    else:
        rows = "<tr><td style='padding:7px 12px' colspan='3'>No sponsor clicks yet.</td></tr>"
    subject = f"Fork·Fate sponsor summary — {month}"
    html = (
        "<div style='font-family:Arial,sans-serif;color:#1a1a1a;max-width:560px'>"
        f"<h2 style='color:#E01E26;margin:0 0 4px'>Fork·Fate sponsor summary</h2>"
        f"<p style='margin:0 0 16px;color:#666'>{month}</p>"
        "<table style='border-collapse:collapse;width:100%;margin-bottom:18px'>"
        f"<tr><td style='padding:6px 0'>Paying subscribers</td><td style='text-align:right;font-weight:bold'>{len(paying)}</td></tr>"
        f"<tr><td style='padding:6px 0'>MRR</td><td style='text-align:right;font-weight:bold'>${mrr:,.2f}</td></tr>"
        f"<tr><td style='padding:6px 0'>ARR (projected)</td><td style='text-align:right;font-weight:bold'>${arr:,.2f}</td></tr>"
        f"<tr><td style='padding:6px 0'>Active sponsors shown</td><td style='text-align:right;font-weight:bold'>{len(active)}</td></tr>"
        f"<tr><td style='padding:6px 0'>Total clicks (all-time)</td><td style='text-align:right;font-weight:bold'>{total_clicks:,}</td></tr>"
        f"<tr><td style='padding:6px 0'>Total impressions (all-time)</td><td style='text-align:right;font-weight:bold'>{total_impressions:,}</td></tr>"
        f"<tr><td style='padding:6px 0'>Click-through rate</td><td style='text-align:right;font-weight:bold'>{ctr}%</td></tr>"
        "</table>"
        "<h3 style='margin:0 0 8px'>Top sponsors by clicks</h3>"
        "<table style='border-collapse:collapse;width:100%'>"
        "<tr style='text-align:left;color:#666;font-size:13px'><th style='padding:7px 12px'>Sponsor</th>"
        "<th style='padding:7px 12px;text-align:right'>Clicks</th><th style='padding:7px 12px;text-align:right'>Impressions</th></tr>"
        f"{rows}</table>"
        "<p style='margin:18px 0 0;color:#999;font-size:12px'>Clicks &amp; impressions are all-time cumulative totals.</p>"
        "</div>"
    )
    return subject, html


@router.post("/admin/email-summary", dependencies=[Depends(require_admin)])
async def email_summary():
    """Send the sponsor performance summary email on demand."""
    subject, html = await build_sponsor_summary()
    ok = await send_email(subject, html)
    if not ok:
        raise HTTPException(status_code=503, detail="email-not-configured-or-failed")
    return {"sent": True}