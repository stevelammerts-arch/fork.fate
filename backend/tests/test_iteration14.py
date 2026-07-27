"""Iteration 14 tests: Gluten Free chip, sponsorship endpoint, regression sanity."""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
if not BASE_URL:
    with open("/app/frontend/.env") as f:
        for line in f:
            if line.startswith("REACT_APP_BACKEND_URL="):
                BASE_URL = line.split("=", 1)[1].strip().rstrip("/")

API = f"{BASE_URL}/api"


@pytest.fixture(scope="module")
def client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


# --- NEW: Gluten Free cuisine ---
def test_places_search_gluten_free_10001(client):
    r = client.post(f"{API}/places/search", json={
        "category": "food",
        "cuisines": ["Gluten Free"],
        "zip_code": "10001",
        "open_now": False,
    }, timeout=30)
    assert r.status_code == 200, r.text
    data = r.json()
    assert data.get("source") == "google", f"Expected google source, got {data.get('source')}"
    assert isinstance(data.get("restaurants"), list) and len(data["restaurants"]) > 0


# --- NEW: sponsorship-requests endpoint ---
def test_sponsorship_request_valid(client):
    r = client.post(f"{API}/sponsorship-requests", json={
        "business_name": "TEST_iter14 Bistro",
        "contact_email": "owner_test_iter14@example.com",
        "message": "Please sponsor us",
    }, timeout=15)
    assert r.status_code == 200, r.text
    data = r.json()
    assert data.get("ok") == True
    assert "id" in data


def test_sponsorship_request_invalid_email(client):
    r = client.post(f"{API}/sponsorship-requests", json={
        "business_name": "TEST_iter14 Bistro",
        "contact_email": "not-an-email",
    }, timeout=15)
    assert r.status_code == 422


# --- REGRESSION: sanity ---
def test_get_restaurants(client):
    r = client.get(f"{API}/restaurants", timeout=15)
    assert r.status_code == 200
    assert isinstance(r.json(), list)


def test_get_cuisines(client):
    r = client.get(f"{API}/cuisines", timeout=15)
    assert r.status_code == 200
    assert isinstance(r.json(), list)


def test_spin(client):
    r = client.post(f"{API}/spin", json={"category": "food"}, timeout=15)
    assert r.status_code in (200, 404)


def test_places_search_latlng(client):
    r = client.post(f"{API}/places/search", json={
        "category": "food",
        "lat": 40.7536,
        "lng": -73.9991,
    }, timeout=30)
    assert r.status_code == 200
    data = r.json()
    assert data.get("source") == "google"
    assert len(data.get("restaurants", [])) > 0


def test_reports_create(client):
    # need a restaurant id
    lst = client.get(f"{API}/restaurants", timeout=15).json()
    if not lst:
        pytest.skip("no restaurants")
    r = client.post(f"{API}/reports", json={
        "restaurant_id": lst[0]["id"],
        "reason": "TEST_iter14 - report test",
    }, timeout=15)
    assert r.status_code == 200
    assert r.json().get("ok") == True
