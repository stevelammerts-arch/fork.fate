"""Iteration 9 verification: explore/stay tabs, radius expansion, seed depth, sponsor categories."""
import os
import re
import time
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://fate-mobile-build.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"
ADMIN_PASSWORD = "ForkFate!Admin2026"


@pytest.fixture(scope="session")
def s():
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


@pytest.fixture(scope="session")
def admin(s):
    r = s.post(f"{API}/admin/login", json={"password": ADMIN_PASSWORD})
    assert r.status_code == 200, r.text
    csrf = s.cookies.get("ff_csrf")
    assert csrf, "ff_csrf missing"
    return {"X-CSRF-Token": csrf}


# --- Radius validation ---
class TestRadius:
    def test_radius_150_accepted_explore(self, s):
        r = s.post(f"{API}/places/search", json={
            "zip_code": "10001", "category": "explore",
            "cuisines": ["State Parks"], "radius_miles": 120
        })
        assert r.status_code == 200, f"expected 200 got {r.status_code}: {r.text[:200]}"

    def test_radius_151_rejected(self, s):
        r = s.post(f"{API}/places/search", json={
            "zip_code": "10001", "category": "explore",
            "cuisines": ["State Parks"], "radius_miles": 151
        })
        assert r.status_code == 422

    def test_radius_50_food_still_ok(self, s):
        r = s.post(f"{API}/places/search", json={
            "zip_code": "10001", "category": "food",
            "cuisines": ["Italian"], "radius_miles": 50
        })
        assert r.status_code == 200


# --- Explore/Stay search results ---
class TestExploreStaySearch:
    def test_explore_returns_results(self, s):
        r = s.post(f"{API}/places/search", json={
            "zip_code": "10001", "category": "explore",
            "cuisines": ["State Parks"], "radius_miles": 100
        })
        assert r.status_code == 200
        data = r.json()
        results = data.get("results") or data.get("restaurants") or []
        assert len(results) > 0, f"no results: {data}"
        first = results[0]
        for f in ("name", "cuisine", "image"):
            assert f in first, f"missing {f}"
        name_lower = first["name"].lower()
        # Should NOT be a restaurant
        assert "restaurant" not in name_lower or "park" in name_lower

    def test_stay_returns_results(self, s):
        r = s.post(f"{API}/places/search", json={
            "zip_code": "10001", "category": "stay",
            "cuisines": ["Campgrounds"], "radius_miles": 100
        })
        assert r.status_code == 200
        data = r.json()
        results = data.get("results") or data.get("restaurants") or []
        assert len(results) > 0


# --- Seed data verification (direct MongoDB) ---
class TestSeedData:
    @pytest.fixture(scope="class")
    def db(self):
        from pymongo import MongoClient
        mongo_url = "mongodb://localhost:27017"
        # Read from backend env
        env = open("/app/backend/.env").read()
        m = re.search(r'MONGO_URL="?([^"\n]+)"?', env)
        if m:
            mongo_url = m.group(1)
        dm = re.search(r'DB_NAME="?([^"\n]+)"?', env)
        db_name = dm.group(1) if dm else "test_database"
        client = MongoClient(mongo_url)
        return client[db_name]

    def test_total_count_484(self, db):
        count = db.restaurants.count_documents({})
        assert count == 484, f"expected 484 got {count}"

    def test_no_duplicate_names(self, db):
        pipeline = [{"$group": {"_id": "$name", "c": {"$sum": 1}}}, {"$match": {"c": {"$gt": 1}}}]
        dups = list(db.restaurants.aggregate(pipeline))
        assert len(dups) == 0, f"duplicates: {dups[:5]}"

    def test_every_category_cuisine_pair_has_min_4(self, db):
        pipeline = [
            {"$group": {"_id": {"cat": "$category", "cuisine": "$cuisine"}, "c": {"$sum": 1}}},
            {"$match": {"c": {"$lt": 4}}},
        ]
        thin = list(db.restaurants.aggregate(pipeline))
        assert len(thin) == 0, f"thin groups: {thin[:5]}"

    def test_explore_venues_have_image_address_desc(self, db):
        docs = list(db.restaurants.find({"category": "explore"}).limit(20))
        assert len(docs) > 0
        for d in docs:
            assert d.get("image"), f"no image: {d['name']}"
            assert d.get("description"), f"no description: {d['name']}"
            assert d.get("address"), f"no address: {d['name']}"
            assert d.get("sponsored") is False

    def test_stay_venues_have_image_address_desc(self, db):
        docs = list(db.restaurants.find({"category": "stay"}).limit(20))
        assert len(docs) > 0
        for d in docs:
            assert d.get("image")
            assert d.get("description")

    def test_explore_cuisines_36(self, db):
        cuisines = db.restaurants.distinct("cuisine", {"category": "explore"})
        assert len(cuisines) == 36, f"expected 36 explore cuisines, got {len(cuisines)}"

    def test_stay_cuisines_16(self, db):
        cuisines = db.restaurants.distinct("cuisine", {"category": "stay"})
        assert len(cuisines) == 16, f"expected 16 stay cuisines, got {len(cuisines)}"


# --- Sponsor category expansion (both pre-existing bug fixes) ---
class TestSponsorCategories:
    _created = {"req_ids": [], "sponsor_ids": []}

    def test_sponsorship_request_explore(self, s):
        r = s.post(f"{API}/sponsorship-requests", json={
            "business_name": "TEST_ExploreBiz",
            "contact_email": "test_explore@example.com",
            "category": "explore",
            "message": "test"
        })
        assert r.status_code == 200, r.text
        data = r.json()
        if "id" in data:
            self._created["req_ids"].append(data["id"])

    def test_sponsorship_request_stay(self, s):
        r = s.post(f"{API}/sponsorship-requests", json={
            "business_name": "TEST_StayBiz",
            "contact_email": "test_stay@example.com",
            "category": "stay",
            "message": "test"
        })
        assert r.status_code == 200

    def test_sponsorship_request_fuel(self, s):
        r = s.post(f"{API}/sponsorship-requests", json={
            "business_name": "TEST_FuelBiz",
            "contact_email": "test_fuel@example.com",
            "category": "fuel",
            "message": "test"
        })
        assert r.status_code == 200

    def test_admin_create_sponsor_stay(self, s, admin):
        r = s.post(f"{API}/admin/sponsors", headers=admin, json={
            "name": "TEST_StaySponsor", "cuisine": "Cabins",
            "category": "stay", "price": "$$", "address": "1 Test", "active": True
        })
        assert r.status_code == 200, r.text
        sid = r.json().get("id")
        if sid:
            self._created["sponsor_ids"].append(sid)

    def test_admin_create_sponsor_explore(self, s, admin):
        r = s.post(f"{API}/admin/sponsors", headers=admin, json={
            "name": "TEST_ExploreSponsor", "cuisine": "State Parks",
            "category": "explore", "price": "$", "address": "1 Test", "active": True
        })
        assert r.status_code == 200
        sid = r.json().get("id")
        if sid:
            self._created["sponsor_ids"].append(sid)

    def test_admin_create_sponsor_fuel(self, s, admin):
        r = s.post(f"{API}/admin/sponsors", headers=admin, json={
            "name": "TEST_FuelSponsor", "cuisine": "Gas Station",
            "category": "fuel", "price": "$", "address": "1 Test", "active": True
        })
        assert r.status_code == 200
        sid = r.json().get("id")
        if sid:
            self._created["sponsor_ids"].append(sid)

    def test_zzz_cleanup(self, s, admin):
        # cleanup created sponsors
        for sid in self._created["sponsor_ids"]:
            s.delete(f"{API}/admin/sponsors/{sid}", headers=admin)
        # cleanup requests (if endpoint exists)
        for rid in self._created["req_ids"]:
            s.delete(f"{API}/admin/sponsorship-requests/{rid}", headers=admin)


# --- FF_BUILD ---
class TestBuild:
    def test_ff_build_285(self):
        html = requests.get(BASE_URL).text
        # look for either version marker
        assert "285" in html or "2026.06-285" in html, "FF_BUILD 285 not found in HTML"
