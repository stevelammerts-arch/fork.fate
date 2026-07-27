
import asyncio
import base64
import os
from pathlib import Path
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

load_dotenv('/app/backend/.env')
client = AsyncIOMotorClient(os.environ['MONGO_URL'])
db = client[os.environ['DB_NAME']]
RP_ID = 'web-fate-launch.preview.emergentagent.com'
ADMIN_KEY = 'admin'

def b64url(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b'=').decode()

async def main():
    doc = await db.admin_auth.find_one({'_id': ADMIN_KEY}) or {'_id': ADMIN_KEY, 'passkeys': []}
    # Remove any prior QA dummy key for idempotence, preserve any non-test passkeys.
    existing = [pk for pk in doc.get('passkeys', []) if not pk.get('qa_dummy')]
    dummy = {
        'credential_id': b64url(b'qa-dummy-lost-passkey-credential-2026'),
        'public_key': b64url(b'not-a-real-public-key-used-only-to-trigger-available-ui'),
        'sign_count': 0,
        'rp_id': RP_ID,
        'qa_dummy': True
    }
    await db.admin_auth.update_one({'_id': ADMIN_KEY}, {'$set': {'passkeys': existing + [dummy]}}, upsert=True)
    after = await db.admin_auth.find_one({'_id': ADMIN_KEY}, {'_id': 0})
    count = len([pk for pk in after.get('passkeys', []) if pk.get('rp_id') == RP_ID])
    print({'seeded_dummy_passkey_for_rp': RP_ID, 'rp_count': count, 'total_count': len(after.get('passkeys', []))})
    client.close()

asyncio.run(main())
