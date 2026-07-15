"""Sponsorship requests + self-serve PayPal subscription billing + reconcile."""
import uuid
import httpx
from datetime import datetime, timezone, timedelta
from pymongo.errors import DuplicateKeyError
from fastapi import APIRouter, HTTPException, Request, Depends, UploadFile, File
from fastapi.responses import Response

from core import (
    db, logger, rate_limit, client_ip, origin_allowed, SPONSOR_PRICE,
    SPONSOR_PRICE_ANNUAL, sponsor_fallback_image, storage_put, storage_get, STORAGE_APP,
    PAYPAL_BASE, PAYPAL_ENV, PAYPAL_CLIENT_ID, PAYPAL_SECRET, PAYPAL_WEBHOOK_ID,
)
from models import SponsorshipRequest, SponsorSubscribe

router = APIRouter()

_UPLOAD_TYPES = {"image/jpeg": "jpg", "image/png": "png", "image/webp": "webp"}
_MAX_UPLOAD = 5 * 1024 * 1024  # 5 MB
_MAX_UPLOADS_PER_DAY = 300  # global ceiling to bound object-storage cost abuse

# Cross-worker dedupe (Mongo-backed) so a single client can't inflate sponsor
# analytics by hammering the public impression/click endpoints. A TTL index on
# `exp` auto-expires stale keys.
_IMPRESSION_TTL = 60      # count one impression batch per IP per minute
_CLICK_TTL = 300          # count one click per (sponsor, IP) per 5 minutes
_dedupe_index_ready = False


async def _stat_first_seen(key: str, ttl: int) -> bool:
    """True if this key hasn't been counted within its TTL window (atomic, cross-worker)."""
    global _dedupe_index_ready
    if not _dedupe_index_ready:
        try:
            await db.stat_dedupe.create_index("exp", expireAfterSeconds=0)
        except Exception:
            pass
        _dedupe_index_ready = True
    now = datetime.now(timezone.utc)
    exp = now + timedelta(seconds=ttl)
    try:
        # Matches only a missing or already-expired key; a live key hits the unique
        # _id on upsert insert and raises DuplicateKeyError -> deduped.
        await db.stat_dedupe.update_one(
            {"_id": key, "exp": {"$lte": now}},
            {"$set": {"exp": exp}},
            upsert=True,
        )
        return True
    except DuplicateKeyError:
        return False



def _sniff_image(data: bytes) -> str | None:
    """Verify real image bytes (magic numbers) rather than trusting the client header."""
    if data[:3] == b"\xff\xd8\xff":
        return "jpg"
    if data[:8] == b"\x89PNG\r\n\x1a\n":
        return "png"
    if data[:4] == b"RIFF" and data[8:12] == b"WEBP":
        return "webp"
    return None


@router.post("/sponsors/upload-photo", dependencies=[Depends(rate_limit(15))])
async def upload_sponsor_photo(file: UploadFile = File(...)):
    """Upload a sponsor business photo to object storage; returns its serve path."""
    ext = _UPLOAD_TYPES.get(file.content_type)
    if not ext:
        raise HTTPException(status_code=400, detail="Please upload a JPG, PNG or WEBP image")
    # Global daily cap so an anonymous caller can't bulk-fill paid storage.
    day_ago = (datetime.now(timezone.utc) - timedelta(days=1)).isoformat()
    recent = await db.files.count_documents({"kind": "sponsor_photo", "created_at": {"$gt": day_ago}})
    if recent >= _MAX_UPLOADS_PER_DAY:
        raise HTTPException(status_code=429, detail="Upload limit reached, please try again later")
    data = await file.read()
    if len(data) > _MAX_UPLOAD:
        raise HTTPException(status_code=400, detail="Image too large (max 5 MB)")
    if not data:
        raise HTTPException(status_code=400, detail="Empty file")
    # Trust the bytes, not the header — reject anything that isn't a real image.
    if _sniff_image(data) != ext:
        raise HTTPException(status_code=400, detail="File is not a valid JPG, PNG or WEBP image")
    path = f"{STORAGE_APP}/sponsors/{uuid.uuid4()}.{ext}"
    try:
        result = await storage_put(path, data, file.content_type)
    except Exception as e:
        logger.error(f"Sponsor photo upload failed: {e}")
        raise HTTPException(status_code=502, detail="Upload failed, please try again")
    stored = result.get("path", path)
    await db.files.insert_one({
        "id": str(uuid.uuid4()),
        "storage_path": stored,
        "original_filename": file.filename,
        "content_type": file.content_type,
        "size": result.get("size", len(data)),
        "kind": "sponsor_photo",
        "is_deleted": False,
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    return {"path": stored}


@router.get("/files/{path:path}")
async def serve_file(path: str):
    """Public serve for sponsor photos (images are meant to be shown to everyone)."""
    record = await db.files.find_one({"storage_path": path, "is_deleted": False})
    if not record:
        raise HTTPException(status_code=404, detail="File not found")
    try:
        data, content_type = await storage_get(path)
    except Exception:
        raise HTTPException(status_code=404, detail="File not found")
    return Response(
        content=data,
        media_type=record.get("content_type", content_type),
        headers={"Cache-Control": "public, max-age=86400"},
    )


@router.post("/sponsorship-requests", dependencies=[Depends(rate_limit(10))])
async def create_sponsorship_request(payload: SponsorshipRequest):
    """Businesses can request a sponsored spot. Stored for review/follow-up."""
    doc = payload.model_dump()
    doc['id'] = str(uuid.uuid4())
    doc['status'] = "new"
    doc['created_at'] = datetime.now(timezone.utc).isoformat()
    await db.sponsorship_requests.insert_one(doc)
    return {"ok": True, "id": doc['id']}


def paypal_configured():
    return bool(PAYPAL_CLIENT_ID and PAYPAL_SECRET)


async def paypal_token(http: httpx.AsyncClient):
    r = await http.post(
        f"{PAYPAL_BASE}/v1/oauth2/token",
        auth=(PAYPAL_CLIENT_ID, PAYPAL_SECRET),
        data={"grant_type": "client_credentials"},
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    if r.status_code != 200:
        logger.error(f"PayPal token error: {r.status_code} {r.text[:300]}")
        raise HTTPException(status_code=502, detail="PayPal auth failed")
    return r.json()["access_token"]


async def _ensure_paypal_product(http: httpx.AsyncClient, h: dict) -> str:
    """Create (once) and cache the shared PayPal product for all sponsor plans."""
    cfg = await db.config.find_one({"key": "paypal_product", "env": PAYPAL_ENV})
    if cfg and cfg.get("product_id"):
        return cfg["product_id"]
    prod = await http.post(f"{PAYPAL_BASE}/v1/catalogs/products", headers=h, json={
        "name": "Fork·Fate Sponsorship", "type": "SERVICE", "category": "ADVERTISING",
    })
    if prod.status_code not in (200, 201):
        logger.error(f"PayPal product error: {prod.text[:300]}")
        raise HTTPException(status_code=502, detail="Could not create PayPal product")
    product_id = prod.json()["id"]
    await db.config.update_one({"key": "paypal_product", "env": PAYPAL_ENV},
                               {"$set": {"product_id": product_id}}, upsert=True)
    return product_id


def _plan_spec(period: str, product_id: str) -> dict:
    """PayPal billing-plan body for the given period.
    monthly: free first month, then $29/mo. yearly: $290/yr charged up front, no trial."""
    if period == "yearly":
        return {
            "product_id": product_id,
            "name": "Fork·Fate Sponsor — $290/yr",
            "description": "Sponsored placement on Fork·Fate. Billed $290/year (2 months free).",
            "billing_cycles": [
                {"frequency": {"interval_unit": "YEAR", "interval_count": 1}, "tenure_type": "REGULAR",
                 "sequence": 1, "total_cycles": 0,
                 "pricing_scheme": {"fixed_price": {"value": SPONSOR_PRICE_ANNUAL, "currency_code": "USD"}}},
            ],
            "payment_preferences": {
                "auto_bill_outstanding": True,
                "setup_fee": {"value": "0", "currency_code": "USD"},
                "setup_fee_failure_action": "CONTINUE",
                "payment_failure_threshold": 2,
            },
        }
    return {
        "product_id": product_id,
        "name": "Fork·Fate Sponsor — $29/mo",
        "description": "Sponsored placement on Fork·Fate. First month free, then $29/month.",
        "billing_cycles": [
            {"frequency": {"interval_unit": "MONTH", "interval_count": 1}, "tenure_type": "TRIAL",
             "sequence": 1, "total_cycles": 1,
             "pricing_scheme": {"fixed_price": {"value": "0", "currency_code": "USD"}}},
            {"frequency": {"interval_unit": "MONTH", "interval_count": 1}, "tenure_type": "REGULAR",
             "sequence": 2, "total_cycles": 0,
             "pricing_scheme": {"fixed_price": {"value": SPONSOR_PRICE, "currency_code": "USD"}}},
        ],
        "payment_preferences": {
            "auto_bill_outstanding": True,
            "setup_fee": {"value": "0", "currency_code": "USD"},
            "setup_fee_failure_action": "CONTINUE",
            "payment_failure_threshold": 2,
        },
    }


async def ensure_paypal_plan(http: httpx.AsyncClient, token: str, period: str = "monthly"):
    """Create (once) and cache the PayPal billing plan for the given period."""
    key = "paypal_plan_annual" if period == "yearly" else "paypal_plan"
    cfg = await db.config.find_one({"key": key})
    if cfg and cfg.get("plan_id") and cfg.get("env") == PAYPAL_ENV:
        return cfg["plan_id"]
    h = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    product_id = await _ensure_paypal_product(http, h)
    plan = await http.post(f"{PAYPAL_BASE}/v1/billing/plans", headers=h,
                           json=_plan_spec(period, product_id))
    if plan.status_code not in (200, 201):
        logger.error(f"PayPal plan error: {plan.text[:300]}")
        raise HTTPException(status_code=502, detail="Could not create PayPal plan")
    plan_id = plan.json()["id"]
    await db.config.update_one({"key": key},
                               {"$set": {"plan_id": plan_id, "product_id": product_id, "env": PAYPAL_ENV}},
                               upsert=True)
    return plan_id


@router.post("/sponsors/subscribe", dependencies=[Depends(rate_limit(5))])
async def sponsors_subscribe(payload: SponsorSubscribe, request: Request):
    """Self-serve: create a pending sponsor + a PayPal subscription; returns the approval URL."""
    if not paypal_configured():
        raise HTTPException(status_code=503, detail="Online sponsorship isn't available yet — please email us.")
    if not origin_allowed(payload.origin):
        raise HTTPException(status_code=400, detail="Invalid origin")
    ip = client_ip(request)
    # Abuse cap: limit unapproved pending sponsors per source in the last 24h.
    day_ago = (datetime.now(timezone.utc) - timedelta(days=1)).isoformat()
    pending_recent = await db.sponsors.count_documents({
        "created_ip": ip, "active": False, "sub_status": "pending_payment",
        "created_at": {"$gt": day_ago},
    })
    if pending_recent >= 3:
        raise HTTPException(status_code=429, detail="Too many pending requests — please complete or wait before trying again.")
    sponsor_id = str(uuid.uuid4())
    doc = {
        "id": sponsor_id,
        "name": payload.name, "cuisine": payload.cuisine, "price": payload.price,
        "category": payload.category, "address": payload.address,
        "description": payload.description, "image": payload.image or sponsor_fallback_image(payload.category, payload.cuisine, payload.name),
        "website": payload.website, "contact_email": payload.contact_email,
        "rating": 4.7, "distance": 0.5, "open_now": True,
        "active": False, "sub_status": "pending_payment", "subscription_id": None,
        "billing_period": payload.plan,
        "impressions": 0, "clicks": 0,
        "created_ip": ip,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.sponsors.insert_one(doc)
    origin = payload.origin.rstrip("/")
    try:
        async with httpx.AsyncClient(timeout=20) as http:
            token = await paypal_token(http)
            plan_id = await ensure_paypal_plan(http, token, payload.plan)
            sub = await http.post(f"{PAYPAL_BASE}/v1/billing/subscriptions",
                headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
                json={
                    "plan_id": plan_id,
                    "custom_id": sponsor_id,
                    "subscriber": {"email_address": payload.contact_email},
                    "application_context": {
                        "brand_name": "Fork·Fate",
                        "user_action": "SUBSCRIBE_NOW",
                        "shipping_preference": "NO_SHIPPING",
                        "return_url": f"{origin}/sponsor/success",
                        "cancel_url": f"{origin}/sponsor/cancelled",
                    },
                })
    except Exception:
        # Any PayPal failure (auth/timeout/network) must not orphan the pending row —
        # otherwise it counts toward the per-IP cap and locks the business out for 24h.
        await db.sponsors.delete_one({"id": sponsor_id})
        raise
    if sub.status_code not in (200, 201):
        logger.error(f"PayPal subscription error: {sub.text[:300]}")
        await db.sponsors.delete_one({"id": sponsor_id})
        raise HTTPException(status_code=502, detail="Could not start PayPal subscription")
    data = sub.json()
    approve = next((lnk["href"] for lnk in data.get("links", []) if lnk.get("rel") == "approve"), None)
    if not approve:
        await db.sponsors.delete_one({"id": sponsor_id})
        raise HTTPException(status_code=502, detail="PayPal did not return an approval link")
    await db.sponsors.update_one({"id": sponsor_id}, {"$set": {"subscription_id": data.get("id")}})
    return {"approval_url": approve, "subscription_id": data.get("id")}


async def _verify_paypal_webhook(headers, body_json):
    if not PAYPAL_WEBHOOK_ID:
        return False
    async with httpx.AsyncClient(timeout=20) as http:
        token = await paypal_token(http)
        r = await http.post(f"{PAYPAL_BASE}/v1/notifications/verify-webhook-signature",
            headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
            json={
                "auth_algo": headers.get("paypal-auth-algo"),
                "cert_url": headers.get("paypal-cert-url"),
                "transmission_id": headers.get("paypal-transmission-id"),
                "transmission_sig": headers.get("paypal-transmission-sig"),
                "transmission_time": headers.get("paypal-transmission-time"),
                "webhook_id": PAYPAL_WEBHOOK_ID,
                "webhook_event": body_json,
            })
    return r.status_code == 200 and r.json().get("verification_status") == "SUCCESS"


@router.post("/paypal/webhook", dependencies=[Depends(rate_limit(60))])
async def paypal_webhook(request: Request):
    body = await request.body()
    if len(body) > 100_000:
        raise HTTPException(status_code=413, detail="Payload too large")
    try:
        event = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON body")
    if not await _verify_paypal_webhook(request.headers, event):
        raise HTTPException(status_code=400, detail="Invalid webhook signature")
    etype = event.get("event_type", "")
    resource = event.get("resource", {}) or {}
    sub_id = resource.get("id")
    custom_id = resource.get("custom_id")
    query = {"subscription_id": sub_id} if sub_id else {"id": custom_id}
    if custom_id:
        query = {"id": custom_id}
    if etype == "BILLING.SUBSCRIPTION.ACTIVATED":
        await db.sponsors.update_one(query, {"$set": {"active": True, "sub_status": "active", "subscription_id": sub_id}})
    elif etype in ("BILLING.SUBSCRIPTION.CANCELLED", "BILLING.SUBSCRIPTION.SUSPENDED", "BILLING.SUBSCRIPTION.EXPIRED"):
        status = etype.split(".")[-1].lower()
        await db.sponsors.update_one(query, {"$set": {"active": False, "sub_status": status}})
    return {"ok": True}


@router.get("/sponsors/active", dependencies=[Depends(rate_limit(60))])
async def active_sponsors(request: Request):
    """Public list of active sponsors for the header marquee (no PII)."""
    docs = await db.sponsors.find({"active": True}, {"_id": 0}).sort("created_at", -1).to_list(100)
    out = []
    for s in docs:
        out.append({
            "id": s.get("id"),
            "name": s.get("name"),
            "cuisine": s.get("cuisine"),
            "category": s.get("category"),
            "website": s.get("website", ""),
            "image": s.get("image") or sponsor_fallback_image(s.get("category"), s.get("cuisine"), s.get("id") or s.get("name") or "x"),
        })
    ids = [s["id"] for s in out if s.get("id")]
    if ids and await _stat_first_seen(f"imp:{client_ip(request)}", _IMPRESSION_TTL):
        await db.sponsors.update_many({"id": {"$in": ids}}, {"$inc": {"impressions": 1}})
    return {"sponsors": out}


@router.post("/sponsors/{sponsor_id}/click", dependencies=[Depends(rate_limit(60))])
async def sponsor_click(sponsor_id: str, request: Request):
    """Count a click from the marquee / result card toward a sponsor's stats."""
    if not await _stat_first_seen(f"clk:{sponsor_id}:{client_ip(request)}", _CLICK_TTL):
        return {"ok": True}
    r = await db.sponsors.update_one({"id": sponsor_id, "active": True}, {"$inc": {"clicks": 1}})
    return {"ok": r.modified_count > 0}


@router.get("/sponsors/subscription-status", dependencies=[Depends(rate_limit(30))])
async def sponsor_subscription_status(subscription_id: str):
    s = await db.sponsors.find_one({"subscription_id": subscription_id})
    if not s:
        return {"found": False}
    # Webhook-independent activation: if not yet active, confirm status directly with PayPal.
    if not s.get("active") and paypal_configured():
        try:
            async with httpx.AsyncClient(timeout=20) as http:
                token = await paypal_token(http)
                r = await http.get(f"{PAYPAL_BASE}/v1/billing/subscriptions/{subscription_id}",
                                   headers={"Authorization": f"Bearer {token}"})
            if r.status_code == 200:
                status = r.json().get("status", "")
                if status == "ACTIVE":
                    await db.sponsors.update_one({"subscription_id": subscription_id},
                                                 {"$set": {"active": True, "sub_status": "active"}})
                    s["active"] = True
                    s["sub_status"] = "active"
                elif status in ("CANCELLED", "SUSPENDED", "EXPIRED"):
                    await db.sponsors.update_one({"subscription_id": subscription_id},
                                                 {"$set": {"active": False, "sub_status": status.lower()}})
                    s["sub_status"] = status.lower()
        except Exception as e:
            logger.warning(f"PayPal status check failed: {e}")
    active = bool(s.get("active"))
    # Only echo the business name on a confirmed-active subscription (the sponsor's own
    # success page); avoid disclosing it for pending/unknown ids.
    return {"found": True, "name": s.get("name") if active else None,
            "active": active, "sub_status": s.get("sub_status")}


async def reconcile_sponsors():
    """Re-check active PayPal-backed sponsors and auto-pause any that lapsed/cancelled.
    Comped/manual sponsors (no subscription_id) are left untouched.
    Also purges abandoned pending-payment rows to keep the DB clean."""
    stale_cutoff = (datetime.now(timezone.utc) - timedelta(days=2)).isoformat()
    purge = await db.sponsors.delete_many({
        "active": False, "sub_status": "pending_payment", "created_at": {"$lt": stale_cutoff},
    })
    purged = purge.deleted_count
    if not paypal_configured():
        return {"checked": 0, "paused": 0, "purged": purged, "skipped": "paypal_not_configured"}
    active = await db.sponsors.find(
        {"active": True, "subscription_id": {"$ne": None}},
        {"_id": 0, "id": 1, "subscription_id": 1, "name": 1},
    ).to_list(1000)
    if not active:
        return {"checked": 0, "paused": 0, "purged": purged}
    checked = 0
    paused = 0
    async with httpx.AsyncClient(timeout=20) as http:
        token = await paypal_token(http)
        for s in active:
            sid = s.get("subscription_id")
            if not sid:
                continue
            try:
                r = await http.get(f"{PAYPAL_BASE}/v1/billing/subscriptions/{sid}",
                                   headers={"Authorization": f"Bearer {token}"})
                checked += 1
                if r.status_code == 200:
                    status = r.json().get("status", "")
                    if status != "ACTIVE":
                        await db.sponsors.update_one({"id": s["id"]},
                                                     {"$set": {"active": False, "sub_status": status.lower()}})
                        paused += 1
                        logger.info(f"Reconcile: paused sponsor '{s.get('name')}' (PayPal status {status})")
            except Exception as e:
                logger.warning(f"Reconcile check failed for {sid}: {e}")
    return {"checked": checked, "paused": paused, "purged": purged}
