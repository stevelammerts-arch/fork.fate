# Fork·Fate — Product Requirements & State

## Original Problem Statement
Local Restaurant roulette PWA ("Fork·Fate") with a randomized card reveal/shuffle
experience. Geolocated Google Places searches, a guided "sealing your fate" ritual
wizard, filtering, shareable "Fate Card" generation, PWA installability, Admin portal
for sponsors, Pub Crawl mode with verified anti-cheat leaderboards, 10 themes, and an
in-app Merch showcase (`/shop`). Deployed as Android TWA + production at fork-fate.com.

## Environments
- PREVIEW (dev): https://fate-mobile-build.preview.emergentagent.com — separate DB.
  NOTE: this container's template is Expo/Metro, but Fork·Fate is a CRA web app.
  The `expo` supervisor program is intentionally STOPPED; the frontend runs as a
  plain background process: `cd /app/frontend && BROWSER=none yarn start` (logs at
  /tmp/craco.log). Backend is under supervisor as normal. The original Expo
  scaffold was moved to /app/.template-expo/ (unused).
- PRODUCTION (live): https://fork-fate.com — separate DB. User deploys manually.
- PWA caching: bump `var FF_BUILD="2026.06-XX"` in `/app/frontend/public/index.html`
  on ANY frontend change. (Currently 2026.06-279.)

## Implemented — 2026-07-26 (repo re-import session)
- **Repo re-imported from GitHub** after the previous session locked up. IMPORTANT:
  the prior session's work was NEVER pushed — GitHub HEAD was `bfdec92` (Jul 24,
  FF_BUILD 2026.06-276). Stranded and NOT recovered: `RideDropdown.jsx`, the original
  `crawl_checkins` write path, and FF_BUILD 277/278. "Save to GitHub" was greyed out
  in the old session (agent stuck in a thinking loop), so recovery was abandoned and
  the crawl_checkins piece was rebuilt from scratch here.
- **CRITICAL security fix — exposed Android signing keystore.** The security audit
  found `frontend/public/forkfate-upload.keystore` git-tracked AND served publicly
  (verified live: https://fork-fate.com/forkfate-upload.keystore returned HTTP 200,
  2796 bytes), with its password in plaintext in `build_aab/ORIGINAL-signing-key-info.txt`
  in the PUBLIC repo. Five `.aab` bundles were also public. All moved to
  `/app/private_build_assets/` (persistent, gitignored); `.gitignore` now blocks
  `*.keystore`, `*.jks`, `*.aab`, `*.apk`, `build_aab/`, `**/ORIGINAL-signing-key-info.txt`.
  USER ACTION STILL REQUIRED: rotate the upload key via Play Console → Setup →
  App integrity → Request upload key reset, then add the new SHA-256 to assetlinks.json.
  Key material is NOT lost — preserved in /app/private_build_assets/.
- **Reveal card decluttered.** New `components/FateActionsDropdown.jsx` collapses
  Check-in + Reviews & ratings + Share your fate + Share as image + the whole social
  strip into ONE "More" dropdown, matching the OrderDropdown pattern. Reveal card only.
  The Order dropdown stays separate/primary. Removed from RevealStage: `CheckInButton`,
  inline `SocialShare`, and testids `rate-on-google-button`, `check-in-button`,
  `share-fate-button`, `share-fate-image-button`. `SocialShare` is still used in the
  Home.jsx footer; `CheckInButton.jsx` is now unused (left in place — dead code to prune).
- **Order dropdown hidden for shops/fuel on grid tiles.** `RestaurantCard.jsx` only
  gated on URL presence, but the backend populates doordash/ubereats/grubhub/order URLs
  for EVERY category — so yarn/antique/record stores and gas stations showed a bogus
  "Order" → DoorDash button. Now gated on
  `r.category !== "shops" && r.category !== "fuel"`, matching the reveal card's
  `mode !== "shops" && mode !== "fuel"`. Action row flips grid-cols-2 → grid-cols-1 so
  Reviews spans full width when Order is hidden.
- **P3 crawl_checkins TTL hardening.** New `POST /api/crawls/{code}/checkin`
  (rate_limit 60/min) + `CrawlCheckinCreate` model. Writes `created_at` as an ISO
  string (codebase convention) AND a separate `expire_at` BSON datetime, with a TTL
  index `expire_at_1` (expireAfterSeconds=0) + a `code` index, created lazily via
  `_ensure_checkin_indexes()` following the `stat_dedupe` pattern. TTL = 36h.
  NOT YET WIRED to the frontend — `PubCrawlDialog.jsx` still tracks check-ins purely
  in localStorage. Wiring it up is the prerequisite for fixing SEC-002.
- Verified end-to-end by testing_agent (iteration_1): 21/21 backend pytests, Playwright
  across all six categories. New suite: `backend/tests/test_iter_fateactions_and_checkin.py`.

## Security audit — 2026-07-26 (full pass, retry after previous timeout)
- SEC-001 CRITICAL — public signing keystore + password. FIXED in-repo (see above);
  key rotation still pending on the user.
- SEC-002 MEDIUM — leaderboard anti-cheat is client-controlled: `/api/crawls/complete`
  trusts client-supplied `verified`/`distance`/`duration_seconds`; the >15mph check is
  trivially satisfied by a self-consistent fake. Fix = derive verification server-side
  from crawl_checkins (foundation now exists). routes/crawls.py:81-101.
- SEC-003 MEDIUM — credentialed CORS trusts any `*.preview.emergentagent.com`
  (core.py:50 + server.py:44) with `allow_credentials=True`. Currently mitigated by
  SameSite=Lax. Fix = env-gate the preview wildcard out of production.
- SEC-004 MEDIUM — `/api/places/photo` billed Google fetches are NOT counted against
  GOOGLE_SEARCH_DAILY_CAP (places.py:200-214). Fix = reserve + cache.
- P3s: no CSRF token on cookie-auth admin writes; per-worker in-memory rate limiter and
  login lockout; `cf-connecting-ip` trusted for any private TCP peer.

## Pending / Backlog

## Tech Stack
- Frontend: React + Tailwind + framer-motion, react-i18next (`t()`), PWA.
- Backend: FastAPI + MongoDB (Motor). Admin auth = HttpOnly cookie JWT + WebAuthn passkey.
- Integrations: Google Places, PayPal, Resend, GA4, Emergent Object Storage, Gemini image gen.

## Implemented (recent)
- 2026-06: **Order/Delivery dropdown** — replaced the single "Order on DoorDash"
  button on the reveal card (and RestaurantCard tiles) with a reusable
  `OrderDropdown` (DoorDash, Uber Eats, Grubhub, + restaurant order link). Backend
  added `ubereats_url()`/`grubhub_url()` helpers (core.py), new Restaurant model
  fields, and populates them in places.py + restaurants.py. Favorites persist the
  new fields. Verified via testing_agent (100%). Files: `components/OrderDropdown.jsx`,
  `components/home/RevealStage.jsx`, `components/RestaurantCard.jsx`,
  `hooks/useFavorites.js`, `backend/core.py|models.py|routes/places.py|routes/restaurants.py`.
- 2026-06: **Pub Crawl anti-cheat** (tested via curl):
  - Only GPS-auto-checked-in crawls rank on the leaderboard. Manual taps earn the
    badge but show "Unverified — not ranked".
  - Server sanity check: verified runs implying > 15 mph avg speed (from distance/
    duration) are downgraded to unverified. Missing distance/duration on a claimed
    verified run also downgrades it.
  - `_leaderboard_for` matches `verified: {$ne: False}` → legacy entries (no field)
    stay visible; new manual/impossible entries are hidden.
  - Client: 30s minimum pacing between MANUAL check-ins; GPS arrivals tracked
    separately (`gpsVisited`) to compute `verified`; route distance computed client-side.
  - Files: `backend/models.py` (CrawlCompletionCreate + verified/distance),
    `backend/routes/crawls.py`, `frontend/components/PubCrawlDialog.jsx`,
    `CrawlBadgeDialog.jsx`, `CrawlLeaderboard.jsx`.
- 2026-06: **Multi-origin WebAuthn passkeys** (tested via curl):
  - Each passkey now tagged with `rp_id` at registration; availability, register-options
    (excludeCredentials), login-options (allowCredentials), status, and remove all filter
    by the current request's RP-ID. Legacy untagged passkeys treated as current-origin
    (backward compatible → production passkey untouched).
  - Effect: preview and production each need their own registered passkey (WebAuthn is
    domain-bound). Preview login screen now hides the fingerprint button until a passkey
    is registered for the preview domain.
  - File: `backend/routes/passkey.py`.

## Pending / Backlog
- **P0 (user action): rotate the leaked Android upload key.** Play Console → Setup →
  App integrity → App signing → Request upload key reset. Then add the new SHA-256
  fingerprint to `frontend/public/.well-known/assetlinks.json` and redeploy.
- **P1: wire PubCrawlDialog check-ins to POST /api/crawls/{code}/checkin**, then derive
  `verified` server-side in /api/crawls/complete (closes SEC-002).
- P2: env-gate the `*.preview.emergentagent.com` CORS wildcard out of prod (SEC-003).
- P2: count `/api/places/photo` against the Google daily cap + cache (SEC-004).
- P3: prune now-unused `components/CheckInButton.jsx`.
- Deploy policy: **all production deploys are on hold during Google Play closed
  testing**, EXCEPT the keystore removal, which the user approved shipping immediately.
- P1: **Live Print-on-Demand checkout** (Printful) for `/shop` — currently "Notify me"
  email capture only. Waiting on user signal + Printful API keys.
- P1: **Resend domain verification** — `SENDER_EMAIL` temporarily `onboarding@resend.dev`
  until SPF/DKIM for fork-fate.com is verified.
- In progress: Google Play closed-testing 14-day / 12+ tester window.

## Test Credentials
See `/app/memory/test_credentials.md`.
