"""Fork·Fate API entrypoint: wires routers, CORS, startup/shutdown."""
import os
import asyncio
from datetime import datetime, timezone
from fastapi import FastAPI, APIRouter
from starlette.middleware.cors import CORSMiddleware

from core import client, logger, ALLOWED_ORIGIN_REGEX
from seed_data import seed_db
from routes import restaurants, stats, crawls, places, sponsors, admin, passkey
from routes.sponsors import reconcile_sponsors

app = FastAPI()
api_router = APIRouter(prefix="/api")

api_router.include_router(restaurants.router)
api_router.include_router(stats.router)
api_router.include_router(crawls.router)
api_router.include_router(places.router)
api_router.include_router(sponsors.router)
api_router.include_router(admin.router)
api_router.include_router(passkey.router)

app.include_router(api_router)


@app.middleware("http")
async def security_headers(request, call_next):
    resp = await call_next(request)
    resp.headers["X-Content-Type-Options"] = "nosniff"
    resp.headers["X-Frame-Options"] = "DENY"
    resp.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    resp.headers["Strict-Transport-Security"] = "max-age=63072000; includeSubDomains"
    # API responses never embed active content; lock them down completely.
    resp.headers.setdefault("Content-Security-Policy", "default-src 'none'; img-src 'self'; frame-ancestors 'none'")
    return resp

# Restrict CORS to the app's own domains (prod fork-fate.com + Emergent preview subdomains).
# Extra explicit origins can be added via the CORS_ORIGINS env (comma-separated).
_extra_origins = [o.strip() for o in os.environ.get('CORS_ORIGINS', '').split(',') if o.strip() and o.strip() != '*']
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=_extra_origins,
    allow_origin_regex=ALLOWED_ORIGIN_REGEX,
    allow_methods=["*"],
    allow_headers=["*"],
)


async def _reconcile_loop():
    """Daily background job: auto-pause lapsed/cancelled sponsors (webhook alternative)."""
    while True:
        try:
            res = await reconcile_sponsors()
            if res.get("checked"):
                logger.info(f"Daily sponsor reconcile: {res}")
        except Exception as e:
            logger.warning(f"Reconcile loop error: {e}")
        await asyncio.sleep(24 * 60 * 60)


async def _monthly_summary_loop():
    """Auto-send the sponsor summary email on the 1st of each month (idempotent)."""
    from core import send_email, db
    from routes.admin import build_sponsor_summary
    while True:
        try:
            now = datetime.now(timezone.utc)
            if now.day == 1:
                tag = now.strftime("%Y-%m")
                already = await db.config.find_one({"key": "summary_sent", "month": tag})
                if not already:
                    subject, html = await build_sponsor_summary()
                    if await send_email(subject, html):
                        await db.config.update_one(
                            {"key": "summary_sent", "month": tag},
                            {"$set": {"sent_at": now.isoformat()}}, upsert=True)
                        logger.info(f"Sent monthly sponsor summary for {tag}")
        except Exception as e:
            logger.warning(f"Monthly summary loop error: {e}")
        await asyncio.sleep(6 * 60 * 60)


@app.on_event("startup")
async def startup_event():
    await seed_db()
    try:
        from core import init_storage
        await init_storage()
        logger.info("Object storage initialized")
    except Exception as e:
        logger.error(f"Object storage init failed: {e}")
    asyncio.create_task(_reconcile_loop())
    asyncio.create_task(_monthly_summary_loop())


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
