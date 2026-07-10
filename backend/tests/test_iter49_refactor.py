"""Iteration 49: Backend regression tests after server.py -> modules refactor.

Covers:
- Core: /api/, /api/restaurants, /api/cuisines, /api/spin
- Places: /api/places/search, /api/places/photo (allowlist 404)
- Stats: fates, crawls, increments
- Crawls: create/get/validation
- Admin: auth (bad/good), verify, sponsors GET/CRUD, sponsors/stats, submissions,
  auth-required endpoints reject without Bearer token
"""
import os
import time
import pytest
import requests

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://lucky-bite-1.preview.emergentagent.com').rstrip('/')
API = f"{BASE_URL}/api"
ADMIN_PW = "GrimReaper!2026"


@pytest.fixture(scope="module")
def s():
    sess = requests.Session()
    sess.headers.update({"Content-Type": "application/json"})
    return sess


@pytest.fixture(scope="module")
def admin_token(s):
    r = s.post(f"{API}/admin/login", json={"password": ADMIN_PW}, timeout=15)
    assert r.status_code == 200, r.text
    tok = r.json().get("token")
    assert tok and isinstance(tok, str)
    return tok


@pytest.fixture(scope="module")
def auth_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}"}


# ---------- Core / Restaurants ----------
class TestCore:
    def test_root(self, s):
        r = s.get(f"{API}/", timeout=15)
        assert r.status_code == 200
        assert "message" in r.json()

    def test_restaurants(self, s):
        r = s.get(f"{API}/restaurants", timeout=15)
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list)
        assert len(data) >= 50, f"expected ~63 restaurants, got {len(data)}"

    def test_cuisines_sorted(self, s):
        r = s.get(f"{API}/cuisines", timeout=15)
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list) and len(data) > 0
        assert data == sorted(data)

    def test_spin_empty_filters(self, s):
        r = s.post(f"{API}/spin", json={}, timeout=15)
        assert r.status_code == 200
        data = r.json()
        assert "id" in data or "name" in data


# ---------- Places ----------
class TestPlaces:
    def test_places_search_food(self, s):
        r = s.post(f"{API}/places/search",
                   json={"category": "food", "radius_miles": 50}, timeout=30)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data.get("source") in ("curated", "google")
        assert isinstance(data.get("restaurants", []), list)
        assert len(data["restaurants"]) > 0

    def test_places_photo_bad_name_404(self, s):
        r = s.get(f"{API}/places/photo", params={"name": "badvalue"}, timeout=15)
        assert r.status_code == 404


# ---------- Stats ----------
class TestStats:
    def test_fates_count(self, s):
        r = s.get(f"{API}/stats/fates", timeout=15)
        assert r.status_code == 200
        assert "count" in r.json() or "total" in r.json()

    def test_crawls_count(self, s):
        r = s.get(f"{API}/stats/crawls", timeout=15)
        assert r.status_code == 200
        assert "count" in r.json() or "total" in r.json()

    def test_fate_dealt_increments(self, s):
        before = s.get(f"{API}/stats/fates", timeout=15).json()
        b = before.get("count", before.get("total", 0))
        r = s.post(f"{API}/stats/fate-dealt", timeout=15)
        assert r.status_code == 200
        after = r.json().get("count", r.json().get("total", 0))
        assert after == b + 1

    def test_crawl_completed_increments(self, s):
        before = s.get(f"{API}/stats/crawls", timeout=15).json()
        b = before.get("count", before.get("total", 0))
        r = s.post(f"{API}/stats/crawl-completed", timeout=15)
        assert r.status_code == 200
        after = r.json().get("count", r.json().get("total", 0))
        assert after == b + 1


# ---------- Crawls ----------
class TestCrawls:
    def test_create_and_get_crawl(self, s):
        payload = {
            "stops": [
                {"name": "Test Bar A", "address": "1 Main St", "image": "https://x/a.jpg"},
                {"name": "Test Bar B", "address": "2 Main St", "image": "https://x/b.jpg"},
            ],
            "label": "TEST_Iter49 Crawl",
        }
        r = s.post(f"{API}/crawls", json=payload, timeout=15)
        assert r.status_code in (200, 201), r.text
        data = r.json()
        code = data.get("code") or data.get("short_code")
        assert code and isinstance(code, str)
        # GET
        g = s.get(f"{API}/crawls/{code}", timeout=15)
        assert g.status_code == 200
        got = g.json()
        assert len(got.get("stops", [])) == 2

    def test_create_crawl_one_stop_422(self, s):
        r = s.post(f"{API}/crawls", json={
            "stops": [{"name": "Solo", "address": "x", "image": "https://x/a.jpg"}]
        }, timeout=15)
        assert r.status_code == 422


# ---------- Admin ----------
class TestAdmin:
    def test_login_wrong_pw_401(self, s):
        r = s.post(f"{API}/admin/login", json={"password": "wrong"}, timeout=15)
        assert r.status_code == 401

    def test_login_good_pw(self, admin_token):
        assert admin_token

    def test_verify(self, s, auth_headers):
        r = s.get(f"{API}/admin/verify", headers=auth_headers, timeout=15)
        assert r.status_code == 200

    def test_verify_without_token_401(self, s):
        r = requests.get(f"{API}/admin/verify", timeout=15)
        assert r.status_code == 401

    def test_sponsors_get(self, s, auth_headers):
        r = s.get(f"{API}/admin/sponsors", headers=auth_headers, timeout=15)
        assert r.status_code == 200
        assert isinstance(r.json(), (list, dict))

    def test_sponsors_get_without_token_401(self, s):
        r = requests.get(f"{API}/admin/sponsors", timeout=15)
        assert r.status_code == 401

    def test_sponsors_stats(self, s, auth_headers):
        r = s.get(f"{API}/admin/sponsors/stats", headers=auth_headers, timeout=15)
        assert r.status_code == 200
        data = r.json()
        assert "mrr" in data
        assert str(data.get("price", "")).startswith("29") or data.get("price") == 29 or data.get("price") == "29.00"

    def test_submissions(self, s, auth_headers):
        r = s.get(f"{API}/admin/submissions", headers=auth_headers, timeout=15)
        assert r.status_code == 200

    def test_submissions_without_token_401(self, s):
        r = requests.get(f"{API}/admin/submissions", timeout=15)
        assert r.status_code == 401

    def test_sponsor_crud(self, s, auth_headers):
        payload = {
            "name": "TEST_Iter49 Sponsor",
            "cuisine": "Italian",
            "address": "123 Test St",
            "url": "https://example.com",
            "image": "https://example.com/i.jpg",
            "active": True,
        }
        # CREATE
        c = s.post(f"{API}/admin/sponsors", headers=auth_headers, json=payload, timeout=15)
        assert c.status_code in (200, 201), c.text
        sid = c.json().get("id") or c.json().get("_id") or c.json().get("sponsor_id")
        assert sid, f"no id in create response: {c.text}"
        # PATCH
        p = s.patch(f"{API}/admin/sponsors/{sid}", headers=auth_headers,
                    json={"name": "TEST_Iter49 Sponsor Updated"}, timeout=15)
        assert p.status_code in (200, 204), p.text
        # DELETE
        d = s.delete(f"{API}/admin/sponsors/{sid}", headers=auth_headers, timeout=15)
        assert d.status_code in (200, 204), d.text
