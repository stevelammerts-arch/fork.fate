"""Backend regression: /api/places/search returns all four order URL fields
(doordash_url, ubereats_url, grubhub_url, order_url) for food category."""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://lucky-bite-1.preview.emergentagent.com").rstrip("/")


@pytest.fixture
def api():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


def test_places_search_returns_all_order_urls(api):
    r = api.post(f"{BASE_URL}/api/places/search", json={"zip_code": "10001", "category": "food"}, timeout=30)
    assert r.status_code == 200, r.text
    data = r.json()
    assert "restaurants" in data
    assert isinstance(data["restaurants"], list)
    assert len(data["restaurants"]) > 0, "expected at least one restaurant"

    required = ("doordash_url", "ubereats_url", "grubhub_url", "order_url")
    for idx, rest in enumerate(data["restaurants"][:10]):
        for field in required:
            assert field in rest, f"restaurant #{idx} '{rest.get('name')}' missing field {field}"
            val = rest[field]
            assert isinstance(val, str) and val.strip(), f"restaurant #{idx} '{rest.get('name')}' has empty {field}"
        # sanity: URLs should point to the correct hosts
        assert "doordash.com" in rest["doordash_url"].lower()
        assert "ubereats.com" in rest["ubereats_url"].lower()
        assert "grubhub.com" in rest["grubhub_url"].lower()
        # order_url is a google search fallback
        assert "google.com" in rest["order_url"].lower()


def test_places_search_drinks_also_has_urls(api):
    r = api.post(f"{BASE_URL}/api/places/search", json={"zip_code": "10001", "category": "drinks"}, timeout=30)
    assert r.status_code == 200
    data = r.json()
    if data["restaurants"]:
        rest = data["restaurants"][0]
        for f in ("doordash_url", "ubereats_url", "grubhub_url", "order_url"):
            assert rest.get(f), f"drinks: missing {f}"
