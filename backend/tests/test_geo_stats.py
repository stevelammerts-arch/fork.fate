"""Backend tests for the visitor-geography beacon + admin geo-stats panel."""
from _helpers import mint_admin_token
import os
import requests

BASE = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
if not BASE:
    with open("/app/frontend/.env") as f:
        for line in f:
            if line.startswith("REACT_APP_BACKEND_URL="):
                BASE = line.split("=", 1)[1].strip().rstrip("/")

API = f"{BASE}/api"


def _admin_session():
    password = None
    with open("/app/backend/.env") as f:
        for line in f:
            if line.startswith("ADMIN_PASSWORD="):
                password = line.split("=", 1)[1].strip().strip('"')
    assert password, "ADMIN_PASSWORD missing from backend/.env"
    s = requests.Session()
    r = s.post(f"{API}/admin/login", json={"password": password}, timeout=15)
    assert r.status_code == 200, r.text
    # Secure cookie is not sent over plain http; use Bearer (CSRF-exempt).
    s.headers["Authorization"] = f"Bearer {mint_admin_token()}"
    return s


def test_pageview_counts_then_dedupes():
    first = requests.post(f"{API}/stats/pageview", timeout=15).json()
    second = requests.post(f"{API}/stats/pageview", timeout=15).json()
    # Same IP within the 6h window: at most the first call counts.
    assert "counted" in first and "counted" in second
    assert second["counted"] == False


def test_geo_stats_requires_admin():
    r = requests.get(f"{API}/admin/geo-stats?days=30", timeout=15)
    assert r.status_code == 401


def test_geo_stats_shape_and_ranges():
    s = _admin_session()
    for days in (7, 30, 0):
        r = s.get(f"{API}/admin/geo-stats?days={days}", timeout=15)
        assert r.status_code == 200, r.text
        doc = r.json()
        assert doc["days"] == days
        assert isinstance(doc["total"], int)
        assert isinstance(doc["countries"], list)
        assert isinstance(doc["cities"], list)
        for c in doc["countries"]:
            assert set(c) == {"name", "count"}
        for c in doc["cities"]:
            assert set(c) == {"name", "region", "country", "count"}


def test_geo_stats_days_clamped():
    s = _admin_session()
    r = s.get(f"{API}/admin/geo-stats?days=999999", timeout=15)
    assert r.status_code == 200
    assert r.json()["days"] == 3650
