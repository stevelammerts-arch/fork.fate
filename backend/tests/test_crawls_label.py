"""Backend tests for the new CrawlCreate.label field (iter48 themed crawls)."""
import os
import pytest
import requests

BASE_URL = os.environ['REACT_APP_BACKEND_URL'].rstrip('/') if os.environ.get('REACT_APP_BACKEND_URL') else None

# Fall back to reading frontend/.env if REACT_APP_BACKEND_URL not exported to this shell
if not BASE_URL:
    from pathlib import Path
    envf = Path('/app/frontend/.env')
    for line in envf.read_text().splitlines():
        if line.startswith('REACT_APP_BACKEND_URL='):
            BASE_URL = line.split('=', 1)[1].strip().rstrip('/')
            break

STOPS = [
    {"id": "s1", "name": "The Tap House", "cuisine": "Beer", "price": "$$",
     "rating": 4.7, "distance": 1.2, "open_now": True,
     "google_url": "https://maps.google.com/?q=tap+house"},
    {"id": "s2", "name": "Barrel & Bourbon", "cuisine": "Whiskey", "price": "$$$",
     "rating": 4.8, "distance": 2.6, "open_now": True,
     "google_url": "https://maps.google.com/?q=barrel"},
]


class TestCrawlLabel:
    def test_create_crawl_with_label_and_get(self):
        payload = {"mode": "bars", "label": "Brewery Crawl", "stops": STOPS}
        r = requests.post(f"{BASE_URL}/api/crawls", json=payload, timeout=15)
        assert r.status_code == 200, r.text
        data = r.json()
        assert "code" in data and isinstance(data["code"], str) and len(data["code"]) == 5
        code = data["code"]

        g = requests.get(f"{BASE_URL}/api/crawls/{code}", timeout=15)
        assert g.status_code == 200, g.text
        doc = g.json()
        assert doc["code"] == code
        assert doc["mode"] == "bars"
        assert doc["label"] == "Brewery Crawl"
        assert isinstance(doc["stops"], list) and len(doc["stops"]) == 2
        assert doc["stops"][0]["name"] == "The Tap House"

    def test_create_crawl_without_label_defaults_empty(self):
        payload = {"mode": "food", "stops": STOPS}
        r = requests.post(f"{BASE_URL}/api/crawls", json=payload, timeout=15)
        assert r.status_code == 200, r.text
        code = r.json()["code"]
        g = requests.get(f"{BASE_URL}/api/crawls/{code}", timeout=15).json()
        assert g["mode"] == "food"
        assert g.get("label", "") == ""

    def test_create_crawl_taco_label(self):
        payload = {"mode": "food", "label": "Taco Crawl", "stops": STOPS}
        r = requests.post(f"{BASE_URL}/api/crawls", json=payload, timeout=15)
        assert r.status_code == 200
        code = r.json()["code"]
        g = requests.get(f"{BASE_URL}/api/crawls/{code}", timeout=15).json()
        assert g["label"] == "Taco Crawl"

    def test_get_missing_crawl_404(self):
        r = requests.get(f"{BASE_URL}/api/crawls/ZZZZZ", timeout=15)
        assert r.status_code == 404
