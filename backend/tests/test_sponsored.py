import os
import pytest
import requests

BASE_URL = os.environ['REACT_APP_BACKEND_URL'].rstrip('/')
API = f"{BASE_URL}/api"

EXPECTED_SPONSORED = {"Olive & Ember", "Harborline", "Ember & Oak BBQ"}


@pytest.fixture(scope="module")
def client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


class TestSponsoredField:
    def test_get_restaurants_has_sponsored_field(self, client):
        r = client.get(f"{API}/restaurants")
        assert r.status_code == 200
        data = r.json()
        for item in data:
            assert "sponsored" in item
            assert isinstance(item["sponsored"], bool)
        sponsored_names = {x["name"] for x in data if x["sponsored"]}
        assert EXPECTED_SPONSORED.issubset(sponsored_names), f"Missing sponsored: {EXPECTED_SPONSORED - sponsored_names}"

    def test_places_search_sponsored_first_then_distance(self, client):
        r = client.post(f"{API}/places/search", json={"cuisines": [], "price_levels": []})
        assert r.status_code == 200
        d = r.json()
        assert d["source"] == "curated"
        restaurants = d["restaurants"]
        # First N sponsored, then non-sponsored by ascending distance
        n_sponsored = sum(1 for x in restaurants if x["sponsored"])
        assert n_sponsored == 3
        top = restaurants[:3]
        assert all(x["sponsored"] for x in top)
        # Sponsored group ordered by distance
        sp_dists = [x["distance"] for x in top]
        assert sp_dists == sorted(sp_dists)
        # Non-sponsored ordered by distance
        rest = restaurants[3:]
        assert not any(x["sponsored"] for x in rest)
        rest_dists = [x["distance"] for x in rest]
        assert rest_dists == sorted(rest_dists)
        # Confirmed sponsored names
        top_names = {x["name"] for x in top}
        assert top_names == EXPECTED_SPONSORED

    def test_create_restaurant_with_sponsored_true(self, client):
        payload = {
            "name": "TEST_Sponsored Spot",
            "cuisine": "TestCui",
            "price": "$$",
            "rating": 4.6,
            "distance": 1.2,
            "description": "test sponsored",
            "sponsored": True,
        }
        c = client.post(f"{API}/restaurants", json=payload)
        assert c.status_code == 200, c.text
        created = c.json()
        assert created["sponsored"] == True
        rid = created["id"]
        # Verify persistence
        g = client.get(f"{API}/restaurants")
        found = next((x for x in g.json() if x["id"] == rid), None)
        assert found is not None
        assert found["sponsored"] == True
        # cleanup
        client.delete(f"{API}/restaurants/{rid}")

    def test_create_restaurant_default_sponsored_false(self, client):
        payload = {
            "name": "TEST_NonSponsored Spot",
            "cuisine": "TestCui",
            "price": "$",
            "distance": 0.5,
        }
        c = client.post(f"{API}/restaurants", json=payload)
        assert c.status_code == 200
        created = c.json()
        assert created["sponsored"] == False
        client.delete(f"{API}/restaurants/{created['id']}")
