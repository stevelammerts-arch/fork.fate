# Fork·Fate — Local Restaurant & Drinks Roulette

## Original Problem Statement
Local Restaurant roulette app.

## Architecture
- Backend: FastAPI + MongoDB (`/api` prefix). Seeds 31 spots on startup (23 food + 8 drinks).
- Google Places (New) + Geocoding for ZIP → nearby (≤50 mi via haversine). Falls back to curated seed when GOOGLE_API_KEY unset/fails/empty — curated is the intended primary experience.
- Frontend: React 19 + Tailwind + shadcn/ui + Framer Motion. Single ZIP-driven page. Theme: black / silver / red / white.

## Integrations
- Google Places API (New) + Geocoding — needs GOOGLE_API_KEY (backend/.env). NOT SET → curated fallback active.
- Google AdSense — AdUnit component gated on REACT_APP_ADSENSE_PUB_ID (frontend/.env, currently EMPTY → renders nothing). Needs publisher ID + ad slot ID + site approval.

## Implemented (2026-06/07)
- ZIP (optional) + 50-mile radius; filters: cuisine + price; distances in miles.
- Shuffle-to-reveal roulette with an animated **shuffling deck** (riffle) before landing.
- **Food / Drinks toggle** — Drinks section covers Coffee, Boba Tea, Smoothie (own chips, hero copy, add-form options, images).
- **Sponsored spots** — `sponsored` flag pins to top + badge (food: Olive & Ember, Harborline, Ember & Oak BBQ; drinks: Cloud Nine Coffee, Pearl & Pour).
- **Google AdSense scaffold** — responsive ad unit above the grid (lights up when PUB_ID set).
- **Reviews & ratings portal** — button on result card + each grid card linking to the restaurant's Google Maps page (real googleMapsUri for live, maps search URL for curated).
- Add / delete spots; added spots appear immediately and respect current mode/category.
- Tested through iteration_7: backend 30/30, frontend E2E 100%.

## Backlog
- P1: Add GOOGLE_API_KEY → validate live Places path (real photos/ratings). Add REACT_APP_ADSENSE_PUB_ID → validate ads.
- P2: Affiliate "Order/Reserve" buttons; favorites/spin history; shareable result link.
- P2: Live-path cuisine post-filter by primaryType.

## Next Tasks
- Awaiting Google Places key + AdSense publisher ID to go from demo → live.
