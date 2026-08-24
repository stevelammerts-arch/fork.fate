"""Backend tests for Pub Crawl leaderboard endpoints (iter 69)."""
import os
import time
import uuid
import requests
import pytest

BASE = os.environ.get("REACT_APP_BACKEND_URL", "https://lucky-bite-1.preview.emergentagent.com").rstrip("/") + "/api"

TAG = f"TEST_{uuid.uuid4().hex[:6]}"


@pytest.fixture(scope="module")
def crawl_code():
    body = {
        "mode": "bars",
        "label": "Pub Crawl",
        "stops": [
            {"id": "s1", "name": "Bar One", "lat": 40.0, "lng": -74.0, "google_url": "https://maps.google.com/?q=1"},
            {"id": "s2", "name": "Bar Two", "lat": 40.1, "lng": -74.1, "google_url": "https://maps.google.com/?q=2"},
            {"id": "s3", "name": "Bar Three", "lat": 40.2, "lng": -74.2, "google_url": "https://maps.google.com/?q=3"},
        ],
    }
    r = requests.post(f"{BASE}/crawls", json=body, timeout=15)
    assert r.status_code == 200, r.text
    code = r.json()["code"]
    assert code and isinstance(code, str)
    return code


class TestLeaderboardRouting:
    def test_literal_route_not_shadowed(self):
        """GET /crawls/leaderboard must resolve to leaderboard, not a crawl code lookup."""
        r = requests.get(f"{BASE}/crawls/leaderboard", timeout=15)
        assert r.status_code == 200, r.text
        data = r.json()
        assert "global" in data and "crawl" in data
        assert data["crawl"] is None
        assert "stops" in data["global"] and "fastest" in data["global"]

    def test_get_crawl_still_works(self, crawl_code):
        r = requests.get(f"{BASE}/crawls/{crawl_code}", timeout=15)
        assert r.status_code == 200
        assert r.json()["code"] == crawl_code

    def test_unknown_code_404(self):
        r = requests.get(f"{BASE}/crawls/ZZZZZZZZ", timeout=15)
        assert r.status_code == 404


def _gps_checkin_all(code, stops):
    """SEC-002: only server-verified runs rank — log a GPS arrival per stop."""
    for i, st in enumerate(stops):
        r = requests.post(f"{BASE}/crawls/{code}/checkin", json={
            "stop_id": st["id"], "stop_index": i,
            "lat": st["lat"], "lng": st["lng"], "source": "gps",
        }, timeout=15)
        assert r.status_code == 200, r.text


class TestCompletePayload:
    def test_empty_team_becomes_anonymous(self, crawl_code):
        # SEC-002 contract: a run only ranks when GPS check-ins cover every
        # claimed stop AND the pace is plausible (needs duration + distance).
        _gps_checkin_all(crawl_code, [
            {"id": "s1", "lat": 40.0, "lng": -74.0},
            {"id": "s2", "lat": 40.1, "lng": -74.1},
            {"id": "s3", "lat": 40.2, "lng": -74.2},
        ])
        payload = {"team_name": "  ", "stops": 3, "mode": "bars", "label": TAG,
                   "code": crawl_code, "duration_seconds": 1800,
                   "distance": 2.0, "verified": True}
        r = requests.post(f"{BASE}/crawls/complete", json=payload, timeout=15)
        assert r.status_code == 200
        body = r.json()
        assert body["ok"] == True
        assert body["verified"] == True
        assert isinstance(body.get("rank_stops"), int)
        # verify persisted -> Anonymous Crew present in board
        board = requests.get(f"{BASE}/crawls/leaderboard", params={"code": crawl_code}, timeout=15).json()
        assert board["crawl"] is not None
        names = [e["team_name"] for e in board["crawl"]["stops"]]
        assert "Anonymous Crew" in names

    def test_stops_out_of_range_rejected(self, crawl_code):
        r = requests.post(f"{BASE}/crawls/complete", json={"stops": 0, "mode": "bars", "code": crawl_code}, timeout=15)
        assert r.status_code == 422
        r = requests.post(f"{BASE}/crawls/complete", json={"stops": 13, "mode": "bars", "code": crawl_code}, timeout=15)
        assert r.status_code == 422

    def test_stops_valid_boundary(self, crawl_code):
        r = requests.post(f"{BASE}/crawls/complete", json={"team_name": f"{TAG}_min", "stops": 1, "mode": "bars", "code": crawl_code}, timeout=15)
        assert r.status_code == 200


class TestLeaderboardOrdering:
    @pytest.fixture(scope="class")
    def seeded_code(self):
        # dedicated crawl code to isolate ordering tests
        body = {
            "mode": "bars",
            "label": "Pub Crawl",
            "stops": [
                {"id": "a", "name": "A", "lat": 1, "lng": 1, "google_url": "https://x.example/1"},
                {"id": "b", "name": "B", "lat": 2, "lng": 2, "google_url": "https://x.example/2"},
            ],
        }
        # SEC-002: the board only lists verified runs, so give the crawl six
        # stops and log a GPS arrival for each — then any entry claiming
        # <= 6 stops with a plausible pace can rank.
        body["stops"] = [
            {"id": c, "name": c.upper(), "lat": 1 + i, "lng": 1 + i,
             "google_url": f"https://x.example/{i}"}
            for i, c in enumerate("abcdef")
        ]
        r = requests.post(f"{BASE}/crawls", json=body, timeout=15)
        code = r.json()["code"]
        _gps_checkin_all(code, body["stops"])

        # Seed completions with varied stops + durations. Delta has no
        # duration, which under SEC-002 means it can never verify -> it is
        # excluded from BOTH boards (previously only from "fastest").
        entries = [
            {"team_name": f"{TAG}_Alpha", "stops": 5, "duration_seconds": 3600},
            {"team_name": f"{TAG}_Bravo", "stops": 5, "duration_seconds": 1800},  # tie stops, faster time
            {"team_name": f"{TAG}_Charlie", "stops": 3, "duration_seconds": 600},  # fastest
            {"team_name": f"{TAG}_Delta", "stops": 4, "duration_seconds": None},  # unverifiable
            {"team_name": f"{TAG}_Echo", "stops": 6, "duration_seconds": 7200},   # most stops
        ]
        for e in entries:
            body = {"stops": e["stops"], "mode": "bars", "label": TAG, "code": code,
                    "team_name": e["team_name"], "distance": 2.0, "verified": True}
            if e["duration_seconds"] is not None:
                body["duration_seconds"] = e["duration_seconds"]
            rr = requests.post(f"{BASE}/crawls/complete", json=body, timeout=15)
            assert rr.status_code == 200, rr.text
            time.sleep(0.05)
        return code

    def test_stops_sort_desc_with_fastest_tiebreak(self, seeded_code):
        r = requests.get(f"{BASE}/crawls/leaderboard", params={"code": seeded_code}, timeout=15)
        assert r.status_code == 200
        crawl = r.json()["crawl"]
        assert crawl is not None
        stops_board = crawl["stops"]
        # Filter only our seeded entries by TAG prefix
        ours = [e for e in stops_board if e["team_name"].startswith(TAG)]
        # Expected order: Echo(6), Bravo(5, faster), Alpha(5), Charlie(3).
        # Delta (no duration) cannot be verified under SEC-002 -> not listed.
        expected = [f"{TAG}_Echo", f"{TAG}_Bravo", f"{TAG}_Alpha", f"{TAG}_Charlie"]
        got = [e["team_name"] for e in ours]
        assert got == expected, f"stops order incorrect: {got}"

    def test_fastest_sort_asc_and_excludes_untimed(self, seeded_code):
        r = requests.get(f"{BASE}/crawls/leaderboard", params={"code": seeded_code}, timeout=15)
        fastest = r.json()["crawl"]["fastest"]
        ours = [e for e in fastest if e["team_name"].startswith(TAG)]
        got = [e["team_name"] for e in ours]
        # Delta has no duration; should not appear
        assert f"{TAG}_Delta" not in got
        # ascending by time: Charlie(600) < Bravo(1800) < Alpha(3600) < Echo(7200)
        expected = [f"{TAG}_Charlie", f"{TAG}_Bravo", f"{TAG}_Alpha", f"{TAG}_Echo"]
        assert got == expected, f"fastest order incorrect: {got}"

    def test_top10_cap(self, seeded_code):
        # Push more than 10 entries into global and confirm cap
        for i in range(12):
            requests.post(f"{BASE}/crawls/complete", json={
                "team_name": f"{TAG}_cap_{i}", "stops": 2, "mode": "bars", "duration_seconds": 100 + i, "code": seeded_code
            }, timeout=15)
        r = requests.get(f"{BASE}/crawls/leaderboard", params={"code": seeded_code}, timeout=15).json()
        assert len(r["crawl"]["stops"]) <= 10
        assert len(r["crawl"]["fastest"]) <= 10
        assert len(r["global"]["stops"]) <= 10
        assert len(r["global"]["fastest"]) <= 10

    def test_global_scope_no_crawl_when_no_code(self):
        r = requests.get(f"{BASE}/crawls/leaderboard", timeout=15).json()
        assert r["crawl"] is None
        assert isinstance(r["global"]["stops"], list)


class TestEntryShape:
    def test_no_mongo_id_leak(self, crawl_code):
        r = requests.get(f"{BASE}/crawls/leaderboard", params={"code": crawl_code}, timeout=15).json()
        for section in ("stops", "fastest"):
            for row in r["global"][section] + (r["crawl"][section] if r["crawl"] else []):
                assert "_id" not in row
                assert set(row.keys()) >= {"team_name", "stops", "duration_seconds", "mode", "label", "created_at"}


@pytest.fixture(scope="module", autouse=True)
def _cleanup_completions():
    """Verified seeded runs would otherwise pile up in the GLOBAL top-10 and
    crowd out other tests' entries (and real users') across runs."""
    yield
    try:
        from pymongo import MongoClient
        mc = MongoClient(os.environ["MONGO_URL"].strip("\"'"))
        db = mc[os.environ["DB_NAME"].strip("\"'")]
        db.crawl_completions.delete_many({"team_name": {"$regex": "^TEST_"}})
        db.crawl_completions.delete_many({"label": {"$regex": "^TEST_"}})
        db.crawl_checkins.delete_many({"stop_id": {"$regex": "^(s[1-3]|[a-f])$"}})
        mc.close()
    except Exception:
        pass
