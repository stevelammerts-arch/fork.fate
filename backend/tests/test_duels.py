"""Backend tests for Fate Duels (/api/duels).

Covers: create with search context, fetch (404 + verdict None while waiting),
respond (verdict computed, deterministic, winner crowned), 409 double-answer.
"""
import os
import requests

BASE = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
if not BASE:
    with open("/app/frontend/.env") as f:
        for line in f:
            if line.startswith("REACT_APP_BACKEND_URL="):
                BASE = line.split("=", 1)[1].strip().rstrip("/")

API = f"{BASE}/api"

CHALLENGER_PICK = {
    "id": "abc-1", "name": "Taco Cathedral", "cuisine": "Mexican",
    "address": "1 Fate St", "image": "",
}
RESPONDER_PICK = {
    "id": "abc-2", "name": "Noodle Crypt", "cuisine": "Ramen",
    "address": "2 Fate St", "image": "",
}
SEARCH = {"lat": 40.71, "lng": -74.0, "category": "food", "radius_miles": 10,
          "cuisines": ["Mexican"], "price_levels": ["$$"], "open_now": False}


def _create():
    r = requests.post(f"{API}/duels", json={
        "challenger": "Reaper Rick", "pick": CHALLENGER_PICK, "search": SEARCH,
    }, timeout=15)
    assert r.status_code == 200, r.text
    return r.json()["code"]


def test_create_and_get_pending():
    code = _create()
    assert len(code) == 6
    r = requests.get(f"{API}/duels/{code}", timeout=15)
    assert r.status_code == 200
    doc = r.json()
    assert doc["challenger"] == "Reaper Rick"
    assert doc["challenger_pick"]["name"] == "Taco Cathedral"
    assert doc["search"]["lat"] == 40.71
    assert doc["search"]["cuisines"] == ["Mexican"]
    assert doc["responder_pick"] is None
    assert doc["verdict"] is None


def test_get_lowercase_code_normalized():
    code = _create()
    r = requests.get(f"{API}/duels/{code.lower()}", timeout=15)
    assert r.status_code == 200


def test_get_missing_404():
    r = requests.get(f"{API}/duels/ZZZZZZ", timeout=15)
    assert r.status_code == 404


def test_respond_produces_deterministic_verdict():
    code = _create()
    r = requests.post(f"{API}/duels/{code}/respond", json={
        "name": "Challenger Chad", "pick": RESPONDER_PICK,
    }, timeout=15)
    assert r.status_code == 200, r.text
    doc = r.json()
    assert doc["responder"] == "Challenger Chad"
    v = doc["verdict"]
    assert v is not None
    assert 55.0 <= v["challenger_score"] <= 99.9
    assert 55.0 <= v["responder_score"] <= 99.9
    assert v["winner"] in ("challenger", "responder")
    # Deterministic: refetching yields the identical verdict.
    again = requests.get(f"{API}/duels/{code}", timeout=15).json()["verdict"]
    assert again == v


def test_double_answer_409():
    code = _create()
    first = requests.post(f"{API}/duels/{code}/respond", json={
        "name": "One", "pick": RESPONDER_PICK}, timeout=15)
    assert first.status_code == 200
    second = requests.post(f"{API}/duels/{code}/respond", json={
        "name": "Two", "pick": RESPONDER_PICK}, timeout=15)
    assert second.status_code == 409


def test_create_without_search_ok():
    r = requests.post(f"{API}/duels", json={
        "challenger": "", "pick": CHALLENGER_PICK,
    }, timeout=15)
    assert r.status_code == 200
    code = r.json()["code"]
    doc = requests.get(f"{API}/duels/{code}", timeout=15).json()
    assert doc["challenger"] == "A challenger"  # blank name falls back
    assert doc["search"] is None
