# Fork·Fate — Restaurant Roulette (PRD)

## Original Problem Statement
Local restaurant roulette app with a pre-seeded demo list of restaurants. Users manually curate/add restaurants. Simple randomized shuffling-deck card reveal experience with filters. No login required.

Follow-up requirements delivered:
- Black/silver/red/white theme
- Monetization via Google AdSense + Sponsored spots
- Dedicated tabs: Food, Drinks, Bars, Desserts
- Optional Google Places integration (fallback to curated MongoDB data)
- Shuffling deck animation
- Portal buttons for DoorDash / Order online / Google Reviews
- "Open now" hours filter toggle
- Dessert-specific card actions ("Order treats" + dessert vibe icons)

Primary language: English.

## Architecture
- Backend: FastAPI (`/app/backend/server.py`), Motor/MongoDB. All routes prefixed `/api`.
- Frontend: React + Tailwind + Framer Motion + lucide-react. `Home.jsx`, `RestaurantCard.jsx`, `Filters.jsx`, `AddRestaurantDialog.jsx`, `AdUnit.jsx`.
- Data: dual-mode — Google Places (if GOOGLE_API_KEY set + ZIP) else curated MongoDB seed (~55 spots). Currently running on curated fallback (no Google key).

## Key Endpoints
- GET /api/restaurants, GET /api/cuisines
- POST /api/places/search (category + cuisine + price + open_now, curated fallback)
- POST /api/spin, POST /api/restaurants, POST /api/reports
- GET /api/places/photo (proxies Google photos to hide key)

## Implemented (as of 2026-07-05)
- Full 4-tab roulette app, shuffling deck animation, sponsored pinning — DONE
- Open-now filter + dessert card actions — DONE, E2E tested 100% (iteration_12)
- Removed "Chicken Wings" quick button; renamed spin CTA to "Shuffle your fate" — DONE (screenshot verified)
- Deployment readiness check — PASS
- Deployed to production: https://lucky-bite-1.emergent.host
- AdSense wired: REACT_APP_ADSENSE_PUB_ID=ca-pub-7078042401291684, REACT_APP_ADSENSE_SLOT_ID=2465443431 (AdUnit renders in Nearby spots; live ads only on approved prod domain) — DONE in preview; NEEDS REDEPLOY to go live.

## Backlog / Roadmap
- P1: Light moderation/auth for user-submitted restaurants (POST /api/restaurants + /api/reports are unauthenticated — spam risk).
- P2: Refactor server.py (>580 lines) and Home.jsx (~500 lines) into modules; centralize cuisine constants + category enum.
- P2: Use real open_now from Google Places when a key is configured (currently idx%4 seed heuristic).

## Notes
- No auth in app (no test credentials).
- Preview REACT_APP_BACKEND_URL: set in frontend/.env (do not trust older forks).
