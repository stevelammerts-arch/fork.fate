
import json
import re
from pathlib import Path
import httpx

BASE = "https://web-fate-launch.preview.emergentagent.com"
API = BASE + "/api"
PASSWORD = "ForkFate!Admin2026"
ORIGIN = BASE

results = {"base": BASE, "steps": []}

def record(name, ok, detail=None, status=None, data=None, headers=None):
    item = {"name": name, "ok": bool(ok)}
    if status is not None: item["status"] = status
    if detail is not None: item["detail"] = detail
    if data is not None: item["data"] = data
    if headers is not None: item["headers"] = headers
    results["steps"].append(item)
    print(f"{'PASS' if ok else 'FAIL'} {name}: {detail or ''} status={status or ''}")

with httpx.Client(base_url=BASE, follow_redirects=False, timeout=30.0, headers={"Origin": ORIGIN, "Referer": ORIGIN + "/admin"}) as client:
    # Public availability endpoint, used by login UI to decide whether passkey button should render.
    try:
        r = client.get("/api/auth/passkey/available")
        data = r.json()
        record("public_passkey_available", r.status_code == 200 and isinstance(data.get("available"), bool), status=r.status_code, data=data)
    except Exception as e:
        record("public_passkey_available", False, detail=repr(e))

    # Wrong password should be rejected and should not set auth cookie.
    r = client.post("/api/admin/login", json={"password": "definitely-wrong"})
    set_cookie_wrong = r.headers.get("set-cookie", "")
    record(
        "wrong_password_rejected",
        r.status_code in (401, 403) and "ff_admin=" not in set_cookie_wrong,
        status=r.status_code,
        data=(r.json() if r.headers.get("content-type", "").startswith("application/json") else r.text[:200]),
        headers={"set_cookie_contains_ff_admin": "ff_admin=" in set_cookie_wrong},
    )

    # Correct password should create admin + csrf cookies.
    r = client.post("/api/admin/login", json={"password": PASSWORD})
    set_cookie = r.headers.get("set-cookie", "")
    cookies = {c.name: c.value for c in client.cookies.jar}
    record(
        "correct_password_login_sets_cookies",
        r.status_code == 200 and r.json().get("ok") is True and "ff_admin" in cookies and "ff_csrf" in cookies,
        status=r.status_code,
        data=(r.json() if r.headers.get("content-type", "").startswith("application/json") else r.text[:200]),
        headers={"set_cookie_has_ff_admin": "ff_admin=" in set_cookie, "set_cookie_has_ff_csrf": "ff_csrf=" in set_cookie, "cookie_names": sorted(cookies.keys())},
    )

    # Cookie-authenticated verify endpoint.
    r = client.get("/api/admin/verify")
    record("admin_verify_after_password_login", r.status_code == 200 and r.json().get("ok") is True, status=r.status_code, data=r.json() if r.headers.get("content-type", "").startswith("application/json") else r.text[:200])

    # Passkey status after password login.
    r = client.get("/api/admin/passkey/status")
    try:
        status_before = r.json()
    except Exception:
        status_before = {"raw": r.text[:200]}
    status_ok = r.status_code == 200 and isinstance(status_before.get("registered"), bool) and isinstance(status_before.get("count"), int)
    record("passkey_status_after_password_login", status_ok, status=r.status_code, data=status_before)

    # Registration options should be obtainable after password login.
    r = client.get("/api/admin/passkey/register-options")
    try:
        reg_options = r.json()
    except Exception:
        reg_options = {"raw": r.text[:500]}
    required_option_fields = ["challenge", "rp", "user", "pubKeyCredParams"]
    reg_ok = r.status_code == 200 and all(k in reg_options for k in required_option_fields)
    record("passkey_register_options_after_password_login", reg_ok, status=r.status_code, data={k: reg_options.get(k) for k in required_option_fields})

    # Delete passkeys after password login. This is the documented recovery path for lost old credentials.
    csrf = cookies.get("ff_csrf")
    r = client.delete("/api/admin/passkey", headers={"X-CSRF-Token": csrf} if csrf else {})
    try:
        delete_data = r.json()
    except Exception:
        delete_data = {"raw": r.text[:200]}
    record("passkey_delete_after_password_login", r.status_code == 200 and delete_data.get("ok") is True, status=r.status_code, data=delete_data)

    # Status after deletion should be count 0 for this preview origin.
    r = client.get("/api/admin/passkey/status")
    try:
        status_after = r.json()
    except Exception:
        status_after = {"raw": r.text[:200]}
    record("passkey_status_after_delete", r.status_code == 200 and status_after.get("registered") is False and status_after.get("count") == 0, status=r.status_code, data=status_after)

    # Register-options should still work after old passkeys are removed, so user can enroll a new fingerprint/device.
    r = client.get("/api/admin/passkey/register-options")
    try:
        reg_after_delete = r.json()
    except Exception:
        reg_after_delete = {"raw": r.text[:500]}
    reg2_ok = r.status_code == 200 and all(k in reg_after_delete for k in required_option_fields)
    record("passkey_register_options_after_delete", reg2_ok, status=r.status_code, data={k: reg_after_delete.get(k) for k in required_option_fields})

    # Logout should clear cookies (not a core requirement, but ensures UI can be retested cleanly).
    csrf = {c.name: c.value for c in client.cookies.jar}.get("ff_csrf")
    r = client.post("/api/admin/logout", headers={"X-CSRF-Token": csrf} if csrf else {})
    record("admin_logout", r.status_code == 200 and r.json().get("ok") is True, status=r.status_code, data=r.json() if r.headers.get("content-type", "").startswith("application/json") else r.text[:200])

Path('/app/test_reports/passkey_recovery_api_results.json').write_text(json.dumps(results, indent=2))
print('Wrote /app/test_reports/passkey_recovery_api_results.json')
