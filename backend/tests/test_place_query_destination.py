"""Tests for the new place_query (free-text destination) field on /api/places/search."""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://web-fate-launch.preview.emergentagent.com").rstrip("/")
ENDPOINT = f"{BASE_URL}/api/places/search"


def _post(payload):
    return requests.post(ENDPOINT, json=payload, timeout=30)


class TestPlaceQuerySearch:
    def test_place_query_omaha_food(self):
        r = _post({"category": "food", "place_query": "Omaha Nebraska", "radius_miles": 10})
        assert r.status_code == 200, r.text
        data = r.json()
        assert data.get("source") == "google"
        assert isinstance(data.get("restaurants"), list) and len(data["restaurants"]) > 0

    def test_place_query_san_diego_drinks(self):
        r = _post({"category": "drinks", "place_query": "San Diego California", "radius_miles": 10})
        assert r.status_code == 200, r.text
        data = r.json()
        assert data.get("source") == "google"
        assert len(data.get("restaurants", [])) > 0

    def test_zip_only_regression(self):
        r = _post({"category": "food", "zip_code": "90210", "radius_miles": 10})
        assert r.status_code == 200, r.text
        data = r.json()
        assert data.get("source") in ("google", "curated")
        assert isinstance(data.get("restaurants"), list)

    def test_latlng_only_regression(self):
        r = _post({"category": "food", "lat": 34.05, "lng": -118.24, "radius_miles": 10})
        assert r.status_code == 200, r.text
        data = r.json()
        assert data.get("source") == "google"
        assert len(data.get("restaurants", [])) > 0

    def test_invalid_place_query_returns_400(self):
        r = _post({"category": "food", "place_query": "gibberishxxxx999notaplace", "radius_miles": 10})
        assert r.status_code == 400, f"Expected 400, got {r.status_code}: {r.text}"
        body = r.json()
        assert "detail" in body

    def test_zip_preferred_over_place_query(self):
        r = _post({"category": "food", "zip_code": "90210", "place_query": "Omaha Nebraska", "radius_miles": 10})
        assert r.status_code == 200
        data = r.json()
        # Beverly Hills 90210 — no Omaha/Nebraska addresses should show
        addresses = " ".join((x.get("address") or "").lower() for x in data.get("restaurants", []))
        assert "omaha" not in addresses
        assert "nebraska" not in addresses

    def test_latlng_preferred_over_zip_and_place_query(self):
        # NYC coords + LA zip + Omaha query — results should be near NYC.
        r = _post({
            "category": "food", "lat": 40.7128, "lng": -74.0060,
            "zip_code": "90210", "place_query": "Omaha Nebraska", "radius_miles": 10,
        })
        assert r.status_code == 200
        data = r.json()
        assert data.get("source") == "google"
        addresses = " ".join((x.get("address") or "").lower() for x in data.get("restaurants", []))
        assert "omaha" not in addresses and "beverly hills" not in addresses

    def test_place_query_max_length_422(self):
        r = _post({"category": "food", "place_query": "x" * 200})
        assert r.status_code == 422, r.text

    def test_place_query_whitespace_trimmed(self):
        r1 = _post({"category": "food", "place_query": "  Omaha Nebraska  ", "radius_miles": 10})
        r2 = _post({"category": "food", "place_query": "Omaha Nebraska", "radius_miles": 10})
        assert r1.status_code == 200 and r2.status_code == 200
        # Both should return google source and non-empty restaurants
        assert r1.json().get("source") == "google"
        assert r2.json().get("source") == "google"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
