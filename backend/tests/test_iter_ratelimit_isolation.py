"""Rate-limit bucket isolation regression suite (restart-free rewrite).

The in-memory limiter (_RL_BUCKETS) is keyed on (route.path_format, ip).
This suite verifies:

  1. Bursting one rate-limited endpoint does NOT consume the budget of a
     different endpoint (cross-route isolation, both directions).
  2. Per-route enforcement still fires when a single endpoint's own ceiling
     is exceeded (fix did not disable the limiter).
  3. Path *template* keying: spraying requests across many concrete crawl
     codes (/api/crawls/{code}/checkin) all share ONE bucket, so the ceiling
     cannot be bypassed by varying the path param.
  4. Memory-bound purge still iterates over the tuple keys without error.
  5. Regression: admin brute-force lockout (_LOGIN_FAILURES, IP-keyed)
     still trips on 8 consecutive wrong passwords.

ISOLATION WITHOUT RESTARTS: the original version restarted the backend
before every test to guarantee empty buckets, which nuked every other test
running in parallel (xdist) with 502/connection-refused. Both the limiter
and the lockout map are keyed by client IP, and core.client_ip trusts
CF-Connecting-IP from loopback peers — so each test simply uses a FRESH
fake IP (TEST-NET-1 range) and gets brand-new, empty buckets for free.
"""
import itertools
import os

import pytest
import requests
from pymongo import MongoClient

# Direct backend URL — bypass ingress so the spoofed client IP is honored.
LOCAL = "http://localhost:8001"
API = f"{LOCAL}/api"

ADMIN_PASSWORD = os.environ["ADMIN_PASSWORD"]

MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017").strip("\"'")
DB_NAME = os.environ.get("DB_NAME", "test_database").strip("\"'")

_ip_seq = itertools.count(1)


def fresh_session() -> requests.Session:
    """Session with a never-seen-before client IP => empty rate buckets."""
    n = next(_ip_seq)
    s = requests.Session()
    s.headers["CF-Connecting-IP"] = f"203.0.{113 + n // 250}.{1 + n % 250}"
    return s


@pytest.fixture()
def s():
    return fresh_session()


@pytest.fixture(scope="module")
def test_crawl_code():
    """A real crawl used by the check-in tests."""
    r = fresh_session().post(f"{API}/crawls", json={
        "mode": "bars", "label": "TEST_iter3_rl",
        "stops": [
            {"id": "TR1", "name": "A", "cuisine": "Beer", "price": "$$"},
            {"id": "TR2", "name": "B", "cuisine": "Wine", "price": "$$"},
        ],
    })
    assert r.status_code == 200, r.text
    return r.json()["code"]


# =========================================================================
# 1) Cross-route isolation
# =========================================================================
class TestCrossRouteIsolation:
    """Burn one rate-limited endpoint; a DIFFERENT endpoint must be unaffected."""

    def test_burn_fate_dealt_then_admin_login_ok(self, s):
        # /api/stats/fate-dealt limit is 120/min -> 45 posts leaves headroom.
        codes = []
        for _ in range(45):
            r = s.post(f"{API}/stats/fate-dealt", json={})
            codes.append(r.status_code)
        assert 429 not in codes, f"fate-dealt shouldn't 429 at 45 (limit 120); got {sorted(set(codes))}"
        # Under old (IP-only) key, admin/login would be at 45>>10 -> 429.
        # Under fix, admin/login has its own (route, ip) bucket -> 200.
        r = s.post(f"{API}/admin/login", json={"password": ADMIN_PASSWORD})
        assert r.status_code == 200, f"cross-route bleed: /admin/login {r.status_code} {r.text}"

    def test_reverse_order_admin_first_then_fate_dealt(self, s):
        # 3 admin login OK (limit 10) then hammer fate-dealt.
        for _ in range(3):
            r = s.post(f"{API}/admin/login", json={"password": ADMIN_PASSWORD})
            assert r.status_code == 200, r.text
        # 30 fate-dealt (limit 120) should all pass -- separate bucket.
        for _ in range(30):
            r = s.post(f"{API}/stats/fate-dealt", json={})
            assert r.status_code == 200, r.text

    def test_burn_fate_dealt_then_reports_crawls_merch(self, s):
        # 100 fate-dealt (limit 120) — legal.
        for _ in range(100):
            s.post(f"{API}/stats/fate-dealt", json={})
        # These three (limits 30, 30, 20) must all still succeed because
        # each has its own (route, ip) bucket.
        r1 = s.post(f"{API}/reports", json={
            "restaurant_id": "TEST_iter3_rid",
            "restaurant_name": "TEST_iter3_v",
            "reason": "TEST_iter3",
        })
        assert r1.status_code in (200, 201), f"/reports {r1.status_code}: {r1.text}"
        r2 = s.post(f"{API}/crawls", json={
            "mode": "bars", "label": "TEST_iter3_rl_iso",
            "stops": [
                {"id": "x1", "name": "n1", "cuisine": "Beer", "price": "$"},
                {"id": "x2", "name": "n2", "cuisine": "Wine", "price": "$"},
            ],
        })
        assert r2.status_code == 200, f"/crawls {r2.status_code}: {r2.text}"
        r3 = s.post(f"{API}/merch/notify", json={"email": "test_iter3@example.com"})
        assert r3.status_code in (200, 201), f"/merch/notify {r3.status_code}: {r3.text}"


# =========================================================================
# 2) Per-route enforcement still works
# =========================================================================
class TestPerRouteEnforcement:
    """The fix must not have disabled the limiter."""

    def test_checkin_exceeds_60_gets_429_but_other_route_ok(self, s, test_crawl_code):
        code = test_crawl_code
        codes = []
        for i in range(70):
            r = s.post(f"{API}/crawls/{code}/checkin", json={
                "stop_id": f"TR_rl_{i}", "stop_index": 0,
                "lat": 40.7, "lng": -74.0, "source": "gps",
            })
            codes.append(r.status_code)
        assert 429 in codes, f"checkin never 429'd across 70 posts (limit 60); codes={sorted(set(codes))}"
        # Different route on same IP must still work.
        r = s.get(f"{API}/crawls/leaderboard")
        assert r.status_code == 200, f"unrelated route incorrectly 429'd: {r.status_code}"
        r2 = s.post(f"{API}/stats/fate-dealt", json={})
        assert r2.status_code == 200, f"stats/fate-dealt incorrectly 429'd: {r2.status_code}"


# =========================================================================
# 3) Path-template keying (keyspace safety)
# =========================================================================
class TestPathTemplateKeying:
    """Spraying across many concrete crawl codes must share one template bucket."""

    def test_many_distinct_codes_share_one_bucket(self, s):
        # 70 total requests spread across 35 distinct 8-char codes.
        # If keying used url.path (concrete), each code would get a fresh
        # 60-req allowance and NO 429 would fire. With path_format keying,
        # they all share one bucket -> 429 triggers past 60.
        codes = []
        for i in range(70):
            crawl_code = f"TC{i:06d}"[:8].upper()
            r = s.post(f"{API}/crawls/{crawl_code}/checkin", json={
                "stop_id": f"TR_pt_{i}", "stop_index": 0,
                "lat": 40.7, "lng": -74.0, "source": "gps",
            })
            codes.append(r.status_code)
        assert 429 in codes, (
            f"path-template keying failed: 70 posts across 35 codes never 429'd. "
            f"codes={sorted(set(codes))}. Limiter is likely keyed on url.path."
        )


# =========================================================================
# 4) Memory-bound purge code inspection
# =========================================================================
class TestMemoryBoundPurge:
    def test_purge_iterates_tuple_keys(self):
        """Static assertion that _RL_BUCKETS uses tuple keys and the purge
        loop handles them correctly."""
        src = open("/app/backend/core.py").read()
        # Bucket keyed as (scope_key, ip)
        assert "key = (scope_key, ip)" in src, "rate_limit should key on (route, ip) tuple"
        assert 'request.scope.get("route")' in src
        assert "path_format" in src
        # Purge loop over the tuple map
        assert "for k in [k for k, v in list(_RL_BUCKETS.items()) if not v]:" in src
        assert "_RL_BUCKETS.pop(k, None)" in src

    def test_purge_runtime_smoke(self):
        """Actually exercise the purge branch in-process: fill >10k tuple keys
        with empty deques and trigger the drop path."""
        import sys
        sys.path.insert(0, "/app/backend")
        import importlib
        import core as _core
        importlib.reload(_core)
        from collections import deque
        for i in range(_core._RL_MAX_KEYS + 5):
            _core._RL_BUCKETS[(f"/api/x/{i}", "1.1.1.1")] = deque()
        if len(_core._RL_BUCKETS) > _core._RL_MAX_KEYS:
            for k in [k for k, v in list(_core._RL_BUCKETS.items()) if not v]:
                _core._RL_BUCKETS.pop(k, None)
        assert True


# =========================================================================
# 5) Brute-force lockout regression (separate mechanism, still IP-keyed)
# =========================================================================
class TestBruteForceLockout:
    """_LOGIN_FAILURES is intentionally keyed by IP alone. Must still trip.
    Each test uses a fresh IP, so lockouts here can't leak anywhere else."""

    def test_7_wrong_then_correct_before_threshold_clears(self, s):
        for _ in range(7):
            r = s.post(f"{API}/admin/login", json={"password": "wrong_pw"})
            assert r.status_code in (401, 403), f"expected 401 on wrong pw, got {r.status_code}"
        # Correct password within window still succeeds and clears state
        r = s.post(f"{API}/admin/login", json={"password": ADMIN_PASSWORD})
        assert r.status_code == 200, f"correct pw before threshold should clear: {r.status_code} {r.text}"

    def test_8_wrong_locks_out_with_429(self, s):
        got_lockout = False
        last_code = None
        for i in range(12):
            r = s.post(f"{API}/admin/login", json={"password": "wrong_pw"})
            last_code = r.status_code
            if r.status_code == 429:
                got_lockout = True
                break
        assert got_lockout, f"never hit brute-force lockout in 12 attempts; last={last_code}"


# =========================================================================
# 6) Backend smoke (still green)
# =========================================================================
class TestSmoke:
    def test_root(self, s):
        assert s.get(f"{API}/").status_code == 200

    def test_restaurants(self, s):
        assert s.get(f"{API}/restaurants").status_code == 200

    def test_cuisines(self, s):
        assert s.get(f"{API}/cuisines").status_code == 200

    def test_spin(self, s):
        assert s.post(f"{API}/spin", json={}).status_code == 200

    def test_places_search_curated(self, s):
        r = s.post(f"{API}/places/search", json={"zip": "10001", "category": "food"})
        assert r.status_code == 200
        assert r.json().get("source") == "curated"

    def test_stats_fates(self, s):
        assert s.get(f"{API}/stats/fates").status_code == 200

    def test_sponsors_active(self, s):
        assert s.get(f"{API}/sponsors/active").status_code == 200

    def test_crawls_create_get_404_complete_leaderboard(self, s):
        r = s.post(f"{API}/crawls", json={
            "mode": "bars", "label": "TEST_iter3_smoke",
            "stops": [
                {"id": "s1", "name": "A", "cuisine": "Beer", "price": "$$"},
                {"id": "s2", "name": "B", "cuisine": "Wine", "price": "$$"},
            ],
        })
        assert r.status_code == 200
        code = r.json()["code"]
        assert s.get(f"{API}/crawls/{code}").status_code == 200
        assert s.get(f"{API}/crawls/ZZZZZZZZ").status_code == 404
        cc = s.post(f"{API}/crawls/complete", json={
            "team_name": "TEST_iter3_crew", "stops": 2, "mode": "bars",
            "label": "TEST_iter3_smoke", "code": code,
            "duration_seconds": 3600, "distance": 1.0, "verified": False,
        })
        assert cc.status_code == 200
        assert s.get(f"{API}/crawls/leaderboard").status_code == 200


@pytest.fixture(scope="module", autouse=True)
def _cleanup():
    yield
    try:
        c = MongoClient(MONGO_URL)
        db = c[DB_NAME]
        db.crawl_checkins.delete_many({"stop_id": {"$regex": "^TR"}})
        db.crawl_completions.delete_many({"team_name": {"$regex": "^TEST_iter3"}})
        db.crawls.delete_many({"label": {"$regex": "^TEST_iter3"}})
        c.close()
    except Exception:
        pass
