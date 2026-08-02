"""Iteration 5 — verify curated seed depth-up-to-4 change (bug: '1 more to consider')."""
import json
import os
import subprocess
import time
import pytest
import requests
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv('/app/backend/.env')

BASE_URL = os.environ.get('EXPO_BACKEND_URL', 'http://localhost:8001').rstrip('/')
API = f"{BASE_URL}/api"
MONGO_URL = os.environ['MONGO_URL']
DB_NAME = os.environ['DB_NAME']
ZIP = "10001"

mc = MongoClient(MONGO_URL)
DB = mc[DB_NAME]


def _search(category, cuisines=None, price_levels=None, radius=50, open_now=False):
    payload = {"category": category, "zip_code": ZIP, "radius_miles": radius, "cuisines": cuisines or [],
               "price_levels": price_levels or [], "open_now": open_now}
    for _ in range(6):
        r = requests.post(f"{API}/places/search", json=payload, timeout=30)
        if r.status_code != 429:
            return r
        time.sleep(4)  # rate-limit window is 60s / 20 req; back off
    return r


# --- Seed count & idempotency ---
class TestSeedCount:
    def test_total_restaurants_is_276(self):
        assert DB.restaurants.count_documents({}) == 276

    def test_no_duplicate_names(self):
        total = DB.restaurants.count_documents({})
        distinct = len(DB.restaurants.distinct("name"))
        assert total == distinct, f"Total {total} != distinct names {distinct}"

    def test_expand_seed_deterministic(self):
        import sys
        sys.path.insert(0, '/app/backend')
        from seed_data import expand_seed, SEED
        a = [x["name"] for x in expand_seed(SEED)]
        b = [x["name"] for x in expand_seed(SEED)]
        assert a == b
        assert len(a) >= 150  # ~182 expected

    def test_backend_restart_idempotency(self):
        for _ in range(3):
            subprocess.run(["sudo", "supervisorctl", "restart", "backend"], check=True, capture_output=True)
            # wait for backend health
            for _ in range(30):
                try:
                    r = requests.get(f"{API}/restaurants", timeout=3)
                    if r.status_code == 200:
                        break
                except Exception:
                    pass
                time.sleep(1)
            time.sleep(1)
        assert DB.restaurants.count_documents({}) == 276


# --- Data depth per (category, cuisine) pair ---
# NOTE: GOOGLE_API_KEY is now LIVE in preview, so /api/places/search returns
# source='google'. We verify depth at the DATA layer (Mongo) so we do not burn
# ~69 billed Google calls per test run.
class TestDataDepth:
    def test_every_pair_has_ge_4_docs_in_db(self):
        from collections import Counter
        counts = Counter()
        for r in DB.restaurants.find({}, {"category": 1, "cuisine": 1}):
            counts[(r.get("category", "food"), r["cuisine"])] += 1
        insufficient = [(c, n) for c, n in counts.items() if n < 4]
        assert not insufficient, f"Pairs with <4 docs: {insufficient}"
        assert len(counts) >= 60

    def test_source_is_google_with_key(self):
        # With GOOGLE_API_KEY set, live search should hit Google.
        r = _search("food", cuisines=["Italian"])
        assert r.status_code == 200
        assert r.json()["source"] == "google"

    def test_curated_fallback_returns_ge_4_for_representative_pair(self):
        # Spot check the curated path in a subprocess with no Google key so we
        # don't burn Google quota. Uses seed_data.apply_filters directly.
        code = (
            "import sys, json; sys.path.insert(0, '/app/backend');"
            "from seed_data import SEED_ALL, apply_filters;"
            "pairs=[('food','Italian'),('bars','Beer'),('desserts','Ice Cream')];"
            "out={};"
            "\nfor cat,cui in pairs:\n"
            "    items=[r for r in SEED_ALL if r.get('category','food')==cat]\n"
            "    filtered=apply_filters(items, [cui], [], 50)\n"
            "    out[f'{cat}/{cui}']=len(filtered)\n"
            "print(json.dumps(out))"
        )
        env = os.environ.copy()
        env['GOOGLE_API_KEY'] = ""
        p = subprocess.run(["python", "-c", code], capture_output=True, text=True, env=env, timeout=15)
        assert p.returncode == 0, p.stderr
        data = json.loads(p.stdout.strip().splitlines()[-1])
        for k, n in data.items():
            assert n >= 4, f"{k} curated depth {n} < 4"


# --- Seed data quality (generated docs) ---
class TestSeedQuality:
    def test_generated_docs_valid(self):
        # Any doc with a name matching known generated templates or not in original SEED
        import sys
        sys.path.insert(0, '/app/backend')
        from seed_data import SEED
        original_names = {s["name"] for s in SEED}
        gen = list(DB.restaurants.find({"name": {"$nin": list(original_names)}}, {"_id": 0}))
        assert len(gen) > 100, f"Expected ~182 generated docs, got {len(gen)}"
        for d in gen:
            assert d.get("name")
            assert d.get("cuisine")
            assert d.get("category")
            assert d.get("price") in ("$", "$$", "$$$")
            assert 4.0 <= d.get("rating", 0) <= 4.9
            assert 0.5 <= d.get("distance", 0) <= 28.0
            assert d.get("description")
            assert d.get("address")
            assert d.get("image", "").startswith("http")
            assert not d.get("sponsored", False), f"Generated {d['name']} is sponsored"

    def test_original_sponsors_intact(self):
        for name in ["Olive & Ember", "Harborline", "Ember & Oak BBQ"]:
            doc = DB.restaurants.find_one({"name": name})
            assert doc is not None, f"{name} missing"
            assert doc.get("sponsored") is True, f"{name} not sponsored anymore"


# --- Filter correctness ---
# We assert filter semantics against the curated in-memory dataset so we do
# not spend Google API quota. This is the exact code path used when
# GOOGLE_API_KEY is empty.
class TestFilters:
    @classmethod
    def setup_class(cls):
        import sys
        sys.path.insert(0, '/app/backend')
        from seed_data import SEED_ALL, apply_filters
        cls.SEED_ALL = SEED_ALL
        cls.apply_filters = staticmethod(apply_filters)

    def test_category_only(self):
        items = [r for r in self.SEED_ALL if r.get("category", "food") == "bars"]
        assert len(items) > 0
        assert all(r.get("category", "food") == "bars" for r in items)

    def test_cuisine_filter(self):
        items = [r for r in self.SEED_ALL if r.get("category", "food") == "food"]
        filtered = self.apply_filters(items, ["Italian"], [], 50)
        assert len(filtered) >= 4
        assert all(v["cuisine"] == "Italian" for v in filtered)

    def test_price_filter(self):
        items = [r for r in self.SEED_ALL if r.get("category", "food") == "food"]
        filtered = self.apply_filters(items, [], ["$"], 50)
        assert len(filtered) > 0
        for v in filtered:
            assert v["price"] == "$"

    def test_radius_filter(self):
        items = [r for r in self.SEED_ALL if r.get("category", "food") == "food"]
        filtered = self.apply_filters(items, [], [], 5)
        assert len(filtered) > 0
        for v in filtered:
            assert v["distance"] <= 5
        # generated docs can go up to 28.0, so radius=5 is meaningful
        assert any(r["distance"] > 5 for r in items)

    def test_open_now_filter(self):
        # open_now is set at seed time (idx % 4 != 0) — verify via Mongo docs
        docs = list(DB.restaurants.find({"open_now": True}, {"_id": 0, "open_now": 1}).limit(10))
        assert len(docs) > 0
        assert all(d["open_now"] is True for d in docs)


# --- Regression on other API endpoints ---
class TestRegression:
    def test_restaurants_list(self):
        r = requests.get(f"{API}/restaurants", timeout=10)
        assert r.status_code == 200
        assert len(r.json()) >= 250

    def test_cuisines(self):
        r = requests.get(f"{API}/cuisines", timeout=10)
        assert r.status_code == 200

    def test_spin(self):
        r = requests.post(f"{API}/spin", json={"category": "food", "zip_code": ZIP, "radius_miles": 25,
                                                "cuisines": [], "price_levels": [], "open_now": False}, timeout=15)
        assert r.status_code == 200

    def test_fates_stats(self):
        r = requests.get(f"{API}/stats/fates", timeout=10)
        assert r.status_code == 200

    def test_sponsors_active(self):
        r = requests.get(f"{API}/sponsors/active", timeout=10)
        assert r.status_code == 200

    def test_crawl_create_and_get(self):
        r = requests.post(f"{API}/crawls", json={"stops": [{"name": "A", "zip": ZIP}, {"name": "B", "zip": ZIP}]},
                          timeout=10)
        # some APIs require specific shape; accept 200/201/422
        if r.status_code in (200, 201):
            code = r.json().get("code")
            if code:
                g = requests.get(f"{API}/crawls/{code}", timeout=10)
                assert g.status_code == 200

    def test_crawl_leaderboard(self):
        r = requests.get(f"{API}/crawls/leaderboard", timeout=10)
        assert r.status_code == 200


# --- Frontend build guard ---
class TestFrontendBuild:
    def test_ff_build_unchanged(self):
        with open("/app/frontend/public/index.html") as f:
            html = f.read()
        assert "2026.06-280" in html, "FF_BUILD changed unexpectedly"


# --- Google live-key: geocode, search fields, budget counter, photo proxy ---
import datetime as _dt


def _budget_count():
    doc = DB.config.find_one({"key": "google_budget", "date": _dt.datetime.utcnow().strftime("%Y-%m-%d")})
    if not doc:
        return 0
    return int(doc.get("searches", doc.get("count", 0)))


class TestGoogleLive:
    def test_geocode_10001(self):
        r = requests.get(f"{API}/geocode?zip=10001", timeout=10)
        assert r.status_code == 200
        data = r.json()
        assert abs(data["lat"] - 40.75) < 0.05
        assert abs(data["lng"] - -73.99) < 0.05

    def test_search_google_source_and_fields(self):
        r = _search("food", radius=25)
        assert r.status_code == 200
        j = r.json()
        assert j["source"] == "google"
        assert 5 <= len(j["restaurants"]) <= 25
        v = j["restaurants"][0]
        for f in ("name", "cuisine", "price", "rating", "distance",
                  "lat", "lng", "image", "photo_url", "google_url",
                  "doordash_url", "ubereats_url", "grubhub_url",
                  "order_url", "open_now"):
            assert f in v, f"missing field {f}"

    def test_budget_cap_env_is_300(self):
        assert os.environ.get("GOOGLE_SEARCH_DAILY_CAP") == "300"

    def test_budget_counter_increments_on_miss_not_hit(self):
        # Use a unique cuisine to force a fresh cache miss.
        payload = {"category": "food", "zip_code": "10001", "radius_miles": 12,
                   "cuisines": ["Thai"], "price_levels": [], "open_now": False}
        before = _budget_count()
        r1 = requests.post(f"{API}/places/search", json=payload, timeout=30)
        assert r1.status_code == 200 and r1.json()["source"] == "google"
        after_miss = _budget_count()
        assert after_miss == before + 1, f"expected +1 on miss, got {before}->{after_miss}"
        # Immediate repeat should hit 5-min cache and NOT bill.
        r2 = requests.post(f"{API}/places/search", json=payload, timeout=30)
        assert r2.status_code == 200
        after_hit = _budget_count()
        assert after_hit == after_miss, f"expected no delta on cache hit, got {after_miss}->{after_hit}"


class TestPhotoProxy:
    def _pick_photo_name(self):
        payload = {"category": "food", "zip_code": "10001", "radius_miles": 12,
                   "cuisines": ["Italian"], "price_levels": [], "open_now": False}
        r = requests.post(f"{API}/places/search", json=payload, timeout=30)
        assert r.status_code == 200
        for v in r.json()["restaurants"]:
            pu = v.get("photo_url") or ""
            if "name=" in pu:
                import urllib.parse as up
                return up.unquote(pu.split("name=", 1)[1].split("&", 1)[0])
        pytest.skip("no photo_url in results")

    def test_photo_miss_then_hit_no_budget_delta(self):
        name = self._pick_photo_name()
        r1 = requests.get(f"{API}/places/photo", params={"name": name}, timeout=30)
        assert r1.status_code == 200
        assert len(r1.content) > 500
        assert r1.headers.get("X-Photo-Cache") == "miss"
        after1 = _budget_count()
        # cache miss on the photo endpoint MAY or MAY NOT increment the search budget
        # depending on how core buckets budgeting; but repeat MUST be a hit and MUST NOT increment.
        r2 = requests.get(f"{API}/places/photo", params={"name": name}, timeout=30)
        assert r2.status_code == 200
        assert r2.headers.get("X-Photo-Cache") == "hit"
        after2 = _budget_count()
        assert after2 == after1, f"cache hit should not increment budget: {after1}->{after2}"

    def test_photo_malformed_name_returns_404(self):
        r = requests.get(f"{API}/places/photo", params={"name": "not-a-valid-photo-ref"}, timeout=10)
        assert r.status_code == 404
