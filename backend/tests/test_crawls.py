"""Tests for crawl sharing endpoints (POST /api/crawls, GET /api/crawls/{code})."""
import os
import requests
import pytest

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://lucky-bite-1.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"


@pytest.fixture(scope="module")
def sample_stops():
    return [
        {"id": "1", "name": "The Dead Rabbit", "cuisine": "Irish Pub", "price": "$$", "rating": 4.6, "distance": 0.3, "open_now": True, "google_url": "https://maps.google.com/?cid=1"},
        {"id": "2", "name": "PDT", "cuisine": "Speakeasy", "price": "$$$", "rating": 4.5, "distance": 0.7, "open_now": True, "google_url": "https://maps.google.com/?cid=2"},
        {"id": "3", "name": "Attaboy", "cuisine": "Cocktail Bar", "price": "$$$", "rating": 4.7, "distance": 1.1, "open_now": False, "google_url": ""},
    ]


def test_create_crawl_returns_5_char_code(sample_stops):
    resp = requests.post(f"{API}/crawls", json={"mode": "bars", "stops": sample_stops})
    assert resp.status_code == 200, resp.text
    data = resp.json()
    assert "code" in data
    code = data["code"]
    assert isinstance(code, str)
    assert len(code) == 5
    # unambiguous alphabet - uppercase alphanum, no 0/1/I/O
    assert code.isalnum()
    assert code == code.upper()


def test_get_crawl_returns_same_stops_and_mode(sample_stops):
    create = requests.post(f"{API}/crawls", json={"mode": "bars", "stops": sample_stops})
    code = create.json()["code"]

    resp = requests.get(f"{API}/crawls/{code}")
    assert resp.status_code == 200, resp.text
    data = resp.json()
    assert data["code"] == code
    assert data["mode"] == "bars"
    assert len(data["stops"]) == len(sample_stops)
    assert data["stops"][0]["name"] == sample_stops[0]["name"]
    assert data["stops"][1]["name"] == sample_stops[1]["name"]
    # Should NOT expose mongo _id
    assert "_id" not in data


def test_get_crawl_case_insensitive(sample_stops):
    create = requests.post(f"{API}/crawls", json={"mode": "food", "stops": sample_stops})
    code = create.json()["code"]
    resp = requests.get(f"{API}/crawls/{code.lower()}")
    assert resp.status_code == 200
    assert resp.json()["mode"] == "food"


def test_get_crawl_bad_code_returns_404():
    resp = requests.get(f"{API}/crawls/BADCD")
    assert resp.status_code == 404


def test_create_crawl_with_one_stop_rejected(sample_stops):
    resp = requests.post(f"{API}/crawls", json={"mode": "bars", "stops": sample_stops[:1]})
    assert resp.status_code == 422, resp.text


def test_create_crawl_empty_stops_rejected():
    resp = requests.post(f"{API}/crawls", json={"mode": "bars", "stops": []})
    assert resp.status_code == 422


def test_create_crawl_all_modes(sample_stops):
    for mode in ("bars", "food", "drinks", "desserts"):
        resp = requests.post(f"{API}/crawls", json={"mode": mode, "stops": sample_stops})
        assert resp.status_code == 200
        code = resp.json()["code"]
        got = requests.get(f"{API}/crawls/{code}").json()
        assert got["mode"] == mode
