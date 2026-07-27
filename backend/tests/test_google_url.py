import os
import pytest
import requests
from urllib.parse import quote_plus

BASE_URL = os.environ['REACT_APP_BACKEND_URL'].rstrip('/')
API = f"{BASE_URL}/api"


@pytest.fixture(scope="module")
def client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


class TestGoogleUrl:
    def test_all_curated_have_valid_google_url(self, client):
        r = client.post(f"{API}/places/search", json={"cuisines": [], "price_levels": []})
        assert r.status_code == 200
        d = r.json()
        assert d["source"] == "curated"
        assert len(d["restaurants"]) == 23
        for item in d["restaurants"]:
            assert "google_url" in item, f"Missing google_url for {item['name']}"
            url = item["google_url"]
            assert isinstance(url, str) and url, f"Empty google_url for {item['name']}"
            assert url.startswith("https://www.google.com/maps/search/?api=1&query="), url
            # Ensure name (URL encoded) is present in URL
            assert quote_plus(item["name"]) in url or item["name"].replace(" ", "+") in url

    def test_google_url_encodes_name_and_address(self, client):
        r = client.post(f"{API}/places/search", json={"cuisines": ["Italian"], "price_levels": []})
        assert r.status_code == 200
        items = r.json()["restaurants"]
        assert items
        for it in items:
            expected = f"https://www.google.com/maps/search/?api=1&query={quote_plus((it['name'] + ' ' + it.get('address','')).strip())}"
            assert it["google_url"] == expected

    def test_filtered_results_still_include_google_url(self, client):
        r = client.post(f"{API}/places/search", json={"cuisines": [], "price_levels": ["PRICE_LEVEL_MODERATE"]})
        assert r.status_code == 200
        for it in r.json()["restaurants"]:
            assert it.get("google_url", "").startswith("https://www.google.com/maps/search/")
