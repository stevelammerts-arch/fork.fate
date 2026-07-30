import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv("/app/backend/.env")


async def main():
    c = AsyncIOMotorClient(os.environ["MONGO_URL"].strip("\"'"))
    db = c[os.environ["DB_NAME"].strip("\"'")]
    r1 = await db.sponsor_impression_events.delete_many({"sponsor_id": {"$in": ["test-sp-1", "test-sp-2"]}})
    r2 = await db.sponsors.delete_many({"id": {"$in": ["test-sp-1", "test-sp-2"]}})
    print("events removed:", r1.deleted_count, "sponsors removed:", r2.deleted_count)


asyncio.run(main())
