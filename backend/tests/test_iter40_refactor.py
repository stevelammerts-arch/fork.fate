"""Regression tests for iteration 40: places essentials refactor + crawl leaderboard."""
import os
import time
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
if not BASE_URL:
    # fall back to reading frontend/.env
    with open("/app/frontend/.env") as f:
        for line in f:
            if line.startswith("REACT_APP_BACKEND_URL="):
                BASE_URL = line.split("=", 1)[1].strip().rstrip("/")


@pytest.fixture(scope="module")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


# ---- Places Essentials ----
class TestPlacesEssentials:
    def test_zip_success(self, session):
        r = session.get(f"{BASE_URL}/api/places/essentials", params={"zip": "90210", "categories": "pharmacy,gas"}, timeout=30)
        assert r.status_code == 200, r.text
        data = r.json()
        assert "lat" in data and "lng" in data
        assert isinstance(data["lat"], (int, float))
        assert "categories" in data
        cats = data["categories"]
        assert "pharmacy" in cats and "gas" in cats
        assert isinstance(cats["pharmacy"], list)
        assert isinstance(cats["gas"], list)
        if cats["pharmacy"]:
            row = cats["pharmacy"][0]
            for k in ("name", "address", "distance", "maps_url"):
                assert k in row, f"missing {k}"

    def test_missing_location_returns_400(self, session):
        r = session.get(f"{BASE_URL}/api/places/essentials", params={"categories": "gas"}, timeout=15)
        assert r.status_code == 400, f"expected 400 got {r.status_code}: {r.text}"


# ---- Crawl Leaderboard ----
class TestCrawlLeaderboard:
    def test_get_leaderboard(self, session):
        r = session.get(f"{BASE_URL}/api/crawls/leaderboard", timeout=20)
        assert r.status_code == 200, r.text
        data = r.json()
        # accept list or dict shape
        assert isinstance(data, (list, dict))

    def test_post_complete_returns_rank(self, session):
        payload = {
            "team_name": "TEST_QA Crew",
            "stops": 3,
            "mode": "bars",
            "label": "PUB CRAWL",
            "verified": True,
            "duration_seconds": 1800,
        }
        r = session.post(f"{BASE_URL}/api/crawls/complete", json=payload, timeout=20)
        assert r.status_code in (200, 201), r.text
        data = r.json()
        # rank-ish field expected
        rank_keys = [k for k in data.keys() if "rank" in k.lower()]
        assert rank_keys, f"no rank field in response: {data}"


# ---- Core smoke: places/search ----
class TestPlacesSearchSmoke:
    def test_search_90210(self, session):
        r = session.post(f"{BASE_URL}/api/places/search", json={"zip": "90210", "type": "restaurant"}, timeout=30)
        assert r.status_code == 200, r.text
        data = r.json()
        # should return a list of venues (or dict with venues)
        if isinstance(data, dict):
            assert any(k in data for k in ("results", "venues", "places", "items", "restaurants", "bars")), data
        else:
            assert isinstance(data, list)
