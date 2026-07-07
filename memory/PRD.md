# Fork·Fate — Product Requirements & Status

## Original Problem Statement
Local restaurant roulette web app. Pre-seeded/curated restaurant list, users can add spots, randomized shuffling-deck card reveal, filterable spin. No login required.
Later requirements: black/silver/red/white theme; AdSense + sponsored spots monetization; tabs for Food/Drinks/Bars/Desserts; Google Places integration; shuffling deck animation; DoorDash + Google Reviews portal buttons; PWA "Download app"; "Use my location"; admin sponsorship management; animated grim reaper background.

## Architecture
- Frontend: React + Tailwind + Framer Motion. Key pages: `src/pages/Home.jsx`, `src/pages/Admin.jsx`.
- Backend: FastAPI + Motor (MongoDB) + PyJWT. `backend/server.py`.
- Integrations: Google Places (New) & Geocoding API, AdSense, PayPal (manual QR), Gemini image gen (Emergent LLM key, for logo/reaper assets).
- Admin `/admin` password: `GrimReaper!2026` (env ADMIN_PASSWORD).

## Deployment
- Preview: https://lucky-bite-1.preview.emergentagent.com
- Production: deployed (user manages). Custom domain planned but NOT active yet — all domain refs removed from code.
- `.gitignore` fixed to NOT block `.env` (was reappearing at bottom; removed again).

## Implemented (latest first — 2026-07)
- Update mechanism hardened: "Check for updates" now unregisters service workers, clears all Cache Storage, and reloads with cache-busting param (`CheckUpdatesButton.jsx`). Fixes "latest version but stale assets".
- Logo cleanup: replaced speckled/ring logo with clean `logo-v10.png` (red glossy button, no silver ring, no clutter). Updated header, footer, favicon, PWA icon. (Older: logo-v8 had baked speckle shadow; v9 had silver ring.)
- Logo light-sweep glint: thinned band (~8% wide) and slowed (2.6s duration, 8s repeat delay).
- Grim reaper: 3D mouse-parallax tilt + drop shadow for depth; cloak-hem skew sway; yellow lantern glow repositioned over the actual lantern (right side) and wrapped in shared skew wrapper so glow moves WITH the lantern.
- Removed all `fork-fate.com` SEO/OG meta tags (domain not active yet).
- Prior: 4-tab UI, cuisine/vibe filters, Open now + Gluten free, ZIP/geolocation Google Places search, full-screen shuffle pop-up w/ deceleration + camera flash, "5 more to consider", PWA install, AdSense (ads.txt), /admin sponsor management, PayPal $29/mo dialog, social share, "reaper has spoken" one-liners (bold + text-xl), grid sort.

## Backlog / Next
- P1: Sponsor analytics in /admin (impressions/clicks) to justify $29/mo.
- P1: Light moderation for public "Add spot" submissions (anti-spam).
- P2: Save favorites (local), spin history & streaks, auto-reroll if closed, distance/price/rating sort on Nearby grid, group mode (3 picks to vote).
- P2: Refactor server.py into route modules; full PayPal API auto-activation.
- When custom domain goes live: re-add canonical/OG/Twitter meta tags; add domain to Google Places API key referrer allowlist.

## Testing
- Latest passing: /app/test_reports/iteration_27.json (reaper/glow/bold-line regression, all clean).
- Deployment health check: PASS after .gitignore fix.
