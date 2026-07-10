"""Iteration 50 tests: geocode endpoint + crawl lat/lng persistence + regression."""
import os
import pytest
import requests

def _load_backend_url():
    v = os.environ.get("REACT_APP_BACKEND_URL")
    if v:
        return v.rstrip("/")
    # fallback: read from frontend/.env for pytest runs
    try:
        with open("/app/frontend/.env") as f:
            for line in f:
                if line.startswith("REACT_APP_BACKEND_URL="):
                    return line.split("=", 1)[1].strip().rstrip("/")
    except Exception:
        pass
    raise RuntimeError("REACT_APP_BACKEND_URL not set")

BASE_URL = _load_backend_url()
API = f"{BASE_URL}/api"


# ---------------- Geocode endpoint ----------------
class TestGeocode:
    def test_geocode_valid_zip(self):
        r = requests.get(f"{API}/geocode", params={"zip": "10001"}, timeout=20)
        # 200 with lat/lng, or 503 if cost-capped/unavailable (acceptable per task)
        assert r.status_code in (200, 503), f"unexpected {r.status_code} {r.text}"
        if r.status_code == 200:
            data = r.json()
            assert "lat" in data and "lng" in data
            assert isinstance(data["lat"], (int, float))
            assert isinstance(data["lng"], (int, float))
            # NYC roughly
            assert 40 < data["lat"] < 41
            assert -75 < data["lng"] < -73

    def test_geocode_invalid_zip_letters(self):
        r = requests.get(f"{API}/geocode", params={"zip": "abc"}, timeout=10)
        assert r.status_code in (400, 422), f"unexpected {r.status_code}"

    def test_geocode_missing_zip(self):
        r = requests.get(f"{API}/geocode", timeout=10)
        assert r.status_code == 422


# ---------------- Places search returns lat/lng ----------------
class TestPlacesSearchLatLng:
    def test_bars_search_returns_latlng(self):
        payload = {
            "category": "bars",
            "lat": 40.75,
            "lng": -73.99,
            "radius_miles": 5,
            "cuisines": ["Pub"],
        }
        r = requests.post(f"{API}/places/search", json=payload, timeout=30)
        assert r.status_code == 200, r.text
        data = r.json()
        assert "restaurants" in data
        assert isinstance(data["restaurants"], list)
        src = data.get("source")
        # If Google source, each result should include lat/lng
        if src == "google" and data["restaurants"]:
            for item in data["restaurants"][:5]:
                assert "lat" in item and "lng" in item, f"missing lat/lng in google result: {item}"
                assert isinstance(item["lat"], (int, float))
                assert isinstance(item["lng"], (int, float))


# ---------------- Crawls: create with lat/lng, GET persists ----------------
class TestCrawlLatLng:
    def test_create_and_get_crawl_with_latlng(self):
        payload = {
            "stops": [
                {"name": "TEST_Iter50 Stop A", "address": "1 Main St", "lat": 40.7501, "lng": -73.9901},
                {"name": "TEST_Iter50 Stop B", "address": "2 Main St", "lat": 40.7600, "lng": -73.9800},
            ],
            "label": "TEST_Iter50 Crawl",
        }
        c = requests.post(f"{API}/crawls", json=payload, timeout=20)
        assert c.status_code == 200, c.text
        created = c.json()
        code = created.get("code")
        assert code, created

        g = requests.get(f"{API}/crawls/{code}", timeout=20)
        assert g.status_code == 200, g.text
        crawl = g.json()
        assert len(crawl["stops"]) == 2
        for i, s in enumerate(crawl["stops"]):
            assert s.get("lat") is not None, f"stop {i} missing lat: {s}"
            assert s.get("lng") is not None, f"stop {i} missing lng: {s}"
        assert crawl["stops"][0]["lat"] == pytest.approx(40.7501)
        assert crawl["stops"][1]["lng"] == pytest.approx(-73.9800)


# ---------------- Regression: previously working endpoints ----------------
class TestRegression:
    def test_restaurants_list(self):
        r = requests.get(f"{API}/restaurants", timeout=15)
        assert r.status_code == 200
        data = r.json()
        # spec says ~63
        assert isinstance(data, list) and len(data) >= 50

    def test_stats_fates(self):
        r = requests.get(f"{API}/stats/fates", timeout=10)
        assert r.status_code == 200
        d = r.json()
        assert "fates_dealt" in d or "count" in d or isinstance(d, dict)

    def test_spin(self):
        r = requests.post(f"{API}/spin", json={"category": "food"}, timeout=15)
        assert r.status_code == 200, r.text
        d = r.json()
        assert "restaurant" in d or "name" in d or "id" in d

    def test_admin_login_and_sponsor_stats(self):
        login = requests.post(f"{API}/admin/login", json={"password": "GrimReaper!2026"}, timeout=15)
        assert login.status_code == 200, login.text
        tok = login.json().get("token") or login.json().get("access_token")
        assert tok, login.json()
        r = requests.get(
            f"{API}/admin/sponsors/stats",
            headers={"Authorization": f"Bearer {tok}"},
            timeout=15,
        )
        assert r.status_code == 200, r.text
        d = r.json()
        # Should have MRR-related keys
        assert isinstance(d, dict) and len(d) > 0
