import os
import pytest
import requests

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://lucky-bite-1.preview.emergentagent.com').rstrip('/')
API = f"{BASE_URL}/api"


@pytest.fixture(scope="module")
def client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


class TestRestaurantsAPI:
    def test_get_restaurants_seeded(self, client):
        r = client.get(f"{API}/restaurants")
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list)
        # 23 food + 8 drinks
        assert len(data) == 31
        assert sum(1 for x in data if x.get('category', 'food') == 'food') == 23
        assert sum(1 for x in data if x.get('category') == 'drinks') == 8
        first = data[0]
        for k in ("id", "name", "cuisine", "price", "rating", "distance"):
            assert k in first

    def test_get_cuisines_sorted(self, client):
        r = client.get(f"{API}/cuisines")
        assert r.status_code == 200
        cuisines = r.json()
        assert isinstance(cuisines, list)
        assert len(cuisines) > 0
        assert cuisines == sorted(cuisines)
        assert len(cuisines) == len(set(cuisines))
        assert "Italian" in cuisines

    def test_spin_empty_filters(self, client):
        r = client.post(f"{API}/spin", json={"cuisines": [], "prices": []})
        assert r.status_code == 200
        d = r.json()
        assert "id" in d and "name" in d and "cuisine" in d

    def test_spin_cuisine_filter(self, client):
        for _ in range(5):
            r = client.post(f"{API}/spin", json={"cuisines": ["Italian"], "prices": []})
            assert r.status_code == 200
            assert r.json()["cuisine"] == "Italian"

    def test_spin_price_and_distance(self, client):
        r = client.post(f"{API}/spin", json={"cuisines": [], "prices": ["$"], "max_distance": 2.0})
        assert r.status_code == 200
        d = r.json()
        assert d["price"] == "$"
        assert d["distance"] <= 2.0

    def test_spin_no_match_404(self, client):
        r = client.post(f"{API}/spin", json={"cuisines": ["NonExistent"], "prices": []})
        assert r.status_code == 404

    def test_create_and_delete_restaurant(self, client):
        payload = {
            "name": "TEST_Pytest Diner",
            "cuisine": "TestCuisine",
            "price": "$$",
            "rating": 4.2,
            "distance": 1.0,
            "description": "test",
        }
        c = client.post(f"{API}/restaurants", json=payload)
        assert c.status_code == 200
        created = c.json()
        assert created["name"] == payload["name"]
        rid = created["id"]

        g = client.get(f"{API}/restaurants")
        assert any(x["id"] == rid for x in g.json())

        d = client.delete(f"{API}/restaurants/{rid}")
        assert d.status_code == 200

        g2 = client.get(f"{API}/restaurants")
        assert not any(x["id"] == rid for x in g2.json())

    def test_delete_nonexistent_404(self, client):
        r = client.delete(f"{API}/restaurants/nonexistent-uuid-xyz")
        assert r.status_code == 404
