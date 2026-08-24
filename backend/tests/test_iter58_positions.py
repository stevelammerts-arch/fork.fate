"""Iteration 58 regression: crew positions API + crawl regression."""
import os
import requests
import pytest

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://web-fate-launch.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"


@pytest.fixture(scope="module")
def crawl_code():
    payload = {
        "mode": "food",
        "label": "TEST_positions",
        "stops": [
            {"place_id": "TEST_stop_1", "name": "Stop 1", "lat": 41.20, "lng": -96.10, "address": "1 A St"},
            {"place_id": "TEST_stop_2", "name": "Stop 2", "lat": 41.21, "lng": -96.11, "address": "2 B St"},
        ],
    }
    r = requests.post(f"{API}/crawls", json=payload, timeout=15)
    assert r.status_code == 200, r.text
    code = r.json()["code"]
    assert isinstance(code, str) and len(code) == 8
    return code


def test_get_crawl(crawl_code):
    r = requests.get(f"{API}/crawls/{crawl_code}", timeout=15)
    assert r.status_code == 200
    j = r.json()
    assert j["code"] == crawl_code
    assert len(j["stops"]) == 2


def test_leaderboard():
    r = requests.get(f"{API}/crawls/leaderboard", timeout=15)
    assert r.status_code == 200
    j = r.json()
    assert "global" in j and "week" in j
    assert "stops" in j["global"] and "fastest" in j["global"]


def test_position_upsert_and_list(crawl_code):
    # First position
    r1 = requests.post(
        f"{API}/crawls/{crawl_code}/position",
        json={"member_id": "TEST_member_bob", "name": "Bob", "lat": 41.20, "lng": -96.10},
        timeout=15,
    )
    assert r1.status_code == 200, r1.text

    # Same member updates coords
    r2 = requests.post(
        f"{API}/crawls/{crawl_code}/position",
        json={"member_id": "TEST_member_bob", "name": "Bob", "lat": 41.25, "lng": -96.15},
        timeout=15,
    )
    assert r2.status_code == 200, r2.text

    # GET positions -> ONE entry with latest coords
    r3 = requests.get(f"{API}/crawls/{crawl_code}/positions", timeout=15)
    assert r3.status_code == 200, r3.text
    positions = r3.json()["positions"]
    bob_entries = [p for p in positions if p.get("member_id") == "TEST_member_bob"]
    assert len(bob_entries) == 1, f"expected 1, got {len(bob_entries)}"
    assert abs(bob_entries[0]["lat"] - 41.25) < 1e-6
    assert abs(bob_entries[0]["lng"] - (-96.15)) < 1e-6
    assert bob_entries[0]["name"] == "Bob"


def test_position_invalid_lat(crawl_code):
    r = requests.post(
        f"{API}/crawls/{crawl_code}/position",
        json={"member_id": "TEST_member_bad", "name": "X", "lat": 91.0, "lng": 0.0},
        timeout=15,
    )
    assert r.status_code == 422, f"expected 422, got {r.status_code}: {r.text}"


def test_checkin_still_works(crawl_code):
    r = requests.post(
        f"{API}/crawls/{crawl_code}/checkin",
        json={"stop_id": "TEST_stop_1", "stop_index": 0, "lat": 41.20, "lng": -96.10, "source": "gps"},
        timeout=15,
    )
    assert r.status_code == 200, r.text
    assert r.json().get("ok") == True
