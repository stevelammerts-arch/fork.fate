import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
if not BASE_URL:
    # fallback to frontend env file
    try:
        with open("/app/frontend/.env") as f:
            for line in f:
                if line.startswith("REACT_APP_BACKEND_URL"):
                    BASE_URL = line.split("=", 1)[1].strip().rstrip("/")
    except Exception:
        pass
API = f"{BASE_URL}/api"


@pytest.fixture(scope="module")
def s():
    sess = requests.Session()
    sess.headers.update({"Content-Type": "application/json"})
    return sess


# --- Restaurants total & category isolation ---
def test_restaurants_total_counts(s):
    r = s.get(f"{API}/restaurants", timeout=20)
    assert r.status_code == 200
    data = r.json()
    assert isinstance(data, list)
    cats = {}
    for d in data:
        cats[d.get("category", "food")] = cats.get(d.get("category", "food"), 0) + 1
    print("category counts:", cats, "total:", len(data))
    # Allow for extra dev-created docs (>=)
    assert cats.get("food", 0) >= 29
    assert cats.get("drinks", 0) >= 8
    assert cats.get("bars", 0) >= 18
    assert len(data) >= 55


# --- Breakfast (food) ---
def test_places_search_breakfast(s):
    r = s.post(f"{API}/places/search",
               json={"zip_code": None, "cuisines": ["Breakfast"], "price_levels": [], "category": "food"},
               timeout=20)
    assert r.status_code == 200
    body = r.json()
    names = [x["name"] for x in body["restaurants"]]
    assert "Sunrise Diner" in names
    assert "The Morning Table" in names
    # sponsored first
    assert body["restaurants"][0]["sponsored"] is True
    assert body["restaurants"][0]["name"] == "Sunrise Diner"
    for x in body["restaurants"]:
        assert x["cuisine"] == "Breakfast"
        assert x.get("category", "food") == "food"


# --- Wine (bars) ---
def test_places_search_wine(s):
    r = s.post(f"{API}/places/search",
               json={"zip_code": None, "cuisines": ["Wine"], "price_levels": [], "category": "bars"},
               timeout=20)
    assert r.status_code == 200
    body = r.json()
    names = [x["name"] for x in body["restaurants"]]
    assert "The Wine Cellar" in names
    winespot = next(x for x in body["restaurants"] if x["name"] == "The Wine Cellar")
    assert winespot["sponsored"] is True
    assert winespot["category"] == "bars"
    assert winespot["google_url"]
    assert winespot["doordash_url"]
    assert winespot["order_url"]


# --- Cocktails (bars) ---
def test_places_search_cocktails(s):
    r = s.post(f"{API}/places/search",
               json={"zip_code": None, "cuisines": ["Cocktails"], "price_levels": [], "category": "bars"},
               timeout=20)
    assert r.status_code == 200
    body = r.json()
    names = [x["name"] for x in body["restaurants"]]
    assert "Shaker & Spoon" in names


# --- Bars no cuisine returns all 18 chips (sponsored first) ---
def test_bars_no_cuisine_covers_18(s):
    r = s.post(f"{API}/places/search",
               json={"zip_code": None, "cuisines": [], "price_levels": [], "category": "bars"},
               timeout=20)
    assert r.status_code == 200
    body = r.json()
    items = body["restaurants"]
    assert len(items) >= 18
    expected_chips = {"Beer","Wine","Cocktails","Liquor","Spirits","Whiskey","Margaritas","Tiki",
                      "Sports Bar","Irish Bar","Bars","Pool","Darts","Volleyball","Music",
                      "Pickle Ball","Games","Bowling"}
    present = {x["cuisine"] for x in items}
    missing = expected_chips - present
    assert not missing, f"Missing bar chips: {missing}"
    # sponsored first
    sponsored_flags = [x["sponsored"] for x in items]
    # all sponsored items appear before any non-sponsored
    seen_non = False
    for f in sponsored_flags:
        if not f:
            seen_non = True
        elif seen_non and f:
            pytest.fail("Sponsored bar item appeared after non-sponsored")
    for x in items:
        assert x["category"] == "bars"
        assert x.get("google_url")
        assert x.get("doordash_url")
        assert x.get("order_url")


# --- Category isolation ---
def test_food_isolation_from_bars(s):
    r = s.post(f"{API}/places/search",
               json={"zip_code": None, "cuisines": [], "price_levels": [], "category": "food"},
               timeout=20)
    assert r.status_code == 200
    for x in r.json()["restaurants"]:
        assert x.get("category", "food") == "food"


def test_drinks_isolation_from_bars(s):
    r = s.post(f"{API}/places/search",
               json={"zip_code": None, "cuisines": [], "price_levels": [], "category": "drinks"},
               timeout=20)
    assert r.status_code == 200
    for x in r.json()["restaurants"]:
        assert x.get("category") == "drinks"


# --- Regressions ---
def test_cuisines_endpoint(s):
    r = s.get(f"{API}/cuisines", timeout=20)
    assert r.status_code == 200


def test_spin(s):
    r = s.post(f"{API}/spin", json={"cuisines": [], "price_levels": []}, timeout=20)
    assert r.status_code == 200
    assert "name" in r.json()


def test_reports_post(s):
    r = s.post(f"{API}/reports",
               json={"restaurant_id": "TEST_iter11", "restaurant_name": "TEST_x", "reason": "iter11"},
               timeout=20)
    assert r.status_code in (200, 201)


def test_photo_404(s):
    r = s.get(f"{API}/places/photo", params={"name": "places/nonexistent/photos/xyz"}, timeout=20)
    assert r.status_code == 404


def test_invalid_zip_422(s):
    r = s.post(f"{API}/places/search",
               json={"zip_code": "abc", "cuisines": [], "price_levels": [], "category": "food"},
               timeout=20)
    assert r.status_code == 422
