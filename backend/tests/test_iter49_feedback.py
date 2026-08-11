"""Iteration 49: in-app feedback endpoints (public POST + admin list/delete)."""
from _helpers import mint_admin_token
import os
import time
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
# Fall back to frontend/.env if REACT_APP_BACKEND_URL not in env
if not BASE_URL:
    try:
        with open("/app/frontend/.env") as f:
            for line in f:
                if line.startswith("REACT_APP_BACKEND_URL"):
                    BASE_URL = line.split("=", 1)[1].strip().rstrip("/")
    except Exception:
        pass

# Admin password comes from backend/.env — never hardcode secrets in tests.
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "")
if not ADMIN_PASSWORD:
    try:
        with open("/app/backend/.env") as f:
            for line in f:
                if line.startswith("ADMIN_PASSWORD"):
                    ADMIN_PASSWORD = line.split("=", 1)[1].strip().strip('"')
    except Exception:
        pass


@pytest.fixture(scope="module")
def api():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="module")
def admin_session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    r = s.post(f"{BASE_URL}/api/admin/login", json={"password": ADMIN_PASSWORD})
    assert r.status_code == 200, f"admin login failed: {r.status_code} {r.text}"
    # attach csrf
    csrf = s.cookies.get("ff_csrf")
    if csrf:
        s.headers.update({"X-CSRF-Token": csrf})
    # Secure cookie is not sent over plain http; use Bearer (CSRF-exempt).
    s.headers["Authorization"] = f"Bearer {mint_admin_token()}"
    return s


# ---- Public POST /api/feedback ----

def test_feedback_reject_short_message(api):
    r = api.post(f"{BASE_URL}/api/feedback", json={"message": "hi"})
    assert r.status_code == 422


def test_feedback_success(api):
    payload = {
        "message": "TEST_iter49 feedback message body",
        "email": "test_iter49@example.com",
        "page": "/",
    }
    r = api.post(f"{BASE_URL}/api/feedback", json=payload)
    assert r.status_code == 200, r.text
    assert r.json() == {"ok": True}


# ---- Admin list/delete ----

def test_admin_feedback_requires_auth(api):
    r = api.get(f"{BASE_URL}/api/admin/feedback")
    assert r.status_code == 401


def test_admin_list_and_delete_feedback(admin_session):
    r = admin_session.get(f"{BASE_URL}/api/admin/feedback")
    assert r.status_code == 200
    data = r.json()
    assert "feedback" in data and "count" in data
    assert data["count"] == len(data["feedback"])
    # newest first check
    if len(data["feedback"]) >= 2:
        first_ts = data["feedback"][0].get("created_at", "")
        second_ts = data["feedback"][1].get("created_at", "")
        assert first_ts >= second_ts

    # Find our TEST_iter49 entry (submitted in prior test)
    target = next((f for f in data["feedback"] if f.get("message", "").startswith("TEST_iter49")), None)
    assert target is not None, "TEST_iter49 feedback not found in admin list"
    # Ensure expected fields
    for k in ("id", "message", "email", "page", "created_at", "ip", "ua"):
        assert k in target, f"missing key {k} in feedback doc"
    assert "_id" not in target
    assert target["email"] == "test_iter49@example.com"
    assert target["page"] == "/"

    # Delete
    fid = target["id"]
    d = admin_session.delete(f"{BASE_URL}/api/admin/feedback/{fid}")
    assert d.status_code == 200, d.text
    assert d.json() == {"ok": True}

    # Verify removal
    r2 = admin_session.get(f"{BASE_URL}/api/admin/feedback")
    assert r2.status_code == 200
    ids = [f["id"] for f in r2.json()["feedback"]]
    assert fid not in ids


def test_admin_delete_nonexistent(admin_session):
    r = admin_session.delete(f"{BASE_URL}/api/admin/feedback/nonexistent-id-xyz")
    assert r.status_code == 200
    assert r.json() == {"ok": False}
