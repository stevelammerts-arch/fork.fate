"""Iteration 9 tests: order buttons, chicken wings, reports, delete removed."""
import os
import pytest
import requests

BASE_URL = os.environ['REACT_APP_BACKEND_URL'].rstrip('/') if os.environ.get('REACT_APP_BACKEND_URL') else None
if not BASE_URL:
    # Fallback to frontend .env parsing
    with open('/app/frontend/.env') as f:
        for line in f:
            if line.startswith('REACT_APP_BACKEND_URL='):
                BASE_URL = line.split('=', 1)[1].strip().rstrip('/')


@pytest.fixture(scope="module")
def api():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


# ---------- Order & DoorDash URLs on places/search ----------
class TestOrderUrls:
    def test_food_search_has_all_urls(self, api):
        r = api.post(f"{BASE_URL}/api/places/search", json={"cuisines": [], "price_levels": [], "category": "food"})
        assert r.status_code == 200
        data = r.json()
        assert data["source"] == "curated"
        items = data["restaurants"]
        assert len(items) > 0
        for item in items:
            assert item.get("doordash_url", "").startswith("https://www.doordash.com/search/store/"), f"bad doordash_url on {item['name']}"
            assert item.get("order_url", "").startswith("https://www.google.com/search?q="), f"bad order_url on {item['name']}"
            assert item.get("google_url", "").startswith("https://www.google.com/maps/"), f"bad google_url on {item['name']}"

    def test_drinks_search_has_all_urls(self, api):
        r = api.post(f"{BASE_URL}/api/places/search", json={"cuisines": [], "price_levels": [], "category": "drinks"})
        assert r.status_code == 200
        items = r.json()["restaurants"]
        assert len(items) >= 8
        for item in items:
            assert item["doordash_url"].startswith("https://www.doordash.com/search/store/")
            assert item["order_url"].startswith("https://www.google.com/search?q=")


# ---------- Chicken Wings ----------
class TestChickenWings:
    def test_chicken_wings_returns_two_spots(self, api):
        r = api.post(f"{BASE_URL}/api/places/search", json={"cuisines": ["Chicken Wings"], "price_levels": [], "category": "food"})
        assert r.status_code == 200
        items = r.json()["restaurants"]
        names = {i["name"] for i in items}
        assert "Buffalo Junction" in names
        assert "Cluck & Fire" in names
        assert len(items) == 2
        # Buffalo Junction sponsored
        bj = next(i for i in items if i["name"] == "Buffalo Junction")
        assert bj["sponsored"] is True
        assert bj["cuisine"] == "Chicken Wings"


# ---------- Reports ----------
class TestReports:
    def test_report_create_success(self, api):
        r = api.post(f"{BASE_URL}/api/reports", json={
            "restaurant_id": "test-id-123",
            "restaurant_name": "TEST_Closed Spot",
            "reason": "No longer in service",
        })
        assert r.status_code == 200
        data = r.json()
        assert data["ok"] is True
        assert "id" in data and isinstance(data["id"], str) and len(data["id"]) > 0

    def test_report_empty_id_422(self, api):
        r = api.post(f"{BASE_URL}/api/reports", json={"restaurant_id": "", "restaurant_name": "x", "reason": "y"})
        assert r.status_code == 422

    def test_report_missing_id_422(self, api):
        r = api.post(f"{BASE_URL}/api/reports", json={"restaurant_name": "x"})
        assert r.status_code == 422


# ---------- DELETE removed ----------
class TestDeleteRemoved:
    def test_delete_restaurant_removed(self, api):
        # Get any restaurant id
        rr = api.get(f"{BASE_URL}/api/restaurants")
        rid = rr.json()[0]["id"]
        r = api.delete(f"{BASE_URL}/api/restaurants/{rid}")
        assert r.status_code in (404, 405), f"expected 404/405, got {r.status_code}"
        # Verify restaurant still exists
        rr2 = api.get(f"{BASE_URL}/api/restaurants")
        assert any(i["id"] == rid for i in rr2.json())


# ---------- Regression ----------
class TestRegression:
    def test_get_restaurants_33(self, api):
        r = api.get(f"{BASE_URL}/api/restaurants")
        assert r.status_code == 200
        items = r.json()
        assert len(items) == 33, f"expected 33 got {len(items)}"
        food = [i for i in items if i.get("category", "food") == "food"]
        drinks = [i for i in items if i.get("category") == "drinks"]
        assert len(food) == 25
        assert len(drinks) == 8

    def test_get_cuisines_includes_chicken_wings(self, api):
        r = api.get(f"{BASE_URL}/api/cuisines")
        assert r.status_code == 200
        assert "Chicken Wings" in r.json()

    def test_spin_works(self, api):
        r = api.post(f"{BASE_URL}/api/spin", json={"cuisines": [], "prices": []})
        assert r.status_code == 200
        assert "name" in r.json()

    def test_create_restaurant_has_urls(self, api):
        r = api.post(f"{BASE_URL}/api/restaurants", json={
            "name": "TEST_Iter9 Spot",
            "cuisine": "Italian",
            "price": "$$",
            "rating": 4.5,
            "distance": 1.0,
            "description": "test",
            "address": "1 Test St",
        })
        assert r.status_code == 200
        data = r.json()
        assert data["google_url"].startswith("https://www.google.com/maps/")
        assert data["doordash_url"].startswith("https://www.doordash.com/search/store/")
        assert data["order_url"].startswith("https://www.google.com/search?q=")

    def test_invalid_zip_422(self, api):
        r = api.post(f"{BASE_URL}/api/places/search", json={"zip_code": "abcde", "cuisines": [], "category": "food"})
        assert r.status_code == 422

    def test_photo_proxy_404_without_key(self, api):
        r = api.get(f"{BASE_URL}/api/places/photo?name=bad")
        assert r.status_code == 404

    def test_no_api_key_in_response(self, api):
        r = api.post(f"{BASE_URL}/api/places/search", json={"cuisines": [], "category": "food"})
        assert "GOOGLE_API_KEY" not in r.text
        assert "AIza" not in r.text
