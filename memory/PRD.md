# Fork·Fate — Restaurant Roulette (PRD)

## Original Problem Statement
Local restaurant roulette app with pre-seeded demo restaurants. Users curate/add spots. Randomized shuffling-deck reveal with filters. No login (public). Monetization via AdSense + sponsored spots.

Primary language: English.

## Architecture
- Backend: FastAPI (`/app/backend/server.py`), Motor/MongoDB. Routes prefixed `/api`. ~790 lines (refactor candidate).
- Frontend: React + Tailwind + Framer Motion + lucide-react. Pages: `Home.jsx`, `Admin.jsx`. Components: RestaurantCard, Filters, AddRestaurantDialog, AdUnit, InstallAppButton, BecomeSponsorDialog.
- Data: Google Places (real, when ZIP/lat-lng + GOOGLE_API_KEY) else curated MongoDB seed. ZIP→latlng geocode cached.
- PWA: manifest.json + InstallAppButton (no service worker → updates are automatic, no re-download).

## Env
- backend/.env: MONGO_URL, DB_NAME, CORS_ORIGINS, GOOGLE_API_KEY, JWT_SECRET, ADMIN_PASSWORD
- frontend/.env: REACT_APP_BACKEND_URL, REACT_APP_ADSENSE_PUB_ID=ca-pub-7078042401291684, REACT_APP_ADSENSE_SLOT_ID=2465443431

## Key Endpoints
- GET /api/restaurants, /api/cuisines; POST /api/places/search (Google/curated, lat/lng, sponsor injection), /api/spin, /api/restaurants, /api/reports, /api/sponsorship-requests
- GET /api/places/photo (proxy)
- Admin (JWT Bearer, password from ADMIN_PASSWORD): POST /api/admin/login, GET /api/admin/verify, GET/POST /api/admin/sponsors, PATCH/DELETE /api/admin/sponsors/{id}

## Production
- Deployed: https://lucky-bite-1.emergent.host (redeploy to push preview changes).
- GOOGLE_API_KEY / JWT_SECRET / ADMIN_PASSWORD live in backend/.env; if prod behaves differently, prod env vars may need to be set via Emergent Support.

## Implemented (through 2026-07-07)
- Core roulette, shuffling deck, 4 tabs, filters, open-now, dessert actions, sponsored pinning — DONE
- CTA "Deal Your Fate!"; mobile header icon-only fix; red Download app (PWA) button — DONE
- Real Google Places ZIP + geolocation ("Use my location") search + geocode cache — DONE
- Photo→Google listing links; "Share your fate"; "5 more to consider" alternatives — DONE
- AdSense wired + ads.txt + always-on landing ad banner — DONE
- Gluten Free food chip — DONE
- Transparent logo + one-time light flash sweep (duration 1.464s) — DONE
- Centered grim-reaper background (transparent, opacity 0.38, mobile+desktop) at /reaper.png — DONE
- Footer with "Suggest an improvement" mailto (stevelammerts@gmail.com) — DONE
- ADMIN sponsor management at /admin (password GrimReaper!2026): login + sponsor CRUD; sponsors injected/pinned into all searches; public Sponsored toggle removed — DONE (tested iteration_15, 100%)
- PayPal sponsorship payment: "Become a sponsor" dialog with $29/mo + first month free, PayPal.Me link (paypal.me/stevelammerts/29) + QR (/paypal-qr.jpg) + email-details CTA — DONE (manual flow, no API)

## Backlog / Roadmap
- P2: Full PayPal API (Client ID/Secret) for auto-activating sponsors on payment.
- P2: Refactor server.py into routes/services modules.
- P3: Native app store publish (PWA install available now).
- P3: Offline support via service worker + "update available" toast (only if offline needed).

## Notes
- Admin password: GrimReaper!2026 (see /app/memory/test_credentials.md).
- Sponsorship pricing: $29/month, first month free. Payments via PayPal.Me @stevelammerts.
