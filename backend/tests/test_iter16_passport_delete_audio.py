"""Iteration 16 — passport DELETE endpoint + audio asset serving.

Kept small: only what iter16 actually needs on the backend side.
"""
import os
import requests

BASE = os.environ["REACT_APP_BACKEND_URL"].rstrip("/")


# ---------------- passport delete ----------------

def _make_passport():
    r = requests.post(
        f"{BASE}/api/passports",
        json={"mode": "explore", "zip": "10001", "size": 3},
        timeout=30,
    )
    assert r.status_code == 200, r.text
    return r.json()["code"]


class TestPassportDelete:
    def test_delete_existing_returns_deleted_and_removes_row(self):
        code = _make_passport()

        # confirm it exists first
        got = requests.get(f"{BASE}/api/passports/{code}", timeout=10)
        assert got.status_code == 200, got.text

        # delete
        d = requests.delete(f"{BASE}/api/passports/{code}", timeout=10)
        assert d.status_code == 200, d.text
        assert d.json() == {"deleted": code}

        # now missing
        gone = requests.get(f"{BASE}/api/passports/{code}", timeout=10)
        assert gone.status_code == 404, gone.text

        # deleting again -> 404 (unknown code path)
        again = requests.delete(f"{BASE}/api/passports/{code}", timeout=10)
        assert again.status_code == 404, again.text

    def test_delete_unknown_code_returns_404(self):
        r = requests.delete(f"{BASE}/api/passports/ZZZZZZ", timeout=10)
        assert r.status_code == 404, r.text


# ---------------- audio assets served ----------------

class TestAudioAssets:
    def test_all_shuffle_and_reveal_beds_serve_200(self):
        # /shuffle-dragon.wav MUST exist (fantasy no longer uses .mp3)
        for path in [
            "/shuffle-seagulls.wav",
            "/shuffle-jacobs.wav",
            "/shuffle-dragon.wav",
            "/reveal-cyber-radio.wav",
            "/shuffle-spring.wav",
            "/shuffle-winter.wav",
            "/shuffle-fall.wav",
        ]:
            r = requests.get(f"{os.environ.get('FF_ASSET_BASE_URL', BASE)}{path}", timeout=20)
            assert r.status_code == 200, f"{path} => {r.status_code}"
            # sanity: not empty
            assert len(r.content) > 10_000, f"{path} too small: {len(r.content)}"
