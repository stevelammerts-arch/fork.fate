
import json
from pathlib import Path
import httpx

BASE = "https://web-fate-launch.preview.emergentagent.com"
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

with httpx.Client(base_url=BASE, timeout=30.0, headers={"Origin": ORIGIN, "Referer": ORIGIN + "/admin"}) as client:
    r = client.get("/api/auth/passkey/available")
    data = r.json()
    record("available_before_delete_seeded_old_passkey", r.status_code == 200 and data.get("available") is True, status=r.status_code, data=data)

    r = client.post("/api/admin/login", json={"password": PASSWORD})
    cookies = {c.name: c.value for c in client.cookies.jar}
    record("password_login_with_old_passkey_present", r.status_code == 200 and r.json().get("ok") is True and "ff_admin" in cookies and "ff_csrf" in cookies, status=r.status_code, data=r.json(), headers={"cookie_names": sorted(cookies.keys())})

    r = client.get("/api/admin/passkey/status")
    status_before = r.json()
    record("status_shows_old_passkey_present", r.status_code == 200 and status_before.get("registered") is True and status_before.get("count", 0) >= 1, status=r.status_code, data=status_before)

    csrf = cookies.get("ff_csrf")
    r = client.delete("/api/admin/passkey", headers={"X-CSRF-Token": csrf})
    delete_data = r.json()
    record("delete_old_passkey_after_password_login", r.status_code == 200 and delete_data.get("ok") is True, status=r.status_code, data=delete_data)

    r = client.get("/api/admin/passkey/status")
    status_after = r.json()
    record("status_after_delete_no_passkeys", r.status_code == 200 and status_after.get("registered") is False and status_after.get("count") == 0, status=r.status_code, data=status_after)

    r = client.get("/api/auth/passkey/available")
    avail_after = r.json()
    record("available_after_delete_false", r.status_code == 200 and avail_after.get("available") is False, status=r.status_code, data=avail_after)

    r = client.get("/api/admin/passkey/register-options")
    reg = r.json()
    required = ["challenge", "rp", "user", "pubKeyCredParams"]
    record("register_options_available_after_delete", r.status_code == 200 and all(k in reg for k in required), status=r.status_code, data={k: reg.get(k) for k in required})

Path('/app/test_reports/passkey_recovery_seeded_delete_results.json').write_text(json.dumps(results, indent=2))
print('Wrote /app/test_reports/passkey_recovery_seeded_delete_results.json')
