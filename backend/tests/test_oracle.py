"""Tests for /api/oracle (AI Fate Oracle) — iteration 37."""
import os
import time
import uuid
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://web-fate-launch.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api/oracle"


def _payload(**over):
    base = {
        "place_id": f"test-oracle-{uuid.uuid4().hex[:10]}",
        "name": "The Gilded Fork",
        "cuisine": "italian",
        "category": "food",
        "theme": "dark",
        "lang": "en",
    }
    base.update(over)
    return base


def test_missing_name_returns_422():
    r = requests.post(API, json={"place_id": "x", "theme": "dark", "lang": "en"}, timeout=20)
    assert r.status_code == 422


def test_first_call_generates_and_second_hits_cache():
    p = _payload()
    r1 = requests.post(API, json=p, timeout=30)
    assert r1.status_code == 200, r1.text
    d1 = r1.json()
    if d1.get("line") is None:
        pytest.skip("Oracle returned null (budget/key). Skipping cache assertion.")
    assert d1["cached"] is False
    line = d1["line"]
    assert isinstance(line, str) and len(line) > 0
    assert len(line) <= 240
    assert not (line.startswith('"') or line.startswith("“") or line.endswith('"') or line.endswith("”"))
    # 2nd call
    r2 = requests.post(API, json=p, timeout=15)
    assert r2.status_code == 200
    d2 = r2.json()
    assert d2["cached"] is True
    assert d2["line"] == line


def test_different_theme_generates_new_line():
    pid = f"test-oracle-{uuid.uuid4().hex[:10]}"
    d1 = requests.post(API, json=_payload(place_id=pid, theme="dark"), timeout=30).json()
    d2 = requests.post(API, json=_payload(place_id=pid, theme="fantasy"), timeout=30).json()
    if d1.get("line") is None or d2.get("line") is None:
        pytest.skip("Oracle returned null.")
    # Both cached=False on first call each (independent voice keys)
    assert d2["cached"] is False
    assert d1["line"] != d2["line"]


def test_different_lang_generates_new_line():
    pid = f"test-oracle-{uuid.uuid4().hex[:10]}"
    d_en = requests.post(API, json=_payload(place_id=pid, lang="en"), timeout=30).json()
    d_es = requests.post(API, json=_payload(place_id=pid, lang="es"), timeout=30).json()
    if d_en.get("line") is None or d_es.get("line") is None:
        pytest.skip("Oracle returned null.")
    assert d_es["cached"] is False
    assert d_en["line"] != d_es["line"]


def test_unknown_theme_falls_back_to_light():
    r = requests.post(API, json=_payload(theme="bogus"), timeout=30)
    assert r.status_code == 200
    d = r.json()
    # Should still return a line (or null if budget); never 500.
    if d.get("line") is None:
        pytest.skip("Oracle returned null.")
    assert isinstance(d["line"], str) and len(d["line"]) > 0
