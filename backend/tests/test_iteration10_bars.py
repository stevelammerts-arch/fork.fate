"""Iteration 10 - Bars category tests for Fork·Fate roulette."""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://lucky-bite-1.preview.emergentagent.com").rstrip("/")

BAR_CUISINES = [
    "Beer", "Liquor", "Spirits", "Whiskey", "Margaritas", "Tiki", "Sports Bar",
    "Irish Bar", "Bars", "Pool", "Darts", "Volleyball", "Music", "Pickle Ball",
    "Games", "Bowling",
]


# ---------- Basic health / totals ----------
def test_restaurants_total_and_split():
    r = requests.get(f"{BASE_URL}/api/restaurants", timeout=15)
    assert r.status_code == 200
    data = r.json()
    assert len(data) == 51
    cats = {}
    for row in data:
        cats[row["category"]] = cats.get(row["category"], 0) + 1
    assert cats.get("bars") == 16
    assert cats.get("drinks") == 8
    assert cats.get("food") == 27


def test_cuisines_include_bar_types():
    r = requests.get(f"{BASE_URL}/api/cuisines", timeout=15)
    assert r.status_code == 200
    cuisines = r.json()
    for c in BAR_CUISINES:
        assert c in cuisines, f"Missing bar cuisine: {c}"


# ---------- places/search bars ----------
def test_places_search_bars_returns_all_16_with_sponsored_first():
    r = requests.post(f"{BASE_URL}/api/places/search",
                      json={"zip_code": None, "cuisines": [], "price_levels": [], "category": "bars"},
                      timeout=15)
    assert r.status_code == 200
    body = r.json()
    assert body["source"] == "curated"
    items = body["restaurants"]
    assert len(items) == 16
    # Every returned item is category bars
    # (curated returns items filtered by category)
    got_cuisines = {i["cuisine"] for i in items}
    for c in BAR_CUISINES:
        assert c in got_cuisines, f"Cuisine {c} missing from bars results"
    # Sponsored first
    sponsored_count = sum(1 for i in items if i.get("sponsored"))
    assert sponsored_count == 4
    for i in items[:4]:
        assert i["sponsored"] == True, f"Sponsored not first: {i['name']}"
    # URLs present
    for i in items:
        assert i["google_url"].startswith("https://www.google.com/maps")
        assert i["doordash_url"].startswith("https://www.doordash.com")
        assert i["order_url"].startswith("https://www.google.com/search")


@pytest.mark.parametrize("cuisine,expected_name", [
    ("Bowling", "Strike & Spare"),
    ("Pool", "Rack 'Em Billiards"),
    ("Pickle Ball", "Dill Dinkers"),
    ("Music", "The Encore"),
    ("Beer", "The Tap House"),
    ("Irish Bar", "O'Malley's"),
    ("Darts", "Bullseye Tavern"),
    ("Volleyball", "Sand Bar"),
    ("Games", "Player One"),
])
def test_places_search_bars_specific_cuisine(cuisine, expected_name):
    r = requests.post(f"{BASE_URL}/api/places/search",
                      json={"cuisines": [cuisine], "category": "bars"},
                      timeout=15)
    assert r.status_code == 200
    items = r.json()["restaurants"]
    assert len(items) >= 1
    names = [i["name"] for i in items]
    assert expected_name in names, f"Expected {expected_name} for {cuisine}, got {names}"
    for i in items:
        assert i["cuisine"] == cuisine


# ---------- category isolation ----------
def test_food_returns_only_food():
    r = requests.post(f"{BASE_URL}/api/places/search",
                      json={"category": "food"}, timeout=15)
    assert r.status_code == 200
    items = r.json()["restaurants"]
    assert len(items) == 27
    cuisines = {i["cuisine"] for i in items}
    for bc in BAR_CUISINES:
        assert bc not in cuisines
    assert "Coffee" not in cuisines
    assert "Boba Tea" not in cuisines


def test_drinks_returns_only_drinks():
    r = requests.post(f"{BASE_URL}/api/places/search",
                      json={"category": "drinks"}, timeout=15)
    assert r.status_code == 200
    items = r.json()["restaurants"]
    assert len(items) == 8
    cuisines = {i["cuisine"] for i in items}
    assert cuisines.issubset({"Coffee", "Boba Tea", "Smoothie"})


# ---------- validator ----------
def test_invalid_category_coerces_to_food():
    r = requests.post(f"{BASE_URL}/api/places/search",
                      json={"category": "garbage"}, timeout=15)
    assert r.status_code == 200
    items = r.json()["restaurants"]
    # Coerced to food -> 27 spots
    assert len(items) == 27


def test_invalid_zip_422():
    r = requests.post(f"{BASE_URL}/api/places/search",
                      json={"zip_code": "abcde", "category": "bars"}, timeout=15)
    assert r.status_code == 422


# ---------- POST /api/restaurants with category=bars ----------
def test_create_bars_restaurant_persists():
    payload = {
        "name": "TEST_Bar_Iter10",
        "cuisine": "Whiskey",
        "price": "$$",
        "rating": 4.6,
        "distance": 2.1,
        "description": "Test bar",
        "address": "1 Test Way",
        "category": "bars",
    }
    r = requests.post(f"{BASE_URL}/api/restaurants", json=payload, timeout=15)
    assert r.status_code == 200
    body = r.json()
    assert body["category"] == "bars"
    assert body["cuisine"] == "Whiskey"
    assert body["google_url"].startswith("https://www.google.com/maps")
    assert body["doordash_url"].startswith("https://www.doordash.com")
    # Verify persisted via GET
    all_ = requests.get(f"{BASE_URL}/api/restaurants", timeout=15).json()
    assert any(i["id"] == body["id"] and i["category"] == "bars" for i in all_)


# ---------- Regression ----------
def test_spin_bars_only():
    r = requests.post(f"{BASE_URL}/api/spin",
                      json={"cuisines": ["Pool"], "prices": []}, timeout=15)
    assert r.status_code == 200
    assert r.json()["cuisine"] == "Pool"


def test_reports_still_works():
    r = requests.post(f"{BASE_URL}/api/reports",
                      json={"restaurant_id": "test-id", "restaurant_name": "TEST",
                            "reason": "Closed"}, timeout=15)
    assert r.status_code == 200
    assert r.json().get("ok") == True


def test_places_photo_404_without_key():
    r = requests.get(f"{BASE_URL}/api/places/photo?name=places/abc", timeout=15)
    assert r.status_code == 404
