import os
import pytest
import requests

BASE_URL = os.environ['REACT_APP_BACKEND_URL'].rstrip('/')
API = f"{BASE_URL}/api"


@pytest.fixture(scope="module")
def client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


class TestPlacesSearchFallback:
    """POST /api/places/search - fallback (no GOOGLE_API_KEY)"""

    def test_empty_filters_returns_all_curated_sorted(self, client):
        r = client.post(f"{API}/places/search", json={"zip_code": "10001", "cuisines": [], "price_levels": []})
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["source"] == "curated"
        assert isinstance(d["restaurants"], list)
        assert len(d["restaurants"]) == 23
        # sorted by distance ascending
        dists = [r["distance"] for r in d["restaurants"]]
        assert dists == sorted(dists)

    def test_no_zip_code_key_ok(self, client):
        # zip_code omitted entirely
        r = client.post(f"{API}/places/search", json={"cuisines": [], "price_levels": []})
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["source"] == "curated"
        assert len(d["restaurants"]) == 23

    def test_null_zip_code_ok(self, client):
        r = client.post(f"{API}/places/search", json={"zip_code": None, "cuisines": [], "price_levels": []})
        assert r.status_code == 200
        assert r.json()["source"] == "curated"

    def test_cuisine_filter_italian(self, client):
        r = client.post(f"{API}/places/search", json={"zip_code": "10001", "cuisines": ["Italian"], "price_levels": []})
        assert r.status_code == 200
        d = r.json()
        assert d["source"] == "curated"
        assert len(d["restaurants"]) > 0
        assert all(x["cuisine"] == "Italian" for x in d["restaurants"])

    def test_price_moderate_maps_to_double_dollar(self, client):
        r = client.post(f"{API}/places/search", json={
            "zip_code": "10001", "cuisines": [], "price_levels": ["PRICE_LEVEL_MODERATE"]
        })
        assert r.status_code == 200
        d = r.json()
        assert d["source"] == "curated"
        assert len(d["restaurants"]) > 0
        assert all(x["price"] == "$$" for x in d["restaurants"])

    def test_price_inexpensive_maps_to_single_dollar(self, client):
        r = client.post(f"{API}/places/search", json={
            "zip_code": "10001", "cuisines": [], "price_levels": ["PRICE_LEVEL_INEXPENSIVE"]
        })
        assert r.status_code == 200
        d = r.json()
        assert all(x["price"] == "$" for x in d["restaurants"])

    def test_combined_cuisine_and_price(self, client):
        r = client.post(f"{API}/places/search", json={
            "zip_code": "10001", "cuisines": ["Italian"], "price_levels": ["PRICE_LEVEL_MODERATE"]
        })
        assert r.status_code == 200
        d = r.json()
        for x in d["restaurants"]:
            assert x["cuisine"] == "Italian"
            assert x["price"] == "$$"

    def test_no_match_returns_empty(self, client):
        r = client.post(f"{API}/places/search", json={
            "zip_code": "10001", "cuisines": ["NonExistentCuisine"], "price_levels": []
        })
        assert r.status_code == 200
        assert r.json()["restaurants"] == []
