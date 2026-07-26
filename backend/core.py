"""Shared config, DB client, helpers, auth and rate limiting for Fork·Fate."""
from fastapi import HTTPException, Request, Response
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import ReturnDocument
import os
import re
import time
import math
import hmac
import secrets
import asyncio
import ipaddress
import jwt
import httpx
import logging
from collections import defaultdict, deque
from pathlib import Path
from urllib.parse import quote_plus, urlparse
from datetime import datetime, timezone, timedelta

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

logging.basicConfig(level=logging.INFO,
                    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

GOOGLE_API_KEY = os.environ.get('GOOGLE_API_KEY')
JWT_SECRET = os.environ.get('JWT_SECRET')
ADMIN_PASSWORD = os.environ.get('ADMIN_PASSWORD')
PAYPAL_ENV = os.environ.get('PAYPAL_ENV', 'sandbox')
PAYPAL_CLIENT_ID = os.environ.get('PAYPAL_CLIENT_ID')
PAYPAL_SECRET = os.environ.get('PAYPAL_SECRET')
PAYPAL_WEBHOOK_ID = os.environ.get('PAYPAL_WEBHOOK_ID')
PAYPAL_BASE = "https://api-m.paypal.com" if PAYPAL_ENV == "live" else "https://api-m.sandbox.paypal.com"
SPONSOR_PRICE = "29.00"
SPONSOR_PRICE_ANNUAL = "290.00"  # 2 months free vs 12 × monthly
JWT_ALG = "HS256"
JWT_ISS = os.environ.get("JWT_ISS", "fork-fate")
JWT_AUD = os.environ.get("JWT_AUD", "fork-fate-admin")
# How to derive the client IP / real origin behind proxies:
#   auto (default) -> trust CF/forwarded headers ONLY when the direct TCP peer is a
#                     private/loopback hop (i.e. our k8s ingress / CDN edge).
#   always/never   -> force-trust or force-ignore (escape hatches for other setups).
TRUST_PROXY_MODE = os.environ.get("TRUST_PROXY_HEADERS", "auto").strip().lower()
# Optional explicit allowlist of proxy CIDRs (comma-separated). When set, ONLY peers
# inside these ranges may supply forwarded headers — this is stricter and safer than
# the legacy "any private/loopback peer" heuristic, because anything else running
# inside the cluster could otherwise spoof CF-Connecting-IP and defeat both the rate
# limiter and the admin login lockout. Unset => legacy behaviour, so nothing breaks.
# Populate with the k8s pod/service ranges plus Cloudflare's published IPs
# (https://www.cloudflare.com/ips-v4).
_TRUST_PROXY_CIDRS = []
for _c in os.environ.get("TRUST_PROXY_CIDRS", "").split(","):
    _c = _c.strip()
    if not _c:
        continue
    try:
        _TRUST_PROXY_CIDRS.append(ipaddress.ip_network(_c, strict=False))
    except ValueError:
        logging.getLogger(__name__).warning(f"ignoring invalid TRUST_PROXY_CIDRS entry: {_c}")
# Origins allowed for CORS + WebAuthn. Production is always fork-fate.com; the
# Emergent preview subdomains are shared tenancy, so trusting them alongside
# `allow_credentials=True` is only acceptable in preview. Set
# ALLOW_PREVIEW_ORIGINS=false in the production secrets to drop the wildcard.
_PROD_ORIGIN_REGEX = r"https://([a-z0-9-]+\.)*fork-fate\.com$"
_PREVIEW_ORIGIN_REGEX = r"https://[a-z0-9-]+\.preview\.emergentagent\.com$"
ALLOW_PREVIEW_ORIGINS = os.environ.get("ALLOW_PREVIEW_ORIGINS", "true").strip().lower() not in ("0", "false", "no")
ALLOWED_ORIGIN_REGEX = (
    f"{_PROD_ORIGIN_REGEX}|{_PREVIEW_ORIGIN_REGEX}" if ALLOW_PREVIEW_ORIGINS else _PROD_ORIGIN_REGEX
)
_ORIGIN_RE = re.compile(ALLOWED_ORIGIN_REGEX, re.I)
FALLBACK_IMG = "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?crop=entropy&cs=srgb&fm=jpg&q=85"


# Free placeholder images (no Google billing) for suggestion grid + shuffle deck.
# The real (billed) Google photo is only loaded for the revealed winning card.
def _u(u):
    return u + ("&" if "?" in u else "?") + "q=80&w=800&auto=compress&cs=tinysrgb"


PLACEHOLDER_IMGS = {
    "food": [
        _u("https://images.unsplash.com/photo-1565895405140-6b9830a88c19"),
        _u("https://images.unsplash.com/photo-1564759296729-771e78c26df7"),
        _u("https://images.unsplash.com/photo-1663530761401-15eefb544889"),
        _u("https://images.unsplash.com/photo-1657053460900-3a12f32b592f"),
    ],
    "drinks": [
        _u("https://images.unsplash.com/photo-1583124688253-60c350bc90d7"),
        _u("https://images.pexels.com/photos/6747870/pexels-photo-6747870.jpeg"),
        _u("https://images.pexels.com/photos/244407/pexels-photo-244407.jpeg"),
    ],
    "desserts": [
        _u("https://images.unsplash.com/photo-1565004602745-718e1b0d44f8"),
        _u("https://images.unsplash.com/photo-1541780171255-b162a3a147e3"),
        _u("https://images.unsplash.com/photo-1642589077626-95702d0b9322"),
    ],
    "bars": [
        _u("https://images.unsplash.com/photo-1598994671512-395d7a6147e0"),
        _u("https://images.unsplash.com/photo-1671395276760-959704c6350a"),
        _u("https://images.unsplash.com/photo-1640902106532-47dd3a2e833e"),
    ],
    "shops": [
        _u("https://images.unsplash.com/photo-1443884590026-2e4d21aee71c"),
        _u("https://images.unsplash.com/photo-1460776960860-7adc30a4e69d"),
        _u("https://images.unsplash.com/photo-1569424746512-4f98ac866469"),
        _u("https://images.unsplash.com/photo-1540221652346-e5dd6b50f3e7"),
    ],
    "fuel": [
        _u("https://images.unsplash.com/photo-1635627026254-b652e62d1d07"),
        _u("https://images.unsplash.com/photo-1695561324569-5e47c76dc0a3"),
        _u("https://images.unsplash.com/photo-1593941707874-ef25b8b4a92b"),
        _u("https://images.unsplash.com/photo-1593941707882-a5bba14938c7"),
    ],
}


def pick_placeholder(category: str, key: str) -> str:
    imgs = PLACEHOLDER_IMGS.get(category, PLACEHOLDER_IMGS["food"])
    idx = sum(bytearray((key or "x").encode("utf-8"))) % len(imgs)
    return imgs[idx]


# Curated per-cuisine imagery so sponsors who skip uploading a photo still get a
# relevant, professional-looking image (not one generic stock shot).
CUISINE_IMGS = {
    "pizza": _u("https://images.unsplash.com/photo-1513104890138-7c749659a591"),
    "taco": _u("https://images.unsplash.com/photo-1565299624946-b28f40a0ae38"),
    "mexican": _u("https://images.unsplash.com/photo-1565299624946-b28f40a0ae38"),
    "burger": _u("https://images.unsplash.com/photo-1568901346375-23c9450c58cd"),
    "sushi": _u("https://images.unsplash.com/photo-1579871494447-9811cf80d66c"),
    "japanese": _u("https://images.unsplash.com/photo-1579871494447-9811cf80d66c"),
    "ramen": _u("https://images.unsplash.com/photo-1569718212165-3a8278d5f624"),
    "chinese": _u("https://images.unsplash.com/photo-1585032226651-759b368d7246"),
    "thai": _u("https://images.unsplash.com/photo-1559314809-0d155014e29e"),
    "indian": _u("https://images.unsplash.com/photo-1585937421612-70a008356fbe"),
    "italian": _u("https://images.unsplash.com/photo-1551183053-bf91a1d81141"),
    "pasta": _u("https://images.unsplash.com/photo-1551183053-bf91a1d81141"),
    "steak": _u("https://images.unsplash.com/photo-1600891964092-4316c288032e"),
    "bbq": _u("https://images.unsplash.com/photo-1529193591184-b1d58069ecdd"),
    "seafood": _u("https://images.unsplash.com/photo-1559737558-2f5a35f4523b"),
    "breakfast": _u("https://images.unsplash.com/photo-1533089860892-a7c6f0a88666"),
    "coffee": _u("https://images.unsplash.com/photo-1495474472287-4d71bcdd2085"),
    "cafe": _u("https://images.unsplash.com/photo-1495474472287-4d71bcdd2085"),
    "boba": _u("https://images.unsplash.com/photo-1558857563-b371033873b8"),
    "tea": _u("https://images.unsplash.com/photo-1558857563-b371033873b8"),
    "juice": _u("https://images.unsplash.com/photo-1600271886742-f049cd451bba"),
    "wine": _u("https://images.unsplash.com/photo-1510812431401-41d2bd2722f3"),
    "winery": _u("https://images.unsplash.com/photo-1510812431401-41d2bd2722f3"),
    "beer": _u("https://images.unsplash.com/photo-1608270586620-248524c67de9"),
    "brewery": _u("https://images.unsplash.com/photo-1608270586620-248524c67de9"),
    "cocktail": _u("https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b"),
    "whiskey": _u("https://images.unsplash.com/photo-1527281400683-1aae777175f8"),
    "liquor": _u("https://images.unsplash.com/photo-1569529465841-dfecdab7503b"),
    "ice cream": _u("https://images.unsplash.com/photo-1501443762994-82bd5dace89a"),
    "donut": _u("https://images.unsplash.com/photo-1551024601-bec78aea704b"),
    "bakery": _u("https://images.unsplash.com/photo-1509440159596-0249088772ff"),
    "cake": _u("https://images.unsplash.com/photo-1578985545062-69928b1d9587"),
    "chocolate": _u("https://images.unsplash.com/photo-1481391319762-47dff72954d9"),
    "antique": _u("https://images.unsplash.com/photo-1443884590026-2e4d21aee71c"),
    "vintage": _u("https://images.unsplash.com/photo-1460776960860-7adc30a4e69d"),
    "consignment": _u("https://images.unsplash.com/photo-1569424746512-4f98ac866469"),
    "thrift": _u("https://images.unsplash.com/photo-1540221652346-e5dd6b50f3e7"),
}


def sponsor_fallback_image(category: str, cuisine: str, key: str) -> str:
    """Best-effort relevant image for a sponsor with no uploaded photo."""
    lower = (cuisine or "").lower()
    for kw, url in CUISINE_IMGS.items():
        if kw in lower:
            return url
    return pick_placeholder(category or "food", key or cuisine or "x")


# ---- Emergent object storage (sponsor photo uploads) ----
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY')
STORAGE_URL = "https://integrations.emergentagent.com/objstore/api/v1/storage"
STORAGE_APP = "fork-fate"
_storage_key = None


async def init_storage():
    global _storage_key
    if _storage_key:
        return _storage_key
    async with httpx.AsyncClient(timeout=30) as http:
        r = await http.post(f"{STORAGE_URL}/init", json={"emergent_key": EMERGENT_LLM_KEY})
        r.raise_for_status()
        _storage_key = r.json()["storage_key"]
    return _storage_key


async def storage_put(path: str, data: bytes, content_type: str) -> dict:
    global _storage_key
    key = await init_storage()
    async with httpx.AsyncClient(timeout=120) as http:
        headers = {"X-Storage-Key": key, "Content-Type": content_type}
        r = await http.put(f"{STORAGE_URL}/objects/{path}", headers=headers, content=data)
        if r.status_code == 403:
            _storage_key = None
            key = await init_storage()
            headers["X-Storage-Key"] = key
            r = await http.put(f"{STORAGE_URL}/objects/{path}", headers=headers, content=data)
        r.raise_for_status()
        return r.json()


async def storage_get(path: str):
    global _storage_key
    key = await init_storage()
    async with httpx.AsyncClient(timeout=60) as http:
        r = await http.get(f"{STORAGE_URL}/objects/{path}", headers={"X-Storage-Key": key})
        if r.status_code == 403:
            _storage_key = None
            key = await init_storage()
            r = await http.get(f"{STORAGE_URL}/objects/{path}", headers={"X-Storage-Key": key})
        r.raise_for_status()
        return r.content, r.headers.get("Content-Type", "application/octet-stream")


MAX_RADIUS_MILES = 50.0


def create_admin_token():
    now = datetime.now(timezone.utc)
    payload = {"sub": "admin", "role": "admin", "type": "admin",
               "iss": JWT_ISS, "aud": JWT_AUD,
               "iat": now, "exp": now + timedelta(hours=12)}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALG)


# HttpOnly session cookie for the admin JWT (replaces localStorage Bearer storage,
# eliminating XSS token theft). Same-origin app, so SameSite=Lax + Secure is safe.
ADMIN_COOKIE = "ff_admin"
ADMIN_COOKIE_MAX_AGE = 12 * 60 * 60  # matches the 12h token expiry

# CSRF: double-submit cookie. SameSite=Lax alone left cookie-authenticated admin
# writes exposed (Lax still permits top-level form POSTs and doesn't cover every
# browser). A readable (non-HttpOnly) token cookie is issued alongside the session
# and must be echoed back in the X-CSRF-Token header — an attacker's page can send
# the victim's cookies but cannot read them to set the header.
# Deliberately NOT HttpOnly: the SPA has to read it. That's safe because it's not a
# credential on its own — it's only meaningful when paired with the session cookie.
CSRF_COOKIE = "ff_csrf"
CSRF_HEADER = "x-csrf-token"
# Set CSRF_STRICT=true once all live sessions have cycled (<=12h after deploy) to
# also reject cookie sessions that predate this change and so carry no CSRF cookie.
CSRF_STRICT = os.environ.get("CSRF_STRICT", "false").strip().lower() in ("1", "true", "yes")
_CSRF_SAFE_METHODS = {"GET", "HEAD", "OPTIONS", "TRACE"}


def set_admin_cookie(response: Response, token: str):
    response.set_cookie(
        key=ADMIN_COOKIE, value=token, httponly=True, secure=True,
        samesite="lax", max_age=ADMIN_COOKIE_MAX_AGE, path="/",
    )
    csrf = secrets.token_urlsafe(32)
    response.set_cookie(
        key=CSRF_COOKIE, value=csrf, httponly=False, secure=True,
        samesite="lax", max_age=ADMIN_COOKIE_MAX_AGE, path="/",
    )
    return csrf


def clear_admin_cookie(response: Response):
    response.delete_cookie(key=ADMIN_COOKIE, path="/", samesite="lax", secure=True, httponly=True)
    response.delete_cookie(key=CSRF_COOKIE, path="/", samesite="lax", secure=True, httponly=False)


def require_admin(request: Request):
    # Cookie takes precedence, matching the original resolution order.
    cookie_token = request.cookies.get(ADMIN_COOKIE)
    auth = request.headers.get("Authorization", "")
    bearer_token = auth[7:] if auth.startswith("Bearer ") else None
    token = cookie_token or bearer_token
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")

    # CSRF only applies to ambient-credential (cookie) auth on state-changing methods.
    # Bearer clients send an explicit header a cross-site page cannot forge, so they
    # are exempt — that keeps existing API clients working.
    if cookie_token and request.method not in _CSRF_SAFE_METHODS:
        sent = request.headers.get(CSRF_HEADER)
        expected = request.cookies.get(CSRF_COOKIE)
        if expected:
            if not sent or not hmac.compare_digest(str(expected), str(sent)):
                raise HTTPException(status_code=403, detail="CSRF token missing or invalid")
        elif CSRF_STRICT:
            raise HTTPException(status_code=403, detail="CSRF token missing")
        else:
            # Session predates the CSRF rollout. A genuine cross-site attack WOULD
            # carry the cookie (browsers send all cookies for the domain), so absence
            # means a legacy session rather than an attack. Expires within 12h.
            logger.info(f"admin write without CSRF cookie (legacy session): {request.url.path}")

    try:
        payload = jwt.decode(
            token, JWT_SECRET, algorithms=[JWT_ALG],
            issuer=JWT_ISS, audience=JWT_AUD,
            options={"require": ["exp", "iss", "aud"]},
        )
        if payload.get("role") != "admin":
            raise HTTPException(status_code=403, detail="Forbidden")
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Session expired, please log in again")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
    return True


def origin_allowed(origin: str) -> bool:
    return bool(origin and _ORIGIN_RE.match(origin.strip()))


def _is_infra_hop(ip) -> bool:
    """Is this address one of our own proxy hops (so not a real client)?"""
    if _TRUST_PROXY_CIDRS:
        return any(ip in net for net in _TRUST_PROXY_CIDRS)
    return ip.is_private or ip.is_loopback


def peer_is_trusted_proxy(request: Request) -> bool:
    """Whether the direct TCP peer is a trusted proxy hop, so we may believe its
    forwarded headers (CF-Connecting-IP, X-Forwarded-Host). When TRUST_PROXY_CIDRS is
    configured we require the peer to be inside one of those ranges. Otherwise we fall
    back to the legacy heuristic: trust only private/loopback peers — a public peer
    means the request reached us directly off-CDN, where client-supplied headers are
    forgeable and must be ignored."""
    if TRUST_PROXY_MODE == "always":
        return True
    if TRUST_PROXY_MODE == "never":
        return False
    peer = request.client.host if request.client else None
    if not peer:
        return False
    try:
        ip = ipaddress.ip_address(peer)
    except ValueError:
        return False
    return _is_infra_hop(ip)


def _request_origin(request: Request) -> str:
    """Best-effort real (user-facing) origin of the calling page. The ingress rewrites
    the browser Origin to an internal host, so behind a trusted proxy we prefer
    x-forwarded-proto + x-forwarded-host (the real external host). This value must equal
    the browser's page origin for WebAuthn verification."""
    if peer_is_trusted_proxy(request):
        host = request.headers.get("x-forwarded-host")
        proto = request.headers.get("x-forwarded-proto") or "https"
        if host:
            return f"{proto}://{host}"
    o = (request.headers.get("origin") or "").strip()
    if o:
        return o
    ref = (request.headers.get("referer") or "").strip()
    if ref:
        p = urlparse(ref)
        if p.scheme and p.netloc:
            return f"{p.scheme}://{p.netloc}"
    if request.headers.get("host"):
        proto = request.headers.get("x-forwarded-proto") or "https"
        return f"{proto}://{request.headers.get('host')}"
    return ""


def rp_id_and_origin(request: Request):
    """Derive the WebAuthn Relying Party ID + expected origin from the (validated)
    request. This lets one deployment serve both fork-fate.com and the Emergent
    preview subdomain without hardcoding a single RP_ID."""
    origin = _request_origin(request)
    if not origin_allowed(origin):
        raise HTTPException(status_code=403, detail="Origin not allowed")
    host = urlparse(origin).hostname
    return host, origin


# Admin-login brute-force protection.
# Per-IP failed-attempt lockout so a single attacker can only lock THEMSELVES out —
# not the legitimate admin. A generous global backstop still bounds distributed floods.
# State lives in MongoDB (see check_login_lockout) so it survives restarts and is
# shared across workers.
_LOGIN_FAIL_MAX = 8                    # failures per IP within the window -> locked
_LOGIN_FAIL_WINDOW = 300              # seconds; failures older than this are forgotten
_ADMIN_LOGIN_GLOBAL = {"window_start": 0.0, "count": 0}
_GLOBAL_MAX = 240                     # total attempts / window (distributed-flood backstop)
_GLOBAL_WINDOW = 60
_LOGIN_LOCK_INDEX_READY = False


async def _ensure_login_indexes():
    global _LOGIN_LOCK_INDEX_READY
    if _LOGIN_LOCK_INDEX_READY:
        return
    try:
        await db.login_failures.create_index("expire_at", expireAfterSeconds=0)
    except Exception as e:
        logger.warning(f"login_failures index setup failed: {e}")
    _LOGIN_LOCK_INDEX_READY = True


async def check_login_lockout(ip: str):
    """Raise 429 if this IP has too many recent failures, or if the generous global
    backstop is exceeded. Call before verifying the password.

    Failure state lives in MongoDB so the lockout survives a restart and is shared
    across workers — an in-process dict reset on every deploy and protected only the
    one worker that happened to see the failures. The high-volume generic rate limiter
    stays in memory; this path is low-volume and security-critical, so a round trip
    is worth it.
    """
    await _ensure_login_indexes()
    now = time.time()
    doc = await db.login_failures.find_one({"_id": ip}, {"fails": 1})
    fails = [t for t in (doc or {}).get("fails", []) if now - t < _LOGIN_FAIL_WINDOW]
    if len(fails) >= _LOGIN_FAIL_MAX:
        # Constant delay so "locked" isn't distinguishable from "wrong password" by timing.
        await asyncio.sleep(0.5)
        raise HTTPException(status_code=429, detail="Too many failed attempts. Please try again in a few minutes.")
    g = _ADMIN_LOGIN_GLOBAL
    if now - g["window_start"] > _GLOBAL_WINDOW:
        g["window_start"] = now
        g["count"] = 0
    g["count"] += 1
    if g["count"] > _GLOBAL_MAX:
        raise HTTPException(status_code=429, detail="Login temporarily busy, please retry shortly.")


async def record_login_failure(ip: str):
    """Append a failure timestamp atomically. $slice bounds the array so a sustained
    attack can't grow the document, and expire_at lets a TTL index reap idle rows."""
    await db.login_failures.update_one(
        {"_id": ip},
        {
            "$push": {"fails": {"$each": [time.time()], "$slice": -(_LOGIN_FAIL_MAX * 2)}},
            "$set": {"expire_at": datetime.now(timezone.utc) + timedelta(seconds=_LOGIN_FAIL_WINDOW * 4)},
        },
        upsert=True,
    )


async def clear_login_failures(ip: str):
    await db.login_failures.delete_one({"_id": ip})


# Simple in-memory per-IP rate limiter (coarse abuse/cost protection)
_RL_BUCKETS = defaultdict(deque)
_RL_MAX_KEYS = 10000  # bound memory: purge empty buckets once the map grows large

# Cache ZIP -> (lat, lng) to cut repeat geocoding calls
_ZIP_GEO_CACHE = {}
# Cache Places search results to cut repeat billed Google calls (key -> (ts, results))
_PLACES_CACHE = {}
_PLACES_TTL = 300  # seconds
# Cache proxied Google photo bytes. Photo media fetches are billed too, so this
# keeps repeat views of the same venue off the meter (see _google_reserve usage
# in routes/places.py). Bounded so a long-lived worker can't balloon.
_PHOTO_CACHE = {}
_PHOTO_TTL = 86400          # seconds (matches the Cache-Control we send)
_PHOTO_CACHE_MAX = 150      # entries
_PHOTO_CACHE_MAX_BYTES = 400_000  # don't cache unusually large images

# Hard daily ceiling on billed Google search/geocode calls (abuse safety net).
GOOGLE_SEARCH_DAILY_CAP = int(os.environ.get("GOOGLE_SEARCH_DAILY_CAP", "300"))
# Fire a one-time alert per day once usage crosses this fraction of the cap.
GOOGLE_SEARCH_ALERT_PCT = int(os.environ.get("GOOGLE_SEARCH_ALERT_PCT", "90"))
# Email alert delivery (Resend). Left unset -> alert is logged only, no email sent.
RESEND_API_KEY = os.environ.get("RESEND_API_KEY")
ALERT_EMAIL_TO = os.environ.get("ALERT_EMAIL_TO")
SENDER_EMAIL = os.environ.get("SENDER_EMAIL", "onboarding@resend.dev")


async def _send_google_cap_alert(used: int):
    """One-time daily warning email when Google usage crosses the alert threshold."""
    import asyncio
    import resend
    pct = round(used / GOOGLE_SEARCH_DAILY_CAP * 100) if GOOGLE_SEARCH_DAILY_CAP else 0
    if not RESEND_API_KEY or not ALERT_EMAIL_TO:
        logger.warning(f"Google usage at {used}/{GOOGLE_SEARCH_DAILY_CAP} ({pct}%) — "
                       f"alert threshold crossed (email not configured)")
        return
    try:
        resend.api_key = RESEND_API_KEY
        params = {
            "from": SENDER_EMAIL,
            "to": [ALERT_EMAIL_TO],
            "subject": f"Fork·Fate: Google usage at {pct}% ({used}/{GOOGLE_SEARCH_DAILY_CAP})",
            "html": (
                "<div style='font-family:Arial,sans-serif;color:#1a1a1a'>"
                "<h2 style='color:#E01E26;margin:0 0 8px'>Fork·Fate — daily Google usage warning</h2>"
                f"<p>Today's billed Google Places searches have reached "
                f"<strong>{used}</strong> of the <strong>{GOOGLE_SEARCH_DAILY_CAP}</strong> daily cap "
                f"(<strong>{pct}%</strong>).</p>"
                "<p>Once the cap is hit, shuffles fall back to curated results until midnight UTC. "
                "Raise the cap via the <code>GOOGLE_SEARCH_DAILY_CAP</code> env var if this is expected traffic.</p>"
                "</div>"
            ),
        }
        await asyncio.wait_for(asyncio.to_thread(resend.Emails.send, params), timeout=10)
        logger.info(f"Sent Google cap alert email to {ALERT_EMAIL_TO} ({pct}%)")
    except Exception as e:
        logger.error(f"Failed to send Google cap alert: {e}")


async def send_email(subject: str, html: str, to: str = None) -> bool:
    """Generic transactional email via Resend. Returns True on success, False if
    unconfigured or on error (never raises)."""
    import asyncio
    import resend
    recipient = to or ALERT_EMAIL_TO
    if not RESEND_API_KEY or not recipient:
        logger.warning(f"Email not sent (Resend not configured): {subject}")
        return False
    try:
        resend.api_key = RESEND_API_KEY
        params = {"from": SENDER_EMAIL, "to": [recipient], "subject": subject, "html": html}
        await asyncio.wait_for(asyncio.to_thread(resend.Emails.send, params), timeout=15)
        logger.info(f"Sent email '{subject}' to {recipient}")
        return True
    except Exception as e:
        logger.error(f"Failed to send email '{subject}': {e}")
        return False


async def _google_reserve() -> bool:
    """Atomically reserve one billed Google call against today's cap (Mongo-backed so it
    survives restarts and is shared across replicas). Increment-FIRST so concurrent
    requests can't all pass a stale check-then-increment; if the reservation lands over
    the ceiling we roll the counter back and reject."""
    today = datetime.now(timezone.utc).date().isoformat()
    doc = await db.config.find_one_and_update(
        {"key": "google_budget", "date": today},
        {"$inc": {"searches": 1}},
        upsert=True,
        return_document=ReturnDocument.AFTER,
    )
    used = int(doc.get("searches", 0))
    if used > GOOGLE_SEARCH_DAILY_CAP:
        await db.config.update_one(
            {"key": "google_budget", "date": today},
            {"$inc": {"searches": -1}},
        )
        return False
    # One-time-per-day warning once usage crosses the alert threshold.
    threshold = max(1, (GOOGLE_SEARCH_DAILY_CAP * GOOGLE_SEARCH_ALERT_PCT) // 100)
    if used >= threshold and not doc.get("alerted"):
        claimed = await db.config.update_one(
            {"key": "google_budget", "date": today, "alerted": {"$ne": True}},
            {"$set": {"alerted": True}},
        )
        if claimed.modified_count == 1:
            import asyncio
            asyncio.create_task(_send_google_cap_alert(used))
    return True


def client_ip(request: Request) -> str:
    """Trusted client IP. Behind our ingress/CDN, CF-Connecting-IP / True-Client-IP are
    set by the trusted hop. We only believe them when the direct TCP peer is a trusted
    proxy (see peer_is_trusted_proxy); a direct public peer means the headers are
    client-forgeable, so we use the TCP peer instead.

    X-Forwarded-For is only consulted as a LAST resort behind a trusted peer, and is
    parsed right-to-left skipping our own infrastructure hops. Taking the leftmost
    value would be forgeable (a client can prepend anything); walking from the right
    yields the first address our infrastructure didn't add. Without this, a missing
    CF-Connecting-IP collapses every user onto the shared ingress IP, which would let
    one visitor exhaust everybody's rate limit.
    """
    if peer_is_trusted_proxy(request):
        for h in ("cf-connecting-ip", "true-client-ip"):
            v = request.headers.get(h)
            if v and v.strip():
                return v.strip()
        xff = request.headers.get("x-forwarded-for")
        if xff:
            for candidate in reversed([p.strip() for p in xff.split(",") if p.strip()]):
                try:
                    ip = ipaddress.ip_address(candidate)
                except ValueError:
                    continue
                if _is_infra_hop(ip):
                    continue  # one of our own hops — keep walking left
                return candidate
    return request.client.host if request.client else "unknown"


def rate_limit(max_requests: int, window_seconds: int = 60):
    def _dep(request: Request):
        ip = client_ip(request)
        # Bucket per (route, IP), not per IP. A single shared bucket meant the
        # tightest limit on the app governed every endpoint — e.g. loading a
        # handful of photos (limit 200) would 429 a later sponsor subscribe
        # (limit 5), because both read the same counter. Keyed on the route's
        # path TEMPLATE so path params can't explode the keyspace.
        route = request.scope.get("route")
        scope_key = getattr(route, "path_format", None) or request.url.path
        key = (scope_key, ip)
        now = time.time()
        bucket = _RL_BUCKETS[key]
        while bucket and bucket[0] < now - window_seconds:
            bucket.popleft()
        if len(bucket) >= max_requests:
            raise HTTPException(status_code=429, detail="Too many requests, please slow down")
        bucket.append(now)
        # Bound memory: drop empty buckets once the map grows large.
        if len(_RL_BUCKETS) > _RL_MAX_KEYS:
            for k in [k for k, v in list(_RL_BUCKETS.items()) if not v]:
                _RL_BUCKETS.pop(k, None)
    return _dep


PRICE_ENUM_TO_SYMBOL = {
    "PRICE_LEVEL_FREE": "$",
    "PRICE_LEVEL_INEXPENSIVE": "$",
    "PRICE_LEVEL_MODERATE": "$$",
    "PRICE_LEVEL_EXPENSIVE": "$$$",
    "PRICE_LEVEL_VERY_EXPENSIVE": "$$$$",
}
SYMBOL_ENUMS = {
    "$": {"PRICE_LEVEL_FREE", "PRICE_LEVEL_INEXPENSIVE"},
    "$$": {"PRICE_LEVEL_MODERATE"},
    "$$$": {"PRICE_LEVEL_EXPENSIVE"},
    "$$$$": {"PRICE_LEVEL_VERY_EXPENSIVE"},
}


def haversine_miles(lat1, lon1, lat2, lon2):
    R = 3958.8
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlmb = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dlmb / 2) ** 2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def prettify_type(t, category="food"):
    if not t:
        return {"drinks": "Cafe", "bars": "Bar", "desserts": "Dessert Shop", "shops": "Shop", "fuel": "Gas Station"}.get(category, "Restaurant")
    return t.replace("_restaurant", "").replace("_", " ").title()


def maps_url(name, address=""):
    return f"https://www.google.com/maps/search/?api=1&query={quote_plus((name + ' ' + address).strip())}"


def doordash_url(name, address=""):
    return f"https://www.doordash.com/search/store/{quote_plus(name)}"


def ubereats_url(name, address=""):
    return f"https://www.ubereats.com/search?q={quote_plus(name)}"


def grubhub_url(name, address=""):
    return f"https://www.grubhub.com/search?queryText={quote_plus(name)}"


def order_url(name, address=""):
    return f"https://www.google.com/search?q={quote_plus((name + ' ' + address + ' order online delivery').strip())}"
