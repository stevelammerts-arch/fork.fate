"""Iteration 12: open_now filter + desserts + category isolation."""
import os
import requests

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://lucky-bite-1.preview.emergentagent.com').rstrip('/')
API = f"{BASE_URL}/api"


def _search(**kwargs):
    payload = {"cuisines": [], "price_levels": [], "category": "food", "open_now": False, **kwargs}
    r = requests.post(f"{API}/places/search", json=payload, timeout=15)
    return r


# --- Basic endpoints ---
def test_root():
    r = requests.get(f"{API}/")
    assert r.status_code == 200


def test_restaurants_list():
    r = requests.get(f"{API}/restaurants", timeout=15)
    assert r.status_code == 200
    data = r.json()
    assert isinstance(data, list)
    assert len(data) >= 55
    # Verify some open_now false docs exist (idx%4==0 => closed)
    closed = [x for x in data if x.get('open_now') is False]
    assert len(closed) >= 5, f"Expected some closed spots, got {len(closed)}"


def test_cuisines():
    r = requests.get(f"{API}/cuisines", timeout=15)
    assert r.status_code == 200
    data = r.json()
    assert "Ice Cream" in data
    assert "Bakery" in data
    assert "Candy Shops" in data
    assert "Frozen Yogurt" in data


def test_spin_endpoint_post():
    r = requests.post(f"{API}/spin", json={"cuisines": [], "prices": []}, timeout=15)
    assert r.status_code == 200
    data = r.json()
    assert "id" in data and "name" in data


# --- Category filtering ---
def test_search_food_category():
    r = _search(category="food")
    assert r.status_code == 200
    data = r.json()
    assert data["source"] == "curated"
    assert len(data["restaurants"]) > 0
    for x in data["restaurants"]:
        # category default 'food' - accept missing or food
        assert x.get("cuisine") not in ("Ice Cream", "Bakery", "Candy Shops", "Frozen Yogurt")


def test_search_desserts_category():
    r = _search(category="desserts")
    assert r.status_code == 200
    data = r.json()
    assert data["source"] == "curated"
    names = {x["name"] for x in data["restaurants"]}
    # 8 dessert seeds expected
    assert len(data["restaurants"]) >= 8
    assert "Scoops & Swirls" in names
    assert "Flour & Butter Bakery" in names
    for x in data["restaurants"]:
        assert x["cuisine"] in ("Ice Cream", "Candy Shops", "Bakery", "Frozen Yogurt")
        # Verify order urls populated
        assert x["doordash_url"].startswith("https://www.doordash.com/")
        assert x["order_url"].startswith("https://www.google.com/search")
        assert x["google_url"].startswith("https://www.google.com/maps")


def test_search_desserts_cuisine_filter():
    r = _search(category="desserts", cuisines=["Ice Cream"])
    assert r.status_code == 200
    data = r.json()
    assert len(data["restaurants"]) >= 2
    for x in data["restaurants"]:
        assert x["cuisine"] == "Ice Cream"


def test_search_drinks_isolated_from_desserts():
    r = _search(category="drinks")
    data = r.json()
    for x in data["restaurants"]:
        assert x["cuisine"] not in ("Ice Cream", "Bakery", "Candy Shops", "Frozen Yogurt")


def test_search_bars_isolated_from_desserts():
    r = _search(category="bars")
    data = r.json()
    for x in data["restaurants"]:
        assert x["cuisine"] not in ("Ice Cream", "Bakery", "Candy Shops", "Frozen Yogurt")


# --- Open now filter ---
def test_open_now_false_returns_all():
    r_all = _search(category="food", open_now=False)
    r_open = _search(category="food", open_now=True)
    assert r_all.status_code == 200 and r_open.status_code == 200
    all_count = len(r_all.json()["restaurants"])
    open_count = len(r_open.json()["restaurants"])
    assert all_count > open_count, f"Expected fewer open-only results: all={all_count} open={open_count}"


def test_open_now_true_excludes_closed():
    r = _search(category="food", open_now=True)
    data = r.json()
    for x in data["restaurants"]:
        assert x["open_now"] is True, f"{x['name']} should be open"


def test_open_now_true_desserts():
    r = _search(category="desserts", open_now=True)
    data = r.json()
    for x in data["restaurants"]:
        assert x["open_now"] is True


def test_open_now_true_bars():
    r = _search(category="bars", open_now=True)
    data = r.json()
    assert len(data["restaurants"]) > 0
    for x in data["restaurants"]:
        assert x["open_now"] is True


# --- Sponsored ordering ---
def test_desserts_sponsored_first():
    r = _search(category="desserts")
    items = r.json()["restaurants"]
    # First item must be sponsored (sponsored-first sort)
    assert items[0]["sponsored"] is True


# --- Validation ---
def test_invalid_zip_422():
    r = requests.post(f"{API}/places/search", json={"zip_code": "abc", "category": "food"}, timeout=15)
    assert r.status_code == 422


def test_invalid_category_defaults_to_food():
    r = _search(category="invalid_xyz")
    assert r.status_code == 200


# --- Reports ---
def test_report_creation():
    r = requests.post(f"{API}/reports", json={
        "restaurant_id": "TEST_iter12",
        "restaurant_name": "TEST_iter12",
        "reason": "TEST",
    }, timeout=15)
    assert r.status_code == 200
    assert r.json().get("ok") is True
