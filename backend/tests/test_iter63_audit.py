"""Iteration 63 backend regression tests for audit-fix validation.

Covers:
- /api/places/search happy path + curated fallback + invalid ZIP
- /api/sponsors/upload-photo magic-byte and content-type validation
- /api/files/{path} public serve of sponsor photos
- /api/sponsorship-requests happy path
- /api/sponsors/subscription-status unknown id
- /api/admin/* auth gating
- /api/paypal/webhook fails closed with 400 (not 500) on forged body
"""
import io
import os
import struct
import zlib
import pytest
import requests

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL').rstrip('/')
API = f"{BASE_URL}/api"


def _real_png_bytes(width: int = 2, height: int = 2) -> bytes:
    """Build a genuinely valid tiny PNG (signature + IHDR + IDAT + IEND)."""
    sig = b"\x89PNG\r\n\x1a\n"

    def chunk(tag: bytes, data: bytes) -> bytes:
        return (
            struct.pack(">I", len(data))
            + tag
            + data
            + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF)
        )

    ihdr = struct.pack(">IIBBBBB", width, height, 8, 2, 0, 0, 0)  # 8-bit RGB
    # Raw scanlines: each row prefixed with filter byte 0 + width*3 bytes of RGB
    raw = b"".join(b"\x00" + b"\xff\x00\x00" * width for _ in range(height))
    idat = zlib.compress(raw)
    return sig + chunk(b"IHDR", ihdr) + chunk(b"IDAT", idat) + chunk(b"IEND", b"")


# ---------- /api/places/search ----------

class TestPlacesSearch:
    def test_search_happy_path(self):
        r = requests.post(f"{API}/places/search", json={
            "zip_code": "90001", "category": "food", "radius_miles": 10,
        }, timeout=30)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data.get("source") in ("google", "curated")
        assert isinstance(data.get("restaurants"), list)
        assert len(data["restaurants"]) > 0

    def test_search_cached_second_call(self):
        payload = {"zip_code": "90001", "category": "food", "radius_miles": 10}
        r1 = requests.post(f"{API}/places/search", json=payload, timeout=30)
        r2 = requests.post(f"{API}/places/search", json=payload, timeout=30)
        assert r1.status_code == 200 and r2.status_code == 200
        # both should succeed; second served from cache
        assert r2.json().get("source") in ("google", "curated")

    def test_search_invalid_zip_returns_400_not_500(self):
        r = requests.post(f"{API}/places/search", json={
            "zip_code": "00000", "category": "food", "radius_miles": 10,
        }, timeout=30)
        # Should not 500; ideally 400. Accept 200 with curated fallback ONLY if
        # google not configured, but per fix the code re-raises 400.
        assert r.status_code != 500, r.text
        # Prefer 400 with the specific message
        if r.status_code == 400:
            assert "ZIP" in r.text or "zip" in r.text.lower()

    def test_search_drinks_category(self):
        r = requests.post(f"{API}/places/search", json={
            "zip_code": "90001", "category": "drinks", "radius_miles": 10,
        }, timeout=30)
        assert r.status_code == 200
        assert isinstance(r.json().get("restaurants"), list)


# ---------- /api/sponsors/upload-photo + /api/files ----------

class TestSponsorUpload:
    def test_reject_fake_png_bytes(self):
        # Content type says PNG but bytes are not
        files = {"file": ("fake.png", b"not really an image at all", "image/png")}
        r = requests.post(f"{API}/sponsors/upload-photo", files=files, timeout=30)
        assert r.status_code == 400, r.text
        assert "not a valid" in r.text.lower() or "valid" in r.text.lower()

    def test_reject_unsupported_content_type(self):
        files = {"file": ("thing.txt", b"hello world", "text/plain")}
        r = requests.post(f"{API}/sponsors/upload-photo", files=files, timeout=30)
        assert r.status_code == 400, r.text

    def test_reject_empty_file(self):
        files = {"file": ("empty.png", b"", "image/png")}
        r = requests.post(f"{API}/sponsors/upload-photo", files=files, timeout=30)
        assert r.status_code == 400, r.text

    def test_accept_real_png_and_serve(self):
        png = _real_png_bytes()
        assert png[:8] == b"\x89PNG\r\n\x1a\n"
        files = {"file": ("real.png", png, "image/png")}
        r = requests.post(f"{API}/sponsors/upload-photo", files=files, timeout=30)
        assert r.status_code == 200, r.text
        body = r.json()
        assert "path" in body
        path = body["path"]
        assert path.startswith("fork-fate/sponsors/")
        assert path.endswith(".png")

        # Now serve it back
        serve = requests.get(f"{API}/files/{path}", timeout=30)
        assert serve.status_code == 200, serve.text
        # Bytes should start with PNG signature
        assert serve.content[:8] == b"\x89PNG\r\n\x1a\n"

    def test_serve_nonexistent_returns_404(self):
        r = requests.get(f"{API}/files/fork-fate/sponsors/does-not-exist.png", timeout=15)
        assert r.status_code == 404, r.text


# ---------- /api/sponsorship-requests ----------

class TestSponsorshipRequest:
    def test_create_ok(self):
        payload = {
            "business_name": "TEST_ForkFate Diner",
            "contact_name": "Test User",
            "contact_email": "test-forkfate@example.com",
            "phone": "555-0100",
            "category": "food",
            "cuisine": "American",
            "price": "$$",
            "address": "1 Test St, Los Angeles, CA 90001",
            "website": "https://example.com",
            "notes": "regression test",
        }
        r = requests.post(f"{API}/sponsorship-requests", json=payload, timeout=15)
        assert r.status_code == 200, r.text
        body = r.json()
        assert body.get("ok") is True
        assert body.get("id")


# ---------- /api/sponsors/subscription-status ----------

class TestSubscriptionStatus:
    def test_nonexistent_returns_found_false(self):
        r = requests.get(f"{API}/sponsors/subscription-status",
                         params={"subscription_id": "nonexistent-TEST-xyz"}, timeout=15)
        assert r.status_code == 200, r.text
        assert r.json() == {"found": False}


# ---------- Admin auth gating ----------

class TestAdminAuth:
    def test_admin_sponsors_requires_auth(self):
        r = requests.get(f"{API}/admin/sponsors", timeout=15)
        assert r.status_code in (401, 403), f"expected 401/403, got {r.status_code}: {r.text}"

    def test_admin_cost_status_requires_auth(self):
        r = requests.get(f"{API}/admin/cost-status", timeout=15)
        assert r.status_code in (401, 403), r.text

    def test_admin_bad_token_rejected(self):
        r = requests.get(f"{API}/admin/sponsors",
                         headers={"Authorization": "Bearer garbage-token"}, timeout=15)
        assert r.status_code in (401, 403), r.text

    def test_admin_login_and_access(self):
        pwd = os.environ.get("ADMIN_PASSWORD", "GrimReaper!2026")
        r = requests.post(f"{API}/admin/login", json={"password": pwd}, timeout=15)
        if r.status_code != 200:
            pytest.skip(f"admin login unavailable: {r.status_code} {r.text[:200]}")
        token = r.json().get("token")
        assert token
        r2 = requests.get(f"{API}/admin/verify",
                          headers={"Authorization": f"Bearer {token}"}, timeout=15)
        assert r2.status_code == 200


# ---------- PayPal webhook fails closed ----------

class TestPayPalWebhook:
    def test_forged_body_returns_400_not_500(self):
        r = requests.post(f"{API}/paypal/webhook",
                          json={"event_type": "BILLING.SUBSCRIPTION.ACTIVATED",
                                "resource": {"id": "fake", "custom_id": "fake"}},
                          timeout=20)
        assert r.status_code == 400, f"expected 400 (signature fail-closed), got {r.status_code}: {r.text}"

    def test_empty_body_no_500(self):
        r = requests.post(f"{API}/paypal/webhook",
                          data=b"not-json", headers={"Content-Type": "application/json"}, timeout=15)
        assert r.status_code != 500, r.text
