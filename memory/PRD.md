# Fork·Fate — Restaurant Roulette (PRD)

## Original Problem Statement
Local restaurant roulette app with a pre-seeded demo list of restaurants. Users manually curate/add restaurants. Simple randomized shuffling-deck card reveal experience with filters. No login required.

Delivered follow-ups: black/silver/red/white theme; AdSense + Sponsored monetization; Food/Drinks/Bars/Desserts tabs; optional Google Places (fallback to curated MongoDB); shuffling deck animation; DoorDash/Order/Google Reviews portals; "Open now" filter; dessert-specific card actions.

Primary language: English.

## Architecture
- Backend: FastAPI (`/app/backend/server.py`), Motor/MongoDB. All routes prefixed `/api`.
- Frontend: React + Tailwind + Framer Motion + lucide-react. Key files: `Home.jsx`, `RestaurantCard.jsx`, `Filters.jsx`, `AddRestaurantDialog.jsx`, `AdUnit.jsx`, `InstallAppButton.jsx`.
- Data: dual-mode — Google Places (GOOGLE_API_KEY + ZIP) else curated MongoDB seed (~55 spots). ZIP→latlng geocode cached in-memory.
- PWA: `public/manifest.json` + InstallAppButton (beforeinstallprompt).

## Key Endpoints
- GET /api/restaurants, GET /api/cuisines
- POST /api/places/search (category + cuisine + price + open_now; Google or curated fallback)
- POST /api/spin, POST /api/restaurants, POST /api/reports
- GET /api/places/photo (proxies Google photos to hide key)

## Env
- backend/.env: MONGO_URL, DB_NAME, CORS_ORIGINS, GOOGLE_API_KEY
- frontend/.env: REACT_APP_BACKEND_URL, REACT_APP_ADSENSE_PUB_ID=ca-pub-7078042401291684, REACT_APP_ADSENSE_SLOT_ID=2465443431

## Production
- Deployed: https://lucky-bite-1.emergent.host (redeploys required to push preview changes).
- NOTE: GOOGLE_API_KEY lives in backend/.env; if prod ZIP search falls back to demo, prod env may need the var set via Emergent Support.

## Implemented (2026-07-05)
- Core roulette app, shuffling deck, sponsored pinning, Open-now filter, dessert card actions — DONE (E2E tested, iteration_12 100%)
- Removed Chicken Wings quick button; CTA renamed to "Deal Your Fate!" — DONE
- AdSense wired (pub + slot) — DONE
- "Share your fate" button (Web Share + clipboard) — DONE
- Establishment photo links to Google listing (result card + grid) — DONE
- "5 more to consider" alternatives list on result card (click to swap) — DONE
- Real Google Places ZIP search (Places API New + Geocoding) + geocode cache — DONE (curl verified all 4 categories)
- Download app / PWA install button + manifest.json — DONE
- Mobile header overlap fix (icon-only buttons < sm) — DONE
- Centered grim-reaper transparent background (bg removed, contrast/sharpened, opacity 0.38, visible mobile+desktop) at /reaper.png — DONE

## Backlog / Roadmap
- P1: Light moderation/auth for user-submitted restaurants (POST /api/restaurants + /api/reports unauthenticated — spam risk).
- P2: Refactor server.py (>580 lines) & Home.jsx (~560 lines) into modules; centralize cuisine constants + category enum.
- P2: Publish native app to App/Play stores (PWA install available now).

## Notes
- No auth (no test credentials).
- Restrict Google API key to Places API (New) + Geocoding API in Google Cloud.
