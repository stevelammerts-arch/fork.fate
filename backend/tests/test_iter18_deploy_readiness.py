"""Iter-18 deploy-readiness smoke: covers review request items for fork-fate.com launch."""
from _helpers import mint_admin_token
import os, uuid, time
import pytest
import requests

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://web-fate-launch.preview.emergentagent.com').rstrip('/')
UA = {"User-Agent": "Mozilla/5.0 (Iter18Test)"}
ADMIN_PW = os.environ["ADMIN_PASSWORD"]


@pytest.fixture(scope="module")
def sess():
    s = requests.Session()
    s.headers.update(UA)
    return s


# --- API root ------------------------------------------------------
def test_api_root(sess):
    r = sess.get(f"{BASE_URL}/api/")
    assert r.status_code == 200
    assert "message" in r.json()


# --- Seed data ------------------------------------------------------
def test_restaurants_seeded_704(sess):
    r = sess.get(f"{BASE_URL}/api/restaurants")
    assert r.status_code == 200
    data = r.json()
    assert isinstance(data, list)
    # At least the 704 seeded venues should be present
    assert len(data) >= 700, f"Expected ~704 seeded venues, got {len(data)}"
    cats = {(x.get('category') or '').lower() for x in data}
    expected = {'food', 'bars', 'desserts', 'shops', 'fuel', 'explore', 'stay'}
    missing = expected - cats
    assert not missing, f"Missing seeded categories: {missing}. Present: {cats}"


# --- Cuisines ------------------------------------------------------
def test_cuisines(sess):
    r = sess.get(f"{BASE_URL}/api/cuisines")
    assert r.status_code == 200
    data = r.json()
    assert isinstance(data, (list, dict))


# --- Stats sub-endpoints (no bare /api/stats exists) ---------------
def test_stats_fates(sess):
    r = sess.get(f"{BASE_URL}/api/stats/fates")
    assert r.status_code == 200
    assert isinstance(r.json(), dict)


def test_stats_crawls(sess):
    r = sess.get(f"{BASE_URL}/api/stats/crawls")
    assert r.status_code == 200
    assert isinstance(r.json(), dict)


# --- Places search with lat/lng ------------------------------------
def test_places_search_latlng_google(sess):
    payload = {"category": "food", "lat": 34.0522, "lng": -118.2437, "radius_m": 3000}
    r = sess.post(f"{BASE_URL}/api/places/search", json=payload)
    assert r.status_code == 200, r.text
    data = r.json()
    assert isinstance(data, dict)
    src = data.get("source")
    assert src == "google", f"Expected source=google with valid API key, got {src}"
    results = data.get("restaurants") or data.get("results") or data.get("venues") or []
    assert len(results) > 0, "Expected at least 1 place result"


def test_places_search_zip(sess):
    payload = {"category": "food", "zip": "90001"}
    r = sess.post(f"{BASE_URL}/api/places/search", json=payload)
    # zip may or may not be supported; accept 200 or 422 gracefully
    assert r.status_code in (200, 400, 422), r.text
    if r.status_code == 200:
        data = r.json()
        results = data.get("restaurants") or data.get("results") or data.get("venues") or []
        assert isinstance(results, list)


def test_places_search_curated_fallback(sess):
    # Force a niche category where Google likely returns nothing
    payload = {"category": "explore", "lat": 34.0522, "lng": -118.2437, "radius_m": 2000}
    r = sess.post(f"{BASE_URL}/api/places/search", json=payload)
    assert r.status_code == 200, r.text
    data = r.json()
    results = data.get("restaurants") or data.get("results") or data.get("venues") or []
    assert isinstance(results, list)
    assert len(results) > 0, f"Expected fallback curated results for niche cat, got {data}"


# --- Admin auth -----------------------------------------------------
def test_admin_login_ok(sess):
    r = sess.post(f"{BASE_URL}/api/admin/login", json={"password": ADMIN_PW})
    assert r.status_code == 200, r.text
    body = r.json()
    assert body.get("ok") is True


def test_admin_sponsors_requires_auth():
    # Fresh session without cookie
    s = requests.Session()
    s.headers.update(UA)
    r = s.get(f"{BASE_URL}/api/admin/sponsors")
    assert r.status_code in (401, 403), f"Expected 401/403 without auth, got {r.status_code}"


def test_admin_sponsors_with_login():
    s = requests.Session()
    s.headers.update(UA)
    login = s.post(f"{BASE_URL}/api/admin/login", json={"password": ADMIN_PW})
    assert login.status_code == 200
    # Secure cookie is not sent over plain http; use Bearer for the read.
    s.headers["Authorization"] = f"Bearer {mint_admin_token()}"
    r = s.get(f"{BASE_URL}/api/admin/sponsors")
    assert r.status_code == 200, r.text


# --- Crawls ---------------------------------------------------------
def test_crawl_create_and_get(sess):
    payload = {
        "name": f"TEST_iter18_{uuid.uuid4().hex[:6]}",
        "stops": [
            {"name": "Bar A", "address": "123 Main"},
            {"name": "Bar B", "address": "456 Main"},
            {"name": "Bar C", "address": "789 Main"},
        ],
    }
    r = sess.post(f"{BASE_URL}/api/crawls", json=payload)
    assert r.status_code in (200, 201), r.text
    body = r.json()
    code = body.get("code") or body.get("shareable_code") or body.get("id")
    assert code, f"No code returned: {body}"
    # Retrieve
    r2 = sess.get(f"{BASE_URL}/api/crawls/{code}")
    assert r2.status_code == 200, r2.text
    detail = r2.json()
    assert detail.get("name", "").startswith("TEST_iter18_") or "stops" in detail


def test_crawl_leaderboard(sess):
    r = sess.get(f"{BASE_URL}/api/crawls/leaderboard")
    assert r.status_code == 200
    body = r.json()
    assert isinstance(body, (list, dict))


# --- Passports ------------------------------------------------------
def test_passports_wall(sess):
    r = sess.get(f"{BASE_URL}/api/passports/wall")
    assert r.status_code == 200
    body = r.json()
    assert isinstance(body, (list, dict))


# --- Assetlinks TWA -------------------------------------------------
def test_assetlinks_json(sess):
    r = sess.get(f"{os.environ.get('FF_ASSET_BASE_URL', BASE_URL)}/.well-known/assetlinks.json")
    assert r.status_code == 200, r.text
    data = r.json()
    assert isinstance(data, list) and len(data) >= 1
    target = data[0].get("target", {})
    assert target.get("package_name") == "com.fork_fate.twa", f"Wrong package: {target}"
    fps = target.get("sha256_cert_fingerprints") or []
    assert len(fps) == 4, f"Expected 4 sha256 fingerprints, got {len(fps)}"
