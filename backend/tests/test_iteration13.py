"""Iteration 13: Google Places ZIP/lat-lng search, photo proxy, curated fallback, sanity."""
import os
import pytest
import requests

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://lucky-bite-1.preview.emergentagent.com').rstrip('/')
API = f"{BASE_URL}/api"


@pytest.fixture(scope="module")
def s():
    sess = requests.Session()
    sess.headers.update({"Content-Type": "application/json"})
    return sess


# ---------- Google Places ZIP search ----------
@pytest.mark.parametrize("category", ["food", "drinks", "bars", "desserts"])
def test_zip_search_google_source_all_categories(s, category):
    r = s.post(f"{API}/places/search", json={"zip_code": "10001", "category": category})
    assert r.status_code == 200, r.text
    data = r.json()
    assert data["source"] == "google", f"expected google, got {data['source']} for {category}"
    spots = data["restaurants"]
    assert len(spots) >= 5, f"{category}: got {len(spots)} spots"
    first = spots[0]
    for key in ("name", "address", "google_url", "doordash_url", "distance", "image"):
        assert key in first, f"{category} missing {key}"
    # image should be photo proxy path or fallback
    assert first["image"].startswith("/api/places/photo?name=") or first["image"].startswith("http"), first["image"]
    assert "google.com" in first["google_url"]
    assert "doordash.com" in first["doordash_url"]
    # distances sorted ascending
    dists = [x["distance"] for x in spots]
    assert dists == sorted(dists), "not sorted by distance"


# ---------- Lat/Lng geolocation search ----------
def test_latlng_search_returns_google(s):
    r = s.post(f"{API}/places/search", json={"lat": 40.7536, "lng": -73.9991, "category": "food"})
    assert r.status_code == 200, r.text
    data = r.json()
    assert data["source"] == "google"
    assert len(data["restaurants"]) >= 5
    dists = [x["distance"] for x in data["restaurants"]]
    assert dists == sorted(dists)


# ---------- Open now filter ----------
def test_zip_open_now_only(s):
    r = s.post(f"{API}/places/search", json={"zip_code": "10001", "category": "food", "open_now": True})
    assert r.status_code == 200
    data = r.json()
    assert data["source"] == "google"
    # Google returns only open when openNow=True; verify each item is open
    for spot in data["restaurants"]:
        assert spot["open_now"] is True, f"{spot['name']} was returned as closed"


# ---------- Curated fallback (no zip, no lat/lng) ----------
def test_curated_fallback_no_location(s):
    r = s.post(f"{API}/places/search", json={"category": "food"})
    assert r.status_code == 200
    data = r.json()
    assert data["source"] == "curated"
    assert len(data["restaurants"]) > 0
    for x in data["restaurants"]:
        # curated food category
        assert x.get("category", "food") == "food"


def test_curated_fallback_desserts(s):
    r = s.post(f"{API}/places/search", json={"category": "desserts"})
    assert r.status_code == 200
    data = r.json()
    assert data["source"] == "curated"
    assert all(x.get("category") == "desserts" for x in data["restaurants"])


# ---------- Photo proxy ----------
def test_photo_proxy_returns_image(s):
    r = s.post(f"{API}/places/search", json={"zip_code": "10001", "category": "food"})
    spots = r.json()["restaurants"]
    proxy_spot = next((x for x in spots if x["image"].startswith("/api/places/photo?name=")), None)
    assert proxy_spot is not None, "no proxy photo found"
    # Extract the photo path
    from urllib.parse import unquote
    name_qs = proxy_spot["image"].split("name=", 1)[1]
    photo_name = unquote(name_qs)
    pr = requests.get(f"{API}/places/photo", params={"name": photo_name}, timeout=20)
    assert pr.status_code == 200, f"photo returned {pr.status_code}: {pr.text[:200]}"
    assert pr.headers.get("content-type", "").startswith("image/"), pr.headers.get("content-type")
    assert len(pr.content) > 1000


def test_photo_proxy_rejects_bad_name(s):
    r = requests.get(f"{API}/places/photo", params={"name": "../malicious"})
    assert r.status_code == 404


# ---------- ZIP validation ----------
def test_invalid_zip_returns_422(s):
    r = s.post(f"{API}/places/search", json={"zip_code": "abcde", "category": "food"})
    assert r.status_code == 422


# ---------- Sanity: restaurants, cuisines, spin, reports ----------
def test_get_restaurants(s):
    r = s.get(f"{API}/restaurants")
    assert r.status_code == 200
    data = r.json()
    assert isinstance(data, list) and len(data) > 20
    assert all("id" in x and "_id" not in x for x in data)


def test_get_cuisines(s):
    r = s.get(f"{API}/cuisines")
    assert r.status_code == 200
    assert isinstance(r.json(), list) and len(r.json()) > 5


def test_spin(s):
    r = s.post(f"{API}/spin", json={"cuisines": [], "prices": []})
    assert r.status_code == 200
    assert "id" in r.json() and "name" in r.json()


def test_reports_create(s):
    r = s.post(f"{API}/reports", json={"restaurant_id": "TEST_it13", "restaurant_name": "TEST", "reason": "TEST_iter13"})
    assert r.status_code == 200
    assert r.json().get("ok") is True


def test_restaurant_create_and_get(s):
    payload = {"name": "TEST_iter13_spot", "cuisine": "Italian", "price": "$$", "category": "food"}
    r = s.post(f"{API}/restaurants", json=payload)
    assert r.status_code == 200
    created = r.json()
    assert created["name"] == payload["name"]
    assert "google.com" in created["google_url"]
    # verify persistence
    g = s.get(f"{API}/restaurants")
    assert any(x["id"] == created["id"] for x in g.json())
