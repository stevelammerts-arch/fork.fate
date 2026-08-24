"""Iteration 12 — Fate Passport backend + per-chip search fix regression."""
import os
import pytest
import requests

BASE_URL = os.environ.get("EXPO_PUBLIC_BACKEND_URL") or os.environ.get("EXPO_BACKEND_URL") or os.environ.get("REACT_APP_BACKEND_URL")
BASE_URL = (BASE_URL or "").rstrip("/")
API = f"{BASE_URL}/api"


@pytest.fixture(scope="session")
def client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


SAMPLE_STOPS = [
    {"id": "stop-a", "name": "TEST Empire Landmark", "cuisine": "Landmark", "price": "$",  "rating": 4.6, "distance": 0.2, "lat": 40.7484, "lng": -73.9857},
    {"id": "stop-b", "name": "TEST High Line",       "cuisine": "Park",     "price": "$",  "rating": 4.7, "distance": 0.5, "lat": 40.7480, "lng": -74.0048},
    {"id": "stop-c", "name": "TEST Bryant Park",     "cuisine": "Park",     "price": "$",  "rating": 4.6, "distance": 0.9, "lat": 40.7536, "lng": -73.9832},
    {"id": "stop-d", "name": "TEST Chelsea Market",  "cuisine": "Market",   "price": "$$", "rating": 4.5, "distance": 0.6, "lat": 40.7420, "lng": -74.0060},
]


@pytest.fixture(scope="module")
def passport_code(client):
    """Create ONE passport per test module and share across all stamp tests."""
    r = client.post(f"{API}/passports", json={"mode": "explore", "label": "TEST NYC", "stops": SAMPLE_STOPS})
    assert r.status_code == 200, r.text
    code = r.json()["code"]
    assert isinstance(code, str) and len(code) == 6
    return code


# ---------- create ----------

def test_two_stops_returns_422(client):
    r = client.post(f"{API}/passports", json={"mode": "explore", "stops": SAMPLE_STOPS[:2]})
    assert r.status_code == 422, r.text


def test_over_ten_stops_truncated_to_ten(client):
    big = []
    for i in range(15):
        s = dict(SAMPLE_STOPS[i % 4])
        s["id"] = f"stop-big-{i}"
        s["name"] = f"TEST Big {i}"
        big.append(s)
    r = client.post(f"{API}/passports", json={"mode": "explore", "stops": big})
    assert r.status_code == 200
    code = r.json()["code"]
    got = client.get(f"{API}/passports/{code}").json()
    assert got["total"] == 10


# ---------- get ----------

def test_get_shape(client, passport_code):
    r = client.get(f"{API}/passports/{passport_code}")
    assert r.status_code == 200
    data = r.json()
    for k in ("stops", "stamps", "stamped", "total", "completed_at"):
        assert k in data
    assert data["total"] == 4
    assert data["stamped"] == 0
    assert data["completed_at"] is None


def test_unknown_code_404(client):
    r = client.get(f"{API}/passports/ZZZZZZ")
    assert r.status_code == 404


# ---------- stamp (ordered by name) ----------

def _age_last_stamp(code):
    """Rewind the newest stamp's timestamp past the 60s anti-cheat cooldown
    (MIN_SECONDS_BETWEEN_STAMPS) so consecutive test stamps don't 429."""
    from datetime import datetime, timedelta, timezone
    from pymongo import MongoClient
    mc = MongoClient(os.environ["MONGO_URL"].strip("\"'"))
    db = mc[os.environ["DB_NAME"].strip("\"'")]
    doc = db.passports.find_one({"code": code})
    stamps = (doc or {}).get("stamps", [])
    if stamps:
        stamps[-1]["stamped_at"] = (datetime.now(timezone.utc) - timedelta(seconds=90)).isoformat()
        db.passports.update_one({"code": code}, {"$set": {"stamps": stamps}})
    mc.close()


def test_stamp_1_gps_far_away_returns_409(client, passport_code):
    r = client.post(f"{API}/passports/{passport_code}/stamp",
                    json={"stop_id": "stop-a", "lat": 34.0522, "lng": -118.2437, "source": "gps"})
    assert r.status_code == 409, r.text
    assert "closer" in r.json().get("detail", "").lower()


def test_stamp_2_gps_within_radius_verified_true(client, passport_code):
    r = client.post(f"{API}/passports/{passport_code}/stamp",
                    json={"stop_id": "stop-a", "lat": 40.7485, "lng": -73.9858, "source": "gps"})
    assert r.status_code == 200, r.text
    d = r.json()
    assert d["stamped"] == 1
    assert d["just_stamped"]["verified"] == True


def test_stamp_3_manual_verified_false(client, passport_code):
    # anti-cheat: stamping again immediately must be rejected with 429...
    burst = client.post(f"{API}/passports/{passport_code}/stamp",
                        json={"stop_id": "stop-b", "source": "manual"})
    assert burst.status_code == 429, burst.text
    # ...but once the cooldown has passed, the stamp goes through
    _age_last_stamp(passport_code)
    r = client.post(f"{API}/passports/{passport_code}/stamp",
                    json={"stop_id": "stop-b", "source": "manual"})
    assert r.status_code == 200, r.text
    d = r.json()
    assert d["stamped"] == 2
    assert d["just_stamped"]["verified"] == False


def test_stamp_4_double_is_idempotent(client, passport_code):
    _age_last_stamp(passport_code)
    r = client.post(f"{API}/passports/{passport_code}/stamp",
                    json={"stop_id": "stop-b", "source": "manual"})
    assert r.status_code == 200
    d = r.json()
    assert d.get("already_stamped") == True
    assert d["stamped"] == 2  # NOT incremented


def test_stamp_5_unknown_stop_404(client, passport_code):
    r = client.post(f"{API}/passports/{passport_code}/stamp",
                    json={"stop_id": "does-not-exist", "source": "manual"})
    assert r.status_code == 404


def test_stamp_6_last_stamp_sets_completed_at(client, passport_code):
    _age_last_stamp(passport_code)
    r1 = client.post(f"{API}/passports/{passport_code}/stamp", json={"stop_id": "stop-c", "source": "manual"})
    assert r1.status_code == 200
    _age_last_stamp(passport_code)
    r2 = client.post(f"{API}/passports/{passport_code}/stamp", json={"stop_id": "stop-d", "source": "manual"})
    assert r2.status_code == 200
    d = r2.json()
    assert d["stamped"] == 4
    assert d["completed_at"] is not None


def test_stamp_7_unstamp_clears_completed(client, passport_code):
    r = client.delete(f"{API}/passports/{passport_code}/stamp/stop-d")
    assert r.status_code == 200, r.text
    d = r.json()
    assert d["completed_at"] is None
    assert d["stamped"] == 3
    assert not any(s["stop_id"] == "stop-d" for s in d["stamps"])


# ---------- places search regression ----------

def test_search_breakfast_filipino_no_subway_and_interleaved(client):
    r = client.post(f"{API}/places/search", json={
        "zip_code": "10001", "category": "food",
        "cuisines": ["Breakfast", "Filipino"],
        "radius_miles": 25,
    })
    assert r.status_code == 200, r.text
    body = r.json()
    items = body.get("restaurants", [])
    if not items:
        pytest.skip("No results (google budget/curated empty)")
    for it in items:
        assert "subway" not in (it.get("name") or "").lower(), f"Subway leaked: {it['name']}"
        assert it.get("category") == "food"
        assert it.get("cuisine") in ("Breakfast", "Filipino"), it.get("cuisine")
    if body.get("source") == "google" and len(items) >= 4:
        first = [it["cuisine"] for it in items[:6]]
        assert "Breakfast" in first and "Filipino" in first, first


def test_search_explore_lighthouses_no_restaurants(client):
    r = client.post(f"{API}/places/search", json={
        "zip_code": "28782", "category": "explore",
        "cuisines": ["Lighthouses"],
        "radius_miles": 150,
    })
    assert r.status_code == 200
    items = r.json().get("restaurants", [])
    for it in items:
        assert it.get("category") == "explore"
        name_lower = (it.get("name") or "").lower()
        for banned in ("restaurant", "diner", "pizzeria", "steakhouse", "burger"):
            assert banned not in name_lower, f"restaurant leaked into Lighthouses: {it['name']}"


def test_search_fuel_bus_stations(client):
    r = client.post(f"{API}/places/search", json={
        "zip_code": "10001", "category": "fuel",
        "cuisines": ["Bus Stations"],
        "radius_miles": 25,
    })
    assert r.status_code == 200
    items = r.json().get("restaurants", [])
    if not items:
        pytest.skip("No results (google budget/curated empty)")
    for it in items:
        assert it.get("category") == "fuel"
        name_lower = (it.get("name") or "").lower()
        for banned in ("restaurant", "steakhouse", "burger", "pizzeria"):
            assert banned not in name_lower
