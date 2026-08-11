"""Tests for chain sponsor feature (iteration 31): subscription-status, social-card downloads,
subscribe endpoint validation, and regression on active sponsors + chain coupons."""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://web-fate-launch.preview.emergentagent.com").rstrip("/")
SUB_ID = "I-TESTSUB123"
SPONSOR_ID = "test-chain-sponsor-1"


@pytest.fixture(scope="module")
def s():
    return requests.Session()


# --- subscription-status ---
class TestSubscriptionStatus:
    def test_status_active_seeded(self, s):
        r = s.get(f"{BASE_URL}/api/sponsors/subscription-status", params={"subscription_id": SUB_ID})
        assert r.status_code == 200
        data = r.json()
        assert data["found"] is True
        assert data["name"] == "Burrito Bandito"
        assert data["sponsor_id"] == SPONSOR_ID
        assert data["active"] is True

    def test_status_unknown(self, s):
        r = s.get(f"{BASE_URL}/api/sponsors/subscription-status", params={"subscription_id": "UNKNOWN-XYZ"})
        assert r.status_code == 200
        data = r.json()
        assert data["found"] is False
        assert "sponsor_id" not in data or data.get("sponsor_id") in (None, "")


# --- social-card downloads ---
class TestSocialCard:
    @pytest.mark.parametrize("fmt,ctype", [
        ("square", "image/png"),
        ("story", "image/png"),
        ("pdf", "application/pdf"),
    ])
    def test_social_card_download(self, s, fmt, ctype):
        r = s.get(f"{BASE_URL}/api/sponsors/{SPONSOR_ID}/social-card", params={"format": fmt})
        assert r.status_code == 200, f"format={fmt} status={r.status_code} body={r.text[:200]}"
        assert ctype in r.headers.get("content-type", ""), f"format={fmt} ctype={r.headers.get('content-type')}"
        assert len(r.content) > 50 * 1024, f"format={fmt} size={len(r.content)} too small"


# --- subscribe endpoint (PayPal not configured -> 503 expected) ---
class TestSubscribe:
    def test_chain_missing_coupon_returns_error(self, s):
        # No coupon supplied; server may 400 (validation) or 503 (paypal not configured)
        payload = {
            "name": "TEST Chain No Coupon", "category": "food", "cuisine": "Tacos",
            "price": "$$", "address": "", "website": "", "image": "",
            "contact_email": "TEST_nc@example.com", "plan": "monthly", "tier": "chain_coupon_only",
            "origin": "https://example.com",
        }
        r = s.post(f"{BASE_URL}/api/sponsors/subscribe", json=payload)
        assert r.status_code in (400, 503), f"status={r.status_code} body={r.text[:300]}"

    def test_chain_full_payload_paypal_503(self, s):
        payload = {
            "name": "TEST Chain Full", "category": "food", "cuisine": "Tacos",
            "price": "$$", "address": "", "website": "", "image": "",
            "contact_email": "TEST_full@example.com", "plan": "monthly", "tier": "chain_coupon_only",
            "coupon": {"code": "TESTFORK", "description": "20% off", "terms": "", "discount_type": "custom"},
            "origin": "https://example.com",
        }
        r = s.post(f"{BASE_URL}/api/sponsors/subscribe", json=payload)
        assert r.status_code == 503, f"status={r.status_code} body={r.text[:300]}"
        detail = r.json().get("detail", "")
        assert "email us" in detail.lower() or "isn't available" in detail.lower()

    def test_local_tier_garbage_tier_falls_back(self, s):
        # Verify model tier validator accepts unknown tier by falling back
        payload = {
            "name": "TEST Local Garbage", "category": "food", "cuisine": "Pizza",
            "price": "$$", "contact_email": "TEST_g@example.com", "plan": "monthly",
            "tier": "garbage_tier_value", "origin": "https://example.com",
        }
        r = s.post(f"{BASE_URL}/api/sponsors/subscribe", json=payload)
        # Should NOT be 422 (validation error); should reach paypal check -> 503
        assert r.status_code != 422, f"tier validator failed: {r.text[:300]}"
        assert r.status_code == 503, f"status={r.status_code} body={r.text[:300]}"


# --- regression ---
class TestRegression:
    def test_active_sponsors_endpoint(self, s):
        r = s.get(f"{BASE_URL}/api/sponsors/active")
        assert r.status_code == 200
        # response is a list or dict with entries
        data = r.json()
        assert isinstance(data, (list, dict))

    def test_chains_nearby_coupon_food(self, s):
        # The endpoint now defaults to limit=1 (one bonus coupon beside the
        # winner) — ask for more so the seeded FORK20 chain coupon is visible.
        r = s.get(f"{BASE_URL}/api/coupons/chains-nearby", params={"category": "food", "limit": 10})
        assert r.status_code == 200
        data = r.json()
        # Should include seeded FORK20 coupon
        items = data if isinstance(data, list) else data.get("items", data.get("coupons", []))
        codes = []
        for it in items:
            if isinstance(it, dict):
                codes.append(str(it.get("code", "")).upper())
                # Sometimes nested
                if "coupon" in it and isinstance(it["coupon"], dict):
                    codes.append(str(it["coupon"].get("code", "")).upper())
        assert "FORK20" in codes, f"FORK20 not in coupons response. codes={codes} raw={str(data)[:400]}"

    def test_fates_stats(self, s):
        r = s.get(f"{BASE_URL}/api/stats/fates")
        assert r.status_code == 200
        assert "count" in r.json()
