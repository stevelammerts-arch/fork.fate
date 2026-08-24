"""Iteration 32 — Reaction voting endpoints."""
import os
import uuid
import requests
import pytest

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
if not BASE_URL:
    # Fallback to frontend .env parse
    with open("/app/frontend/.env") as f:
        for line in f:
            if line.startswith("REACT_APP_BACKEND_URL="):
                BASE_URL = line.split("=", 1)[1].strip().rstrip("/")


@pytest.fixture(scope="module")
def s():
    return requests.Session()


def _pid():
    return f"TEST_rxn_{uuid.uuid4().hex[:10]}"


def test_get_unknown_place_returns_zero_pct_null(s):
    pid = _pid()
    r = s.get(f"{BASE_URL}/api/reactions/{pid}")
    assert r.status_code == 200
    d = r.json()
    assert d == {"up": 0, "down": 0, "total": 0, "pct": None}


def test_post_up_vote_counts_and_returns_pct_100(s):
    pid = _pid()
    r = s.post(f"{BASE_URL}/api/reactions", json={"place_id": pid, "vote": "up"})
    assert r.status_code == 200, r.text
    d = r.json()
    assert d["counted"] == True
    assert d["up"] == 1
    assert d["down"] == 0
    assert d["total"] == 1
    assert d["pct"] == 100


def test_second_vote_same_ip_same_place_not_counted(s):
    pid = _pid()
    r1 = s.post(f"{BASE_URL}/api/reactions", json={"place_id": pid, "vote": "up"})
    assert r1.status_code == 200
    assert r1.json()["counted"] == True

    r2 = s.post(f"{BASE_URL}/api/reactions", json={"place_id": pid, "vote": "down"})
    assert r2.status_code == 200
    d2 = r2.json()
    assert d2["counted"] == False
    # totals unchanged
    assert d2["up"] == 1
    assert d2["down"] == 0
    assert d2["total"] == 1


def test_invalid_vote_returns_422(s):
    r = s.post(f"{BASE_URL}/api/reactions", json={"place_id": _pid(), "vote": "meh"})
    assert r.status_code == 422


def test_missing_place_id_returns_422(s):
    r = s.post(f"{BASE_URL}/api/reactions", json={"vote": "up"})
    assert r.status_code == 422


def test_get_reflects_after_post(s):
    pid = _pid()
    s.post(f"{BASE_URL}/api/reactions", json={"place_id": pid, "vote": "up"})
    r = s.get(f"{BASE_URL}/api/reactions/{pid}")
    assert r.status_code == 200
    d = r.json()
    assert d["up"] == 1
    assert d["total"] == 1
    assert d["pct"] == 100


def test_down_vote_pct_zero(s):
    pid = _pid()
    r = s.post(f"{BASE_URL}/api/reactions", json={"place_id": pid, "vote": "down"})
    assert r.status_code == 200
    d = r.json()
    assert d["counted"] == True
    assert d["down"] == 1
    assert d["pct"] == 0
