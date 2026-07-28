"""Focused backend verification for iteration 25 place_query cache regression."""
import json
import os
import sys
from pathlib import Path

import requests


ROOT = Path("/app")


def frontend_base_url() -> str:
    env_url = os.environ.get("REACT_APP_BACKEND_URL")
    if env_url:
        return env_url.rstrip("/")
    env_file = ROOT / "frontend" / ".env"
    for line in env_file.read_text().splitlines():
        if line.startswith("REACT_APP_BACKEND_URL="):
            return line.split("=", 1)[1].strip().strip('"').rstrip("/")
    return "https://web-fate-launch.preview.emergentagent.com"


API = f"{frontend_base_url()}/api"


def post_places(payload):
    r = requests.post(f"{API}/places/search", json=payload, timeout=45)
    try:
        body = r.json()
    except Exception:
        body = {"raw": r.text[:500]}
    return r.status_code, body


def non_sponsored(restaurants):
    return [r for r in restaurants if not r.get("sponsored")]


def result_signature(data):
    rows = non_sponsored(data.get("restaurants", []))[:8]
    return [(r.get("name", ""), r.get("address", "")) for r in rows]


def blob(data):
    return "\n".join(
        f"{r.get('name','')} {r.get('address','')}" for r in non_sponsored(data.get("restaurants", []))[:12]
    ).lower()


def assert_true(cond, msg):
    if not cond:
        raise AssertionError(msg)


def main():
    evidence = {"api": API}

    # Exact reported cache-collision repro: successful San Diego drinks request then
    # immediately invalid destination with same cache-shaping fields. The invalid
    # query must not return cached San Diego results.
    sd_payload = {"category": "drinks", "place_query": "San Diego California", "radius_miles": 50}
    bogus_payload = {"category": "drinks", "place_query": "stillanotherbogusquery999", "radius_miles": 50}
    sd_status, sd_body = post_places(sd_payload)
    bogus_status, bogus_body = post_places(bogus_payload)
    evidence["san_diego_then_bogus"] = {
        "san_diego_status": sd_status,
        "san_diego_source": sd_body.get("source"),
        "san_diego_count": len(sd_body.get("restaurants", [])),
        "bogus_status": bogus_status,
        "bogus_body": bogus_body,
    }
    assert_true(sd_status == 200 and sd_body.get("source") == "google", f"San Diego setup failed: {sd_status} {sd_body}")
    assert_true(bogus_status == 400, f"Bogus query should 400, got {bogus_status}: {bogus_body}")
    assert_true("detail" in bogus_body, f"Bogus 400 response missing detail: {bogus_body}")

    # Different valid place_query values must not collide. We require city evidence
    # in non-sponsored Google results and distinct result signatures.
    portland_payload = {"category": "food", "place_query": "Portland Oregon", "radius_miles": 50}
    miami_payload = {"category": "food", "place_query": "Miami Florida", "radius_miles": 50}
    portland_status, portland_body = post_places(portland_payload)
    miami_status, miami_body = post_places(miami_payload)
    portland_blob = blob(portland_body)
    miami_blob = blob(miami_body)
    evidence["portland_then_miami"] = {
        "portland_status": portland_status,
        "portland_source": portland_body.get("source"),
        "portland_signature": result_signature(portland_body),
        "miami_status": miami_status,
        "miami_source": miami_body.get("source"),
        "miami_signature": result_signature(miami_body),
    }
    assert_true(portland_status == 200 and portland_body.get("source") == "google", f"Portland failed: {portland_status} {portland_body}")
    assert_true(miami_status == 200 and miami_body.get("source") == "google", f"Miami failed: {miami_status} {miami_body}")
    assert_true("portland" in portland_blob or " or " in portland_blob or ", or" in portland_blob, "Portland response lacked Portland/Oregon evidence")
    assert_true("miami" in miami_blob or " florida" in miami_blob or ", fl" in miami_blob, "Miami response lacked Miami/Florida evidence")
    assert_true(result_signature(portland_body) != result_signature(miami_body), "Portland and Miami result signatures were identical")

    # Regression coverage explicitly requested by main agent.
    max_status, max_body = post_places({"category": "food", "place_query": "x" * 200})
    zip_status, zip_body = post_places({"category": "food", "zip_code": "90210", "place_query": "Omaha Nebraska", "radius_miles": 50})
    lat_status, lat_body = post_places({"category": "food", "lat": 40.7128, "lng": -74.0060, "zip_code": "90210", "place_query": "Omaha Nebraska", "radius_miles": 50})
    curated_status, curated_body = post_places({"category": "food", "radius_miles": 50})
    evidence["regressions"] = {
        "max_length_status": max_status,
        "zip_priority_status": zip_status,
        "zip_priority_source": zip_body.get("source"),
        "latlng_priority_status": lat_status,
        "latlng_priority_source": lat_body.get("source"),
        "curated_status": curated_status,
        "curated_source": curated_body.get("source"),
        "curated_count": len(curated_body.get("restaurants", [])),
    }
    assert_true(max_status == 422, f"place_query max_length should 422, got {max_status}: {max_body}")
    assert_true(zip_status == 200 and zip_body.get("restaurants"), f"zip+place_query priority search failed: {zip_status} {zip_body}")
    zip_text = blob(zip_body)
    assert_true("omaha" not in zip_text and "nebraska" not in zip_text, "zip priority response appeared to use Omaha place_query")
    assert_true(lat_status == 200 and lat_body.get("restaurants"), f"lat/lng priority search failed: {lat_status} {lat_body}")
    lat_text = blob(lat_body)
    assert_true("omaha" not in lat_text and "beverly hills" not in lat_text, "lat/lng priority response appeared to use lower-priority location")
    assert_true(curated_status == 200 and curated_body.get("source") == "curated" and curated_body.get("restaurants"), f"curated fallback failed: {curated_status} {curated_body}")

    print(json.dumps({"ok": True, "evidence": evidence}, indent=2))


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print(json.dumps({"ok": False, "error": str(exc)}, indent=2))
        sys.exit(1)