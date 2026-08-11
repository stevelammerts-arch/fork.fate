"""Iteration 8 adversarial coverage: CSRF matrix, Bearer precedence, IP handling."""
import os
import time
import asyncio
import pytest
import requests

BASE = "http://localhost:8001"
# Cookie/CSRF tests need https (Secure cookies) + real ingress:
EXT = os.environ.get("FF_EXTERNAL_BASE_URL", BASE).rstrip("/")
PWD = os.environ["ADMIN_PASSWORD"]


def _clear_lockout(*ips):
    """Targeted cleanup so subsequent runs are not locked out. Deleting ALL
    docs raced with parallel workers' in-flight lockout tests — only remove
    the IPs this test actually used (default: this module's fake client IP)."""
    from pymongo import MongoClient
    mc = MongoClient(os.environ.get("MONGO_URL", "mongodb://localhost:27017"))
    dbn = os.environ.get("DB_NAME", "test_database")
    targets = [ip for ip in (ips or ()) if ip]
    if not targets:
        targets = [os.environ.get("FF_TEST_CLIENT_IP", ""), "127.0.0.1"]
        targets = [t for t in targets if t]
    mc[dbn].login_failures.delete_many({"_id": {"$in": targets}})


@pytest.fixture(scope="module", autouse=True)
def _reset():
    # Clear this module's default IP plus every hardcoded IP the lockout
    # tests use, so a previous run inside the lockout window can't 429 us.
    _HARDCODED = ("198.51.100.42", "198.51.100.43", "198.51.100.44",
                  "198.51.100.50", "198.51.100.51",
                  "192.0.2.100", "192.0.2.200", "9.9.9.9")
    _clear_lockout(*_HARDCODED)
    yield
    _clear_lockout(*_HARDCODED)


@pytest.fixture
def admin_session():
    s = requests.Session()
    # Use a spoofed IP so we don't collide with other tests hitting real IP.
    r = s.post(f"{EXT}/api/admin/login", json={"password": PWD})
    assert r.status_code == 200, r.text
    assert "ff_admin" in s.cookies, "missing ff_admin cookie"
    assert "ff_csrf" in s.cookies, "missing ff_csrf cookie"
    return s


# ============ CSRF ENFORCEMENT MATRIX ============
class TestCSRFMatrix:
    def test_a_safe_methods_no_csrf(self, admin_session):
        # GET should work without CSRF header
        r = admin_session.get(f"{EXT}/api/admin/verify")
        assert r.status_code == 200

    def test_b_unsafe_no_header_blocked(self, admin_session):
        r = admin_session.delete(f"{EXT}/api/admin/beta-testers",
                                 params={"email": "nobody@example.com"})
        assert r.status_code == 403
        assert "CSRF" in r.json().get("detail", "")

    def test_c_unsafe_wrong_header_blocked(self, admin_session):
        r = admin_session.delete(f"{EXT}/api/admin/beta-testers",
                                 params={"email": "nobody@example.com"},
                                 headers={"X-CSRF-Token": "wrong-value"})
        assert r.status_code == 403

    def test_d_correct_header_passes(self, admin_session):
        csrf = admin_session.cookies.get("ff_csrf")
        r = admin_session.delete(f"{EXT}/api/admin/beta-testers",
                                 params={"email": "nobody@example.com"},
                                 headers={"X-CSRF-Token": csrf})
        assert r.status_code == 200

    def test_e_header_only_no_cookie(self, admin_session):
        # Send correct CSRF header but strip cookies entirely: should be 401
        # (no auth at all since no ff_admin).
        csrf = admin_session.cookies.get("ff_csrf")
        r = requests.delete(f"{BASE}/api/admin/beta-testers",
                            params={"email": "nobody@example.com"},
                            headers={"X-CSRF-Token": csrf})
        assert r.status_code == 401

    def test_f_cross_session_csrf(self, admin_session):
        # Log in as a second session; use session1's ff_admin cookie
        # but session2's ff_csrf cookie + header. Documents behaviour.
        s2 = requests.Session()
        r = s2.post(f"{BASE}/api/admin/login", json={"password": PWD},
                    headers={"CF-Connecting-IP": "203.0.113.8"})
        assert r.status_code == 200
        csrf2 = s2.cookies.get("ff_csrf")
        cookies = {"ff_admin": admin_session.cookies.get("ff_admin"),
                   "ff_csrf": csrf2}
        r = requests.delete(f"{BASE}/api/admin/beta-testers",
                            params={"email": "nobody@example.com"},
                            cookies=cookies,
                            headers={"X-CSRF-Token": csrf2})
        # Double-submit does not bind CSRF to session — expected to pass.
        assert r.status_code == 200, f"cross-session CSRF result: {r.status_code} {r.text}"


# ============ BEARER TOKEN PRECEDENCE ============
class TestBearerPrecedence:
    def test_bearer_only_no_csrf_needed(self):
        # Log in, extract cookie JWT (same as bearer), then use as Bearer
        s = requests.Session()
        r = s.post(f"{BASE}/api/admin/login", json={"password": PWD},
                   headers={"CF-Connecting-IP": "203.0.113.9"})
        assert r.status_code == 200
        token = s.cookies.get("ff_admin")
        # Bearer with no cookies, no CSRF header - should succeed on unsafe method
        r = requests.delete(f"{BASE}/api/admin/beta-testers",
                            params={"email": "nobody@example.com"},
                            headers={"Authorization": f"Bearer {token}"})
        assert r.status_code == 200

    def test_invalid_cookie_plus_valid_bearer_wins_cookie(self):
        # Cookie precedence: invalid ff_admin cookie should cause 401 
        # even with valid Bearer (documenting regression risk).
        s = requests.Session()
        r = s.post(f"{BASE}/api/admin/login", json={"password": PWD},
                   headers={"CF-Connecting-IP": "203.0.113.10"})
        token = s.cookies.get("ff_admin")
        r = requests.get(f"{BASE}/api/admin/verify",
                         cookies={"ff_admin": "garbage-token"},
                         headers={"Authorization": f"Bearer {token}"})
        # Documented as intentional: cookie wins => 401.
        assert r.status_code == 401, f"expected cookie precedence 401, got {r.status_code}"


# ============ LOGIN LOCKOUT (MongoDB-backed) ============
class TestLockout:
    def test_lockout_after_8_failures(self):
        ip = "198.51.100.42"
        _clear_lockout(ip)
        # 8 wrong attempts should be allowed to reach password check (401)
        for i in range(8):
            r = requests.post(f"{BASE}/api/admin/login",
                              json={"password": "wrong"},
                              headers={"CF-Connecting-IP": ip})
            assert r.status_code == 401, f"attempt {i+1}: {r.status_code} {r.text}"
        # 9th with CORRECT password should now be locked out (429)
        r = requests.post(f"{BASE}/api/admin/login",
                          json={"password": PWD},
                          headers={"CF-Connecting-IP": ip})
        assert r.status_code == 429
        assert "failed attempts" in r.json().get("detail", "").lower()

    def test_lockout_doc_shape_and_slice(self):
        ip = "198.51.100.43"
        _clear_lockout(ip)
        # 30 failures to test $slice caps at 16
        for i in range(30):
            requests.post(f"{BASE}/api/admin/login",
                          json={"password": "wrong"},
                          headers={"CF-Connecting-IP": ip})
        from pymongo import MongoClient
        from datetime import datetime
        mc = MongoClient(os.environ.get("MONGO_URL"))
        dbn = os.environ.get("DB_NAME", "test_database")
        doc = mc[dbn].login_failures.find_one({"_id": ip})
        assert doc is not None
        assert len(doc.get("fails", [])) <= 16, f"fails length {len(doc['fails'])} > 16"
        assert isinstance(doc.get("expire_at"), datetime), "expire_at not datetime"

    def test_ttl_index_present(self):
        from pymongo import MongoClient
        mc = MongoClient(os.environ.get("MONGO_URL"))
        dbn = os.environ.get("DB_NAME", "test_database")
        idx = mc[dbn].login_failures.index_information()
        assert "expire_at_1" in idx, f"ttl index missing: {list(idx.keys())}"
        assert idx["expire_at_1"].get("expireAfterSeconds") == 0

    def test_successful_login_clears_failures(self):
        ip = "198.51.100.44"
        _clear_lockout(ip)
        for _ in range(3):
            requests.post(f"{BASE}/api/admin/login",
                          json={"password": "wrong"},
                          headers={"CF-Connecting-IP": ip})
        # Successful login
        r = requests.post(f"{BASE}/api/admin/login",
                          json={"password": PWD},
                          headers={"CF-Connecting-IP": ip})
        assert r.status_code == 200
        from pymongo import MongoClient
        mc = MongoClient(os.environ.get("MONGO_URL"))
        dbn = os.environ.get("DB_NAME", "test_database")
        doc = mc[dbn].login_failures.find_one({"_id": ip})
        assert doc is None, "login_failures doc not cleared"


# ============ LOCKOUT TIMING SIDE-CHANNEL ============
class TestLockoutTiming:
    def test_locked_branch_sleeps_at_least_400ms(self):
        ip = "198.51.100.50"
        _clear_lockout(ip)
        for _ in range(8):
            requests.post(f"{BASE}/api/admin/login",
                          json={"password": "wrong"},
                          headers={"CF-Connecting-IP": ip})
        t0 = time.time()
        r = requests.post(f"{BASE}/api/admin/login",
                          json={"password": "wrong"},
                          headers={"CF-Connecting-IP": ip})
        dt = time.time() - t0
        assert r.status_code == 429
        assert dt >= 0.4, f"locked delay too short: {dt:.3f}s"

    def test_concurrent_get_not_blocked_by_sleep(self):
        ip = "198.51.100.51"
        _clear_lockout(ip)
        for _ in range(8):
            requests.post(f"{BASE}/api/admin/login",
                          json={"password": "wrong"},
                          headers={"CF-Connecting-IP": ip})
        # Kick off locked login (0.5s sleep) and a plain GET concurrently.
        import threading
        results = {}
        def do_locked():
            t0 = time.time()
            requests.post(f"{BASE}/api/admin/login",
                          json={"password": "wrong"},
                          headers={"CF-Connecting-IP": ip}, timeout=5)
            results["locked_dt"] = time.time() - t0
        def do_get():
            time.sleep(0.05)  # ensure locked started
            t0 = time.time()
            requests.get(f"{BASE}/api/", timeout=5)
            results["get_dt"] = time.time() - t0
        t1 = threading.Thread(target=do_locked)
        t2 = threading.Thread(target=do_get)
        t1.start(); t2.start()
        t1.join(); t2.join()
        # If sleep blocked event loop, GET would take ~0.5s. Should be <0.3s.
        assert results["get_dt"] < 0.3, f"event loop blocked: GET took {results['get_dt']:.3f}s"


# ============ IP HANDLING ============
class TestIPHandling:
    def test_cf_connecting_ip_isolates_buckets(self):
        ip_a = "192.0.2.100"
        ip_b = "192.0.2.200"
        _clear_lockout(ip_a, ip_b)
        for _ in range(8):
            requests.post(f"{BASE}/api/admin/login",
                          json={"password": "wrong"},
                          headers={"CF-Connecting-IP": ip_a})
        # ip_a locked
        r = requests.post(f"{BASE}/api/admin/login",
                          json={"password": PWD},
                          headers={"CF-Connecting-IP": ip_a})
        assert r.status_code == 429
        # ip_b still allowed
        r = requests.post(f"{BASE}/api/admin/login",
                          json={"password": PWD},
                          headers={"CF-Connecting-IP": ip_b})
        assert r.status_code == 200
        # Confirm doc keyed by ip_a
        from pymongo import MongoClient
        mc = MongoClient(os.environ.get("MONGO_URL"))
        dbn = os.environ.get("DB_NAME", "test_database")
        assert mc[dbn].login_failures.find_one({"_id": ip_a}) is not None

    def test_xff_right_to_left_skip_infra(self):
        # Send XFF with public then private then loopback.
        # Expected chosen IP = 9.9.9.9 (rightmost non-infra).
        ip = "9.9.9.9"
        _clear_lockout(ip)
        for _ in range(8):
            requests.post(f"{BASE}/api/admin/login",
                          json={"password": "wrong"},
                          headers={"X-Forwarded-For": "1.1.1.1, 9.9.9.9, 10.0.0.5, 127.0.0.1"})
        r = requests.post(f"{BASE}/api/admin/login",
                          json={"password": PWD},
                          headers={"X-Forwarded-For": "1.1.1.1, 9.9.9.9, 10.0.0.5, 127.0.0.1"})
        assert r.status_code == 429, f"XFF right-to-left parsing broken: {r.status_code}"
        from pymongo import MongoClient
        mc = MongoClient(os.environ.get("MONGO_URL"))
        dbn = os.environ.get("DB_NAME", "test_database")
        assert mc[dbn].login_failures.find_one({"_id": ip}) is not None

    def test_malformed_xff_fails_safe(self):
        # Malformed values should NOT raise; falls back to socket peer.
        r = requests.post(f"{BASE}/api/admin/login",
                          json={"password": "wrong"},
                          headers={"X-Forwarded-For": "not-an-ip, ,,"})
        # 401 (or 429 if peer is already locked from earlier); anything but 500.
        assert r.status_code in (401, 429), r.status_code


# ============ SMOKE ============
class TestSmoke:
    def test_root(self):
        r = requests.get(f"{BASE}/api/")
        assert r.status_code == 200

    def test_leaderboard(self):
        r = requests.get(f"{BASE}/api/crawls/leaderboard")
        assert r.status_code == 200
