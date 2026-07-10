"""Test the /api/stats/crawls counter endpoints (iter47 additions)."""
import os
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://lucky-bite-1.preview.emergentagent.com").rstrip("/")


def test_get_crawls_returns_count_int():
    r = requests.get(f"{BASE_URL}/api/stats/crawls", timeout=15)
    assert r.status_code == 200, r.text
    data = r.json()
    assert "count" in data
    assert isinstance(data["count"], int)
    assert data["count"] >= 0


def test_post_crawl_completed_increments():
    before = requests.get(f"{BASE_URL}/api/stats/crawls", timeout=15).json()["count"]
    r = requests.post(f"{BASE_URL}/api/stats/crawl-completed", timeout=15)
    assert r.status_code == 200, r.text
    posted = r.json()["count"]
    after = requests.get(f"{BASE_URL}/api/stats/crawls", timeout=15).json()["count"]
    assert posted == before + 1, f"POST returned {posted}, expected {before + 1}"
    assert after == posted, f"GET after POST returned {after}, expected {posted}"
