"""Iteration 10 verification tests — Fork·Fate UI/category tweaks.

Verifies:
  1. /api/places/search returns `category` field on EVERY item for
     food/shops/explore/stay/fuel (fixes the pre-existing bug where live
     Google results lacked `category`, letting the frontend Order button
     leak onto non-food tiles).
  2. explore with cuisines ["Safaris", "Children's Museums"] returns 200
     with non-empty results (curated fallback is acceptable).
  3. shops with cuisines ["Plant Shop", "Craft Store"] returns 200
     with non-empty results (curated fallback is acceptable).
"""
import os
import pytest
import requests

BASE_URL = os.environ.get("EXPO_PUBLIC_BACKEND_URL", "").rstrip("/") or \
           os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/") or \
           "https://fate-mobile-build.preview.emergentagent.com"

ZIP = "10001"  # NYC — cached in _ZIP_GEO_CACHE from prior iterations
CATEGORIES = ["food", "shops", "explore", "stay", "fuel"]


@pytest.fixture(scope="module")
def api():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


# ── Category field present on EVERY item ─────────────────────────────
@pytest.mark.parametrize("category", CATEGORIES)
def test_search_stamps_category_on_every_item(api, category):
    r = api.post(
        f"{BASE_URL}/api/places/search",
        json={"zip_code": ZIP, "category": category, "cuisines": [], "radius_miles": 25},
        timeout=30,
    )
    assert r.status_code == 200, f"[{category}] HTTP {r.status_code}: {r.text[:200]}"
    body = r.json()
    assert "restaurants" in body, f"[{category}] missing 'restaurants' key"
    items = body["restaurants"]
    assert isinstance(items, list) and len(items) > 0, \
        f"[{category}] expected non-empty list, got {len(items)}"

    missing = [i for i, it in enumerate(items) if "category" not in it]
    wrong = [(i, it.get("category")) for i, it in enumerate(items)
             if it.get("category") != category]
    assert not missing, f"[{category}] {len(missing)} items missing 'category'"
    assert not wrong, f"[{category}] {len(wrong)} items with wrong category: {wrong[:3]}"

    # Reveal-card guard sanity: source hint useful in report
    print(f"[{category}] source={body.get('source')} count={len(items)}")


# ── New Explore chips — Safaris + Children's Museums ─────────────────
def test_explore_safaris_and_childrens_museums(api):
    r = api.post(
        f"{BASE_URL}/api/places/search",
        json={
            "zip_code": ZIP,
            "category": "explore",
            "cuisines": ["Safaris", "Children's Museums"],
            "radius_miles": 50,
        },
        timeout=30,
    )
    assert r.status_code == 200, f"HTTP {r.status_code}: {r.text[:200]}"
    items = r.json().get("restaurants", [])
    assert len(items) > 0, "expected non-empty results (curated fallback OK)"
    # Every item still stamped as explore
    for it in items:
        assert it.get("category") == "explore", f"non-explore item leaked: {it}"


# ── New Shop chips — Plant Shop + Craft Store ────────────────────────
def test_shops_plant_shop_and_craft_store(api):
    r = api.post(
        f"{BASE_URL}/api/places/search",
        json={
            "zip_code": ZIP,
            "category": "shops",
            "cuisines": ["Plant Shop", "Craft Store"],
            "radius_miles": 50,
        },
        timeout=30,
    )
    assert r.status_code == 200, f"HTTP {r.status_code}: {r.text[:200]}"
    items = r.json().get("restaurants", [])
    assert len(items) > 0, "expected non-empty results (curated fallback OK)"
    for it in items:
        assert it.get("category") == "shops", f"non-shop item leaked: {it}"
