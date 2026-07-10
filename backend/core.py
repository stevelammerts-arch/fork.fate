"""Shared config, DB client, helpers, auth and rate limiting for Fork·Fate."""
from fastapi import HTTPException, Request
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient
import os
import re
import time
import math
import jwt
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
JWT_ALG = "HS256"
JWT_ISS = os.environ.get("JWT_ISS", "fork-fate")
JWT_AUD = os.environ.get("JWT_AUD", "fork-fate-admin")
# Origins allowed for CORS + WebAuthn (prod fork-fate.com + Emergent preview subdomains).
ALLOWED_ORIGIN_REGEX = r"https://([a-z0-9-]+\.)*(fork-fate\.com|emergentagent\.com)$"
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
}


def pick_placeholder(category: str, key: str) -> str:
    imgs = PLACEHOLDER_IMGS.get(category, PLACEHOLDER_IMGS["food"])
    idx = sum(bytearray((key or "x").encode("utf-8"))) % len(imgs)
    return imgs[idx]


MAX_RADIUS_MILES = 50.0


def create_admin_token():
    now = datetime.now(timezone.utc)
    payload = {"sub": "admin", "role": "admin", "type": "admin",
               "iss": JWT_ISS, "aud": JWT_AUD,
               "iat": now, "exp": now + timedelta(hours=12)}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALG)


def require_admin(request: Request):
    auth = request.headers.get("Authorization", "")
    token = auth[7:] if auth.startswith("Bearer ") else None
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
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


def _request_origin(request: Request) -> str:
    """Best-effort origin of the calling page. Same-origin GETs often omit the
    Origin header, so fall back to Referer, then the forwarded host/proto set by
    the ingress, then the Host header."""
    o = (request.headers.get("origin") or "").strip()
    if o:
        return o
    ref = (request.headers.get("referer") or "").strip()
    if ref:
        p = urlparse(ref)
        if p.scheme and p.netloc:
            return f"{p.scheme}://{p.netloc}"
    host = request.headers.get("x-forwarded-host") or request.headers.get("host")
    proto = request.headers.get("x-forwarded-proto") or "https"
    if host:
        return f"{proto}://{host}"
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


# Global admin-login throttle: caps TOTAL login attempts across all IPs per window,
# defending against distributed / IP-spoofed brute force (complements the per-IP limit).
_ADMIN_LOGIN_GLOBAL = {"window_start": 0.0, "count": 0}


def admin_login_throttle(max_per_window: int = 30, window_seconds: int = 60):
    now = time.time()
    g = _ADMIN_LOGIN_GLOBAL
    if now - g["window_start"] > window_seconds:
        g["window_start"] = now
        g["count"] = 0
    g["count"] += 1
    if g["count"] > max_per_window:
        raise HTTPException(status_code=429, detail="Too many login attempts, please try again shortly")


# Simple in-memory per-IP rate limiter (coarse abuse/cost protection)
_RL_BUCKETS = defaultdict(deque)
_RL_MAX_KEYS = 10000  # bound memory: purge empty buckets once the map grows large

# Cache ZIP -> (lat, lng) to cut repeat geocoding calls
_ZIP_GEO_CACHE = {}
# Cache Places search results to cut repeat billed Google calls (key -> (ts, results))
_PLACES_CACHE = {}
_PLACES_TTL = 300  # seconds

# Hard daily ceiling on billed Google search/geocode calls (abuse safety net).
GOOGLE_SEARCH_DAILY_CAP = int(os.environ.get("GOOGLE_SEARCH_DAILY_CAP", "160"))
_GOOGLE_DAY = {"date": None, "searches": 0}


def _google_budget_ok() -> bool:
    today = datetime.now(timezone.utc).date().isoformat()
    if _GOOGLE_DAY["date"] != today:
        _GOOGLE_DAY["date"] = today
        _GOOGLE_DAY["searches"] = 0
    return _GOOGLE_DAY["searches"] < GOOGLE_SEARCH_DAILY_CAP


def _google_record_call():
    _GOOGLE_DAY["searches"] += 1


def client_ip(request: Request) -> str:
    """Trusted client IP. Behind Cloudflare, CF-Connecting-IP is set by the CDN and
    cannot be spoofed by the client. Do NOT trust the client-supplied leftmost
    X-Forwarded-For value (forgeable -> rate-limit bypass). Fall back to the direct
    TCP peer when no trusted CDN header is present."""
    for h in ("cf-connecting-ip", "true-client-ip"):
        v = request.headers.get(h)
        if v and v.strip():
            return v.strip()
    return request.client.host if request.client else "unknown"


def rate_limit(max_requests: int, window_seconds: int = 60):
    def _dep(request: Request):
        ip = client_ip(request)
        now = time.time()
        bucket = _RL_BUCKETS[ip]
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


def prettify_type(t):
    if not t:
        return "Restaurant"
    return t.replace("_restaurant", "").replace("_", " ").title()


def maps_url(name, address=""):
    return f"https://www.google.com/maps/search/?api=1&query={quote_plus((name + ' ' + address).strip())}"


def doordash_url(name, address=""):
    return f"https://www.doordash.com/search/store/{quote_plus(name)}"


def order_url(name, address=""):
    return f"https://www.google.com/search?q={quote_plus((name + ' ' + address + ' order online delivery').strip())}"
