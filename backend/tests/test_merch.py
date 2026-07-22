"""Backend tests for merch showcase notify + admin merch-interest."""
import os
import uuid
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
if not BASE_URL:
    # Fallback to backend .env for direct execution
    with open("/app/frontend/.env") as f:
        for line in f:
            if line.startswith("REACT_APP_BACKEND_URL="):
                BASE_URL = line.split("=", 1)[1].strip().rstrip("/")

ADMIN_PASSWORD = "GrimReaper!2026"


@pytest.fixture(scope="module")
def unique_email():
    return f"TEST_{uuid.uuid4().hex[:10]}@example.com"


@pytest.fixture(scope="module")
def admin_session():
    s = requests.Session()
    r = s.post(f"{BASE_URL}/api/admin/login", json={"password": ADMIN_PASSWORD})
    assert r.status_code == 200, f"admin login failed: {r.status_code} {r.text}"
    return s


def test_merch_notify_public_valid(unique_email):
    r = requests.post(
        f"{BASE_URL}/api/merch/notify",
        json={"email": unique_email, "product_key": "tee", "design": "Dragon's Hoard — Scene"},
    )
    assert r.status_code == 200, r.text
    data = r.json()
    assert data["ok"] is True
    assert isinstance(data["count"], int)
    assert data["count"] >= 1


def test_merch_notify_upsert_no_double_count(unique_email):
    # Submit same email+design again
    r1 = requests.post(
        f"{BASE_URL}/api/merch/notify",
        json={"email": unique_email, "product_key": "tee", "design": "Dragon's Hoard — Scene"},
    )
    assert r1.status_code == 200
    count_after = r1.json()["count"]

    r2 = requests.post(
        f"{BASE_URL}/api/merch/notify",
        json={"email": unique_email, "product_key": "tee", "design": "Dragon's Hoard — Scene"},
    )
    assert r2.status_code == 200
    assert r2.json()["count"] == count_after, "Duplicate email+design should not increment count"


def test_merch_notify_invalid_email():
    r = requests.post(
        f"{BASE_URL}/api/merch/notify",
        json={"email": "abc", "product_key": "tee", "design": "test"},
    )
    assert r.status_code in (400, 422), f"expected validation error, got {r.status_code}"


def test_admin_merch_interest_requires_auth():
    r = requests.get(f"{BASE_URL}/api/admin/merch-interest")
    assert r.status_code == 401


def test_admin_merch_interest_lists_signup(admin_session, unique_email):
    r = admin_session.get(f"{BASE_URL}/api/admin/merch-interest")
    assert r.status_code == 200
    data = r.json()
    assert "signups" in data and "count" in data and "by_design" in data
    emails = [s["email"] for s in data["signups"]]
    assert unique_email.lower() in emails, f"submitted email not found in listing: {emails[:5]}..."
    # by_design tally exists for our design
    assert any("Dragon" in k for k in data["by_design"].keys())


def test_admin_login_sets_cookie():
    s = requests.Session()
    r = s.post(f"{BASE_URL}/api/admin/login", json={"password": ADMIN_PASSWORD})
    assert r.status_code == 200
    # Should have an ff_admin cookie
    assert any(c.name == "ff_admin" for c in s.cookies), f"cookies: {s.cookies.items()}"
