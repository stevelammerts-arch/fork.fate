"""Iter-11 backend smoke — POST /api/places/search returns results with
correct category stamped for food, bars, explore, stay at ZIP 10001."""
import os
import pytest
import requests

BASE_URL = os.environ["REACT_APP_BACKEND_URL"].rstrip("/")


@pytest.fixture(scope="module")
def api():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.mark.parametrize("category,cuisines", [
    ("food", ["Burgers"]),
    ("bars", ["Bars"]),
    ("explore", ["Swimming Holes"]),
    ("stay", ["Campgrounds"]),
])
def test_places_search_category_stamped(api, category, cuisines):
    payload = {
        "zip": "10001",
        "radius_miles": 25 if category not in ("explore", "stay") else 50,
        "category": category,
        "cuisines": cuisines,
        "open_now": False,
    }
    r = api.post(f"{BASE_URL}/api/places/search", json=payload, timeout=45)
    assert r.status_code == 200, f"{category}: {r.status_code} {r.text[:250]}"
    data = r.json()
    items = data.get("restaurants") or data.get("results") or data.get("items") or []
    assert isinstance(items, list) and len(items) > 0, f"{category}: empty result"
    # Every item must be stamped with the requested category
    bad = [it for it in items if it.get("category") != category]
    assert not bad, f"{category}: {len(bad)} items missing/wrong category (first={bad[0] if bad else None})"
