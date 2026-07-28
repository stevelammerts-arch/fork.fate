"""Backend logic check: /places/search falls back to curated when Google search fails."""
import asyncio
import json
import sys

from fastapi import HTTPException

sys.path.insert(0, "/app/backend")

from models import PlacesSearchRequest  # noqa: E402
import routes.places as places  # noqa: E402


async def main():
    original_key = places.GOOGLE_API_KEY
    original_cached = places.cached_google_search

    async def forced_google_failure(req):
        raise HTTPException(status_code=503, detail="forced-google-failure")

    try:
        places.GOOGLE_API_KEY = "forced-test-key"
        places.cached_google_search = forced_google_failure
        result = await places.places_search(
            PlacesSearchRequest(category="food", zip_code="10001", radius_miles=50)
        )
        assert result.get("source") == "curated", result
        assert len(result.get("restaurants", [])) > 0, result
        print(json.dumps({
            "ok": True,
            "source": result.get("source"),
            "restaurant_count": len(result.get("restaurants", [])),
        }, indent=2))
    finally:
        places.GOOGLE_API_KEY = original_key
        places.cached_google_search = original_cached


if __name__ == "__main__":
    asyncio.run(main())