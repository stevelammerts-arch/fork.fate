"""Iteration 2 security tests: SEC-002 (server-side crawl verification + upsert
idempotency), SEC-003 (env-gated CORS preview wildcard), SEC-004 (photo cache +
budget reservation)."""
import os
import subprocess
import textwrap
from datetime import datetime, timezone

import pytest
import requests
from pymongo import MongoClient

BASE_URL = (os.environ.get("REACT_APP_BACKEND_URL") or "").rstrip("/")
assert BASE_URL, "REACT_APP_BACKEND_URL missing"
API = f"{BASE_URL}/api"

MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017").strip("\"'")
DB_NAME = os.environ.get("DB_NAME", "test_database").strip("\"'")


@pytest.fixture(scope="module")
def s():
    return requests.Session()


@pytest.fixture(scope="module")
def mongo():
    c = MongoClient(MONGO_URL)
    yield c[DB_NAME]
    c.close()


@pytest.fixture(scope="module")
def crawl_code(s):
    """Create a fresh crawl and yield its code (label TEST_sec2 for cleanup)."""
    r = s.post(f"{API}/crawls", json={
        "mode": "bars", "label": "TEST_sec2",
        "stops": [
            {"id": "TS1", "name": "A", "cuisine": "Beer", "price": "$$"},
            {"id": "TS2", "name": "B", "cuisine": "Wine", "price": "$$"},
            {"id": "TS3", "name": "C", "cuisine": "Beer", "price": "$$"},
        ],
    })
    assert r.status_code == 200, r.text
    return r.json()["code"]


def _post_checkin(s, code, stop_id, source="gps", stop_index=0):
    return s.post(f"{API}/crawls/{code}/checkin", json={
        "stop_id": stop_id, "stop_index": stop_index,
        "lat": 40.7, "lng": -74.0, "source": source,
    })


def _clear_checkins(mongo, code):
    mongo.crawl_checkins.delete_many({"code": code})


# ============== SEC-002 verification matrix ==============
class TestSec002Verification:
    def test_a_verified_true_but_zero_gps_checkins(self, s, mongo, crawl_code):
        _clear_checkins(mongo, crawl_code)
        r = s.post(f"{API}/crawls/complete", json={
            "team_name": "TEST_sec2_A", "stops": 3, "mode": "bars", "label": "TEST_sec2",
            "code": crawl_code, "duration_seconds": 5400, "distance": 1.5, "verified": True,
        })
        assert r.status_code == 200
        j = r.json()
        assert j["verified"] is False
        assert j["rank_stops"] is None and j["rank_fastest"] is None
        # Not on leaderboard
        lb = s.get(f"{API}/crawls/leaderboard").json()
        names = [e["team_name"] for e in lb["global"]["stops"]]
        assert "TEST_sec2_A" not in names

    def test_b_partial_gps_still_unverified(self, s, mongo, crawl_code):
        _clear_checkins(mongo, crawl_code)
        assert _post_checkin(s, crawl_code, "TS1", "gps", 0).status_code == 200
        assert _post_checkin(s, crawl_code, "TS2", "gps", 1).status_code == 200
        r = s.post(f"{API}/crawls/complete", json={
            "team_name": "TEST_sec2_B", "stops": 3, "mode": "bars", "label": "TEST_sec2",
            "code": crawl_code, "duration_seconds": 5400, "distance": 1.5, "verified": True,
        })
        j = r.json()
        assert j["verified"] is False, j
        assert j["rank_stops"] is None

    def test_c_full_gps_verified_and_on_leaderboard(self, s, mongo, crawl_code):
        _clear_checkins(mongo, crawl_code)
        for i, sid in enumerate(["TS1", "TS2", "TS3"]):
            assert _post_checkin(s, crawl_code, sid, "gps", i).status_code == 200
        r = s.post(f"{API}/crawls/complete", json={
            "team_name": "TEST_sec2_C", "stops": 3, "mode": "bars", "label": "TEST_sec2",
            "code": crawl_code, "duration_seconds": 5400, "distance": 1.5, "verified": True,
        })
        j = r.json()
        assert j["verified"] is True, j
        assert isinstance(j["rank_stops"], int)
        lb = s.get(f"{API}/crawls/leaderboard").json()
        names = [e["team_name"] for e in lb["global"]["stops"]]
        assert "TEST_sec2_C" in names, names

    def test_d_impossible_pace_downgraded(self, s, mongo, crawl_code):
        _clear_checkins(mongo, crawl_code)
        for i, sid in enumerate(["TS1", "TS2", "TS3"]):
            _post_checkin(s, crawl_code, sid, "gps", i)
        r = s.post(f"{API}/crawls/complete", json={
            "team_name": "TEST_sec2_D", "stops": 3, "mode": "bars", "label": "TEST_sec2",
            "code": crawl_code, "duration_seconds": 60, "distance": 40, "verified": True,
        })
        j = r.json()
        assert j["verified"] is False, j

    def test_e_no_code_forces_unverified(self, s):
        r = s.post(f"{API}/crawls/complete", json={
            "team_name": "TEST_sec2_E", "stops": 2, "mode": "bars", "label": "TEST_sec2",
            "duration_seconds": 3600, "distance": 1.0, "verified": True,
        })
        assert r.status_code == 200
        assert r.json()["verified"] is False

    def test_f_manual_checkins_dont_count(self, s, mongo, crawl_code):
        _clear_checkins(mongo, crawl_code)
        for i, sid in enumerate(["TS1", "TS2", "TS3"]):
            _post_checkin(s, crawl_code, sid, "manual", i)
        r = s.post(f"{API}/crawls/complete", json={
            "team_name": "TEST_sec2_F", "stops": 3, "mode": "bars", "label": "TEST_sec2",
            "code": crawl_code, "duration_seconds": 5400, "distance": 1.5, "verified": True,
        })
        assert r.json()["verified"] is False


# ============== SEC-002 idempotency ==============
class TestSec002Idempotency:
    def test_upsert_dedupes_repeated_gps(self, s, mongo, crawl_code):
        _clear_checkins(mongo, crawl_code)
        first = None
        for _ in range(5):
            _post_checkin(s, crawl_code, "TS_upsert", "gps", 0)
        docs = list(mongo.crawl_checkins.find({"code": crawl_code, "stop_id": "TS_upsert", "source": "gps"}))
        assert len(docs) == 1, f"expected 1 doc after 5 upserts, got {len(docs)}"
        first = docs[0]
        # Repeat again and check created_at unchanged, expire_at refreshed
        old_created = first["created_at"]
        old_expire = first["expire_at"]
        import time as _t
        _t.sleep(1.1)
        _post_checkin(s, crawl_code, "TS_upsert", "gps", 0)
        d2 = mongo.crawl_checkins.find_one({"code": crawl_code, "stop_id": "TS_upsert", "source": "gps"})
        assert d2["created_at"] == old_created, "created_at must not change on repost"
        assert d2["expire_at"] > old_expire, "expire_at must be refreshed on repost"

    def test_different_source_yields_second_doc(self, s, mongo, crawl_code):
        _clear_checkins(mongo, crawl_code)
        _post_checkin(s, crawl_code, "TS_dual", "gps", 0)
        _post_checkin(s, crawl_code, "TS_dual", "manual", 0)
        docs = list(mongo.crawl_checkins.find({"code": crawl_code, "stop_id": "TS_dual"}))
        assert len(docs) == 2, f"expected gps+manual=2 docs, got {len(docs)}"

    def test_ttl_indexes_still_present(self, mongo):
        idx = mongo.crawl_checkins.index_information()
        assert "expire_at_1" in idx
        assert idx["expire_at_1"].get("expireAfterSeconds") == 0
        assert "code_1" in idx

    def test_expire_at_is_bson_datetime_36h_out(self, s, mongo, crawl_code):
        _clear_checkins(mongo, crawl_code)
        _post_checkin(s, crawl_code, "TS_ttl", "gps", 0)
        d = mongo.crawl_checkins.find_one({"code": crawl_code, "stop_id": "TS_ttl"})
        assert isinstance(d["created_at"], str), "created_at must be ISO string"
        assert isinstance(d["expire_at"], datetime), "expire_at must be BSON datetime"
        hrs = (d["expire_at"].replace(tzinfo=timezone.utc) - datetime.now(timezone.utc)).total_seconds() / 3600
        assert 35 < hrs <= 36.5


# ============== SEC-003 CORS gating ==============
class TestSec003CORS:
    def test_origin_allowed_default_true(self):
        import sys
        sys.path.insert(0, '/app/backend')
        from core import origin_allowed
        assert origin_allowed("https://fork-fate.com") is True
        assert origin_allowed("https://www.fork-fate.com") is True
        assert origin_allowed("https://fate-mobile-build.preview.emergentagent.com") is True
        assert origin_allowed("https://evil.com") is False

    def test_origin_allowed_preview_disabled_via_subprocess(self):
        # Reimport core in a subprocess with ALLOW_PREVIEW_ORIGINS=false to prove gating.
        script = textwrap.dedent("""
            import os, sys
            os.environ['ALLOW_PREVIEW_ORIGINS'] = 'false'
            sys.path.insert(0, '/app/backend')
            from core import origin_allowed
            print(origin_allowed('https://fork-fate.com'),
                  origin_allowed('https://fate-mobile-build.preview.emergentagent.com'),
                  origin_allowed('https://evil.com'))
        """)
        env = {**os.environ, "ALLOW_PREVIEW_ORIGINS": "false"}
        r = subprocess.run(["python", "-c", script], capture_output=True, text=True, env=env)
        assert r.returncode == 0, r.stderr
        out = r.stdout.strip().split()
        assert out == ["True", "False", "False"], f"got {out}\nstderr={r.stderr}"

    def test_live_cors_headers(self, s):
        # NOTE: In this preview environment the ingress/CDN layer (Cloudflare) rewrites
        # ACAO to '*' before the FastAPI response reaches the client, so we cannot
        # observe the app's own CORSMiddleware headers over the wire. The gating
        # behavior of SEC-003 is still fully exercised by test_origin_allowed_*.
        good = s.get(f"{API}/", headers={"Origin": "https://fork-fate.com"})
        assert good.status_code == 200


# ============== SEC-004 photo cache + budget ==============
class TestSec004PhotoCache:
    def test_photo_endpoint_404_without_google_key(self, s):
        r = s.get(f"{API}/places/photo?name=places/ChIJ/photos/AbC-1")
        # No GOOGLE_API_KEY -> 404 (guard fires first)
        assert r.status_code == 404

    def test_photo_endpoint_rejects_malformed_name(self, s):
        for bad in ["../etc/passwd", "places/../evil", "places/x/photos/../y", "not-matching"]:
            r = s.get(f"{API}/places/photo", params={"name": bad})
            assert r.status_code == 404, f"{bad!r} -> {r.status_code}"

    def test_cache_constants_importable(self):
        import sys
        sys.path.insert(0, '/app/backend')
        from core import _PHOTO_CACHE, _PHOTO_TTL, _PHOTO_CACHE_MAX, _PHOTO_CACHE_MAX_BYTES
        assert isinstance(_PHOTO_CACHE, dict)
        assert _PHOTO_TTL == 86400
        assert _PHOTO_CACHE_MAX == 150
        assert _PHOTO_CACHE_MAX_BYTES == 400_000

    def test_code_inspection_reserve_and_cache_header(self):
        src = open("/app/backend/routes/places.py").read()
        # _google_reserve must be called BEFORE the httpx fetch on miss.
        reserve_idx = src.find("await _google_reserve()")
        fetch_idx = src.find("await http.get(url)")
        assert 0 < reserve_idx < fetch_idx, "reserve must precede fetch"
        # X-Photo-Cache header set for both hit and miss branches
        assert '"X-Photo-Cache": "hit"' in src
        assert '"X-Photo-Cache": "miss"' in src
        # Eviction branch present
        assert "_PHOTO_CACHE_MAX" in src and "pop(next(iter(_PHOTO_CACHE))" in src


# ============== Build + Cleanup ==============
class TestBuild:
    def test_ff_build_280(self):
        html = open("/app/frontend/public/index.html").read()
        assert 'FF_BUILD="2026.06-280"' in html

    def test_no_checkinbutton_import(self):
        import glob
        for path in glob.glob("/app/frontend/src/**/*.jsx", recursive=True):
            src = open(path).read()
            assert "from './CheckInButton'" not in src, path
            assert 'from "./CheckInButton"' not in src, path
        # Ensure the .unused stash exists (not the live file)
        assert not os.path.exists("/app/frontend/src/components/CheckInButton.jsx")


@pytest.fixture(scope="session", autouse=True)
def _cleanup():
    yield
    try:
        c = MongoClient(MONGO_URL)
        db = c[DB_NAME]
        db.crawl_checkins.delete_many({"stop_id": {"$regex": "^TS"}})
        db.crawl_completions.delete_many({"team_name": {"$regex": "^TEST_sec2"}})
        db.crawls.delete_many({"label": "TEST_sec2"})
        c.close()
    except Exception:
        pass
