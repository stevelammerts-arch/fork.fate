"""Weather snapshot (Open-Meteo, no API key) used to bias the Explore roulette.

Dealing a hiking trail in a thunderstorm — or a museum on the first warm day of
spring — is a bad pick. Explore searches with no chips selected ask this module
what kind of outing the sky allows. Frontend never calls Open-Meteo directly.
"""
import time

import httpx
from fastapi import APIRouter, HTTPException, Query

from core import logger

router = APIRouter()

OPEN_METEO_URL = "https://api.open-meteo.com/v1/forecast"
# Open-Meteo's fair use is 10k/day, 600/min. Coordinates are rounded to ~1 km and
# cached for 30 min, so a busy ZIP costs one call per half hour.
_WX_CACHE: dict[str, tuple[float, dict]] = {}
_WX_TTL = 1800

# WMO weather codes (see Open-Meteo docs).
_WET = set(range(51, 68)) | set(range(80, 100))   # drizzle, rain, freezing rain, showers, storms
_SNOW = set(range(71, 80))
_FOG = {45, 48}


def _classify(temp_f: float, precip_prob: int, code: int) -> tuple[str, str]:
    """Return (bias, human label). bias drives the Explore default query."""
    if code in _SNOW or (code in _WET and temp_f <= 34):
        return "snow", "Snowy"
    if code in _WET or precip_prob >= 55:
        return "indoor", "Rain likely"
    if code in _FOG:
        return "indoor", "Foggy"
    if temp_f >= 88:
        return "water", "Hot out"
    if temp_f <= 40:
        return "indoor", "Cold out"
    return "outdoor", "Nice out"


async def weather_snapshot(lat: float, lng: float) -> dict | None:
    """Best-effort forecast. Returns None on any failure — weather is a nicety."""
    key = f"{round(lat, 2)},{round(lng, 2)}"
    hit = _WX_CACHE.get(key)
    if hit and time.time() - hit[0] < _WX_TTL:
        return hit[1]
    try:
        async with httpx.AsyncClient(timeout=6) as http:
            r = await http.get(OPEN_METEO_URL, params={
                "latitude": round(lat, 2),
                "longitude": round(lng, 2),
                "current": "temperature_2m,weather_code,precipitation",
                "hourly": "precipitation_probability",
                "forecast_hours": 3,
                "temperature_unit": "fahrenheit",
                "precipitation_unit": "inch",
                "timezone": "auto",
            })
            r.raise_for_status()
            d = r.json()
        cur = d.get("current") or {}
        temp_f = float(cur.get("temperature_2m") or 60)
        code = int(cur.get("weather_code") or 0)
        probs = [p for p in (d.get("hourly") or {}).get("precipitation_probability", []) if p is not None]
        precip_prob = int(max(probs[:3])) if probs else 0
        bias, label = _classify(temp_f, precip_prob, code)
        snap = {"temp_f": round(temp_f), "precip_prob": precip_prob, "code": code, "bias": bias, "label": label}
        _WX_CACHE[key] = (time.time(), snap)
        if len(_WX_CACHE) > 500:
            for k in sorted(_WX_CACHE, key=lambda k: _WX_CACHE[k][0])[:100]:
                _WX_CACHE.pop(k, None)
        return snap
    except Exception as e:  # noqa: BLE001 — never let weather break a search
        logger.warning(f"Open-Meteo lookup failed: {str(e)[:200]}")
        return None


@router.get("/weather")
async def get_weather(lat: float = Query(..., ge=-90, le=90), lng: float = Query(..., ge=-180, le=180)):
    snap = await weather_snapshot(lat, lng)
    if not snap:
        raise HTTPException(status_code=503, detail="Weather is unavailable right now")
    return snap
