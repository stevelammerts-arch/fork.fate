"""Dynamic Open Graph share endpoint.

Fork·Fate is a client-rendered SPA. When users share their winning fate on
Facebook / iMessage / WhatsApp, the crawler fetches the shared URL and reads
Open Graph meta tags — but the static `index.html` only advertises the
Fork·Fate logo/description, so every share preview looked identical
regardless of which restaurant fate picked.

This route accepts the winner's details as query params, emits a tiny HTML
document with the correct OG tags (title, description, image), and then
meta-refreshes real users to the app home. Crawlers see the OG tags and
skip the refresh; humans get redirected in ~0.4s so it's imperceptible.
"""
from fastapi import APIRouter, Query, Response
from html import escape

router = APIRouter()

PROD_URL = "https://fork-fate.com"


@router.get("/share")
async def share_preview(
    name: str = Query("", max_length=200),
    cuisine: str = Query("", max_length=100),
    price: str = Query("", max_length=8),
    distance: str = Query("", max_length=20),
    image: str = Query("", max_length=1000),
    id: str = Query("", max_length=64),
):
    """Return an HTML page with dynamic OG tags for social share crawlers."""
    safe_name = escape(name or "Fork·Fate")
    safe_cuisine = escape(cuisine)
    safe_price = escape(price)
    safe_distance = escape(distance)

    parts = [p for p in [safe_cuisine, safe_price] if p]
    subtitle = " · ".join(parts)
    if safe_distance:
        subtitle = f"{subtitle} · {safe_distance} mi away" if subtitle else f"{safe_distance} mi away"

    title = f"The reaper has spoken: {safe_name}" if name else "Fork·Fate — Restaurant Roulette"
    description = (
        f"{subtitle}. Deal your own fate on Fork·Fate — restaurant roulette."
        if subtitle else "Can't decide where to eat? Let fate deal your next meal, drink or dessert."
    )
    og_image = image if (image and image.startswith("http")) else f"{PROD_URL}/og-image.png?v=2"

    # Landing URL preserves the sponsor deep-link pattern used elsewhere so
    # opening the share from a crawler-followed link still highlights the spot.
    landing = f"{PROD_URL}/?sponsor={escape(id)}" if id else f"{PROD_URL}/"

    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>{title}</title>
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="Fork·Fate">
  <meta property="og:title" content="{title}">
  <meta property="og:description" content="{escape(description)}">
  <meta property="og:image" content="{escape(og_image)}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:url" content="{escape(landing)}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="{title}">
  <meta name="twitter:description" content="{escape(description)}">
  <meta name="twitter:image" content="{escape(og_image)}">
  <meta http-equiv="refresh" content="0; url={escape(landing)}">
  <link rel="canonical" href="{escape(landing)}">
</head>
<body style="margin:0;font-family:system-ui;padding:2rem;text-align:center;background:#0E0E0E;color:#fff;">
  <p>Opening Fork·Fate…</p>
  <p><a href="{escape(landing)}" style="color:#E6B23A;">Tap here if you're not redirected</a></p>
</body>
</html>"""
    return Response(content=html, media_type="text/html; charset=utf-8")
