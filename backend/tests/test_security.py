import os
import time
import json
import pytest
import requests

BASE_URL = os.environ['REACT_APP_BACKEND_URL'].rstrip('/')
API = f"{BASE_URL}/api"


@pytest.fixture(scope="module")
def client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


class TestZipValidation:
    def test_invalid_zip_short(self, client):
        r = client.post(f"{API}/places/search", json={"zip_code": "12"})
        assert r.status_code == 422

    def test_invalid_zip_alpha(self, client):
        r = client.post(f"{API}/places/search", json={"zip_code": "abcde"})
        assert r.status_code == 422

    def test_valid_zip_ok(self, client):
        r = client.post(f"{API}/places/search", json={"zip_code": "10001"})
        assert r.status_code == 200

    def test_omitted_zip_ok(self, client):
        r = client.post(f"{API}/places/search", json={})
        assert r.status_code == 200


class TestCategoryCoercion:
    def test_banana_coerced_to_food(self, client):
        r = client.post(f"{API}/places/search", json={"category": "banana"})
        assert r.status_code == 200
        d = r.json()
        assert d["source"] == "curated"
        # should be food (23), not drinks (8)
        assert len(d["restaurants"]) == 23


class TestPhotoProxy:
    def test_photo_returns_404_without_key(self, client):
        # GOOGLE_API_KEY intentionally unset
        r = client.get(f"{API}/places/photo", params={"name": "places/abc"})
        assert r.status_code == 404

    def test_photo_rejects_bad_prefix(self, client):
        r = client.get(f"{API}/places/photo", params={"name": "../etc/passwd"})
        assert r.status_code == 404


class TestNoApiKeyLeak:
    def test_no_google_key_in_response(self, client):
        r = client.post(f"{API}/places/search", json={"zip_code": "10001"})
        assert r.status_code == 200
        body = r.text
        assert "key=" not in body.lower()
        # confirm images are unsplash (curated path)
        d = r.json()
        for x in d["restaurants"]:
            img = x.get("image", "")
            assert img.startswith("http") and "unsplash" in img or img.startswith("/api/places/photo")


class TestCreateFieldValidation:
    def test_empty_name_422(self, client):
        r = client.post(f"{API}/restaurants", json={"name": "", "cuisine": "Test"})
        assert r.status_code == 422

    def test_long_name_422(self, client):
        r = client.post(f"{API}/restaurants", json={"name": "x" * 121, "cuisine": "Test"})
        assert r.status_code == 422

    def test_empty_cuisine_422(self, client):
        r = client.post(f"{API}/restaurants", json={"name": "TEST_ValidName", "cuisine": ""})
        assert r.status_code == 422


class TestRateLimit:
    def test_create_rate_limit_429(self, client):
        """Send >20 rapid POSTs to /api/restaurants; expect 429 eventually."""
        created_ids = []
        got_429 = False
        for i in range(30):
            payload = {"name": f"TEST_RL_{i}_{int(time.time()*1000)}", "cuisine": "RLTest"}
            r = client.post(f"{API}/restaurants", json=payload)
            if r.status_code == 429:
                got_429 = True
                break
            if r.status_code == 200:
                created_ids.append(r.json()["id"])
        # cleanup — but deletes are rate-limited too; wait then delete
        # (Rate window is 60s per IP shared with create; skip aggressive cleanup)
        # Best effort cleanup after sleep
        assert got_429, "Expected 429 after >20 rapid creates"
