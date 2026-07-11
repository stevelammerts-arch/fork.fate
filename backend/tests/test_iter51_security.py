"""Iter51: JWT iss/aud, rate limit, passkey origin gating."""
import os
import time
import jwt
import requests
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parents[1] / ".env")

BASE = os.environ.get("REACT_APP_BACKEND_URL", "https://lucky-bite-1.preview.emergentagent.com").rstrip("/")
API = f"{BASE}/api"
ADMIN_PW = os.environ.get("ADMIN_PASSWORD", "")
JWT_SECRET = os.environ["JWT_SECRET"]


def _login_token():
    r = requests.post(f"{API}/admin/login", json={"password": ADMIN_PW}, timeout=15)
    assert r.status_code == 200, f"admin login failed: {r.status_code} {r.text}"
    return r.json()["token"]


# ── SECURITY: JWT iss/aud ────────────────────────────────────────────────
def test_admin_login_and_verify_ok():
    tok = _login_token()
    r = requests.get(f"{API}/admin/verify", headers={"Authorization": f"Bearer {tok}"}, timeout=15)
    assert r.status_code == 200
    assert r.json() == {"ok": True}


def test_verify_rejects_token_without_iss_aud():
    """A hand-crafted JWT with the same secret but no iss/aud must be 401."""
    from datetime import datetime, timezone, timedelta
    now = datetime.now(timezone.utc)
    bad = jwt.encode(
        {"sub": "admin", "role": "admin", "type": "admin",
         "iat": now, "exp": now + timedelta(hours=1)},
        JWT_SECRET, algorithm="HS256",
    )
    r = requests.get(f"{API}/admin/verify", headers={"Authorization": f"Bearer {bad}"}, timeout=15)
    assert r.status_code == 401, f"expected 401 for token missing iss/aud, got {r.status_code} {r.text}"


# ── SECURITY: wrong password ─────────────────────────────────────────────
def test_admin_login_wrong_password():
    r = requests.post(f"{API}/admin/login", json={"password": "nope-nope-nope"}, timeout=15)
    assert r.status_code == 401
    assert "Incorrect password" in r.text


# ── SECURITY: passkey origin gating ──────────────────────────────────────
def test_passkey_register_options_spoofed_client_origin_ignored():
    """The server intentionally trusts the ingress x-forwarded-host over the
    client-supplied Origin/Referer headers (per Iter52 fix). A client that spoofs
    Origin: https://evil.com will therefore be IGNORED and the request should
    succeed because x-forwarded-host resolves to the allowlisted preview host.
    WebAuthn's signed clientDataJSON.origin check at verify-time is the real
    cross-origin protection, not this preflight-style header check."""
    tok = _login_token()
    r = requests.get(
        f"{API}/admin/passkey/register-options",
        headers={"Authorization": f"Bearer {tok}", "Origin": "https://evil.com", "Referer": "https://evil.com/"},
        timeout=15,
    )
    assert r.status_code == 200, f"expected spoofed client Origin to be ignored (200), got {r.status_code} {r.text}"
    j = r.json()
    assert j.get("rp", {}).get("id"), f"rp.id missing: {j}"


def test_passkey_register_options_allowed_origin():
    """Per task note: preview ingress may strip/rewrite Origin; fallback is
    x-forwarded-host which resolves to the emergentagent.com preview and is
    on the allowlist -> 200. Referer alone also works."""
    tok = _login_token()
    r = requests.get(
        f"{API}/admin/passkey/register-options",
        headers={"Authorization": f"Bearer {tok}", "Referer": BASE + "/admin"},
        timeout=15,
    )
    assert r.status_code == 200, f"expected 200, got {r.status_code} {r.text}"
    j = r.json()
    assert "rp" in j and j["rp"].get("id"), f"rp.id missing: {j}"
    assert j.get("challenge"), "challenge missing"


# ── SECURITY: per-IP login rate limit ────────────────────────────────────
def test_admin_login_rate_limit_429():
    """rate_limit(10)/60s per-IP + admin_login_throttle 30/60s global should
    force a 429 within a burst. Preview may spread requests across ingress
    pods (different peer IPs) so we push well past the global cap."""
    got_429 = False
    for i in range(45):
        r = requests.post(f"{API}/admin/login", json={"password": "x"}, timeout=15)
        if r.status_code == 429:
            got_429 = True
            break
    assert got_429, "expected a 429 within 45 rapid login attempts"
