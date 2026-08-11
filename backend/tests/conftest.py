"""Shared pytest fixtures / env bootstrap for the Fork·Fate backend test suite.

Loads `/app/backend/.env` up-front so every test module can rely on
`os.environ["ADMIN_PASSWORD"]` and other credentials without duplicating the
value inline. Hardcoded secrets in test files were flagged by the security
review; centralising here keeps the source of truth in `.env` (git-ignored).

REGRESSION MODE (default): tests hit the backend DIRECTLY at
http://localhost:8001 — running 500+ tests through the public ingress causes
sporadic 502s and shares one rate-limit bucket across the whole suite. Each
test module is also given its own fake client IP (CF-Connecting-IP, trusted
from loopback peers per core.client_ip) so one module's rate-limit
consumption can't 429 the next. Set FF_TEST_EXTERNAL=1 to run end-to-end
through the real preview URL instead.
"""
import itertools
import os
import time

import pytest
import requests
from dotenv import load_dotenv

load_dotenv("/app/backend/.env")
load_dotenv("/app/frontend/.env")

# The real https preview URL — cookie-semantics tests (Secure cookies are not
# sent over plain http) and Origin-validation tests must use this.
os.environ.setdefault("FF_EXTERNAL_BASE_URL", os.environ["REACT_APP_BACKEND_URL"])

if os.environ.get("FF_TEST_EXTERNAL", "").strip() not in ("1", "true", "yes"):
    # Frontend static assets (audio/sprites) aren't served by the backend —
    # point asset checks at the CRA dev server instead of the ingress.
    os.environ["FF_ASSET_BASE_URL"] = "http://localhost:3000"
    os.environ["REACT_APP_BACKEND_URL"] = "http://localhost:8001"
else:
    os.environ["FF_ASSET_BASE_URL"] = os.environ["REACT_APP_BACKEND_URL"]

_ip_counter = itertools.count(1)
_RUN_SALT = int(time.time()) % 250  # unique-ish per pytest invocation so
# back-to-back runs within one rate-limit window don't share buckets


@pytest.fixture(autouse=True, scope="module")
def _isolated_rate_limit_bucket():
    """Give every test module its own client IP (TEST-NET-2 range) so the
    per-(route, IP) rate limiter treats each module as a separate visitor.
    Tests that set their own CF-Connecting-IP keep theirs (setdefault)."""
    n = next(_ip_counter)
    # xdist runs each worker in its own process (own counter) — fold the
    # worker id into the IP so gw0's module #3 != gw1's module #3.
    wnum = int(os.environ.get("PYTEST_XDIST_WORKER", "gw0").replace("gw", "") or 0)
    ip = f"198.{51 + wnum}.{_RUN_SALT}.{1 + n % 250}"
    os.environ["FF_TEST_CLIENT_IP"] = ip  # so tests can target their own lockout docs
    orig = requests.sessions.Session.request

    def patched(self, method, url, **kw):
        if not url.startswith(("http://localhost", "http://127.")):
            # Cloudflare rejects client-supplied CF-Connecting-IP (error 1000)
            # — only spoof against the local backend.
            return orig(self, method, url, **kw)
        headers = kw.get("headers") or {}
        has_own = (
            "CF-Connecting-IP" in headers or "cf-connecting-ip" in headers
            or "CF-Connecting-IP" in self.headers  # session-level (case-insensitive)
            or "X-Forwarded-For" in headers or "x-forwarded-for" in headers  # IP-semantics tests
        )
        if not has_own:
            headers["CF-Connecting-IP"] = ip
            kw["headers"] = headers
        return orig(self, method, url, **kw)

    requests.sessions.Session.request = patched
    yield
    requests.sessions.Session.request = orig


@pytest.fixture(scope="session")
def admin_password() -> str:
    pw = os.environ.get("ADMIN_PASSWORD")
    if not pw:
        pytest.skip("ADMIN_PASSWORD not set in backend/.env")
    return pw


@pytest.fixture(scope="session", autouse=True)
def _db_janitor():
    """Sweep test-created restaurant docs after the run so exact-count and
    hygiene tests don't rot as the suite accumulates data across sessions."""
    yield
    try:
        from pymongo import MongoClient
        c = MongoClient(os.environ["MONGO_URL"].strip("\"'"))
        db = c[os.environ["DB_NAME"].strip("\"'")]
        db.restaurants.delete_many({"$or": [
            {"name": {"$regex": "^TEST_"}},
            {"cuisine": {"$regex": "^TestCui"}},
        ]})
        db.crawl_completions.delete_many({"team_name": {"$regex": "^TEST_"}})
        db.crawls.delete_many({"label": {"$regex": "^TEST"}})
        c.close()
    except Exception:
        pass
