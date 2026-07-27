"""Iteration 60 verification: admin auth, sponsors CRUD + stats + click tracking,
submissions moderation, places search (single call), crawls + stats endpoints.
"""
import os
import uuid
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
ADMIN_PW = os.environ.get("ADMIN_PASSWORD", "")


@pytest.fixture(scope="module")
def api():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="module")
def admin_token(api):
    r = api.post(f"{BASE_URL}/api/admin/login", json={"password": ADMIN_PW})
    assert r.status_code == 200, r.text
    tok = r.json().get("token")
    assert isinstance(tok, str) and len(tok) > 20
    return tok


@pytest.fixture(scope="module")
def auth(admin_token):
    return {"Authorization": f"Bearer {admin_token}"}


@pytest.fixture(scope="module", autouse=True)
def _cleanup(admin_token):
    yield
    hdr = {"Authorization": f"Bearer {admin_token}"}
    try:
        r = requests.get(f"{BASE_URL}/api/admin/sponsors", headers=hdr, timeout=15)
        for s in r.json():
            if s.get("name", "").startswith("TEST_"):
                requests.delete(f"{BASE_URL}/api/admin/sponsors/{s['id']}", headers=hdr, timeout=15)
        # Cleanup any TEST_ pending submissions
        r = requests.get(f"{BASE_URL}/api/admin/submissions", headers=hdr, timeout=15)
        for s in r.json():
            if s.get("name", "").startswith("TEST_"):
                requests.delete(f"{BASE_URL}/api/admin/submissions/{s['id']}", headers=hdr, timeout=15)
    except Exception as e:
        print(f"cleanup failed: {e}")


# --------- Admin auth ---------
class TestAdminAuth:
    def test_wrong_password_401(self, api):
        r = api.post(f"{BASE_URL}/api/admin/login", json={"password": "wrong"})
        assert r.status_code == 401

    def test_correct_password_returns_jwt(self, admin_token):
        # JWT tokens contain 2 dots
        assert admin_token.count(".") == 2

    def test_verify_unauthorized(self):
        r = requests.get(f"{BASE_URL}/api/admin/verify")
        assert r.status_code == 401

    def test_verify_ok(self, auth):
        r = requests.get(f"{BASE_URL}/api/admin/verify", headers=auth)
        assert r.status_code == 200 and r.json().get("ok") is True


# --------- Sponsor stats ---------
class TestSponsorStats:
    def test_stats_shape(self, auth):
        r = requests.get(f"{BASE_URL}/api/admin/sponsors/stats", headers=auth)
        assert r.status_code == 200, r.text
        d = r.json()
        for key in ("mrr", "arr", "paying_subscribers", "active_sponsors",
                    "total_impressions", "total_clicks", "total_sponsors", "price"):
            assert key in d, f"missing {key}"
        assert isinstance(d["mrr"], (int, float))
        assert isinstance(d["arr"], (int, float))
        assert isinstance(d["total_impressions"], int)
        assert isinstance(d["total_clicks"], int)

    def test_stats_requires_auth(self):
        r = requests.get(f"{BASE_URL}/api/admin/sponsors/stats")
        assert r.status_code == 401


# --------- Sponsor CRUD ---------
class TestSponsorCRUD:
    def test_full_crud_and_patch_toggle(self, auth):
        payload = {"name": f"TEST_Iter60_{uuid.uuid4().hex[:6]}",
                   "cuisine": "Italian", "price": "$$", "category": "food",
                   "address": "1 Test St", "description": "test", "active": True}
        r = requests.post(f"{BASE_URL}/api/admin/sponsors", json=payload, headers=auth)
        assert r.status_code == 200
        sp = r.json()
        sid = sp["id"]
        assert sp["active"] is True and sp["impressions"] == 0 and sp["clicks"] == 0

        # list contains
        r = requests.get(f"{BASE_URL}/api/admin/sponsors", headers=auth)
        assert any(x["id"] == sid for x in r.json())

        # toggle active
        r = requests.patch(f"{BASE_URL}/api/admin/sponsors/{sid}",
                           json={"active": False}, headers=auth)
        assert r.status_code == 200 and r.json()["active"] is False

        # delete
        r = requests.delete(f"{BASE_URL}/api/admin/sponsors/{sid}", headers=auth)
        assert r.status_code == 200

        r = requests.delete(f"{BASE_URL}/api/admin/sponsors/{sid}", headers=auth)
        assert r.status_code == 404


# --------- Click tracking ---------
class TestSponsorClickTracking:
    def test_click_increments(self, auth):
        r = requests.post(f"{BASE_URL}/api/admin/sponsors",
                          json={"name": f"TEST_Click_{uuid.uuid4().hex[:6]}",
                                "cuisine": "Italian", "category": "food",
                                "active": True}, headers=auth)
        sid = r.json()["id"]
        try:
            # public endpoint - no auth
            r = requests.post(f"{BASE_URL}/api/track/sponsor-click", json={"sponsor_id": sid})
            assert r.status_code == 200
            r = requests.post(f"{BASE_URL}/api/track/sponsor-click", json={"sponsor_id": sid})
            assert r.status_code == 200

            r = requests.get(f"{BASE_URL}/api/admin/sponsors", headers=auth)
            match = [x for x in r.json() if x["id"] == sid][0]
            assert match["clicks"] >= 2, f"clicks={match['clicks']}"
        finally:
            requests.delete(f"{BASE_URL}/api/admin/sponsors/{sid}", headers=auth)


# --------- Submissions moderation ---------
class TestSubmissions:
    def test_submissions_requires_auth(self):
        r = requests.get(f"{BASE_URL}/api/admin/submissions")
        assert r.status_code == 401

    def test_create_pending_and_approve(self, auth, api):
        name = f"TEST_Sub_{uuid.uuid4().hex[:6]}"
        r = api.post(f"{BASE_URL}/api/restaurants",
                     json={"name": name, "cuisine": "Italian", "price": "$$"})
        assert r.status_code == 200
        rid = r.json()["id"]
        assert r.json().get("status") == "pending"

        # appears in pending list
        r = requests.get(f"{BASE_URL}/api/admin/submissions", headers=auth)
        assert r.status_code == 200
        assert any(x["id"] == rid for x in r.json())

        # approve
        r = requests.post(f"{BASE_URL}/api/admin/submissions/{rid}/approve", headers=auth)
        assert r.status_code == 200

        # no longer pending
        r = requests.get(f"{BASE_URL}/api/admin/submissions", headers=auth)
        assert not any(x["id"] == rid for x in r.json())

    def test_create_pending_and_reject(self, auth, api):
        name = f"TEST_Rej_{uuid.uuid4().hex[:6]}"
        r = api.post(f"{BASE_URL}/api/restaurants",
                     json={"name": name, "cuisine": "Mexican", "price": "$"})
        rid = r.json()["id"]
        r = requests.delete(f"{BASE_URL}/api/admin/submissions/{rid}", headers=auth)
        assert r.status_code == 200
        r = requests.delete(f"{BASE_URL}/api/admin/submissions/{rid}", headers=auth)
        assert r.status_code == 404


# --------- Places search (SINGLE CALL - protects 160/day cap) ---------
class TestPlacesSearchSingleCall:
    def test_search_with_sponsor_merges_and_increments_impressions(self, auth):
        # Create an active sponsor first
        r = requests.post(f"{BASE_URL}/api/admin/sponsors",
                          json={"name": f"TEST_Search_{uuid.uuid4().hex[:6]}",
                                "cuisine": "Italian", "price": "$$",
                                "category": "food", "active": True}, headers=auth)
        sp = r.json()
        sid = sp["id"]
        assert sp["impressions"] == 0
        try:
            # exactly ONE real search call
            r = requests.post(f"{BASE_URL}/api/places/search",
                              json={"zip_code": "10001", "category": "food"}, timeout=30)
            assert r.status_code == 200, r.text
            data = r.json()
            assert data["source"] in ("google", "curated")
            restos = data["restaurants"]
            assert len(restos) > 0
            first = restos[0]
            assert first["sponsored"] is True
            assert first["name"] == sp["name"]

            # impression count incremented for our sponsor
            r = requests.get(f"{BASE_URL}/api/admin/sponsors", headers=auth)
            match = [x for x in r.json() if x["id"] == sid][0]
            assert match["impressions"] >= 1, f"impressions not incremented: {match['impressions']}"
        finally:
            requests.delete(f"{BASE_URL}/api/admin/sponsors/{sid}", headers=auth)


# --------- Crawls + stats ---------
class TestCrawlsAndStats:
    def test_stats_fates(self, api):
        r = api.get(f"{BASE_URL}/api/stats/fates")
        assert r.status_code == 200
        assert isinstance(r.json(), dict)

    def test_stats_crawls(self, api):
        r = api.get(f"{BASE_URL}/api/stats/crawls")
        assert r.status_code == 200
        assert isinstance(r.json(), dict)
