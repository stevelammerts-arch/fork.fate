"""Fork·Fate API entrypoint: wires routers, CORS, startup/shutdown."""
import os
import asyncio
from fastapi import FastAPI, APIRouter
from starlette.middleware.cors import CORSMiddleware

from core import client, logger
from seed_data import seed_db
from routes import restaurants, stats, crawls, places, sponsors, admin
from routes.sponsors import reconcile_sponsors

app = FastAPI()
api_router = APIRouter(prefix="/api")

api_router.include_router(restaurants.router)
api_router.include_router(stats.router)
api_router.include_router(crawls.router)
api_router.include_router(places.router)
api_router.include_router(sponsors.router)
api_router.include_router(admin.router)

app.include_router(api_router)

_cors_origins = os.environ.get('CORS_ORIGINS', '*').split(',')
app.add_middleware(
    CORSMiddleware,
    allow_credentials=False,
    allow_origins=_cors_origins,
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


@app.on_event("startup")
async def startup_event():
    await seed_db()
    asyncio.create_task(_reconcile_loop())


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
