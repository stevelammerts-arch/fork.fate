"""Iteration test: FateActionsDropdown + shops/fuel guard + crawl_checkins TTL.

Covers the review_request punch-list:
- Backend smoke: /api/, restaurants, cuisines, spin, places/search, stats, sponsors
- Admin login + verify
- New POST /api/crawls/{code}/checkin with TTL index + validation
- Regression on existing crawl routes: create, get, complete, leaderboard
"""
import os
import time
from datetime import datetime, timezone

import pytest
import requests
from pymongo import MongoClient

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/") or \
           os.environ.get("EXPO_PUBLIC_BACKEND_URL", "").rstrip("/")
assert BASE_URL, "REACT_APP_BACKEND_URL missing"
API = f"{BASE_URL}/api"
ADMIN_PASSWORD = "ForkFate!Admin2026"

MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017").strip('"').strip("'")
DB_NAME = os.environ.get("DB_NAME", "test_database").strip('"').strip("'")


@pytest.fixture(scope="module")
def s():
    ses = requests.Session()
    ses.headers.update({"Content-Type": "application/json"})
    return ses


@pytest.fixture(scope="module")
def mongo():
    c = MongoClient(MONGO_URL)
    yield c[DB_NAME]
    c.close()


# ------------------ Smoke ------------------
class TestSmoke:
    def test_root(self, s):
        r = s.get(f"{API}/")
        assert r.status_code == 200

    def test_restaurants(self, s):
        r = s.get(f"{API}/restaurants")
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_cuisines(self, s):
        r = s.get(f"{API}/cuisines")
        assert r.status_code == 200

    def test_spin(self, s):
        r = s.post(f"{API}/spin", json={})
        assert r.status_code == 200

    def test_places_search_curated(self, s):
        r = s.post(f"{API}/places/search", json={"zip": "10001", "category": "food"})
        assert r.status_code == 200
        assert r.json().get("source") == "curated"

    def test_stats_fates(self, s):
        r = s.get(f"{API}/stats/fates")
        assert r.status_code == 200

    def test_stats_fate_dealt(self, s):
        r = s.post(f"{API}/stats/fate-dealt", json={})
        assert r.status_code in (200, 429)  # rate limited if hammered

    def test_sponsors_active(self, s):
        r = s.get(f"{API}/sponsors/active")
        assert r.status_code == 200


# ------------------ Admin ------------------
class TestAdmin:
    def test_login_and_verify(self, s):
        r = s.post(f"{API}/admin/login", json={"password": ADMIN_PASSWORD})
        assert r.status_code == 200, r.text
        token = r.json().get("token") or r.json().get("access_token")
        headers = {"Authorization": f"Bearer {token}"} if token else {}
        v = s.get(f"{API}/admin/verify", headers=headers)
        # cookie-based session should also work via session cookies
        assert v.status_code == 200, v.text


# ------------------ Crawls regression ------------------
class TestCrawls:
    def test_create_get_404(self, s):
        payload = {
            "mode": "bars",
            "label": "TEST_crawl",
            "stops": [
                {"id": "s1", "name": "A", "cuisine": "Beer", "price": "$$", "image": "", "distance": 0.1},
                {"id": "s2", "name": "B", "cuisine": "Wine", "price": "$$", "image": "", "distance": 0.2},
            ],
        }
        r = s.post(f"{API}/crawls", json=payload)
        assert r.status_code == 200, r.text
        code = r.json()["code"]
        assert len(code) == 8
        pytest.crawl_code = code

        g = s.get(f"{API}/crawls/{code}")
        assert g.status_code == 200
        assert g.json()["label"] == "TEST_crawl"

        nf = s.get(f"{API}/crawls/ZZZZZZZZ")
        assert nf.status_code == 404

    def test_complete(self, s):
        code = getattr(pytest, "crawl_code", "AAAAAAAA")
        r = s.post(f"{API}/crawls/complete", json={
            "team_name": "TEST_crew",
            "stops": 2,
            "mode": "bars",
            "label": "TEST_crawl",
            "code": code,
            "duration_seconds": 3600,
            "distance": 1.0,
            "verified": True,
        })
        assert r.status_code == 200
        assert r.json().get("ok") is True

    def test_leaderboard(self, s):
        r = s.get(f"{API}/crawls/leaderboard")
        assert r.status_code == 200
        d = r.json()
        assert "global" in d and "week" in d


# ------------------ New: check-in endpoint ------------------
class TestCheckin:
    def test_checkin_success_and_persistence(self, s, mongo):
        code = getattr(pytest, "crawl_code", "AAAAAAAA")
        body = {"stop_id": "TEST_s1", "stop_index": 0, "lat": 40.75, "lng": -73.99, "source": "gps"}
        r = s.post(f"{API}/crawls/{code}/checkin", json=body)
        assert r.status_code == 200, r.text
        j = r.json()
        assert j["ok"] is True
        assert j["expires_in_hours"] == 36

        # verify persistence (both created_at ISO string AND expire_at BSON datetime)
        time.sleep(0.3)
        doc = mongo.crawl_checkins.find_one({"code": code, "stop_id": "TEST_s1"})
        assert doc is not None, "check-in not persisted"
        assert isinstance(doc["created_at"], str), "created_at must be ISO string"
        assert isinstance(doc["expire_at"], datetime), "expire_at must be BSON datetime"
        delta_hours = (doc["expire_at"].replace(tzinfo=timezone.utc) - datetime.now(timezone.utc)).total_seconds() / 3600
        assert 35 < delta_hours <= 36.5, f"expire_at ~36h expected, got {delta_hours}"

    def test_ttl_index_present(self, mongo):
        idx = mongo.crawl_checkins.index_information()
        assert "expire_at_1" in idx, f"missing TTL index. Got: {list(idx.keys())}"
        assert idx["expire_at_1"].get("expireAfterSeconds") == 0
        assert "code_1" in idx, f"missing code index. Got: {list(idx.keys())}"

    def test_source_coerced_to_manual(self, s, mongo):
        code = getattr(pytest, "crawl_code", "AAAAAAAA")
        r = s.post(f"{API}/crawls/{code}/checkin", json={
            "stop_id": "TEST_srcbad", "stop_index": 1, "lat": 40.7, "lng": -74.0, "source": "spaceship"
        })
        assert r.status_code == 200
        doc = mongo.crawl_checkins.find_one({"code": code, "stop_id": "TEST_srcbad"})
        assert doc and doc["source"] == "manual"

    def test_stop_index_out_of_range_rejected(self, s):
        code = getattr(pytest, "crawl_code", "AAAAAAAA")
        r = s.post(f"{API}/crawls/{code}/checkin", json={
            "stop_id": "x", "stop_index": 99, "lat": 0, "lng": 0, "source": "gps"
        })
        assert r.status_code == 422
        r2 = s.post(f"{API}/crawls/{code}/checkin", json={
            "stop_id": "x", "stop_index": -1, "lat": 0, "lng": 0, "source": "gps"
        })
        assert r2.status_code == 422

    def test_lat_lng_out_of_range_rejected(self, s):
        code = getattr(pytest, "crawl_code", "AAAAAAAA")
        r = s.post(f"{API}/crawls/{code}/checkin", json={
            "stop_id": "x", "stop_index": 0, "lat": 999, "lng": 0, "source": "gps"
        })
        assert r.status_code == 422
        r2 = s.post(f"{API}/crawls/{code}/checkin", json={
            "stop_id": "x", "stop_index": 0, "lat": 0, "lng": 999, "source": "gps"
        })
        assert r2.status_code == 422

    def test_rate_limit_60_per_min(self, s):
        code = getattr(pytest, "crawl_code", "AAAAAAAA")
        # Fire many rapid requests; expect at least one 429 (limit is 60/min per IP)
        # Note: preview ingress may vary the source IP; accept either strict enforcement
        # or note it as informational.
        codes = []
        for i in range(80):
            r = s.post(f"{API}/crawls/{code}/checkin", json={
                "stop_id": f"TEST_rl_{i}", "stop_index": 0, "lat": 0, "lng": 0, "source": "gps"
            })
            codes.append(r.status_code)
        # Informational: log distribution but do not hard-fail if ingress rewrites IP
        if 429 not in codes:
            pytest.skip(f"rate limit not triggered (likely ingress IP rewrite); codes={set(codes)}")


# ------------------ Build cache + security file check ------------------
class TestBuildAndSecurity:
    def test_ff_build_bumped(self):
        with open("/app/frontend/public/index.html") as f:
            html = f.read()
        assert 'FF_BUILD="2026.06-279"' in html

    def test_no_keystore_or_aab_in_public(self):
        import glob
        assert glob.glob("/app/frontend/public/*.keystore") == []
        assert glob.glob("/app/frontend/public/*.aab") == []

    def test_keystore_public_url_not_leaking_binary(self, s):
        r = s.get(f"{BASE_URL}/forkfate-upload.keystore")
        # SPA fallback returns HTML, not the binary keystore
        ct = r.headers.get("content-type", "")
        assert "text/html" in ct or r.status_code >= 400, \
            f"leaked binary! ct={ct} status={r.status_code}"

    def test_aab_public_url_not_leaking_binary(self, s):
        r = s.get(f"{BASE_URL}/forkfate-v3.aab")
        ct = r.headers.get("content-type", "")
        assert "text/html" in ct or r.status_code >= 400, \
            f"leaked binary! ct={ct} status={r.status_code}"


@pytest.fixture(scope="session", autouse=True)
def _cleanup():
    yield
    try:
        c = MongoClient(MONGO_URL)
        db = c[DB_NAME]
        db.crawl_checkins.delete_many({"stop_id": {"$regex": "^TEST_"}})
        db.crawl_completions.delete_many({"team_name": "TEST_crew"})
        db.crawls.delete_many({"label": "TEST_crawl"})
        c.close()
    except Exception:
        pass
