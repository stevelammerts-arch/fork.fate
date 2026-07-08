"""Final pre-deploy regression backend tests for Fork·Fate."""
import os
import requests
import pytest

BASE = os.environ.get('REACT_APP_BACKEND_URL', 'https://lucky-bite-1.preview.emergentagent.com').rstrip('/')
ADMIN_PW = "GrimReaper!2026"


@pytest.fixture(scope="module")
def admin_token():
    r = requests.post(f"{BASE}/api/admin/login", json={"password": ADMIN_PW}, timeout=15)
    assert r.status_code == 200, f"admin login failed: {r.status_code} {r.text}"
    tok = r.json().get("token") or r.json().get("access_token")
    assert tok
    return tok


def test_cuisines():
    r = requests.get(f"{BASE}/api/cuisines", timeout=15)
    assert r.status_code == 200
    data = r.json()
    assert isinstance(data, list) and len(data) > 5


def test_restaurants_list_no_test_prefix():
    r = requests.get(f"{BASE}/api/restaurants", timeout=15)
    assert r.status_code == 200
    data = r.json()
    assert isinstance(data, list)
    leftovers = [x for x in data if isinstance(x, dict) and str(x.get("name", "")).startswith("TEST_")]
    assert leftovers == [], f"Leftover TEST_ data: {leftovers}"


def test_places_search_google_zip():
    r = requests.post(f"{BASE}/api/places/search", json={"zip_code": "10001", "category": "food"}, timeout=30)
    assert r.status_code == 200
    d = r.json()
    assert "restaurants" in d
    assert d["source"] == "google", f"Expected google, got {d['source']}"
    assert len(d["restaurants"]) > 0
    print(f"places_search google zip count: {len(d['restaurants'])}")


def test_places_search_latlng():
    r = requests.post(f"{BASE}/api/places/search",
                      json={"lat": 40.7484, "lng": -73.9967, "category": "food"}, timeout=30)
    assert r.status_code == 200
    d = r.json()
    assert d.get("source") == "google"
    assert len(d.get("restaurants", [])) > 0


def test_places_search_curated_fallback():
    # No zip, no lat/lng -> curated
    r = requests.post(f"{BASE}/api/places/search", json={"category": "food"}, timeout=15)
    assert r.status_code == 200
    d = r.json()
    assert d.get("source") == "curated"


def test_places_search_all_modes():
    for cat in ("food", "drinks", "bars", "desserts"):
        r = requests.post(f"{BASE}/api/places/search",
                          json={"zip_code": "10001", "category": cat}, timeout=30)
        assert r.status_code == 200, f"{cat} failed: {r.status_code}"
        d = r.json()
        assert len(d.get("restaurants", [])) > 0, f"{cat} returned empty"


def test_spin():
    r = requests.post(f"{BASE}/api/spin", json={"cuisines": [], "prices": []}, timeout=15)
    assert r.status_code in (200, 201)


def test_admin_login_wrong():
    r = requests.post(f"{BASE}/api/admin/login", json={"password": "wrong"}, timeout=10)
    assert r.status_code in (401, 403)


def test_admin_login_correct(admin_token):
    assert admin_token


def test_sponsor_crud_and_pinning(admin_token):
    headers = {"Authorization": f"Bearer {admin_token}"}
    payload = {
        "name": "TEST_SponsorPin",
        "cuisine": "American",
        "category": "food",
        "price": "$$",
        "address": "1 Test Ave, New York, NY 10001",
        "description": "Test sponsor",
        "image": "https://picsum.photos/300",
        "active": True,
    }
    r = requests.post(f"{BASE}/api/admin/sponsors", json=payload, headers=headers, timeout=15)
    assert r.status_code in (200, 201), f"create sponsor failed: {r.status_code} {r.text}"
    sponsor = r.json()
    sid = sponsor.get("id")
    assert sid, f"no id in {sponsor}"

    try:
        # Verify pinned first in search
        s = requests.post(f"{BASE}/api/places/search",
                          json={"zip_code": "10001", "category": "food"}, timeout=30)
        assert s.status_code == 200
        results = s.json().get("restaurants", [])
        assert results and results[0].get("name") == "TEST_SponsorPin", \
            f"Sponsor not pinned first. First: {results[0].get('name') if results else 'none'}"
        assert results[0].get("sponsored") == True

        # Toggle inactive
        u = requests.patch(f"{BASE}/api/admin/sponsors/{sid}", json={"active": False},
                           headers=headers, timeout=15)
        assert u.status_code in (200, 204), f"update failed: {u.status_code} {u.text}"
        s2 = requests.post(f"{BASE}/api/places/search",
                           json={"zip_code": "10001", "category": "food"}, timeout=30)
        r2 = s2.json().get("restaurants", [])
        names = [x.get("name") for x in r2]
        assert "TEST_SponsorPin" not in names, f"Inactive sponsor still appearing: {names[:5]}"
    finally:
        d = requests.delete(f"{BASE}/api/admin/sponsors/{sid}", headers=headers, timeout=15)
        assert d.status_code in (200, 204), f"delete failed: {d.status_code} {d.text}"


def test_reports_and_sponsorship_requests():
    r = requests.post(f"{BASE}/api/reports", json={
        "restaurant_id": "test-id", "restaurant_name": "TEST_r", "reason": "TEST feedback"
    }, timeout=15)
    assert r.status_code in (200, 201, 202), f"reports failed: {r.status_code} {r.text}"

    r2 = requests.post(f"{BASE}/api/sponsorship-requests", json={
        "business_name": "TEST_biz", "contact_email": "t@t.com",
        "category": "food", "message": "hi"
    }, timeout=15)
    assert r2.status_code in (200, 201, 202), f"sponsorship failed: {r2.status_code} {r2.text}"
