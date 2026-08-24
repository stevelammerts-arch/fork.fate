"""Backend tests for /api/crawls/{code}/flare + /positions.

Verifies upsert-by-member_id, multi-member, code normalization, TTL response.
"""
import os
import requests
import pytest

BASE = os.environ["REACT_APP_BACKEND_URL"].rstrip("/") if "REACT_APP_BACKEND_URL" in os.environ else "https://web-fate-launch.preview.emergentagent.com"
# Prefer frontend/.env if not in env
if not os.environ.get("REACT_APP_BACKEND_URL"):
    try:
        with open("/app/frontend/.env") as f:
            for line in f:
                if line.startswith("REACT_APP_BACKEND_URL="):
                    BASE = line.split("=", 1)[1].strip().rstrip("/")
    except Exception:
        pass


@pytest.fixture(scope="module")
def code():
    return "TESTFLARE1"  # will be uppercased/truncated to 12


def test_pop_flare_ok(code):
    r = requests.post(f"{BASE}/api/crawls/{code}/flare", json={
        "member_id": "mem-alpha", "name": "Alpha", "lat": 40.75, "lng": -73.99
    })
    assert r.status_code == 200, r.text
    data = r.json()
    assert data["ok"] == True
    assert data["expires_in_minutes"] == 3


def test_positions_returns_flare(code):
    r = requests.get(f"{BASE}/api/crawls/{code}/positions")
    assert r.status_code == 200
    data = r.json()
    assert "positions" in data and "flares" in data
    flares = data["flares"]
    matching = [f for f in flares if f["member_id"] == "mem-alpha"]
    assert len(matching) == 1
    f = matching[0]
    assert f["name"] == "Alpha"
    assert f["lat"] == 40.75
    assert f["lng"] == -73.99
    assert f["code"] == code.upper()[:12]
    assert "at" in f


def test_pop_flare_upsert_same_member(code):
    # Second flare with SAME member_id updates the existing (still 1)
    r = requests.post(f"{BASE}/api/crawls/{code}/flare", json={
        "member_id": "mem-alpha", "name": "Alpha2", "lat": 41.0, "lng": -74.0
    })
    assert r.status_code == 200
    r2 = requests.get(f"{BASE}/api/crawls/{code}/positions")
    flares = [f for f in r2.json()["flares"] if f["member_id"] == "mem-alpha"]
    assert len(flares) == 1
    assert flares[0]["name"] == "Alpha2"
    assert flares[0]["lat"] == 41.0


def test_pop_flare_multi_member(code):
    r = requests.post(f"{BASE}/api/crawls/{code}/flare", json={
        "member_id": "mem-beta", "name": "Beta", "lat": 40.7, "lng": -74.0
    })
    assert r.status_code == 200
    r2 = requests.get(f"{BASE}/api/crawls/{code}/positions")
    ids = sorted({f["member_id"] for f in r2.json()["flares"] if f["member_id"] in ("mem-alpha", "mem-beta")})
    assert ids == ["mem-alpha", "mem-beta"]


def test_code_normalization():
    # lowercase + long, must be uppercased and truncated to 12
    raw = "abcdefghijklmnop"
    r = requests.post(f"{BASE}/api/crawls/{raw}/flare", json={
        "member_id": "mem-norm", "name": "Norm", "lat": 1.0, "lng": 2.0
    })
    assert r.status_code == 200
    # GET with truncated uppercase form
    norm = raw.upper()[:12]
    r2 = requests.get(f"{BASE}/api/crawls/{norm}/positions")
    ids = [f["member_id"] for f in r2.json()["flares"]]
    assert "mem-norm" in ids


def test_short_member_id_rejected():
    # Pydantic model requires min 4 chars — expect 422
    r = requests.post(f"{BASE}/api/crawls/TESTX/flare", json={
        "member_id": "abc", "name": "X", "lat": 1.0, "lng": 2.0
    })
    assert r.status_code == 422
