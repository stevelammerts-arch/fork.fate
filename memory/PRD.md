# Fork·Fate — Local Restaurant Roulette

## Original Problem Statement
Local Restaurant roulette app.

## User Choices / Evolution
- v1: Pre-seeded + manually curated restaurants; shuffle-to-reveal roulette; filters cuisine/price/distance; no auth.
- v2: Limit to within 50 miles of a user's ZIP code; randomize by cuisine, price, and show Google star ratings.
- Data source: Live Google Places API (New) primary + curated seed list as automatic fallback.
- Color theme: black / silver / red / white.
- Spin picks fully random; rating shown (not filtered); distances in miles.

## Architecture
- Backend: FastAPI + MongoDB. `/api` prefix. Seeds 12 curated restaurants on startup.
- Google Places (New) Text Search + Geocoding for ZIP → lat/lng → nearby restaurants; haversine filter to ≤ 50 miles; real Google ratings, price level, photo.
- Frontend: React 19 + Tailwind + shadcn/ui + Framer Motion. Single ZIP-driven page.

## Integrations
- Google Places API (New) + Geocoding API. Requires `GOOGLE_API_KEY` in backend/.env.
  - STATUS: KEY NOT YET PROVIDED — app currently runs on the curated fallback path.
  - When key is added + backend restarted, live path activates automatically (source='google').

## Implemented (2026-06)
- Backend: POST /api/places/search {zip_code, cuisines[], price_levels[]} → {source, restaurants[]}; Google primary, curated fallback; 50-mile haversine filter; price-enum→symbol + cuisine filtering on fallback.
- Existing: GET /api/restaurants, POST/DELETE /api/restaurants, GET /api/cuisines, POST /api/spin.
- Frontend: ZIP input (digits only, 5-cap), cuisine + price filter pills, red "Spin the deck" with shuffle→reveal, result card (Google rating, miles, address), Spin again / Clear, nearby-spots grid. Black/silver/red/white theme.
- Tested: iteration_3 → 14/14 backend, 100% frontend E2E (curated fallback path).

## Backlog
- P1: Add GOOGLE_API_KEY and validate live path (real restaurants + Google photos/ratings).
- P2: Live-path cuisine post-filter by primaryType for tighter matches.
- P2: Favorites / spin history; shareable result link.
- P2: Browser geolocation as ZIP alternative.

## Next Tasks
- Obtain GOOGLE_API_KEY from user → enable + test live Google Places flow.
