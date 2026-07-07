"""Backend tests for admin auth + sponsor CRUD + sponsor injection into places/search.
Cleans up all TEST_ prefixed sponsors created during the run.
"""
import os
import uuid
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/") or \
           "https://lucky-bite-1.preview.emergentagent.com"
ADMIN_PW = "GrimReaper!2026"


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
    except Exception as e:
        print(f"cleanup failed: {e}")


# --------- Admin auth ---------
class TestAdminAuth:
    def test_login_wrong_password(self, api):
        r = api.post(f"{BASE_URL}/api/admin/login", json={"password": "nope"})
        assert r.status_code == 401

    def test_login_success(self, admin_token):
        assert admin_token

    def test_verify_no_token(self, api):
        r = requests.get(f"{BASE_URL}/api/admin/verify")
        assert r.status_code == 401

    def test_verify_with_token(self, auth):
        r = requests.get(f"{BASE_URL}/api/admin/verify", headers=auth)
        assert r.status_code == 200
        assert r.json().get("ok") is True


# --------- Sponsor CRUD ---------
class TestSponsorCRUD:
    def test_list_requires_auth(self):
        r = requests.get(f"{BASE_URL}/api/admin/sponsors")
        assert r.status_code == 401

    def test_create_requires_auth(self):
        r = requests.post(f"{BASE_URL}/api/admin/sponsors",
                          json={"name": "TEST_x", "cuisine": "Italian"})
        assert r.status_code == 401

    def test_full_crud(self, auth):
        payload = {"name": f"TEST_Sponsor_{uuid.uuid4().hex[:6]}",
                   "cuisine": "Italian", "price": "$$", "category": "food",
                   "address": "1 Test St", "description": "test",
                   "active": True}
        r = requests.post(f"{BASE_URL}/api/admin/sponsors", json=payload, headers=auth)
        assert r.status_code == 200, r.text
        sp = r.json()
        assert sp["name"] == payload["name"]
        assert sp["active"] is True
        assert "id" in sp
        sid = sp["id"]

        # list contains
        r = requests.get(f"{BASE_URL}/api/admin/sponsors", headers=auth)
        assert r.status_code == 200
        assert any(x["id"] == sid for x in r.json())

        # patch
        r = requests.patch(f"{BASE_URL}/api/admin/sponsors/{sid}",
                           json={"active": False}, headers=auth)
        assert r.status_code == 200
        assert r.json()["active"] is False

        # delete
        r = requests.delete(f"{BASE_URL}/api/admin/sponsors/{sid}", headers=auth)
        assert r.status_code == 200

        # delete nonexistent -> 404
        r = requests.delete(f"{BASE_URL}/api/admin/sponsors/{sid}", headers=auth)
        assert r.status_code == 404


# --------- Sponsor injection into search ---------
class TestSponsorInjection:
    def _create(self, auth, **overrides):
        payload = {"name": f"TEST_Inject_{uuid.uuid4().hex[:6]}",
                   "cuisine": "Italian", "price": "$$", "category": "food",
                   "active": True}
        payload.update(overrides)
        r = requests.post(f"{BASE_URL}/api/admin/sponsors", json=payload, headers=auth)
        assert r.status_code == 200, r.text
        return r.json()

    def test_food_sponsor_appears_first(self, auth):
        sp = self._create(auth)
        try:
            r = requests.post(f"{BASE_URL}/api/places/search",
                              json={"zip_code": "10001", "category": "food"})
            assert r.status_code == 200, r.text
            data = r.json()
            restos = data["restaurants"]
            assert len(restos) > 0
            first = restos[0]
            assert first["name"] == sp["name"], f"Expected sponsor first, got {first['name']}"
            assert first["sponsored"] is True
        finally:
            requests.delete(f"{BASE_URL}/api/admin/sponsors/{sp['id']}", headers=auth)

    def test_inactive_sponsor_not_included(self, auth):
        sp = self._create(auth)
        try:
            requests.patch(f"{BASE_URL}/api/admin/sponsors/{sp['id']}",
                           json={"active": False}, headers=auth)
            r = requests.post(f"{BASE_URL}/api/places/search",
                              json={"zip_code": "10001", "category": "food"})
            names = [x["name"] for x in r.json()["restaurants"]]
            assert sp["name"] not in names
        finally:
            requests.delete(f"{BASE_URL}/api/admin/sponsors/{sp['id']}", headers=auth)

    def test_bars_sponsor_not_in_food_search(self, auth):
        sp = self._create(auth, category="bars", cuisine="Cocktails")
        try:
            r = requests.post(f"{BASE_URL}/api/places/search",
                              json={"zip_code": "10001", "category": "food"})
            names = [x["name"] for x in r.json()["restaurants"]]
            assert sp["name"] not in names
        finally:
            requests.delete(f"{BASE_URL}/api/admin/sponsors/{sp['id']}", headers=auth)

    def test_cuisine_filter_matches(self, auth):
        sp = self._create(auth, cuisine="Italian")
        try:
            r = requests.post(f"{BASE_URL}/api/places/search",
                              json={"zip_code": "10001", "category": "food",
                                    "cuisines": ["Italian"]})
            names = [x["name"] for x in r.json()["restaurants"]]
            assert sp["name"] in names
            # excluded when cuisines don't include it
            r = requests.post(f"{BASE_URL}/api/places/search",
                              json={"zip_code": "10001", "category": "food",
                                    "cuisines": ["Mexican"]})
            names = [x["name"] for x in r.json()["restaurants"]]
            assert sp["name"] not in names
        finally:
            requests.delete(f"{BASE_URL}/api/admin/sponsors/{sp['id']}", headers=auth)


# --------- Regressions ---------
class TestRegressions:
    def test_create_restaurant_still_works(self, api):
        r = api.post(f"{BASE_URL}/api/restaurants", json={
            "name": f"TEST_Reg_{uuid.uuid4().hex[:6]}",
            "cuisine": "Italian", "price": "$$"
        })
        assert r.status_code == 200, r.text
        assert r.json()["name"].startswith("TEST_Reg_")

    def test_spin_works(self, api):
        r = api.post(f"{BASE_URL}/api/spin", json={})
        assert r.status_code == 200
        assert "name" in r.json()

    def test_curated_fallback_no_zip(self, api):
        r = api.post(f"{BASE_URL}/api/places/search",
                     json={"category": "food"})
        assert r.status_code == 200
        d = r.json()
        assert d["source"] == "curated"
        assert len(d["restaurants"]) > 0
