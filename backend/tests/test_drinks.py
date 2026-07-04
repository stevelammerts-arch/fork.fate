import os
import pytest
import requests

BASE_URL = os.environ['REACT_APP_BACKEND_URL'].rstrip('/')
API = f"{BASE_URL}/api"

DRINK_CUISINES = {"Coffee", "Boba Tea", "Smoothie"}


@pytest.fixture(scope="module")
def client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


class TestDrinksCategory:
    """Drinks section - category filter on /api/places/search"""

    def test_drinks_returns_only_drink_spots(self, client):
        r = client.post(f"{API}/places/search", json={"category": "drinks", "cuisines": [], "price_levels": []})
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["source"] == "curated"
        items = d["restaurants"]
        assert len(items) == 8
        assert all(x["cuisine"] in DRINK_CUISINES for x in items)
        # sponsored first: Cloud Nine Coffee, Pearl & Pour
        names_top = [x["name"] for x in items[:2]]
        assert set(names_top) == {"Cloud Nine Coffee", "Pearl & Pour"}

    def test_food_excludes_drinks(self, client):
        r = client.post(f"{API}/places/search", json={"category": "food", "cuisines": [], "price_levels": []})
        assert r.status_code == 200
        items = r.json()["restaurants"]
        assert len(items) == 23
        assert all(x["cuisine"] not in DRINK_CUISINES for x in items)

    def test_drinks_with_cuisine_filter_boba(self, client):
        r = client.post(f"{API}/places/search", json={
            "category": "drinks", "cuisines": ["Boba Tea"], "price_levels": []
        })
        assert r.status_code == 200
        items = r.json()["restaurants"]
        assert len(items) > 0
        assert all(x["cuisine"] == "Boba Tea" for x in items)

    def test_drinks_with_price_filter(self, client):
        r = client.post(f"{API}/places/search", json={
            "category": "drinks", "cuisines": [], "price_levels": ["PRICE_LEVEL_INEXPENSIVE"]
        })
        assert r.status_code == 200
        items = r.json()["restaurants"]
        assert len(items) > 0
        assert all(x["price"] == "$" and x["cuisine"] in DRINK_CUISINES for x in items)

    def test_drinks_combined_cuisine_and_price(self, client):
        r = client.post(f"{API}/places/search", json={
            "category": "drinks", "cuisines": ["Coffee"], "price_levels": ["PRICE_LEVEL_INEXPENSIVE"]
        })
        assert r.status_code == 200
        items = r.json()["restaurants"]
        for x in items:
            assert x["cuisine"] == "Coffee"
            assert x["price"] == "$"

    def test_google_url_present_on_all(self, client):
        r = client.post(f"{API}/places/search", json={"category": "drinks"})
        items = r.json()["restaurants"]
        assert all(x.get("google_url", "").startswith("https://www.google.com/maps") for x in items)


class TestCreateDrinkSpot:
    def test_create_drink_persists_and_has_google_url(self, client):
        payload = {
            "name": "TEST_Chai Corner",
            "cuisine": "Coffee",
            "price": "$",
            "rating": 4.6,
            "distance": 0.9,
            "description": "test chai",
            "address": "1 Test Ln",
            "category": "drinks",
        }
        c = client.post(f"{API}/restaurants", json=payload)
        assert c.status_code == 200, c.text
        created = c.json()
        assert created["category"] == "drinks"
        assert created["google_url"].startswith("https://www.google.com/maps")
        rid = created["id"]

        # Appears in drinks places search
        s = client.post(f"{API}/places/search", json={"category": "drinks"})
        assert any(x["id"] == rid for x in s.json()["restaurants"])

        # Does NOT appear in food
        s2 = client.post(f"{API}/places/search", json={"category": "food"})
        assert not any(x["id"] == rid for x in s2.json()["restaurants"])

        # Cleanup
        d = client.delete(f"{API}/restaurants/{rid}")
        assert d.status_code == 200
