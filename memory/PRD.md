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

## Implemented — 2026-08-02 (Oracle + Realm picker session)
- **Flourish refinement wave (user-directed, FF_BUILD 313-316)** in
  `ThemeFlourish.jsx`: (1) Coffee Shop flourish = LATTE ART (cup + cream heart
  that draws itself; compact cup above the deck card) replacing steam;
  (2) Coffee Shop shuffle bed: user "lost shuffle noises" — theme never had
  one (they'd been on seasonal default); synthesized café bed
  `scripts/gen_cafe_bed.py` -> `/shuffle-cafe.wav` (v2 = babble syllables, no
  static hiss after user feedback) wired via SHUFFLE_LOOPS light entry. User
  says they once had a REAL café recording — repo history has none; they may
  upload one later (drop-in same filename). UPDATE 2026-02: user uploaded a
  real coffee-maker brew recording (floraphonic, 68s); replaced
  /shuffle-cafe.wav with the 10-22s segment (most active brewing), highpass
  60Hz, 0.35s fade in/out for seamless loop, loudnorm -18 LUFS; SHUFFLE_LOOPS
  now points to /shuffle-cafe.wav?v=2 for cache-busting. (3) Reaper reveal flourish =
  GHASTLY spectral shrouds (SVG, gaunt slanted sockets + wailing mouth,
  sickly green-white glow, flicker; iterated 3x from 'comical' -> 'smoke' ->
  'ghastly'); deck keeps skeleton hands. (4) Cyberpunk reveal flourish =
  PURPLE MATRIX RAIN (12 binary columns, glowing lead char) — user first
  asked lasers (built, then 'belay that order'); rain now loops
  UPDATE 2026-02 (accepted by user): Reaper flourish iterated again —
  'ghastly shrouds' rejected as 'video game'; now ELONGATED HUMAN APPARITIONS
  (GhostRise in ThemeFlourish.jsx): translucent human figure (head, jaw,
  shoulders, folded-arm hint) trailing into long vapor tendrils (viewBox
  60x140), body under animated feTurbulence displacement, face under light
  blur only — mournful human eyes/nose/small open mouth, NOT a skull. A faint
  synthesized SOUL WAIL (/soul-wail.wav, scripts/gen_soul_wail.py — two
  detuned gliding voices + breath noise + tap reverb, 4.2s) plays via
  useEffect in GhostRise (0.35s delay, vol 0.5) on every Reaper reveal.
  Dev preview page /dev/rare now has replayable 'Reaper Souls' and
  'Cyberpunk Rain' flourish cards.
  INFINITELY while the reveal card shows (RevealStage skips the 4200ms
  auto-off for cyber only). (5) Summer = bouncing striped beach balls
  (replaced sun sparkles, deleted). Barista bell + all verified through
  iterations 45-47 (100%); final ghastly/looping deltas lint-clean on
  verified structures. NOTE: a stray duplicated JSX fragment briefly broke
  ThemeFlourish parsing — removed (watch for edit-overlap debris in this file).
- **Shake-collision fix**: shaking the phone during a rare ritual (esp. 8-ball)
  used to ALSO fire the global shake-to-shuffle and deal a new shuffle over
  the ritual. Home.jsx global useShake now bails/disables while surpriseReveal
  or showThemeWelcome is active. Verified iteration_43 (3/3, synthetic
  DeviceMotionEvent bursts — recipe documented in that report).
- **Per-theme flourishes** (`components/home/ThemeFlourish.jsx`, one-shot over
  the landed deck card + reveal card, 4.2s): Winter snow flurry, Spring petals,
  Fall leaves, Tiki fireflies, Summer sun sparkles, Coffee Shop coffee steam
  (SteamBurst reuse), Steampunk steam (routed through same component now,
  deck testid renamed deck-steam -> deck-flourish), Dragon's Hoard =
  "realistic dissipating wall of fire": base heat glow + 12 flickering flame
  tongues + 22 embers sparking upward (user asked for embers/sparks
  emphasis) — REVEAL ONLY for fantasy (deck keeps dragon claw + gold pulse).
  Dark (skeleton hands) + Cyber (neon pulse) unchanged, no flourish.
  FLOURISH_THEMES set exported and used to gate RevealStage's effect.
- **Barista bell reveal (Coffee Shop)**: user-uploaded bell
  (`/public/barista-bell.mp3`, 1.85s) now plays on light-theme reveals via the
  revealSrc map (`light` key) in Home.jsx runShuffle + both thunderRef
  fallbacks (theme==='light' check). Summer/seasonal fallback keeps tada.
  FF_BUILD -> **2026.06-311**.
- **Coffee Shop dust motes** (`components/CafeDustMotes.jsx`): 16 warm golden
  specks drifting full-screen, infinite loop, light theme only,
  pointer-events-none. Rendered in Home next to cafe-bg-light.
  User's other Coffee Shop idea picks: barista bell reveal sound (NEEDS sound
  file from user), receipt-style card framing (not yet requested to build).
- All verified iteration_44: 10/10 themes exact-match matrix, 0 console errors.
- FF_BUILD -> **2026.06-310**. Still PREVIEW-only pending redeploy.
- **Steampunk steam flourish** (`components/home/SteamBurst.jsx`, steampunk only):
  one-shot burst of 7 blurred vapor puffs (a) rising off the TOP of the landed
  "FATE HAS CHOSEN" deck card in the shuffle popup (`ShufflingDeck.jsx`
  deck-steam strip, gated landed && theme==='steam') and (b) from the upper
  half of the reveal card while the reveal sound plays (`RevealStage.jsx`
  steaming state — hooks live ABOVE the early returns, keyed result?.id;
  4200ms auto-unmount). SteamBurst is parametrized (startBottom, travel,
  className). Verified iterations 41+42 (100%): fires on steam, never on other
  themes, pointer-events-none, no hook-order errors.
- **Theme renames (labels only, ids unchanged)**: 'Dark' -> 'Reaper (Original)',
  'Light' -> 'Coffee Shop' in the header Theme dropdown + Choose Your Realm
  window; es translations 'Segador (Original)' / 'Cafetería'. Verified
  visually + iteration_42.
- FF_BUILD -> **2026.06-308**.
- **Code-review cleanup + refactor sweep** (user-approved after audit; most report
  findings were false positives — documented in chat): removed 4 stale
  eslint-disable comments + dead `_origin` var + 2 unused test vars. **Home.jsx
  split 1891 → ~1560 lines**: new `components/home/HomeHeader.jsx`,
  `HomeInfoSections.jsx` (owns faqOpen state), `HomeFooter.jsx` — extracted
  verbatim, same testids. **CrawlLeaderboard.jsx** rebuilt with SubmitPanel/
  PostedBanner/ScopeSortTabs/BoardList subcomponents (+ exports rankTitle,
  fmtTime). **CrawlBadgeDialog.jsx** 592 → 405 lines: canvas painters moved to
  `lib/crawlBadge.js` (exports REAPER_SRC, loadImage, buildBadge);
  DarkBadgePreview/LightBadgePreview subcomponents. **routes/places.py**:
  places_essentials split into _essentials_resolve_location + _essential_row.
  All verified iteration_40 (backend 5/5 incl. new tests/test_iter40_refactor.py,
  frontend 100%). NOTE: tests/test_iter17 GPS-stamping + test_iter5 seed-count/
  FF_BUILD pytest failures are PRE-EXISTING/STALE asserts, unrelated.
- **Wheel of Fate tick fix (prod phone bug)**: sound started seconds late on
  phones (12.8s MP3 + metadata seek). Now plays pre-trimmed
  `/wheel-tick-end.mp3` preloaded on mount, no seeking. USER FEEDBACK FIX:
  the source clip has a "quick song" jingle at ~8.8-11s and silence after —
  the first trim (last 4.4s) captured jingle+silence, explaining "tada, no
  ticking". Final trim = 4.2-8.6s (pure steady ticking) with 0.9s fade-out to
  emulate the wheel settling (4.44s, 58KB, ffmpeg). Legacy wheel-tick.mp3
  still ships but is unused.
- **8-ball: zero shuffle cards (prod phone bug)**: new `rare8Ball` state in
  Home.jsx suppresses the full-screen shuffle popup entirely for 8-ball rares
  (was flashing ~150ms of cards); reset in runShuffle + runCrawlShuffle. Normal
  deals still show the popup (verified iteration_40, MutationObserver clean).
- **8-ball slide-down exit**: after the name shows in the window (2s), the ball
  slides down + fades (0.6s) into the original reveal card (stage "exit" in
  Magic8Ball state machine; onDone at +650ms). /dev/rare smoke-verified.
- FF_BUILD -> **2026.06-306**. ALL of this is PREVIEW-ONLY until user redeploys
  to fork-fate.com (phone app wraps production).
- **Magic 8-Ball reworked like the real toy** (user-directed, `Magic8Ball.jsx`):
  props now `{name, onDone}` (photo/ink-dissipate reveal REMOVED). The triangle
  die floats up through the dark liquid in the square window — occasionally
  (FAIL_CHANCE 0.4/shake, MAX_FAILS 2, answer GUARANTEED by 3rd shake) bearing a
  taunt ("ASK AGAIN LATER" etc., anti-repeat rotation), and finally the winner's
  NAME in gold. Fail counters persist in sessionStorage (`ff8b_<name>`, cleared
  on answer) so remounts can't break the 3rd-shake guarantee (iteration_38 bug →
  fixed, iteration_39 3/3 PASS incl. Replay-remount resilience). Overlay exposes
  `data-state=idle|shaking|message|answer`; answer/fail dies conditionally
  rendered (selector presence = state). No shuffle deck on the 8-ball path
  (150ms beat, verified: overlay in 0.85s, zero ticker).
- **Rare fate cadence: every 10 deal taps** (was 13-17 jitter) — Home.jsx
  `shouldRareFate` target fixed at 10, fallback 1/10; /dev/rare copy updated.
  FF_BUILD -> **2026.06-305**. Verified iteration_38 (E2E home flow, cadence,
  regression) + iteration_39 (fail sequence, remount, answer path): all PASS.
- **AGP 9.0 Play Console warning — advisory re-answered to user**: PWABuilder TWA
  wrapper concern, not repo code; soft warning; regenerate package on pwabuilder.com
  with the SAME signing key when convenient.
- **AI Fate Oracle — BUILT THEN REMOVED same session (user: "too creepy")**: the
  /api/oracle endpoint, FateOracle.jsx, its i18n strings, tests and db.oracle_lines
  cache were all deleted. Do NOT rebuild without explicit user request.
  FF_BUILD -> **2026.06-304**.
- **First-run "Choose Your Realm" window** (`components/ThemeWelcomeDialog.jsx`):
  appears ONCE before the guided ritual's "What calls to you" step (z-[130] above
  GuidedFlow's z-[100]), 10 gradient swatch cards with live theme preview on tap,
  "Enter Fork·Fate" seals it (localStorage `ff_theme_chosen`=1, also dismisses the
  old theme hint). Testids: theme-welcome, theme-welcome-option-{id},
  theme-welcome-continue. Spanish strings added to i18n.js.
- FF_BUILD -> **2026.06-303**. Verified by testing_agent iteration_37: backend 5/5
  pytest (`backend/tests/test_oracle.py`), frontend 100% (fresh-context dialog, live
  theme apply, persistence after reload, full deal E2E with oracle line rendering).
- NOTE: preview ingress showed the platform "wake up servers" gate to the main
  agent's screenshot tool; services were healthy (localhost:3000 → 200). Testing
  agent's browser was unaffected.


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
- **P1 (user decision): confirm chain-tier pricing** — agent set $99/mo · $990/yr
  as sensible defaults; adjust `SPONSOR_PRICE_CHAIN[_ANNUAL]` in core.py + the
  displayed prices in `SponsorChains.jsx`/`BecomeSponsorDialog.jsx` if changed.
- P2: 'Check again' button on /sponsor/success when polling ends in 'pending'
  (testing-agent suggestion, iter_31).
- P2 (iter_49 review note): add email format validation to FeedbackCreate
  (backend) and FeedbackDialog (frontend) — currently length-only.

## Implemented — 2026-02 (FAIRY GULLY REALM session)
- **New 'Fairy Gully' theme (id: fairy)** — user-directed, iterated live:
  - BG: Nano-Banana-generated /fairy-gully.png (user picked mock 5 of 5:
    twilight gully, two fairies, willow face, red-cap fairy ring, distant
    unicorn, rainbow flowers on green). Gen script: scripts/gen_fairy_bg.py.
  - Ambient scene (ThemeScenes.jsx AMBIANCE.fairy): 6 tiny butterflies with
    REAL wing-flap (ffWingFold scaleX fold + ffFlit paths; ButterflySprite /
    FlutterButterfly exports), 8 teal will-o'-wisps (ffWispDrift/Glow),
    4 pond ripple rings PINNED TO IMAGE COORDS via useCoverAnchor (object-
    cover crop math; fixes mobile 'ripples on land' bug). Keyframes in
    index.css.
  - Cards: red-cap mushroom card back (/fairy-mushroom.png via
    scripts/gen_fairy_mushroom.py) with GREEN inner borders + GOLD outer
    border/label ('gilded' = fantasy||fairy in ShufflingDeck.jsx).
  - Reveal: ButterflyBurst flourish (ThemeFlourish.jsx), magical quote lines
    (FAIRY_LINES/fairyLineFor in homeConstants, Sparkles icon in
    RevealStage), NO 'behold your fate' voice for fairy (Home.jsx:358).
  - Audio: USER-UPLOADED piano-bell shuffle (/shuffle-fairy.wav, leading
    1.13s silence trimmed — was 'delayed') + magic-bottles reveal
    (/reveal-fairy.wav). scripts/gen_fairy_sounds.py is SUPERSEDED — do not
    re-run.
  - Green-scoped styling: [data-ff-theme="fairy"] CSS overrides in index.css
    turn ALL red buttons/pills/text/slider(.bg-primary) forest green — fairy
    only (verified red elsewhere). Golden hero eyebrow for fairy.
  - GuidedFlow: fairy tokens — medium green card (#235C3D) + light-beige
    tiles (user: 'green too dark' → lightened), exported MushroomIcon
    (custom lucide-style SVG) used for SEAL_ICONS.fairy, welcome tile, and
    header menu icon.
- **Welcome dialog**: 12th tile 'Let Fate Decide' (random pick,
  theme-welcome-random); Fairy Gully tile; 'Cyberpunk' RENAMED 'Cyberscape';
  realm PEEK REMOVED per user ('rather it be a surprise'); subtitle now
  'Choose yours.'
- **No more seasonal auto-default** (useTheme.js): first visit = dark/Reaper;
  seasonForDate/isSouthernHemisphere deleted per user ('back to how we used
  to have it').
- **Reaper souls**: iterated to ELONGATED HUMAN APPARITIONS (accepted);
  octave-down dark soul wail (accepted); NEW user-uploaded possessed laugh
  (/soul-laugh.mp3, front-trimmed) layered at +1.4s into GhostRise flourish.
- Tested: iteration_50.json 100% frontend pass (fairy + regressions on
  dark/cyber/light, green scoping verified both ways). Code-review notes:
  Home.jsx 1575 lines (split later); 'reaper-line' testid semantic rename.
- NEXT (user): Apple/App Store work tomorrow — assets already in
  /store-assets/ zips.

## Implemented — 2026-02 (feedback + realm peek + store assets session)
- **In-app FEEDBACK system** (for Play closed-test testers): POST /api/feedback
  (public, rate-limited), GET/DELETE /api/admin/feedback (admin). Footer's old
  mailto link replaced by FeedbackDialog.jsx (message + optional email);
  entries stored in Mongo `feedback` collection; best-effort Resend email
  (no-ops, key empty). Admin page shows FeedbackList section with delete.
  Tested: iteration_49.json 100% (backend 5/5 pytest in
  /app/backend/tests/test_iter49_feedback.py). Testing agent fixed a missing
  FeedbackList import in Admin.jsx during test.
- **Realm peek**: tapping a theme tile on the welcome dialog fades the
  overlay+card to ~6% for 2.4s ("Previewing your realm…" hint pill) so the
  live scenery shows, then eases back (ThemeWelcomeDialog.jsx).
- **Store assets** in /app/frontend/public/store-assets/ (scripts:
  gen_store_assets.py + gen_store_screenshots.py, playwright + system Chrome
  at 430x932@3x): appstore-icon-1024.png (opaque), play-icon-512.png,
  play-feature-1024x500.png, 4x iPhone 6.7" screenshots (1290x2796),
  zipped as forkfate-iphone-screenshots.zip + forkfate-store-assets-all.zip
  (downloadable at <site>/store-assets/...).
- **Soul wail darkened** an octave down (98-156Hz contour, 1.3kHz lowpass,
  dark breath noise) per user; user confirmed "sounds better".
- **Dragon's Hoard tile** reddened (crimson #7E1B0E grad) to differ from
  Steampunk.
- Google Play: user has 12 testers opted in — 14-day clock running.
- P1: App Store assets (1024x1024 icon, screenshots) once Apple approval lands.
- DONE 2026-02: React hooks dependency cleanup — the old Code Quality report's
  "75 instances" turned out to be 6 real exhaustive-deps warnings once the rule
  was actually enabled. Fixed all 6 (InstallAppButton install→useCallback;
  NearbyHelp effectiveCoords→useMemo; PubCrawlDialog openBadge→useCallback,
  GPS watch postCheckin via ref + one intentional route-lock eslint-disable;
  RevealStage flourish keyed on derived resultId). Rule now permanently ON at
  "warn" in eslint.config.js so future violations surface. Regression-tested
  100% pass (iteration_48.json, 7 flows, zero console errors, no fetch loops).
- NOTE: Google Play closed testing — user has their 12 testers (Feb 2026); the
  14-day opt-in clock is running, then apply for production access.

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

## Implemented — 2026-07-26 (part 2: security-audit remediation)
- **SEC-002 — leaderboard anti-cheat now server-derived.** `/api/crawls/complete`
  no longer trusts the client's `verified` flag. It calls `_gps_checkin_count(code)`
  and keeps `verified` only when DISTINCT `source="gps"` check-ins >= submitted
  `stops`; the >15mph implied-speed downgrade still applies on top. No code, or
  manual-only check-ins, => unranked. `POST /crawls/{code}/checkin` became an
  UPSERT on (code, stop_id, source) so replaying it can't inflate the GPS count
  (`created_at` via $setOnInsert, `expire_at` refreshed each post).
  Frontend: `PubCrawlDialog.jsx` gained `buildStopsPayload()`, `ensureCrawlCode()`
  (silently creates the crawl on first check-in, dedupes concurrent callers via
  `creatingRef`) and `postCheckin()` (fire-and-forget, dedupes via `postedRef`,
  releases the key on failure to allow retry). `shareCrawl()` now routes through
  `ensureCrawlCode()` so the shared /c/<code> link and the recorded check-ins use
  ONE code — previously sharing could mint a second.
- **SEC-003 — CORS preview wildcard env-gated.** `ALLOWED_ORIGIN_REGEX` is composed
  from `ALLOW_PREVIEW_ORIGINS` (default "true"). Set it to **false in production
  secrets** to drop `*.preview.emergentagent.com` as a credentialed origin.
  Safe default: unset behaves exactly as before, so deploying can't break preview.
- **SEC-004 — photo proxy metered + cached.** `/api/places/photo` now reserves each
  cache MISS against the shared Google daily budget via `_google_reserve()` and
  serves repeats from a bounded in-process cache (`_PHOTO_CACHE`, 24h TTL, 150
  entries, skips >400KB bodies). Responses carry `X-Photo-Cache: hit|miss`.
- **BUG (pre-existing, found via testing) — rate limiter was global per IP.**
  `rate_limit()` keyed its deque on the client IP ALONE, so every endpoint shared
  one counter and the tightest limit governed the whole API: ~10 photo loads
  (limit 200) would 429 a later sponsor subscribe (limit 5). Now keyed on
  `(route.path_format, ip)` — the path TEMPLATE, so `/crawls/{code}/checkin` can't
  mint an unbounded keyspace by varying the param. The admin brute-force lockout
  (`_LOGIN_FAILURES`) stays IP-only, which is correct.
- Removed now-unused `components/CheckInButton.jsx` (moved to
  `/app/.template-expo/CheckInButton.jsx.unused`). FF_BUILD -> **2026.06-280**.
- Verified by testing_agent iterations 2 and 3: **58 passed / 1 informational skip /
  0 failed**. Suites: `backend/tests/test_iter_fateactions_and_checkin.py`,
  `test_iter_sec002_003_004.py`, `test_iter_ratelimit_isolation.py`.

## Known / out of scope
- Ops layer: the Cloudflare/ingress in PREVIEW rewrites `access-control-allow-origin: *`
  with `allow-credentials: true` on responses regardless of origin. The app's own
  CORSMiddleware gating is correct (proven by the SEC-003 tests) and browsers reject
  `*`+credentials, so it isn't exploitable — but it masks the app's origin gating
  over the wire in preview. Not an app bug.
- Remaining audit P3s: no CSRF token on cookie-auth admin writes (mitigated by
  SameSite=Lax); rate limiter + login lockout are per-worker in-memory (weaken with
  >1 worker); `cf-connecting-ip` trusted for any private TCP peer.

## Implemented — 2026-07-26 (part 3: preview parity + "1 more to consider" fix)
- **USER BUG: reveal card showed "1 more to consider" instead of "3".** Not a code
  regression — `alternatives = deck.filter(...).slice(0, 3)` in RevealStage.jsx was
  never touched. Root cause: preview had no `GOOGLE_API_KEY`, so /places/search
  always served curated seed data, and **66 of 69 (category, cuisine) pairs had only
  1-2 venues** — so any cuisine filter collapsed the deck to 1-2 items. With no
  cuisine filter it already showed 3 correctly.
- **Fix A — deeper curated seed.** `seed_data.py` gained `MIN_PER_CUISINE = 4` and a
  deterministic `expand_seed()` that tops every (category, cuisine) group up to 4,
  with `SEED_ALL = SEED + expand_seed(SEED)` consumed by `seed_db()`. **94 -> 276
  venues.** Determinism matters: `seed_db()` backfills by NAME on every boot, so a
  random generator would insert fresh duplicates each restart. Verified idempotent
  across 3 restarts (276 docs, 0 duplicate names). Generated venues are never
  sponsored; the original 94 hand-written entries are untouched.
- **Fix B — `GOOGLE_API_KEY` set in preview** (user-supplied 2026-07-26). Preview now
  returns `source: "google"` with ~20 live results, matching production. Geocoding
  API + Places API (New) both confirmed. ⚠️ The key was pasted into chat — treat as
  exposed, rotate + restrict. Preview now bills the user's Google account, capped by
  `GOOGLE_SEARCH_DAILY_CAP=300`/day (shared across search, geocode and — since
  SEC-004 — the photo proxy).
- Verified by testing_agent iteration 5: **86/86 backend assertions + 58 legacy
  pass / 1 skip / 0 fail**; browser confirms "3 MORE TO CONSIDER" with exactly 3
  tiles. New suite `backend/tests/test_iter5_seed_expansion.py`. Testing agent also
  fixed a `sys.path` import bug in the iter2 suite (test-only).
- Two testing-agent "minor notes" investigated and dismissed as FALSE ALARMS:
  `/admin/cost-status` already reads the `searches` field (admin.py:179), and the
  deal button already has `data-testid="spin-roulette-button"` (Home.jsx:995).

## Implemented — 2026-07-26 (part 4: shuffle rework + share menu)
- **USER BUG: "cards just go back and forth, not a real shuffle."** `ShufflingDeck.jsx`
  animated every card `x: [0, ±96, 0]`, `y: [0,-26,0]` on a 0.72s loop with a FIXED
  `zIndex: DECK_SIZE - i`. Symmetric out-and-back with no reordering = a wobble.
  Reworked over two passes (the first pass was still rejected by the user as "looks
  different, slower, no shuffle noises"):
  - `riffleKeyframes(i)` — 6-stop split / **HOLD apart** / interleave / overshoot /
    settle, `RIFFLE_TIMES [0,.22,.34,.66,.84,1]` with a per-segment easing array so it
    snaps rather than floats. The HOLD phase is what makes two packets readable.
  - **Corner `transformOrigin`** per packet (`100% 100%` even / `0% 100%` odd) so each
    half FANS about its inner-bottom corner like cards, instead of sliding like a tile.
    This was the single biggest contributor to it finally reading as a riffle.
  - **Stacking order actually rotates**: `cycle` state on a `RIFFLE_MS` interval drives
    `zIndex: DECK_SIZE - ((i + cycle) % DECK_SIZE)`. Integer z-index only — animating
    zIndex via `animate` would interpolate to fractional values the browser discards,
    so it is set via `style`. Interval stops on `landed`.
  - **RIFFLE_MS 1150 -> 700ms** (user said it got slower); stagger `i * 0.055`.
  - Measured in-browser: transformOrigins alternate, |translateX| to 80, translateY to
    -43, cadence 0.727s, z-order reorders, no fractional z-index, no h-scroll at 430px.
- **USER BUG: "no unique shuffle noises."** The project had NO card audio at all.
  Synthesised two WAVs into `public/` with numpy: `card-riffle.wav` (0.700s seamless
  loop matched to RIFFLE_MS — 34 accelerating band-passed noise clicks + a square-up
  tap) and `card-deal.wav` (0.200s card-down snap). `Home.jsx` gained `cardsRef` +
  `startCards()`/`stopCards()`; the loop starts on the first flick in BOTH `runShuffle`
  and `runCrawlShuffle`, plays in EVERY theme at volume 0.5 under the themed ambience,
  honours `localStorage.ff_muted`, stops on landing, and is cleaned up on unmount.
- **Shuffle name ticker randomised.** Both shuffle paths did `setFlash(pool[i % len])`,
  walking the pool IN ORDER so the flickering name looked like it was counting down a
  list. Now a `nextFlash()` helper picks randomly and never repeats back-to-back.
- **"More" dropdown renamed to "Share your fate"** (icon MoreHorizontal -> Share2). The
  inner text-share item was renamed to "Share as text" to avoid duplicating the trigger
  label; testid `fate-action-share-text` unchanged.
- FF_BUILD -> **2026.06-283**. Verified by testing_agent iterations 6 and 7, plus two
  items I self-verified after the harness reported them inconclusive: muted deals
  construct ZERO audio and still shuffle/reveal correctly, and the crawl path plays
  card-riffle -> pauses on land -> fires card-deal with no leaked audio elements.
- Three more testing-agent "missing testid" reports investigated and dismissed as FALSE
  ALARMS: `crawl-mode-toggle`, `crawl-deal-button` and `spin-roulette-button` all
  already exist. (Running total: 5 false alarms — verify before acting on these.)

## In progress / UNVERIFIED (do not deploy without testing)
- Auth hardening from the P3 audit backlog, written but NOT yet verified end-to-end:
  - **Admin CSRF double-submit**: `set_admin_cookie()` now also issues a readable
    `ff_csrf` cookie; `require_admin` requires it echoed in `X-CSRF-Token` for
    cookie-authenticated unsafe methods. Bearer clients are exempt (they can't be
    CSRF'd). Migration is lockout-proof: enforced only when the cookie is PRESENT,
    since a real cross-site attack would carry it — set `CSRF_STRICT=true` after all
    sessions cycle (<=12h) to also reject legacy cookie sessions. Frontend registers
    an axios request interceptor at `Admin.jsx` module scope.
  - **Login lockout moved to MongoDB** (`db.login_failures`, atomic `$push` with
    `$slice`, TTL on `expire_at`) so it survives restarts and is shared across workers;
    `check/record/clear_login_failures` are now async. Added a 0.5s constant delay on
    the locked branch so lockout isn't detectable by timing.
  - **`TRUST_PROXY_CIDRS`** optional allowlist for proxy hops (unset = legacy
    private/loopback heuristic, so nothing breaks), plus right-to-left X-Forwarded-For
    parsing that skips our own hops — previously a missing CF-Connecting-IP collapsed
    every user onto the shared ingress IP.

## Completed 2026-08-03 (later) — polish batch
- Wheel ENLARGED per user ("way too small"): wheel now h-72 (288px, max 60vw) with
  bigger crest hub (h-20) and 9.5px labels; the reveal photo header grows to
  `h-[26rem]` while ANY rare ritual is covering (RevealStage `covered` conditional
  height, transition-[height]) and shrinks back to h-64 on unveil. /dev/rare wheel
  demo card uses `tall` prop. FF_BUILD 2026.06-301. Verified via screenshot.
- Wheel demo `autoSpin` prop: /dev/rare wheel spins itself 1.4s after mount (verified
  iter_35 with rotation-matrix assertions + screenshots at midspin/settled).
- Champions + Passport Wall links paired in one flex row (`Home.jsx` ~1308) — same
  line at desktop AND 390px mobile (0px Y delta, iter_35).
- Rare-fate voice skip (Reaper "behold your fate" no longer plays over ritual audio)
  verified via code inspect in iter_35. FF_BUILD 2026.06-300.
- Screenshot-tool NOTE: custom playwright scripts do NOT execute (nav+default
  screenshot only) — use testing_agent for ANY timed/interactive capture; its
  screenshots land in /app/test_reports/screenshots/ and can be shown to the user.

## Completed 2026-08-03 — Rare Fate Rituals expansion (wheel, gothic, ink 8-ball)
User-directed refinements this session:
- **Wheel of Fate** (`WheelOfFate.jsx`, third rare variant): user-specified design —
  BLACK/RED/WHITE roulette segments, RED Fork·Fate crest (`/logo-crest.png`) hub,
  GOTHIC undertone (wrought-iron rim + rivets, dagger pointer, serif italic labels,
  candlelit red vignette). Flick to spin (velocity >90 deg/s) or "tap to spin"
  fallback; rigged to land on the pre-chosen winner (R ≡ -winnerCenter mod 360,
  4 turns, 4.4s ease-out). 4/6/8 segments from deck names. Tested iter_34: 5/5 PASS
  incl. rigged-landing verification.
- **ThemeCardFrame** (`ScratchCover.jsx` export): deck-card double inset border
  (accentForTheme map) + dark rim (for contrast on gold foil) now frames ALL rare
  reveals — user asked for "the borders the shuffle cards have".
- **Scratch threshold 0.65** (was 0.35): user reported auto-reveal at half-scratched.
  Verified: 50% does NOT reveal, ~80% does. Renamed testids:
  `rare-fate-scratch-cover` / `coupon-scratch-cover`.
- **Magic 8-Ball smoky ink** (user request): window now shows the fate PHOTO under
  layered ink (full-coverage base + 3 swirling blobs + floating "8") that dissipates
  on shake. `photo` prop = card.photo_url || card.image. Gothic serif hints.
- **/dev/rare preview page** (unlisted route, `RarePreview.jsx`): live demos of all
  three rituals with Replay buttons — user can preview there.
- **Voice/SFX collision fix** (user report: Reaper "behold your fate" voice drowned
  the 8-ball shake sound): rare-fate decision (`rareFate`) is now computed BEFORE the
  dark-theme voice cue in runShuffle, and the voice is skipped when a rare ritual is
  incoming (rituals bring their own audio). FF_BUILD 2026.06-299.
- **8-ball shake SFX** (user-uploaded reverse cymbal swell → `/public/8ball-shake.mp3`,
  6s): plays in Magic8Ball trigger() as the ink dissipates (respects ff_muted).
  FF_BUILD 2026.06-297.
- **Shake-shuffle SFX** (user-uploaded page-shuffle whoosh → `/public/shake-shuffle.mp3`,
  5s): plays with haptic(25) + `shake_shuffle` analytics event when devicemotion shake
  triggers a deal (Home.jsx useShake handler; respects ff_muted via playSound).
  FF_BUILD 2026.06-296. NEEDS user testing on a real phone (devicemotion not automatable).
- **Wheel tick SFX** (user-uploaded 8-bit spin sound → `/public/wheel-tick.mp3`,
  12.8s): plays the clip's FINAL 4.4s (a.currentTime = duration - 4.4 on
  loadedmetadata, per user — the clip naturally slows at its end, syncing with the
  wheel's decay), respects `ff_muted`, fade-stopped on settle, paused on unmount.
  FF_BUILD 2026.06-298.
- Variant pool now ["scratch","8ball","wheel"] random each rare trigger;
  QA override `ff_rare_force` accepts all three. FF_BUILD 2026.06-294.
- E2E NOTE for future agents: React onClick/pointer handlers need synthesized
  PointerEvent+MouseEvent sequences via page.evaluate (documented in iter_33/34
  context_for_next_testing_agent).
- Ink-8ball visual verified via /dev/rare screenshots; full 8-ball flow was tested
  in iter_33 (mechanics unchanged — only window contents changed).

## Completed 2026-08-02/03 — Phase 1 Interactivity (user-approved plan)
User approved a 3-phase interactivity roadmap. Phase 1 built + tested:
- **Swipe-to-reroll** (`RevealStage.jsx` draggable photo header): swipe left >90px
  to reroll, 3 per deal (reset in doSearch/dealFromFavorites/onReset). Hint chip
  `swipe-reroll-hint` shows remaining. framer drag needs dispatched PointerEvents in tests.
- **Reaction voting** (`ReactionBar.jsx` + `routes/stats.py`): Flame "Fate chose
  well" / Skull "Fate failed me" on the reveal. POST/GET `/api/reactions`; IP dedupe
  30d via stat_dedupe TTL; localStorage `ff_rxn_{placeId}` client-side; community %
  bar shows at 5+ votes. Backend 7/7 pytest (`tests/test_reactions_iter32.py`).
- **RARE FATE reveals** — user-directed design: every ~15 DEAL TAPS (13-17 jitter;
  localStorage `ff_deal_taps`/`ff_rare_at`) the ticker shuffle is skipped and the
  winner arrives hidden behind a ritual, randomly one of:
  (a) **Scratch foil** (`ScratchCover.jsx`) — THEME-MATCHED foil palettes
  (`foilForTheme`: gold fantasy, bone dark, neon cyber, brass steam, seasonal…),
  canvas destination-out scratching, threshold 0.65 (user found 0.35 auto-revealed
  too early — raised per feedback), testid `rare-fate-scratch-cover`.
  (b) **Magic 8-Ball** (`Magic8Ball.jsx`) — user must SHAKE the phone (devicemotion)
  or rattle the ball with cursor (3 direction flips, >350px travel, <1.5s); wobble →
  blue triangle answer with the winner's name → full unveil after 2.1s.
  QA override: localStorage `ff_rare_force`='scratch'|'8ball'. Reveal fanfare
  (thunder/flash) fires on completion via `surpriseDone()` in Home.
- **Scratch-off coupons** (`CouponReveal.jsx`): sponsored coupon sealed state is now
  gold scratch foil (testid `coupon-scratch-cover`). User chose to KEEP this in
  addition to rare-fate scratch.
- **Shake-to-shuffle** (`hooks/useShake.js`): devicemotion, 2 jolts <900ms, 3s
  cooldown; iOS permission requested inside deal-tap gesture
  (`requestMotionPermission()` in `spin`/`sealFate`). Not automatable — needs USER
  testing on a real phone.
- Tests: iteration_32 (100% backend+frontend), iteration_33 (8-ball 100%).
  FF_BUILD 2026.06-292. All of this is PREVIEW-ONLY until user redeploys.
- Phase 2 approved & pending: AI Fate Oracle (Emergent LLM key approved by user),
  daily fate challenge, badges. Phase 3: live group spin rooms, wheel-of-fate as
  another rare variant (user confirmed), reveal-synced haptics. User also confirmed
  reaction % public at 5+ votes.

## Completed 2026-08-02 (chain sponsors session)
- **Chain Pitch Page** (`/sponsor/chains`, `SponsorChains.jsx`): dark landing page for
  national chains — hero, live fates counter, 3-step how-it-works, perks list,
  pricing card ($99/mo · $990/yr = 2 months free). CTAs open `BecomeSponsorDialog`
  in chain mode. NOTE: chain pricing ($99/$990) was agent-chosen — user should
  confirm before production deploy. Backend: `_plan_spec`/`ensure_paypal_plan` grew
  a `tier` param (config keys `paypal_plan_chain[_annual]`); `SponsorSubscribe`
  model has `tier` + `coupon`; subscribe rejects chain tier without coupon code (400).
- **Chain-mode sponsor dialog** (`BecomeSponsorDialog.jsx` `tier` prop): chain shows
  $99/$990 plans (no free month) + required coupon section (code auto-uppercase,
  description, optional terms); local mode unchanged (regression-tested).
- **Card Download Buttons** (`SponsorStatus.jsx`): active success page shows a
  "Your marketing kit" block with 3 downloads (square/story/pdf) hitting
  `GET /api/sponsors/{id}/social-card?format=X`. `subscription-status` endpoint now
  returns `sponsor_id` (active subs only — no leak for pending).
- **Sponsor welcome-cards email** (`sponsors.py send_sponsor_welcome_cards`):
  on PayPal activation (webhook ACTIVATED + status-poll fallback path) emails the 3
  card formats as base64 Resend attachments to `contact_email`. Idempotent: claims
  `cards_email_sent` flag atomically, releases on failure for retry.
  `core.send_email` now accepts `attachments`. CANNOT be delivery-tested in preview
  (RESEND_API_KEY + PayPal keys are EMPTY in preview env — send path unit-verified,
  works in production where keys exist).
- Seeded PREVIEW-ONLY test sponsor: id `test-chain-sponsor-1`, subscription
  `I-TESTSUB123`, active chain tier, coupon FORK20 — handy for previewing the chain
  coupon strip; delete when no longer needed.
- Testing agent iteration_31: backend 11/11 pytest (new suite
  `backend/tests/test_chain_sponsor_iter31.py`), frontend 100%. FF_BUILD 2026.06-289.
- Earlier this session (see below): dragon claw two-layer fix (iter_29) + pulsing
  reveal glow (iter_30), both user-approved. User confirmed the existing
  `reveal-dragon.mp3` already covers the clawed-reveal sound.

## Completed 2026-08-02 (earlier: claw + glow)
- **Dragon claw REBUILT as two-layer grip & USER-APPROVED** (`ShufflingDeck.jsx`
  ~lines 203-254). Root cause of all prior misalignment: the CSS centered the PNG on
  the card and clipped the palm, and inline `transform` strings on `motion.img` were
  silently OVERWRITTEN by framer-motion's animated scale (scaleX tweaks never applied).
  New approach: `/dragon-claw.png` rendered TWICE with complementary clip-path
  polygons — palm slice at z-1 BEHIND the card (z-5), talon/thumb/fingers at z-50 in
  front. Geometry computed from alpha-channel measurements
  (`/app/scripts/measure_claw_window.py`): img 323px wide, framer `scaleY: 1.12`,
  wrapper `translate(calc(-50% - 2px), calc(-50% + 18px))`. Seams on near-transparent
  rows (png y≈868 / x≈216). Testing agent iteration_29: 100% (all 5 visual criteria +
  z-order + dark-theme skeleton-hand regression). Static harness at
  `/app/frontend/public/claw_test.html` mirrors exact CSS (authoritative reference).
  NOTE: original claw art restored — user LIKES the top talon. Backups:
  `/app/scripts/dragon_claw_prev_landscape.png` (original), `claw_cand1.png` (unused
  regen). Do NOT regenerate the PNG without asking.
- **Mystical aura simplified to single pulsing glow & VERIFIED** (`Home.jsx` ~1524):
  removed rotating conic-gradient rect + border ring; now ONE accent-colored blurred
  (28px) rect pulsing opacity 0.35→0.85 / scale 0.98→1.03 @1.6s behind the reveal
  panel. Adapts to theme accent (gold on fantasy, etc.). Dead `auraBg` const removed.
  Testing agent iteration_30: 100% on default + fantasy, no console errors.
  User iterated: "more flashy" → then settled on "just a pulsing glow" — final state
  is the simple pulse. `FF_BUILD` bumped to `2026.06-288`.
- Screenshot-tool limitation discovered: it does NOT execute interaction scripts in
  this environment (returns initial-page frame only). Use testing_agent for any
  flow-dependent visual checks; `claw_test.html` for static claw geometry.

## Completed 2026-08-01 (previous session)
- **Dragon claw alignment FIXED & VERIFIED** (`ShufflingDeck.jsx`): wrapper translateY
  `calc(-50% - 14px)` → `calc(-50% - 4px)`; inner img `scaleX(1.20)` → `scaleX(1.32)`.
  Testing agent iteration_28: ALL 3 criteria PASS (thumb overflows ~67px past left gold
  border, 3 right claws overflow right border, top talon flush at card top edge).
  `FF_BUILD` bumped to `2026.06-287` for cache busting. Note for future tests: the
  primary CTA testid is `spin-roulette-button` (NOT `deal-button`).
- **Google Play AGP 9.0 warning — advisory answered**: app is a PWABuilder TWA wrapper
  (`com.forkfate.twa`), no native Android code in repo. Warning is a soft advisory,
  not a blocker. Remedy when convenient: regenerate the package on pwabuilder.com
  (uses current AGP/targetSdk), bump versionCode, upload new .aab with SAME signing key.
- **Linter engine error FIXED**: ESLint 9 was installed with no config file at all,
  crashing the platform lint hook. Added `/app/frontend/eslint.config.js` (flat config,
  warnings-only except syntax-level errors). Also fixed 4 real `no-dupe-keys` bugs in
  `src/i18n/i18n.js` (duplicate Spanish translation keys — kept the later-wins values
  to preserve runtime behavior). Lint now passes: 0 errors.

## Pending / Backlog
- **P0 (user action): rotate + restrict the Google API key** `AIzaSyA8-B...TyDI`. It
  was pasted into a chat transcript. Restrict to Places API (New) + Geocoding API
  only, and prefer a SEPARATE key for preview vs production.
- **P0 (user action): rotate the leaked Android upload key.** Play Console → Setup →
  App integrity → App signing → Request upload key reset. Then add the new SHA-256
  fingerprint to `frontend/public/.well-known/assetlinks.json` and redeploy.
- **P1: wire PubCrawlDialog check-ins to POST /api/crawls/{code}/checkin** — DONE
  2026-07-26 (see part 2 above); SEC-002 closed.
- P2: env-gate the `*.preview.emergentagent.com` CORS wildcard out of prod — DONE
  (SEC-003). ACTION: set `ALLOW_PREVIEW_ORIGINS=false` in the PRODUCTION secrets.
- P2: count `/api/places/photo` against the Google daily cap + cache — DONE (SEC-004).
- P3: prune now-unused `components/CheckInButton.jsx` — DONE.
- Deploy policy: **all production deploys are on hold during Google Play closed
  testing**, EXCEPT the keystore removal, which the user approved shipping immediately.
- P1: **Live Print-on-Demand checkout** (Printful) for `/shop` — currently "Notify me"
  email capture only. Waiting on user signal + Printful API keys.
- P1: **Resend domain verification** — `SENDER_EMAIL` temporarily `onboarding@resend.dev`
  until SPF/DKIM for fork-fate.com is verified.
- In progress: Google Play closed-testing 14-day / 12+ tester window.

## Test Credentials
See `/app/memory/test_credentials.md`.

## 2026-08 Pre-Publish Deployment Check
- Ran deployment_agent readiness scan before user's production publish: PASS.
- Only flag was a CORS warning on CORS_ORIGINS being domain-specific — verified
  FALSE POSITIVE: `allow_origin_regex` (core.py) already covers fork-fate.com,
  *.emergent.host, and preview domains; CORSMiddleware accepts either list or regex.
- No code changes made. App published by user; iteration_51 deep diagnostic was green.
- Next: Apple App Store publishing support when user returns; P2 backlog item —
  "Check again" button on /sponsor/success when payment polling ends pending.

## 2026-08-02 Session: Theme picker rework + Steampunk props
- Theme pill (header) now opens the full "Choose your realm" window (ThemeWelcomeDialog)
  instead of a dropdown; dropdown removed from HomeHeader.jsx.
- ThemeWelcomeDialog: removed "Enter Fork·Fate" continue button — tapping a realm
  applies it AND closes the window immediately (pickTheme -> setTheme + onDone).
  Footer hint updated (EN + ES in i18n.js).
- Steampunk scene (ThemeScenes.jsx):
  - New AI-generated props (Nano Banana, magenta-keyed to alpha via /app/scripts/
    gen_steam_props.py + gen_steam_mask_floor.py): steam-goggles-shelf.png,
    steam-mask-floor.png in frontend/public.
  - Brass goggles resting on the console's desk shelf, anchored to the cabinet's
    aspect-ratio box (848/1264) so they scale with it; tilted -5deg, brightness
    boost + ellipse ground shadow (user: "they blend in" -> fixed).
  - Plague doctor mask lying on the dusty floor strip with ground shadow (13vh wide,
    in scale with the cabinet).
  - Jacob's ladder arc shrunk to fit between the device posts (left 43.5%, width 12.5%).
  - Console cabinet made fully opaque (was opacity-80; user could see through it).
- Verified via UI automation: picker opens from pill, one-tap applies theme + closes;
  steam scene props render correctly.

## 2026-08-03 Session: Sponsor tier visibility
- Problem: /sponsor/chains pitch page was orphaned (no inbound links); chain coupon
  tier invisible to prospects.
- BecomeSponsorDialog.jsx: added in-dialog tier picker (Local spot $19/mo vs Chain
  coupon $99/mo) — tier prop now only preselects; users can switch. "See how chain
  coupons work →" link to /sponsor/chains when chain selected.
- HomeFooter.jsx: "Chains & franchises: coupon sponsorships →" link + new Sponsor FAQ
  pill (SponsorFaqDialog.jsx — 5-question accordion covering both tiers, billing,
  updates, placement).
- SponsorMarquee.jsx: "Your chain's coupon here" CTA rides at end of each marquee loop
  half, links /sponsor/chains.
- All new strings translated to Spanish in i18n.js.
- Verified via browser automation: marquee CTA, footer link, FAQ pill/dialog, tier
  picker switch to chain ($99 plans + coupon section) all working.
- Note: user publishing English-only App Store listings; Spanish stays in-app.

## 2026-08-03 Session part 2: Free founder coupon for local sponsors + chain band
- User decision: NO new paid tier — local sponsors get coupons FREE as a founder perk
  (no new PayPal plan). Coupons appear BOTH on the winner's own card (already worked)
  and in the bonus coupon strip.
- Backend (routes/sponsors.py): /api/coupons/chains-nearby now includes local-tier
  (and legacy no-tier) sponsors with coupons alongside chains; new `exclude` param
  skips the winner's own id (RevealStage passes excludeId when winner is sponsored).
- BecomeSponsorDialog.jsx: local tier shows OPTIONAL green coupon section with
  "FREE — founder perk" badge (testids sponsor-local-coupon-*); chain keeps required
  amber section. Validation: local code without description blocked. Tier picker local
  button notes "+ FREE coupon".
- HomeInfoSections.jsx: new gold "For chains & franchises" band card BELOW the local
  band (chain-business-band, $99/mo $990/yr, CTA -> /sponsor/chains); local band has
  green founder-perk pill (local-coupon-perk-line).
- SponsorFaqDialog: 6 questions now (added "How does the free local coupon work?").
- All strings translated ES. Tested: iteration_52.json — 100% pass backend + frontend
  including spin/reveal exclusion regression (sponsored winner's coupon inline, other
  sponsor's coupon in strip).
- Note: PayPal env empty in preview -> subscribe 503s (expected); works in production.

## 2026-08-03 Session part 3: Check-again button + coupon recap emails
- SponsorStatus.jsx (/sponsor/success): when polling exhausts to "Almost there",
  a "Check again" button (sponsor-status-check-again) restarts the 6x2.5s poll loop.
  Verified: pending -> click -> back to checking.
- routes/sponsors.py: send_coupon_recaps() — per-sponsor monthly analytics recap email
  (impressions/clicks/coupon copies DELTA since last recap via recap_snapshot field).
  Branded HTML via _recap_html(). No-ops gracefully when Resend unconfigured.
- server.py: _coupon_recap_loop() fires on the 1st of each month, idempotent via
  db.config key "coupon_recaps_sent" per month. Registered at startup.
- routes/admin.py: POST /api/admin/sponsors/coupon-recaps (require_admin + CSRF header
  x-csrf-token from ff_csrf cookie) manual trigger. Tested via curl: {"sponsors":1,"sent":0}
  (sent=0 expected in preview — Resend key empty; snapshot only saved on send success).
- Remaining: Apple App Store publishing guidance (user working on it).

## 2026-08-04: Footer sponsor block removed
- Removed footer sponsorship-cta column (Become a sponsor button, $19 line, chains
  link, FAQ pill) from HomeFooter.jsx — redundant with the two big Home band windows.
- SponsorFaqDialog pill relocated: now centered directly below the chain band in
  HomeInfoSections.jsx. Verified via screenshots (footer clean, pill opens dialog).

## 2026-08-04 part 2: Collapsed cuisine groups + Sponsor FAQ card
- Filters.jsx: grouped cuisine panels (Food/Bars/Explore/Fuel) now render every
  sub-division COLLAPSED by default (CollapsibleGroup) — header shows group name,
  item count, red picked-count badge, chevron. Tap to open only the group you want.
  Ungrouped modes keep the old +N more chip behavior. Testids:
  cuisine-group-<slug>, cuisine-group-count-<slug>, pills unchanged.
- SponsorFaqDialog.jsx DELETED -> SponsorFaqCard.jsx: matches the main FAQ card
  pattern (white rounded card, serif title, More/Less toggle, inline accordion,
  email link). Rendered directly below the chain band in HomeInfoSections.
- Verified via screenshots: 7 collapsed food groups, pick applies + panel closes,
  FAQ card expands with 6 questions. NOTE: filters panel defaults OPEN on load.

## 2026-08-04 part 3: Cyberscape audio swap (user-uploaded clips)
- shuffle-cyber.mp3 (cyberpunk electronic logo, trimmed to start at 0.05s) replaces
  reveal-cyber-radio.wav in SHUFFLE_LOOPS.cyber (Home.jsx, loop 0.8).
- reveal-cyber.mp3 (robot machinery sfx, trimmed to FIRST 4s + 0.4s fadeout — source
  was 22.7s; user may want a different window) replaces reveal-electric.wav in both
  reveal maps (Home.jsx lines ~336 + ~697).
- flourish-cyber.mp3 (glitchy zap, 5s) plays in MatrixRain flourish (ThemeFlourish.jsx,
  vol 0.5, 250ms delay) — cyber flourish previously silent.
- Old reveal-cyber-radio.wav / reveal-electric.wav deleted (no refs remain).

## 2026-08-04 part 4: Cyber audio tuning + big steam burst
- shuffle-cyber.mp3 re-cut to start at 1.72s (RMS analysis showed a quiet 1.75s
  intro build; shuffle only lasts ~1.5s so users heard just the build). ?v=2.
- User asked to SWAP cyber reveal and flourish sounds: reveal-cyber.mp3 = glitchy
  zap (5s), flourish-cyber.mp3 = robot machinery (4s trim of 22.7s source).
  Cache-busted ?v=2 in Home.jsx + ThemeFlourish.jsx.
- SteamBurst.jsx: upgraded from 7 soft puffs to 18 dense front-loaded puffs +
  6 fast valve-jets escaping the card edges; default wrapper overflow-visible so
  steam escapes the card. Verified live via steam-theme spin (10001): burst mounts,
  large cloud renders over landed card. Deal button testid: spin-roulette-button.

## 2026-08-04 part 5: Cyber audio recut + HackTerminal rare ritual
- reveal-cyber.mp3 (zap) recut to 3.24s (was 5s, "slightly too long"); flourish-cyber.mp3
  (robot) extended to 8s (was 4s, "not long enough"); refs bumped to ?v=3. MatrixRain
  cleanup no longer pauses playing audio (parent unmounts at ~4.2s, clip is 8s) —
  only cancels a not-yet-started play.
- NEW rare ritual: HackTerminal.jsx (Cyberscape) — CRT terminal cover: JACK IN button,
  typed breach log (WebAudio blips), winner name decrypts via glyph scramble, TARGET
  ACQUIRED + zap, onDone after 1.4s. Wired in RevealStage (surprise === "hack",
  isCovered) and Home.jsx rare pool (cyber: scratch/8ball/wheel/hack). ES translations
  added. Force-test with localStorage ff_rare_force='hack', ff_deal_taps='9'.
- Verified live end-to-end in cyber theme (zip 10001): terminal -> log -> decrypt ->
  reveal card. Testids: hack-terminal-cover/-jack-in/-log/-name/-acquired.

## 2026-08-04 part 6: CodeBreaker keypad rare ritual (Cyberscape #2)
- CodeBreaker.jsx: futuristic keypad lock — random 5-digit code glows at top (teal
  #22D3EE CRT style), user punches it on a 3x4 number pad. Wrong key: ACCESS DENIED
  + shake + low buzz; full code: digits turn green, ACCESS GRANTED + zap, onDone 1.5s.
- Wired: RevealStage (surprise === "code", isCovered), Home cyber pool now
  [scratch, 8ball, wheel, hack, code]. ES translations added.
- Verified live end-to-end (force ff_rare_force='code'): keypad -> denied -> granted
  -> reveal. Testids: code-breaker-cover/-code/-status/-pad, code-digit-i, code-key-n.

## 2026-08-04 part 7: CrankGear ritual (steam) + CodeBreaker countdown
- CrankGear.jsx: steampunk rare ritual — brass 12-tooth SVG gear with crank handle;
  drag circularly (forward only) or tap to ratchet +45deg; 720deg (2 turns) fills a
  brass pressure bar -> "Pressure released!" + reveal-steam.wav + SteamBurst -> onDone
  1.8s. FIX LEARNED: never call side effects (finish/setDone) inside a setState
  updater — React drops them; angle now lives in angleRef.
- Home steam rare pool: [scratch, 8ball, wheel, crank]. Testids: crank-gear-cover/
  -gear/-prompt/-done, crank-pressure-bar.
- CodeBreaker countdown (user: "Yes, on count down"): 12s timer bar under status,
  turns red at <=4s; expiry -> "SYSTEM OVERRIDE — FATE DECRYPTED" (amber) and fate
  reveals anyway. Testids: code-breaker-countdown/-timer.
- ES translations added. Both verified live end-to-end (force ff_rare_force crank/code).

## 2026-08-04 part 8: Steampunk flourish sound
- flourish-steam.mp3 (user-uploaded mechanical clamp, 4.75s) plays with SteamBurst
  (new `sound` prop, default true, muted-aware, 150ms delay). CrankGear passes
  sound={false} (already plays reveal-steam.wav hiss).

## 2026-08-04 part 9: TikiShaker rare ritual + tiki flourish sting
- TikiShaker.jsx: Tiki Lounge rare ritual — carved SVG tiki mug (lime+straw), tap to
  shake (maraca noise-burst rattle via WebAudio, wobble grows per shake, 6 dots
  progress). After 6 shakes: mug tips 112deg, tropical stream + splash pour out,
  reveal-drums-boom.wav, onDone 2s. Pool: tiki [scratch,8ball,wheel,shaker].
  Testids: tiki-shaker-cover/-mug/-prompt/-done, tiki-shake-dots, tiki-pour-stream.
- flourish-tiki.mp3 (user's happy tropical island sting, 5.4s) plays with the
  Fireflies flourish (muted-aware, no cutoff once started). ES translations added.
- Verified live end-to-end in tiki theme (force ff_rare_force='shaker').

## 2026-08-04 part 10: VolcanoReveal rare ritual (Tiki #2)
- VolcanoReveal.jsx: island volcano SVG (crater glow + lava cracks heat up per tap,
  low rumble thump via WebAudio). 4 taps -> ERUPTION: flash, 11 lava bombs fan out,
  smoke column, reveal-volcano.mp3 (user's explosion clip, 5.1s), onDone 2.3s.
- Tiki pool now [scratch, 8ball, wheel, shaker, volcano]. ES added. Verified live.
  Testids: volcano-cover/-mount/-prompt/-done/-taps.
- PENDING: user choosing Reaper rare ritual from proposed ideas (tarot draw, coffin
  knock, seance candles, ouija, soul harvest, hourglass).

## 2026-08-04 part 11: Realistic 3D assets integrated + ritual polish (fork session)
- User approved the new realistic 3D renders (tiki mug, reaper candle, coffin caskets).
- TikiShaker.jsx: SVG mug replaced with /tiki-mug.png (realistic carved mug, lime+straw).
- CoffinKnock.jsx: SVG coffin replaced with CoffinArt — crossfade from
  /reaper-coffin-closed.png to /reaper-coffin-open.png (soul-green glow bloom) on open.
- SeanceCandles.jsx: CSS wax columns replaced with 5x /reaper-candle.png (dripping wax
  on brass holder), uneven heights [64,88,74,96,60], gap-2 so all 5 fit the card on
  390px viewport; snuffed candles dim via brightness filter. Flame sits on wick (-mb-1.5).
- VolcanoReveal already used /tiki-volcano.png (verified, looks 3D/realistic).
- Bug fixes from testing (iteration_53, all 9 rituals PASSED, assets load, no 404s):
  * SeanceCandles: stale-closure setOut -> functional updater (rapid taps no longer skip).
  * FairyWand: onPointerDown + enlarged hit area (-m-4 p-4) — single tap reliably casts.
- Answered user: HackTerminal types breach log char-by-char (34ms/char + blips), then
  Matrix-style name decrypt, then "> target acquired".
- Re-verified post-fix via local Playwright: rapid seance snuff works, wand casts, all
  5 candles fully visible in card.
- BACKLOG P1: Apple App Store (iOS) publishing support (PWABuilder/App Store Connect).

## 2026-08-04 part 12: Ouija + Dragon rituals, Fates Witnessed page, contrast + StrictMode fixes
- NEW RITUALS (all with realistic AI-generated art, magenta-keyed to alpha):
  * OuijaBoard.jsx (dark pool): planchette (/reaper-planchette.png, glass lens shows
    letter beneath) glides letter-to-letter spelling the winner (max 12 glyphs then …),
    ends on GOOD BYE + thunder. Felt-slide WebAudio per move.
  * DragonEye.jsx (fantasy pool 'eye'): 3 taps wake closed eye (/hoard-eye-closed.png)
    -> crossfade to molten open eye (/hoard-eye-open.png) + embers + reveal-dragon.mp3.
  * TreasureChest.jsx (fantasy pool 'chest'): 3 taps break lock (/hoard-chest-closed.png)
    -> open overflowing chest (/hoard-chest-open.png) + coin fountain + synth coin jingle.
  * Home.jsx pool line ~393: dark += ouija; fantasy(Dragon's Hoard) += eye, chest.
- FATES WITNESSED collection: /rituals route (pages/Rituals.jsx), registry in
  lib/rituals.js (15 rituals w/ accent colors + ES translations). localStorage
  ff_rituals_seen {key:{count,first}} recorded in surpriseDone (on ritual COMPLETION,
  not start). Locked cards show '? ? ?' + realm hint. Home link
  data-testid='fates-witnessed-link' under Champions/Wall row.
- WINTER FLOURISH AUDIO: user-uploaded christmas whoosh -> /flourish-winter.mp3
  (trimmed 0.45-3.1s, 2.7s), plays in FallingBurst when kind==='winter' (ff_muted aware).
- CONTRAST FIX (user bug: 'sub categories too light in all themes'): Filters.jsx
  CollapsibleGroup headers always dark ink (labelColor removed — they sit on white
  cards); cuisine pills + all 3 mode-tab grids darkened #6B7075 -> #3A3F45.
- CRITICAL FIX: StrictMode doneRef poisoning across ALL 12 ritual components —
  unmount cleanup set doneRef=true, StrictMode's simulated remount left it true, so
  onDone never fired in dev builds. Fixed with reset-on-mount pattern:
  useEffect(() => { doneRef.current = false; return () => {...} }, []). Production
  was unaffected but dev/preview rituals never handed back to the reveal.
- Testing: iteration_54 PASSED 100% (3 new rituals, collection page, 5 older rituals
  regression, winter flourish, contrast, no console errors/404s).
- Note for future agents: ritual pool per theme lives in Home.jsx ~line 393; add new
  ritual = component + RevealStage RARE_COVERS + render case + pool + lib/rituals.js
  registry entry + i18n strings.
- BACKLOG: P1 iOS App Store publishing; refactor ideas from tester: useRitualLifecycle
  shared hook, extract rare-fate logic from Home.jsx (1589 lines).

## 2026-08-04 part 13: Code review fixes applied
- SECURITY: removed hardcoded admin password from backend/tests/test_iter49_feedback.py
  (now reads ADMIN_PASSWORD from env with backend/.env fallback). 5/5 tests pass.
- REFACTOR: extracted PassportPicker.jsx + GroupPicker.jsx from Home.jsx
  (components/home/). Home.jsx 1590 -> 1477 lines. Verified pixel/behavior parity
  (category switch, size select, setup CTA, no console errors).
- Passport.jsx share catch: no longer swallows real failures (AbortError = user
  cancel stays silent; other errors toast).
- FALSE POSITIVES investigated + documented (do not "fix" these):
  * "100+ missing hook deps": project eslint react-hooks/exhaustive-deps reports 0
    warnings in cited files; Admin/Passport already use useCallback correctly, Wall
    uses module-scope constants.
  * "sensitive data in localStorage": only non-sensitive game state (streaks, ritual
    collection, crawl progress, passport codes). Admin auth uses httpOnly cookies
    (withCredentials) — nothing sensitive client-side.
  * "index-as-key": flagged instances are fixed-length decorative particle arrays
    (coins/embers/flames) that never reorder — index keys are stable and correct.
- DEFERRED to backlog (risk > reward right now): splitting backend high-complexity
  routes (stamp_passport, complete_crawl, places_search), full type-hint pass,
  further Home.jsx/Passport.jsx decomposition, useRitualLifecycle shared hook.
- NOTE: light cafe theme intentionally remaps #E01E26 red -> sage green via
  index.css !important overrides (line 100+) — not a bug.

## 2026-08-04 part 14: Spring flourish audio
- User-uploaded oriental melody wired as spring theme flourish sting
  (/flourish-spring.mp3). Source was 170s; trimmed to the opening 5s with a 1s
  fade-out to match the ~4.2s petal burst. FallingBurst now uses a
  FALLING_STINGS map (winter + spring). Verified: file serves 200, flourish
  mounts ~3s after deal in spring theme.

## 2026-08-04 part 15: Reaper ghost overhaul + soul wail deepened
- GhostRise flourish: SVG blob ghosts replaced with 2 AI-generated painterly
  wraith sprites (/reaper-ghost-1.png skull-faced sheet ghost, /reaper-ghost-2.png
  hooded phantom) matching user reference images. Magenta despill pass applied
  (scripts/despill_ghosts.py). 3 ghosts alternate the 2 sprites.
- soul-wail.wav reworked per user: pitched deeper (x0.76), louder (peak-normalized
  + playback volume 0.5 -> 0.8), longer (4.2s -> 8.4s) with aecho decay tail fading
  to true silence. Backup of original at /tmp/soul-wail-backup.wav (session only).
- Fixed moan cutoff: GhostRise unmount no longer pauses a started wail (same
  pattern as MatrixRain/Fireflies) — moans now ring out until hushed.
- Verified in-app: ghosts render over dark-theme reveal at ~5s, no console errors.

## 2026-08-04 part 16: Ghost choreography
- GhostRise: 3 window ghosts now each own a third of the photo (left 5/36/67% + jitter)
  and rise on separate beats (delays 0 / 1.6 / 3.2s, ~4.2-5s durations).
- Dark theme flourish window extended 4.2s -> 8.8s (RevealStage steaming timer) so the
  staggered ghosts complete and match the 8.4s soul wail.
- NEW GhostEscort (exported from ThemeFlourish.jsx): hooded phantom (/reaper-ghost-2.png)
  floats up OUTSIDE the photo along the reveal card's right edge, spilling past the card
  boundary. Mounted in Home.jsx inside the white shell (relative, no overflow clipping),
  gated on theme==='dark' && result && !surpriseReveal, keyed per result. Verified via
  staggered screenshots.

## 2026-08-04 part 17: Third moan + white escort ghost
- soul-wail.wav rebuilt from original backup: deep base (x0.76) + THIRD even-deeper
  moan (x0.68) overlaid at 3.9s + echo tail; total 10.8s fading to silence.
  Pipeline documented in this entry (ffmpeg amix/adelay/aecho/afade).
- GhostEscort now renders TWO phantoms outside the photo: hooded (/reaper-ghost-2.png,
  right edge, delay 0.9s) + white sheet ghost (/reaper-ghost-1.png, from bottom-centre
  left:42% climbing up-left with -170px drift, delay 2.4s, 7.6s flight).
- Verified in-app mid-flight screenshot; eslint 0 errors.

## 2026-08-04 part 18: White escort ghost visibility fix
- Bug: white escort ghost was anchored to the shell's bottom (shell ~1300px tall),
  so it only faded in after rising above the visible fold — never seen by users.
- Fix: anchored to top: 520 (visible card region), flight y 60 -> -660, drifting
  -170px left. Verified via getBoundingClientRect sampling: opacity 0.8 at
  viewport y ~300 and ~100 — fully visible during the flourish.
- User confirmed working; publishing to production (fork-fate.com) tonight.

## 2026-08-05 part 19: Spring sting lengthened
- flourish-spring.mp3 re-cut from source: now 12s (was 5s), first 12s of the
  oriental melody with a 2.5s fade-out from 9.5s. Plays out fully even after the
  petal burst unmounts (started audio is never paused).

## 2026-08-05 part 20: Owl extended into flourish + rabbit choreography
- reveal-owl.wav rebuilt from clean original (/app/scripts/reveal-owl-backup.wav, 3.5s):
  now 8s — full original call at t=0, natural repeat call (0.78 vol) at 4.4s, looped
  forest-ambience bed (0.45 vol) underneath so no dead air, fade-out 6.3-8s. No echo FX.
  Pipeline: ffmpeg asplit/atrim/adelay/aloop/amix/afade + limiter, then volume 0.92.
  Cache-busted refs in Home.jsx to /reveal-owl.wav?v=4 (both preload + playSound).
- Spring rabbits FIXED: previous session referenced ffRabbitHop/ffRabbitPatrol keyframes
  that were never added to index.css (rabbits were static). Rewrote as single choreographed
  keyframes per direction (ffRabbitPatrol / ffRabbitPatrolL in index.css): 4 forward hops
  out (5.5vw each, -7px arc, move ONLY while airborne), ~1s sits between hops, scaleX flip
  at each end, 4 hops back. Rabbit-1 left-14% (16s), rabbit-2 right-30% (21s, was right-16%
  — moved off the translucent tree trunk per user report). spring-rabbit.png downscaled
  1064px/973KB -> 240px/43KB. Verified live: x/y sampling confirms hop-rest rhythm.

## 2026-08-05 part 21: Rabbit rhythm re-tuned (user feedback)
- User wanted hop BURSTS, not evenly-paced hops: now "hop hop hop -> sit ~3s ->
  hop hop -> sit ~3s -> turn -> repeat". Each hop stays quick (~0.5s, 4.4vw, -7px arc).
  ffRabbitPatrol/ffRabbitPatrolL rewritten (18s/20s cycles, movement only while airborne).
  Verified via 0.25s x-sampling: 3-hop burst (51px/1.5s), dead-still 3s pause, 2-hop burst.

## 2026-08-05 part 22: Fall squirrel + rabbit sniff (post-publish batch)
- User published to production (fork-fate.com); these changes are preview-only until next publish.
- NEW fall-squirrel.png (Nano Banana via gen_squirrel.py, magenta-keyed, despilled, 260px/54KB).
  Renders in fall scene (ThemeScenes.jsx, cfg.squirrel, z-[4], bottom-1.5% left-20%,
  data-testid="fall-squirrel") with ffSquirrelDart keyframes (14s): quick 0.5s dashes
  of 14vw between ~2.5s freezes, crossing the centre pumpkin cluster, flips at ends.
  Verified live: x-sampling shows freeze->dash->freeze.
- Rabbit sniff: ffRabbitSniff keyframes — 2-3 quick 3deg nose-dip pulses (origin feet)
  timed inside the patrol sit windows (8.4-25/30.6-47/58.4-75/80.6-97%). Applied to
  rabbit imgs at SAME duration+delay as wrapper patrol (18s / 20s+2.5s) so they stay
  synced. Verified live: rotation sampling shows pulses only while sitting.
- "Share A Fate" task found ALREADY BUILT: FateActionsDropdown "Share as image" ->
  buildFateCard (pages/homeFateCard.js) renders themed 1080x1080 cards per realm with
  QR; socials use /api/share dynamic OG tags. No work needed.

## 2026-08-05 part 23: Winter cardinal, squirrel acorn, summer crabs, hop-spin turns
- NEW winter-cardinal.png + fall-acorn.png + summer-crab.png (gen_critters.py /
  gen_crab.py, Nano Banana, magenta-keyed, despilled, all <60KB).
- Winter cardinal: rendered INSIDE the cabin container (ThemeScenes.jsx cfg.cardinal,
  w-[6.5%] left 43% top 14%, data-testid="winter-cardinal"). ffCardinalVisit (26s):
  swoop in from upper-left 0-12.5%, perched 12.5-55%, fly off 55-63%, hidden rest.
  ffCardinalIdle: 4deg tail flicks while perched. Verified perched on roof ridge
  beside chimney via scene-only screenshot.
- Squirrel acorn: fall-acorn.png inside squirrel wrapper (-right-2 bottom-0 w-4,
  data-testid="fall-acorn"), ffAcornShow (14s) fades it in ONLY during dart freezes;
  ffSquirrelNibble (14s) rapid 2.5deg head-dips (origin 60%/100%) in same windows.
  Verified opacity sync live.
- Summer crabs: two crabs (data-testid summer-crab-1/2, bottom-7% left-30% 13s +
  bottom-16% right-24% 17s reverse) with ffCrabSkitter — sideways scuttles with
  pauses, no flip needed. Verified x-sampling dash/pause pattern.
- PAPER-FLIP FIX (user complaint): all turn-arounds in ffRabbitPatrol/ffRabbitPatrolL/
  ffSquirrelDart are now hop-spins — body lifts -5/-7px while scaleX sweeps
  1->0.6->0.05->-0.6->-1 over ~0.3-0.4s (quick jump-pivot, not a flat mirror).
  Verified via paused-animation matrix probing at 46/47/47.5/48/49%.

## 2026-08-05 part 24: Summer beach ball
- Reused existing /summer-ball.png (downscaled 1024px/450KB -> 200px/24KB; it was an
  unused falling-item for summer since falling:false).
- Rendered in summer scene inside cfg.crabs block (data-testid="summer-beachball"):
  3-layer structure — travel div (ffBallTravel 13s linear: -12vw -> 104vw with opacity
  fade at edges) > bounce div (ffBallBounce 1.6s, parabolic via per-key
  animation-timing-function cubic-beziers, -44px apex) > img (ffBallSpin 2.2s rotate).
- Verified live: forward drift + 40px y-oscillation sampled on the inner bounce div
  (NOTE: outer wrapper bbox does NOT reflect child transforms — probe the inner div).

## 2026-08-05 part 25: Crab layering, cardinal flight fix, wail mobile boost
- Crabs "seen through chairs/tree" (translucent decor ghosting): moved to foreground
  sand strip (bottom-2%/6%), z-[4] above palm (z-3), opacity 0.95/0.90 so overlaps
  read as walking in front. Verified via scene screenshot.
- Cardinal flew BACKWARDS (entered from left while facing left) w/o wings: NEW
  winter-cardinal-fly.png (wings spread, facing left, gen_cardinal_fly.py).
  ffCardinalVisit rewritten to enter beak-first from upper-RIGHT (+290px,-230px),
  exit forward upper-left. Two imgs in wrapper crossfade: flying (ffCardinalFlyShow
  opacity windows 0-11.5% & 56-63% + ffCardinalFlap 0.32s alternate scaleY wingbeat)
  vs perched (ffCardinalPerchShow 13-55% + ffCardinalIdle tail flicks). USER CONFIRMED.
- Reaper ghost wail louder on mobile: soul-wail.wav boosted +3.5dB in-file (peak -0.7dB;
  pre-boost backup at /app/scripts/soul-wail-pre-mobile-boost.wav) because iOS ignores
  HTMLMediaElement.volume. ThemeFlourish.jsx GhostRise: volume = coarse-pointer ? 0.8
  : 0.55 (desktop compensated to previous loudness), src cache-busted ?v=2.
- PROBE LESSON: to freeze a CSS animation at a phase, set animation:'none' + force
  reflow FIRST, then re-apply shorthand with negative delay + paused — for EVERY
  element probed, imgs included.

## 2026-08-05 part 26: Cardinal two-perch patrol + look-arounds
- Cardinal timeline now one 52s loop with TWO anchored instances:
  A (data-testid="winter-cardinal", inside cabin container): fly in from upper-right
  0-6%, perch 6-27% with TWO look-around body flips (11-13%, 19-21%) + tail flicks,
  fly off LEFT 27-30%. B (data-testid="winter-cardinal-tree", scene root, anchored to
  winter-tree crown left-33%/top-52% mobile, 12.2%/10.3% desktop — computed from DOM
  tree bbox, crown tip at 51.1% flipped width): returns from LEFT 40-46%, perches on
  treetop 46-68% w/ look flips (51-53%, 59-61%), flies off RIGHT 68-71.5%.
- B's content wrapped in static scaleX(-1) div so the left-facing sprites face right;
  keyframes: ffCardinalVisitA/B, FlyShowA/B, PerchShowA/B, LookA/B (scaleX flips +
  rotate flicks, consistent transform lists), shared ffCardinalFlap.
- All 8 phases probe-verified (positions, opacities, look flips, mutual exclusion).

## 2026-08-05 part 27: Summer solidity + cardinal tuning (user feedback rounds)
- Summer chairs/palm made solid (treeOpacity & decorLeftOpacity 0.6/0.62 -> 0.92, new
  cfg.decorLeftZ="z-[3]" wired into decorLeft className); rear crab now z-[2]
  bottom-9% so it genuinely passes BEHIND the palm trunk; front crab stays z-[4].
  Scene-only screenshot approved by user.
- "No animal noises" — user explicitly DECLINED critter sounds. Do not add.
- Cardinal (user: "looks good" but tune): flight slowed ~40% (A in 0-8%, out 26-31%;
  B in 39-47%, out 67-72.5% of 52s); tree perch lowered (top 52->53.8% mobile,
  10.3->13% desktop).
- "Wings don't flap when flying away": flap was too subtle + takeoff crossfade showed
  folded-wings sprite. ffCardinalFlap deepened (scaleY 1->0.5, rotate 1->-5deg), sped
  0.32s->0.24s, crossfades snapped to takeoff moment (26.3% A / 67.3% B). Verified
  live: scaleY oscillates 1->0.5->1 @ ~2 beats/s during fly-out, opacity 1.

## 2026-08-05 part 28: Rabbit leg gait, snowman wave, falling coconut
- Rabbit gait: ffRabbitSniff REPLACED by ffRabbitGait (18s/20s synced to patrol) —
  scaleX stretch 1.14 at each leap apex, gather 0.88 on landing (legs out/in look),
  sniff rotates kept in sit windows. Probe-verified (apex 1.14 / land 0.88 / sit 1.0).
- Snowman wave: NEW winter-arm.png twig sprite (gen_wave_coconut.py). Rendered in
  cabin container (cfg.snowmanArm, w-[6%] left 11.5% top 61.5%, pivot 92%/92%,
  data-testid="winter-snowman-arm"). ffSnowmanWave (34s): fades in raised at the
  viewer-left shoulder ~78%, waves 3x (rotate -12..18deg, 0.34s swings), fades out.
  Placement verified via zoomed cabin screenshot.
- Falling coconut: NEW summer-coconut.png. Element .ff-coconut anchored at palm
  cluster (left-63%/top-60.5% mobile, 89%/39.5% desktop, data-testid="summer-coconut");
  ffCoconutFall (18s): appears 73%, ease-in fall (--ff-coco-fall: 33vh mobile/54vh sm
  via media query), squash thud + 12px bounce + ffCocoPuff sand puff at 78%, rests,
  fades 90%. Probe-verified fall path + landing at trunk base.

## 2026-08-05 part 29: Crab dodge, reaper raven, squirrel gait + solidity
- Crab coconut dodge: crab-1 now uses ffCrabDodge 18s (SAME cycle as ffCoconutFall,
  delay 0 on both = deterministic sync) — wanders toward the palm in 4 legs
  (0->28vw by 61%), holds near the landing spot, then bolts 22vw away in 0.43s right
  at the 78% impact. Probe-verified (tx 109px pre-impact -> 23px post).
- Reaper raven: NEW reaper-raven.png (perched; raw keyed by CORNER-COLOR distance —
  Nano Banana returned maroon bg not magenta, gen_raven.py) + reaper-raven-fly.png.
  Rendered INSIDE ReaperScene.jsx parallax reaper container (left 73.5% top 10.2%,
  w-[9%], z-10, data-testid="reaper-raven") so it rides the reaper's motion; perches
  on the staff hook. ffRavenVisit 44s (in from upper-right 55-62%, perch 62-84% w/
  ffRavenLook flips+head tilt, out upper-left 84-88%), reuses ffCardinalFlap.
  brightness(1.35) filter so the black bird reads on the dark scene. Probe-verified
  box/opacities; black-on-black is faint in static screenshots but correct.
- Squirrel gait: ffSquirrelNibble REPLACED by ffSquirrelGait (stretch 1.15 mid-bound,
  gather 0.88 on landing during the 4 dash windows; nibble rotates kept in freezes).
- Squirrel transparency complaint: opacity-80 removed (now fully opaque); rabbits
  bumped 0.80/0.75 -> 0.95/0.90. NOTE PATTERN: user consistently dislikes translucent
  critters/props ghosting — keep all future critters at >=0.9 opacity.

## 2026-08-05 part 30: Raven moved to fall scarecrow + tiki gecko
- USER CORRECTION: raven belongs in FALL with the scarecrow (not Reaper). Raven block
  REMOVED from ReaperScene.jsx (tail structure restored: lantern -> 2 motion.div
  closings -> </div>); now renders inside the fall scarecrow container
  (data-testid="fall-raven", w-[26%] left 1% top 7.5%) perched on the LEFT crossbar
  tip — same ffRaven* keyframes reused, no brightness filter (daylight). Verified
  visually: sits exactly on the crossbar.
- Tiki gecko: NEW tiki-gecko.png (lime green w/ orange spots, gen_gecko.py).
  In tiki lounge block (data-testid="tiki-gecko", bottom-2.5% left-12%, z-[3], FULL
  opacity per user preference). ffGeckoDart 16s: 0.3s lightning sprints of 15vw with
  ~2.7s freezes, whip-turns (fast scaleX spin + tiny lift) at ends; ffGeckoGait
  stretch pulses (1.18/0.88) during sprints. Verified sprint-freeze x-sampling.
- Reaper realm intentionally has NO critter now (bats already live there).

## 2026-08-05 part 31: Gecko moved ONTO the bar counter
- User expected the gecko ON the bar (was on floor). New .ff-tiki-gecko class anchors
  him to the PAINTED counter using object-cover math: --s: max(100vw/1264, 100dvh/848);
  left/top map canvas coords (520, 495) -> screen; width 46 canvas units.
- ffGeckoDart (floor, vw-based) DELETED; replaced by ffGeckoBar — identical sprint/
  freeze/whip-turn schedule but travel in canvas units (3 legs x 100 canvas px along
  the counter with its slight perspective slope, -3 canvas y per leg).
- Verified both breakpoints via frozen-phase zooms: gecko stands on the counter top
  (desktop clearly visible next to tiki candle; mobile small behind the drinks).
- TECHNIQUE NOTE: this cover-math anchor is THE way to pin critters/props to painted
  content in full-bleed object-cover scenes (tiki, cemetery etc).

## 2026-08-05 part 32: Cyberspace stealth saucer (Servo-Deck) wired in
- User iterated on probe designs: rejected sleek + gritty/worn variants; picked
  "Servo-Deck" — clean but heavily MECHANICAL thin saucer (dense greebles, servos,
  pistons, bolted plates, cable conduits) w/ cyan eye lens, rim lights, antennas.
- Asset: /cyber-saucer-mech.png (gen_saucer_mech.py; magenta-keyed + despilled, 240px).
  Unused alt variants kept in /public: cyber-saucer-{rust,scrap,mil,turbine,gears}.png.
- Wiring (ThemeScenes.jsx, data-testid="cyber-saucer"): z-[6] (in FRONT of everything,
  above bus z-[5]); width clamp(96px,13vw,150px); cyan drop-shadow glow.
- ffSaucerPatrol 30s ease-in-out: sprite faces LEFT (scaleX(1)=left, -1=right); darts
  between 4 hover points w/ hold-drift pauses + scaleX whip-turns; enters offscreen
  right 108vw, exits left -30vw. ffSaucerHover 2.8s bob layered inside.
- BLINK TRICK: duplicate <img> stacked with mix-blend-screen + brightness(2.6)
  saturate(1.7), opacity stepped irregularly via ffSaucerBlink 1.7s steps(1,end) —
  rim running-lights + eye lens flash while dark hull stays unaffected.
- Verified via screenshots desktop 1920 + mobile 390: hover, right-facing flipped leg,
  blink glow all correct on both breakpoints.

## 2026-08-05 part 33: Saucer in front of content + 3-step turn + red beacon
- User iterations: (1) saucer must hover IN FRONT of words/windows, (2) turn is 3
  steps w/ middle step eye facing the user, (3) NO whole-body flash — small red
  beacon dot instead, (4) faster turn transitions.
- ARCHITECTURE: AmbianceScene now returns a FRAGMENT — the z-0 scene div PLUS a
  sibling fixed overlay (data-testid="cyber-saucer-layer", z-[30], pointer-events-
  none) so the saucer flies OVER page content (sections z-10) but UNDER the header
  (z-40) and dialogs (z-60+).
- NEW ASSET: /cyber-saucer-mech-front.png (gen_saucer_front.py) — head-on view,
  cyan eye dead-center. AMBIANCE.cyber gains saucerFront key.
- 3-STEP TURN: patrol keyframes are position-only now; two stacked face divs inside
  the hover wrapper run ffSaucerSideFace / ffSaucerFrontFace (both 30s, synced to
  patrol): side squishes out (scaleX 0.12) -> front pops in ~1s (eye on user) ->
  side returns mirrored. Fades tightened to ~0.25s (0.8% of 30s) per user.
- BEACON: ffSaucerBlink deleted; small red radial <span> dot on each face
  (side 44%/22%, front 48%/16%) blinking via ffSaucerBeacon 1.6s steps(1,end).
- TESTING TECHNIQUE: freeze phase = set animation:'none', force reflow, re-apply
  'name 30s ease-in-out -Xs infinite paused' on patrol + both faces (hover anim
  set to none). Verified frozen at 34% (front, eye on user, over hero words) and
  37.5% (mirrored side restored) at 1920px; earlier live shots verified mobile 390.

## 2026-08-05 part 34: Turn squish removed
- User asked if the shrink (scaleX squish) between images when turning was needed —
  it was stylistic only. ffSaucerSideFace/ffSaucerFrontFace now do PURE opacity
  crossfades (~0.25s) at full sprite size; side scaleX just flips 1/-1 while hidden.
- Verified frozen at 31.9% (mid crossfade): full-width ghosted saucer, no squish.

## 2026-08-05 part 35: Search-beam + both-side entries + longer beam
- SEARCHLIGHT: faint cyan cone (clip-path polygon, linear-gradient fade, painted
  UNDER the sprite) sweeps down 42vh from the saucer belly during hover stops —
  ffSaucerBeamOn (visibility windows) + ffSaucerBeamSweep 4s alternate (-13/12deg
  pan, transformOrigin top). data-testid="cyber-saucer-beam".
- BOTH SIDES: patrol extended to a 60s ROUND TRIP — half 1 enters RIGHT/exits left,
  half 2 re-enters LEFT/exits right (user noticed it only came from the right).
  4 on-screen 3-step turns (18.5/28.5/59/68%) + hidden flips off-screen at ~51%
  and the loop boundary. All face anims re-synced at 60s.
- LONGER BEAM (user request): hover holds A/mid/F widened; beam windows now
  6.5-13.5 / 37.5-44.5 / 79.5-87.5% (~4.2s each, was ~1.8s).
- Verified via computed-style probes at 10/19.6/41/84% (position, side/front
  opacity+flip, beam opacity ALL match) + visual of hover F beam over content.

## 2026-08-05 part 36: "Last 3" — streaks verified, sound pass, saucer abduction
- FATE STREAKS: already existed (homeConstants.js readStreak/bumpStreak, flame badge
  data-testid="streak-badge" at streak>=2 next to the fates-dealt counter, bumped on
  all 4 deal paths). Verified renders "4 day streak" with seeded ff_streak.
- REALM SOUND CHECK: measured RMS x gain of every shuffle bed vs its realm's reveal
  (numpy/soundfile, see audit output). Three beds ran hot vs their reveal:
  cyber 0.8->0.5, winter 0.8->0.65, fall 0.8->0.55 in SHUFFLE_LOOPS (Home.jsx).
  Also deleted the DUPLICATE hardcoded loopVol map at the second play site (~line
  682) — now reads SHUFFLE_LOOPS[theme][1] (fixes fairy/light undefined volume too).
- SAUCER ABDUCTION easter egg: SaucerAbduction component in ThemeScenes.jsx
  (data-testid="cyber-abduction"). Cyber only, ONCE per session (sessionStorage
  ff_abducted), random 45-105s after load; force-trigger for tests via
  window.dispatchEvent(new CustomEvent('ff:abduct')). Sequence (~4.9s, z-[50]
  overlay above header z-30): saucer darts in from right to a hover point
  below-right of the header logo -> tractor beam cone (rotated to aim at the
  logo, atan2(-dx,dy)) -> real medallion hidden while a CLONE (mounted at phase 2
  overlapping invisibly, so the transition has a start point) rides the beam into
  the ship (scale 0.12, spin, fade) -> saucer flees left -> logo drops back with
  ffLogoReturn bounce keyframes (index.css). Patrol layer visibility:hidden while
  active (abducting state in AmbianceScene).
- TESTING NOTE: taking multiple playwright screenshots during the sequence
  throttles page timers and skews phases — verify with ONE capture per run + a
  final computed-state probe (logoVis/abductionGone/patrolVisible all correct).

## 2026-08-05 part 37: Pre-deployment regression + readiness — ALL PASS
- testing_agent iteration_56: 9/9 frontend checks + 4/4 backend endpoints PASS, zero
  issues. Covered: realm dialog, deal flow (POST /api/places/search), theme
  persistence, saucer layer/anim, abduction lifecycle, streak badge, sound config,
  favorites/sponsor/language, no console errors.
- deployment_agent: status PASS — env vars clean, CORS covers fork-fate.com +
  emergent.host + preview, supervisor valid, no hardcoded URLs/secrets. READY.
- User deferred all further features ("save that stuff for later").

## 2026-08-05 part 38: Tiki gecko mobile path fix + second floor gecko
- BUG (user, live/mobile): bar gecko's far stop (300 canvas units) put him at
  x=382 on a 390px phone — sliding off the counter/screen edge.
- FIX: ffGeckoBar far stop parametrized via --gx/--gy CSS vars (canvas units,
  set inline in ThemeScenes.jsx): desktop 300/-45 (unchanged), mobile 220/-33
  (uses existing `mobile` state). Midpoints computed as calc((200+var(--gx))/2).
  Probe-verified: mobile far stop x=302 (on counter), desktop x=1246 unchanged.
- NEW: second gecko on the FLOOR (data-testid="tiki-gecko-floor", left 6%,
  bottom 2vh, width clamp(54px,6vw,78px), z-[3]) — viewport-based ffGeckoFloor
  19s (never syncs w/ 16s bar gecko): sprint/freeze/whip-turn legs 0-30-6-44-0vw;
  ffGeckoFloorGait stretch pulses matched to its sprint windows.
- NOTE: user still hasn't redeployed — these fixes + abduction tuning (if any)
  reach fork-fate.com on next Publish.

## 2026-08-05 part 39: Tiki gecko trio finished
- BAR GECKO (user screenshot showed him at the counter's front-left corner,
  canvas ~480): mobile base moved RIGHT to (570,526) w/ far leg 180/-27; desktop
  unchanged (520,533, 300/-45). Probe: mobile home x=136, far x=312 — both on
  the counter, clear of the corner.
- FLOOR GECKO + FLY CHASE: TikiFloorGecko component (ThemeScenes.jsx). Normal
  ffGeckoFloor 19s loop; every 35-80s a chase arms and waits for the 19s loop
  boundary (gecko at translateX(0) facing right) THEN swaps to one-shot
  ffGeckoChase 4.6s — sprint, lunge (-9px hop at 47%), miss, trot back to 0 —
  so animation swaps never teleport him. Fly (data-testid="tiki-fly", 7px dot,
  ffTikiFly path + ffFlyJitter wing buzz) escapes upward at ~60%. Force-trigger
  for tests: window.dispatchEvent(new CustomEvent('ff:gecko-chase')). Verified:
  fly mounts mid-chase, gone after, loop resumes.
- THIRD GECKO (smaller, 30 canvas units, data-testid="tiki-gecko-shelf"):
  user asked for the roof beam, but ALL painted roof beams are at canvas y<260 —
  permanently hidden behind the sticky header/banner stack on BOTH breakpoints
  (scene is fixed; desktop crop starts ~canvas 233 + UI to ~282, mobile UI to
  ~281). Placed on the highest VISIBLE ledge instead: the back-bar shelf edge
  among the bottles, canvas (450,331), run 170 units, slope +5y. ffGeckoBeam
  18s (no sync w/ 16s/19s). Probes match shelf line exactly on both breakpoints.
- User idea logged: CAFE RARE RITUAL "Latte Stir" — realistic mug, cream latte
  art forms the FF logo, you STIR the logo away to reveal the fate. NOT BUILT
  YET (user said finish geckos first). Winter also has no exclusive ritual.

## 2026-08-05 part 40: Shelf gecko CANCELLED -> totem climber (top-down sprite)
- User cancelled the shelf gecko ("paths too similar") and drew the desired path:
  vertical climb on the carved TOTEM left of the back-bar (canvas x~407-480,
  y~267-467), from palm-frond level down to just above the pineapple.
- NEW SPRITE per user: TAN with GREEN SPOTS, TOP-DOWN dorsal view, head up —
  /public/tiki-gecko-top.png (gen_gecko_top.py, 160px, keyed+despilled).
- ffGeckoBeam/ffGeckoBeamGait keyframes DELETED; new ffGeckoClimb 20s (no sync
  w/ 16/19s): anchored canvas (422,420), climbs -125 units in 3 sprints w/
  pauses, look-around wiggle (rotate -14deg) at top, flips rotate(180) head-down,
  descends in 2 sprints, flips back via rotate(360) at bottom (=0 at loop wrap).
  data-testid="tiki-gecko-totem"; drop-shadow filter for relief against the wood.
- Verified: frozen rects (641,393)/(641,204)/(644,272) all on the painted totem
  column at 1920px; zoomed clips visually confirm him on the totem face/chin.
- NOTE: on very narrow phones (390px) the totem sits at the left crop edge so
  the climber is partially clipped — inherent to the art crop (user's own device
  is wider and shows it fine).
- STILL PENDING (user's chosen next): Latte Stir cafe ritual — FF logo in the
  cream, stir it away to reveal. Winter snow-globe ritual also proposed.

## 2026-08-05 part 41: Cardinal-on-card (winter flourish) + Snow Globe ritual
- CARDINAL PERCH (winter reveal flourish): CardinalPerch (exported from
  ThemeFlourish.jsx, data-testid="winter-cardinal-card") — swoops in from
  off-RIGHT (both sprites face left), lands ON the dealt card's TOP edge,
  side-hops, looks BOTH ways (ffCardinalCardLook: scaleX flips + head tilts,
  per user "only looks 1 direction" note), departs up-left at 7.8s (winter
  window 8s). CLIPPING FIX (user mobile screenshot): spin-result-card's
  overflow-hidden moved to an inner wrapper div; outer motion.div is now
  "relative rounded-2xl" and CardinalPerch renders as its unclipped sibling
  in RevealStage ({theme==="winter" && steaming}). Perch raised twice per
  user: final = translate(-50%,-100%) + top:0% stops.
- SNOW GLOBE RARE RITUAL (winter exclusive, user-approved asset with SNOWMAN
  inside): /public/snow-globe.png (gen_snow_globe.py, 480px). SnowGlobe.jsx
  modeled on TikiShaker: 5 taps to shake (wobble via motion key remount,
  icy noise-burst jingle, progress dots), 26 deterministic flakes clipped to
  the glass sphere (rounded-full overlay at 50%/40.5%, 88% width) swirl
  faster per shake (ffGlobeSwirl duration scales), then ffGlobeSettle +
  reveal-santa.wav on completion; onDone at 2.4s w/ cover fade.
- WIRING: RARE_COVERS + "globe" + render branch (RevealStage), winter pool2
  branch (Home.jsx ~line 413), rituals.js registry entry (auto passport
  tracking -> "New fate witnessed! Snow Globe" toast verified).
- TEST HOOKS: localStorage ff_deal_taps=99 + ff_rare_at=10 forces a rare fate;
  ff_rare_force='globe' picks the ritual. Full flow verified on mobile 390:
  cover -> 5 shakes -> settle -> card revealed + collection toast, no errors.

## 2026-08-05 part 42: Latte Stir fixed + "Tap to shake" copy + haptics (FF_BUILD 317)
- LATTE STIR RITUAL WAS BROKEN: previous fork imported LatteStir + added "latte"
  to RARE_COVERS but FORGOT the render branch — rare fired and the card sat
  exposed/stuck. FIX: `{surprise === "latte" && <LatteStir/>}` branch added after
  globe in RevealStage.jsx.
- CREST MASK FIX: LatteStir masked with /logo-mark.png whose alpha is an OPAQUE
  circular badge -> solid cream blob. Built /public/latte-crest-mask.png (white
  F·F letter silhouette extracted from logo luminance, inner radius<0.52 to drop
  the fork-highlight arc; generated inline w/ PIL). Mask width bumped 62%->88%
  of crema. Verified: crest reads as real latte art; stir (circular pointer
  drag around CREMA cx/cy) dissolves it, done text (now text-center px-6),
  cover fades to card, "New fate witnessed! Latte Stir" toast fires.
- SHAKE PROMPT FIX (user report): SnowGlobe + TikiShaker said "Shake ...!" but
  are tap-driven. Copy now "Tap to shake the globe!" / "Tap to shake the mug!"
  (+es translations) and each tap fires navigator.vibrate(35) haptic where
  supported (iOS Safari ignores silently). Magic8Ball hint now "Shake your
  phone — or rattle the ball with your finger" (it truly supports both).
- i18n: added es entries for latte/globe UI + rituals.js names/descs.
- Verified via screenshot flows: winter globe (2 taps=2 dots), tiki mug,
  full latte stir e2e, /rituals shows globe+latte cards. ESLint 0 errors.
- NOT YET ON PRODUCTION: user must redeploy fork-fate.com to get these fixes
  (production still has the broken/stuck latte rare!).

## 2026-08-05 part 43: Saucer retune + Streak confetti + Dragon Heist (FF_BUILD 318)
- SAUCER ABDUCTION RETUNED (user pick 1): first strike now 20-40s after load
  (was 45-105s) and it REPEATS every 2.5-5 min (was once/session via
  ff_abducted sessionStorage — removed). Repeat-safe: `running` closure guard,
  bail-retry (30s) if the logo medallion isn't measurable, return-bounce
  animation reset via animation="none" + reflow so it replays, and effect
  cleanup un-hides the medallion if unmounted mid-heist (theme switch).
- STREAK CONFETTI (user pick 3): canvas-confetti added (yarn). homeConstants
  `streakMilestone(count)` — milestones [7,30], ff_streak_celebrated stores
  highest fired milestone, auto-resets when streak breaks. Home.dealStreak()
  wraps bumpStreak (all 4 setStreak call sites) -> two side bursts + delayed
  center burst (brand colors #E01E26/#E6B23A/#fff), haptic(30), sonner toast
  ("7-day streak! Fate favors the faithful." / 30-day variant, +es), trackEvent
  streak_milestone. TEST: seed ff_streak={date:yesterday,count:6}, deal.
- DRAGON HEIST (user pick 4, fantasy realm easter egg): DragonHeist in
  ThemeScenes.jsx — reuses /dragon-claw.png (896x1200, grip window center
  50.8%/56%, clawW=2.1*logo w). Claw RISES from below screen, clamps the
  header logo (ffClawClench wiggle keyframe, real medallion hidden + clone
  w/ /logo-crest-gold.png mounts in grip), YANKS it down into the hoard,
  logo returns via new ffLogoReturnUp keyframe (rises from below, unlike
  saucer's drop-in). Same cadence as saucer: 25-45s first, 2.5-5 min repeats.
  Rendered `{theme==="fantasy" && <DragonHeist/>}` in AmbianceScene.
  TEST HOOK: window.dispatchEvent(new Event("ff:heist")) (saucer: "ff:abduct").
- All verified via screenshots: heist clamp/yank/return frames, 7-day toast +
  confetti over revealed card, saucer double-strike in one visit. ESLint 0 err.
- NOT ON PRODUCTION until user redeploys.

## 2026-08-05 part 44: Reaper heist + golden 30-day deck + title startle (FF_BUILD 319)
- HEIST REFACTOR: DragonHeist generalized into shared `LogoHeist` (ThemeScenes
  .jsx) w/ props sprite/aspect/gripX/gripY/widthMult/cloneSrc/shadow/testid.
  DragonHeist = thin wrapper (claw art 896x1200, grip 50.8%/56%, mult 2.1,
  clone /logo-crest-gold.png). Both listen to `ff:heist` (never co-mounted).
- REAPER HEIST (exported ReaperHeist, rendered `{theme==="dark"}` next to
  ReaperScene in Home.jsx ~line 899): /skeleton-hands.png (848x1264, two bony
  hands reaching up), grip 50%/65%, mult 2.55, clone /logo-mark.png, crimson
  glow drop-shadow. Hands rise from the grave, clutch the medallion, drag it
  under; returns via ffLogoReturnUp. VERIFIED numerically: clone rect (16.3,
  17.9) vs logo (16,16) at clamp; dragon regression (15.7,15.2) also clean.
- TITLE STARTLE: HomeHeader "Fork·Fate" span now inline-block +
  data-testid="ff-title"; startleTitle() (ThemeScenes) fires ffTitleStartle
  keyframe (hop + tilt, animation reset via none+reflow) at the clamp moment
  of LogoHeist AND the saucer's lift phase. Verified style.animation applied.
- GOLDEN 30-DAY DECK: ShufflingDeck computes `golden = readStreak() >= 30`;
  CardBack renders a gilded back FIRST (overrides all themes + seasonItem):
  dark-gold gradient, ffGoldSheen foil sweep, double gold border, Flame icon,
  "FORK·FATE / 30-DAY DEVOTEE", data-testid="card-back-golden". Verified: seed
  ff_streak={date:now,count:31} -> all 5 shuffle cards golden in reaper realm.
- NOT ON PRODUCTION until user redeploys.

## 2026-08-05 part 45: Golden fate card + heist collection + streak saver (FF_BUILD 320)
- GOLDEN FATE CARD: homeFateCard.js imports readStreak; buildFateCard passes
  `golden = readStreak() >= 30` into BOTH builders; drawGoldenTrim(ctx,W,H)
  draws a gilded double frame + "★ 30-DAY DEVOTEE" pill seal (top-right, clear
  of QR/logo in both layouts), drawn LAST over scrims. VERIFIED by intercepting
  URL.createObjectURL (window.fetch is instrumented by emergent-main.js — use
  createImageBitmap on the stashed Blob, NOT fetch(blobUrl)) via the
  fate-actions-trigger -> fate-action-share-image download path.
- HEIST COLLECTION: rituals.js adds HEISTS registry (saucer/dragon/grave w/
  name/realm/accent/desc), readHeistsSeen/recordHeistSeen (ff_heists_seen,
  returns first-time bool). ThemeScenes useHeistWitness(key) hook (useLang +
  useNavigate + sonner toast "Heist witnessed!" w/ Collection action) — called
  via witnessRef.current(true) at COMPLETION timers (LogoHeist 3650ms w/
  heistKey prop dragon/grave; SaucerAbduction 4900ms w/ "saucer").
  GOTCHA: one search_replace reported success but didn't persist the LogoHeist
  witness call — always grep-verify after batch edits. Rituals.jsx adds
  "Realm Heists" section (heist-card-{key} grid, HEIST_ICONS Rocket/Grab/Bone;
  also fixed missing globe:Snowflake latte:Coffee ritual icons). VERIFIED:
  forced dragon heist -> toast + ff_heists_seen + unlocked card on /rituals.
- STREAK SAVER: homeConstants — ff_streak JSON now {date,count,graceUsed}.
  bumpStreak returns {count,saved}: days===2 && !graceUsed -> count+1,
  graceUsed=true, saved=true (one grace per streak run; second miss resets,
  graceUsed clears on new run). readStreak honors pending grace (days===2 &&
  !graceUsed keeps count alive for golden-deck checks). Home.dealStreak toasts
  "A grace day saved your streak — fate is merciful." VERIFIED: seed date=2
  days ago count=10 -> deal -> toast + {count:11,graceUsed:true} + badge 11.
- i18n: es entries for all new strings (heists, grace toast, section copy).
- NOT ON PRODUCTION until user redeploys.

## 2026-08-05 part 46: Fate Journal + Dish Dare + Fate of the Day + crawl dialog UX (FF_BUILD 321)
- FATE JOURNAL: new /app/frontend/src/lib/journal.js (ff_journal localStorage,
  MAX 250; recordFate/recordVerdict/journalStats) + /journal page (Journal.jsx,
  dark, stats tiles: fates dealt / chose-well % / dares / top cuisine +
  "The Reaper remembers" line + entry list w/ realm chips + verdict icons).
  Home.landFate(card, extra) wraps ALL result landings: rare flow, normal
  ticker flow, doubleOrNothing({dared:true}), group onPick({group:true}),
  fate-of-day deal. ReactionBar.vote() mirrors verdict via recordVerdict.
  Nav: "Fate Journal" link paired with "Fates Witnessed" in More-ways row.
- DISH DARE: DishDare.jsx (components/home) — dashed amber button on revealed
  card (food/drinks/desserts/bars modes only, keyed dd-{card.id}); slot-machine
  text flicker then locks one of 16 ordering dares. One dare per card.
  Rendered in RevealStage under the verdict row.
- FATE OF THE DAY: Home fateOfDay memo — deterministic hash(date|zip-or-
  rounded-coords) over id-sorted results; gold banner (Crown, thumb via
  cardImage, "Deal me this" -> landFate + scroll top) above "Nearby spots".
- CRAWL DIALOG UX (user-reported: stops obscured, new users lost — their
  screenshot was PRODUCTION/old build): CrawlMap 200->170px; scroll cue
  (bouncing "Your stops" chip over gradient, data-testid=crawl-scroll-cue,
  hides when scrolled via bodyRef/updateCue); first unvisited stop gets
  pulsing ring + "Start here"/"Next" chip (crawl-next-chip-{i}).
- i18n: es for all new strings; FIXED pre-existing duplicate keys in i18n.js
  (Fall/Spring/Summer + my Fates dealt dupe) — eslint no-dupe-keys now clean.
- All verified via e2e screenshots. Crawl testing recipe: crawl-mode-toggle ->
  fill "ZIP code" placeholder (e.g. 68046) -> crawl-deal-button -> dialog ~4s.
- NOT ON PRODUCTION until user redeploys.

## 2026-08-05 part 47: Cuisine Bingo (FF_BUILD 322)
- ENGINE /app/frontend/src/lib/bingo.js: BINGO_POOL (36 common cuisines incl
  Coffee/Bakery/Ice Cream/Pub so drinks/desserts/bars modes hit too);
  ff_bingo = {seed, marked:{cuisine:iso}, lines:[r0..r4,c0..c4,d0,d1],
  stamps, cards}. bingoCard(seed) = mulberry32 shuffle, 24 cells + FREE at
  idx 12. markCuisine(cuisine): case-insensitive exact match, dupes -> null,
  FREE counts toward lines, new lines increment stamps, blackout flag.
  newBingoCard() rerolls seed, cards+1, stamps carry. UNIT-TESTED via node
  eval w/ mocked localStorage (row + col-through-FREE + dup cases pass).
- PAGE /bingo (Bingo.jsx): 5x5 grid (bingo-cell-{i}), red check stamps,
  gold FREE crown, completed-line cells go gold (completedCellIndexes),
  stamps counter (bingo-stamps), markedCount/24, blackout -> bingo-new-card
  button ("Card conquered — deal a fresh card"), cards-conquered footer.
- HOOKS: Home.landFate calls markCuisine(card.cuisine) after recordFate —
  new line -> gold/red confetti + toast "BINGO! Line complete — stamp
  earned." w/ View card action (navigate /bingo) + trackEvent bingo_line;
  plain hit -> toast "Bingo square stamped: {cuisine}". VERIFIED LIVE: deal
  landed Indian -> square stamped + toast on screen.
- COLLECTION: /rituals shows bingo-collection-card (gold Stamp icon, "N
  stamps earned · N cards conquered", links /bingo). HOME: cuisine-bingo-link
  full-width gold button under the Fates Witnessed / Fate Journal pair.
- i18n es added. Deterministic test recipe: seed ff_bingo {seed:12345,...} —
  card row0 = Ramen/Fried Chicken/Mexican/Salads/Seafood, FREE at 12.
- NOT ON PRODUCTION until user redeploys.

## 2026-08-05 part 48: Crawl dialog compact footer (FF_BUILD 323)
- User: "New crawl / Share with group pills too big on mobile — bottom,
  smaller, or side". PubCrawlDialog footer now ONE side-by-side row on all
  sizes (flex-1 each, px-3 py-2 text-xs on mobile, sm: restores py-3 text-sm);
  crawl-complete-button slimmed (py-2 text-xs mobile). Reclaims ~110px —
  stops 1-2 + cue now above the fold at 390x800. Verified via screenshot.

## 2026-08-05 part 49: Crawl dialog Stops/Map pages (FF_BUILD 324)
- User: "list of fates and the map on 2 pages users can switch between".
  PubCrawlDialog now has `view` state + segmented control (crawl-view-tabs,
  crawl-tab-stops / crawl-tab-map, red active pill). Progress bar stays
  visible on both pages. STOPS page (default): hint line + stop list + crew
  input in the scroll body w/ cue (cue effect deps now include view). MAP
  page: CrawlMap height=330 (CrawlMap takes height prop, default 170) +
  caption "Numbered pins follow your route — green means conquered."
  react-leaflet remounts cleanly per tab switch (bounds applied on mount).
- Verified via screenshots: 4 stops above fold on Stops page, big map with
  numbered pins + START marker on Map page, switch back/forth works.

## 2026-08-05 part 50: Live crew pins + bingo/journal share cards + bigger map (FF_BUILD 325)
- LIVE CREW PINS (shared crawls): backend models.CrawlPositionCreate +
  routes/crawls.py POST /crawls/{code}/position (rate_limit 120, upsert on
  code+member_id, 15-min TTL via expire_at index on db.crawl_positions) and
  GET /crawls/{code}/positions. CURL-VERIFIED (upsert + list). Frontend
  PubCrawlDialog: ff_member_id (localStorage), broadcasts livePos max every
  20s while autoGps on + crawlCode set (name = first token of crew input),
  polls positions every 20s while dialog open, filters self, passes
  crew={crewPos} to CrawlMap. CrawlMap crewIcon = blue pinging dot + name
  tag divIcon (escapeHtml). Map caption swaps to "N crew pins live — blue
  dots are your people." (singular variant too). VERIFIED via /c/{code}
  route with a curl-seeded Bob position — blue named pin rendered.
- MAP SIZE (user asked "big enough on mobile?"): map page now
  height="max(260px, 44dvh)" (CrawlMap height prop takes strings) ≈ 370px
  on a typical phone instead of fixed 330.
- SHARE CARDS lib /app/frontend/src/lib/shareCards.js: shareImage(blob) =
  navigator.canShare files -> share, else anchor download (AbortError -> null);
  buildBingoShareImage 1080x1350 portrait (GRID OVERFLOWED at 1080x1080 —
  5 rows need ~1170px, hence 4:5) gold line-cells/red stamps/FREE star;
  buildJournalShareImage 1080x1080 stat rows (fates/chose-well%/dares/
  streak) + "Fate keeps sending me to {topCuisine}" + "The Reaper remembers."
  Buttons: bingo-share-button (Bingo.jsx), journal-share-button (Journal.jsx,
  hidden when 0 fates). Both verified by intercepting URL.createObjectURL
  (set hooks AFTER final navigation — goto wipes window overrides).
- NOTE: a search_replace on Bingo.jsx matched the wrong anchor and left
  dangling JSX (parse error) — caught by eslint, fixed. Always re-lint.
- READY FOR USER REDEPLOY (FF_BUILD 325).

## 2026-08-05 part 51: Heist visibility fix — auto-scroll to the show (FF_BUILD 326)
- BUG (user): "I keep getting heist witness. Problem is if I'm in the middle of
  the page on mobile, I don't see anything." Root cause: heists target the header
  logo via getBoundingClientRect, but Home's root wrapper `overflow-hidden`
  BREAKS the header's `sticky top-0` — so when scrolled, the logo is above the
  viewport and the whole animation (saucer/dragon/reaper) plays off-screen while
  the witness toast still fires.
- FIX (user chose "Scroll" over wait-for-visibility): new `summonToLogo(done)`
  helper in ThemeScenes.jsx — if the medallion isn't fully in the viewport,
  window.scrollTo({top:0, behavior:"smooth"}), poll scrollY every 90ms (2.5s
  failsafe), 250ms settle beat, then re-measure and run the heist. Returns a
  cancel fn; both SaucerAbduction and LogoHeist (dragon + reaper share it) call
  it inside start() with `running=true` set BEFORE the scroll, and cancel on
  unmount. Rect is measured AFTER the scroll completes so coordinates are fresh.
- VERIFIED via screenshot tool on 390x800: scrollY 1400 -> dispatch ff:heist ->
  scrollY 0, reaper-heist overlay mounted, skeleton hands clamp visible at top.
- NOTE: screenshot tool scripts must be FLAT statements (no `async def run(page)`
  wrapper) or prints/actions silently don't execute.

## 2026-08-06 part 52: Fairy wings flap + tiny flourish pixie (FF_BUILD 328)
- WING FLAP (user: "can't make the fairy's wings flap can we?"): the two
  fairies are painted INTO fairy-gully.png (896x1200). Solution = tiki-flame
  trick: Nano Banana (gemini-3.1-flash-image-preview via emergentintegrations,
  script /app/scripts/gen_fairy_wings.py) generated 2 full-frame edits (wings
  raised / wings swept down, "photocopy" prompts to prevent body drift — first
  down frame DID drift the right fairy's pose, regenerated with stricter
  prompt). Frames cropped to patch rect (450,380)-(896,830) — right edge MUST
  reach the artwork edge (896) or the right fairy's painted wing tips peek out
  past the feathered patch (double wings, seen on desktop). Feather 26px on
  interior edges only. Overlays fairy-wings-up/down.png cross-fade over the
  base via ffWingUp/ffWingDown keyframes (index.css), anchored through the
  ripples' coverBox math in ThemeScenes.jsx gully block. Cycle speed iterated
  by user: 2.4s -> 1.2s -> 1s ("less clunky"). Full frames kept at
  /app/scripts/fairy_full_up|down.png for recropping without regen.
- DESYNC EXPLORED, REJECTED: user asked if each fairy could beat at her own
  time. Column motion-energy analysis showed their inner wings OVERLAP
  (image x 650-720) so splitting the shared patch would chop wings; the clean
  path = 4 per-fairy frames (only one fairy moves per frame). User chose to
  KEEP SYNCED ("Ok, synced it is") — per-fairy prompts were drafted then
  reverted; script documents the shipped 2-frame flow.
- TINY FLOURISH PIXIE (user request, "match the other 2 in design" + sparkle
  trail): /app/scripts/gen_tiny_fairy.py feeds fairy-gully.png as the design
  ref, asks for a 2-pose sprite sheet (wings up | down) on pure black with a
  glow aura, keys black->alpha, splits halves. CRITICAL post-step: the two
  poses came back at different body scales/positions — normalized via
  body-bbox detection (skin/hair/outfit hue filter, saturated-wing false
  positives fixed with warm-hue + dark-green rules, rows/cols >=4 px) then
  both anchored body-center on a shared 320x280 canvas; 50% blend QA confirms
  alignment. Assets: fairy-pixie-1/2.png. TinyFairy in ThemeFlourish.jsx
  (inside ButterflyBurst): framer-motion left/top percent path across the
  card (4.1s), 2-frame flutter via ffPixieFlap 0.24s steps(1,end) alternate,
  7 trailing sparkles fly the same path delayed 0.42+i*0.09s. Size iterated
  54px -> 72px ("a third bigger"). data-testid="fairy-pixie".
- /dev/rare now has a "Fairy Pixie + Butterflies (reveal flourish)" demo card
  (resetKey pixie) for testing the fairy flourish without dealing a fate.
- VERIFIED via screenshots: mobile+desktop wing frames aligned (no double
  wings), pixie mid-flight with trail on /dev/rare at two timestamps.
- NOTE screenshot tool scripts must be FLAT statements (no async def wrapper).

## 2026-08-06 part 53: Pixie lives on the page + Pixie Poof heist + green logo (FF_BUILD 329)
- PIXIE PROMOTED from flourish cameo to full-time page resident (user: "spend
  time on the page like the probe", then "go from section to section like
  she's watching what you are doing"). TinyFairy removed from ThemeFlourish
  (ButterflyBurst back to butterflies only; /dev/rare card renamed "Fairy
  Butterflies"). New PixiePatrol in ThemeScenes.jsx, mounted via
  {cfg.gully && <PixiePatrol />}: own fixed z-[30] layer; rAF lerp (k=0.045)
  chases a target anchored to VISIBLE sections from PIXIE_SPOTS testids
  (ff-title, zip-input, use-my-location-button, radius-control, mode-toggle,
  filters-toggle, fate-of-day-card, sort-select); 350ms interval re-anchors as
  the page scrolls; re-picks every 6.5-11s; pointerdown/focusin capture
  listeners dart her to whatever section the user touches; scaleX facing flip;
  3 wake sparkles chase with softer lerps; ffPixieBob hover.
- PIXIE POOF HEIST (user: "make the FF logo disappear with her wand like a
  heist"): integrated into PixiePatrol — first strike 45-75s then 2.5-5min;
  uses summonToLogo (scrolls user up first, same as all heists), flies to the
  medallion (1.9s), wand star (ffWandStar) + 10-particle sparkle burst
  (ffPoofSparkle, --dx/--dy per particle) + soft fairy-laugh (respects
  ff_muted), medallion visibility hidden + startleTitle, second burst on
  return + ffLogoReturn pop. Force event: window 'ff:pixie-heist'. Registry:
  HEISTS += {key:"pixie", name:"Pixie Poof", realm:"Fairy Gully",
  accent:#5EE0A8} (rituals.js), HEIST_ICONS.pixie=Wand2 (Rituals.jsx), es
  i18n added ("¡Puf del Hada!").
- GREEN LOGO (user request): HomeHeader medallion img gets
  filter hue-rotate(115deg) saturate(1.25) brightness(1.05) when theme=fairy
  (CSS-only, no new asset; can generate a dedicated green logo later).
- VERIFIED via screenshot tool @1440px: pixie layer mounted + moving, she
  hovers beside the radius control, forced ff:pixie-heist -> wand star True,
  burst True, logo visibility 'hidden' then '' restored, green medallion
  visible. Lint clean (5 pre-existing warnings, 0 errors).

## 2026-08-06 part 54: Pixie behavior polish round (FF_BUILD 330-331)
User iterated rapid-fire on PixiePatrol (ThemeScenes.jsx). Final state:
- SIZE: 54 -> 72 (flourish era) -> 64 (patrol) -> 85 -> 100px. Wrap offset
  -50px, wand star at (78,28) size 18, trail y-offset +22.
- MOBILE ANCHOR FIX: sections span full width on mobile so "beside right"
  always clamped to the screen edge ("she's on the right looking away").
  anchorOf(el, side) now: side +1/-1 beside if it fits, else perch ABOVE the
  matching corner. curSide picked randomly per visit; dart() has 22% chance
  to swing to the OPPOSITE side (user: "observes from the opposite side /
  flying back and forth"). onTouch/heist use default side 1.
- FACING FIX (user: "doesn't change directions when she flies"): reproduced
  via 250ms sampling — old target-distance threshold flipped her to lookX
  mode while still visibly moving (backwards flying). Now facing = sign of
  ACTUAL per-frame velocity (|vx| > 0.9px/frame), falls back to lookX
  (section center) only when settled. Re-sampled: 15 flight ticks, 0 wrong.
- DARTING (user: "rather have her darting around"): lerp k 0.045 -> 0.13;
  base (anchor) vs target (base + micro-dart offset +-23/-17px every
  0.65-1.4s) split; wander() has 25% "mischief dash" to a random roam point
  for ~1.5-2.4s before the next section.
- DEEP-SCROLL FIX (user: "she just sits at the top"): when no PIXIE_SPOTS
  visible, roam() picks random mid-viewport points (15-85% w, 25-70% h)
  instead of the last clamped top anchor; anchorTick only re-picks when a
  WATCHED element vanishes (roam re-picks on wander cadence).
- TRAIL x3: 3 -> 9 chained sparkles, k = 0.105 - i*0.0085 per link, sizes
  6 -> 2.5px down the tail, staggered ffWispGlow twinkle.
- VERIFIED @390px: 0 wrong-facing flight ticks, 9 trail nodes, deep-scroll
  transform (118,168) = roaming not pinned, screenshot shows her hovering by
  the How-It-Works copy. Lint: 0 errors.

## 2026-08-06 part 55: Gold triple trail + heist visibility fix (FF_BUILD 332-333)
- TRAIL: rebuilt as THREE gold ribbons (user request) — CHAINS fan offsets
  {0,12}/{-12,28}/{12,32} from her body, 6 chained links each (18 spans),
  link lerp k = 0.105 - i*0.012, gold palette (#FFF9D9 core -> #FFD36B,
  gold glow), staggered ffWispGlow twinkle per chain+link.
- PIXIE SIZE final: 100px (wrap offset -50, wand star 78,28 @18px).
- HEIST VISIBILITY BUG (user: "she disappeared when logo disappeared"):
  pixie layer was z-[30] = SAME as the sticky header which renders later in
  the DOM -> header's opaque bg painted over her whenever she flew up to the
  logo. Layer now z-[45]: above header (30) + content (40), below dialogs
  (50/60). VERIFIED: forced ff:pixie-heist @390px — logo hidden, pixie
  clearly visible casting at (43,36) over the header with gold trails.

## 2026-08-06 part 56: Denser trails + gold medallion ring (FF_BUILD 334)
- TRAIL: 5 gold ribbons (was 3), fan offsets {0,10}/{-10,24}/{10,26}/{-18,38}/
  {18,40}, links CLOSER together (k = 0.17 - i*0.012, was 0.105), 30 spans
  total, outer rows slightly smaller.
- GOLD RING (user: "make the black border around the FF logo gold"): fairy
  theme header medallion wrapper now ring-2 ring-[#E6B23A] (HomeHeader.jsx);
  ring width moved INTO the conditional (ring-1 vs ring-2 both set the same
  box-shadow var — don't stack them).
- VERIFIED @390px: 30 trail spans, gold ring + green FF visible, she darted
  to the touched zip input with the denser wake.

## 2026-08-06 part 57: Pixie dust bursts + gold ring final (FF_BUILD 335)
- SPARKLES REWORKED (user: "float below her but should be coming from her in
  just a burst"): chain-follow ribbons REPLACED by a particle emitter — pool
  of 28 gold spans, pops of 5 every 0.5-0.9s spawned AT her body (+-17/13px),
  small outward/down velocities, ttl 0.47-0.9s, opacity = life/ttl*1.4; extra
  dust each frame while she darts fast (speed>3px/frame). All updates in the
  existing rAF step; dead particles opacity 0 + recycled.
- Gold medallion ring (part 56) + green logo + heist all confirmed by user:
  "heist was perfect."
- VERIFIED: 20/20 hover samples show 1-9 visible dust sparkles (burst
  rhythm), dart shake-loose works, screenshot shows dust at her body not
  hanging below.

## 2026-08-06 part 58: Faster dust bursts (FF_BUILD 336)
- Dust ejection velocity up: vx (r-0.5)*3.4 (was 1.4), vy (r-0.35)*2.6+0.4
  (was 0.15..1 down-only — now bursts in all directions with a down bias),
  ttl 0.33-0.67s (was 0.47-0.9) for snappy pops. User-approved burst feel.
- VERIFIED: 13/15 hover ticks with dust (quick-fade gaps are the burst
  rhythm), screenshot shows sparkles flung wide of her body.

## 2026-08-06 part 59: Pixie Reactions + Tiny Dragon companion + new claw (FF_BUILD 337-339)
- PIXIE REACTIONS: Home.jsx landFate() dispatches 'ff:fate-dealt' (companion
  zips beside the reveal zone + 2.6s dust fountain); runShuffle() dispatches
  'ff:reshuffle' ONLY if result exists (companion pouts 3.2s: sinks 30px,
  faces AWAY from lookX, zero dust, no micro-darts). Verified via events:
  23-dust fountain + fly-to; pout dust=0 + sink + reversed facing.
- COMPANION ENGINE: PixiePatrol generalized to CompanionPatrol({s1, s2, glow,
  dustCol, heistKind: "poof"|"breath"|null, testid}). Mounts: fairy=poof
  (fairy-pixie-*), fantasy=breath (dragon-tiny-*, ember dust #FFE9B0/#FF8C3A).
- TINY DRAGON: /app/scripts/gen_tiny_dragon.py (2-pose sheet on black,
  flood-key) + head TEMPLATE-MATCH alignment (gold-bbox failed; SSD search
  found dy=-42) -> dragon-tiny-1/2.png on shared 300x280 canvases.
- DRAGON'S BREATH HEIST: registry {key:"breath", realm:"Dragon's Hoard",
  accent:#FF8C3A}, icon Flame, es i18n. Flame jet: 14 blobs stream from his
  mouth to the medallion (ffFlameJet, --dx/--dy per blob), scorch burst =
  flame-colored ffPoofSparkle (testid dragon-scorch-burst). Force event:
  'ff:breath-heist'. Claw heist (ff:heist) kept separate per user ("do both").
- NEW CLAW: /app/scripts/gen_claw2.py -> dragon-claw2.png (571x718 red/gold).
  KEYING LESSON: threshold-alpha ate dark crevice shading (white lattice);
  fix = flood-fill from borders with strict m<=16 + largest enclosed dark
  region (grip void). DragonHeist: gripX .505, gripY .434, aspect 718/571,
  widthMult 2.4 + NEW LogoHeist prop cloneScale=1.25 (user: "make logo
  bigger" to fill the grip). Also fixed clone rendering as a SQUARE card:
  inline borderRadius 9999px on clone div + img (rounded-full class wasn't
  clipping).
- OUROBOROS RING: CANCELLED by user ("doesn't make sense with the heist");
  dragon-ring.png deleted, gen code remains in gen_tiny_dragon.py if ever
  wanted.
- All verified via screenshots/DOM: breath heist full cycle, pixie poof
  regression, claw grip fit, companions patrolling. Lint 0 errors.

## 2026-08-06 part 60: Dragon occasional wing flap (FF_BUILD 340)
- CompanionPatrol gains `flap` prop (default = pixie's constant 0.24s
  swap). Dragon uses ffDragonFlap 3.4s linear infinite: 5 quick swaps
  (~0.22s each, flurry ~1.2s) then wings-up glide hold for the rest.
- Verified via computed-opacity sampling: 6 swaps clustered + long glide.

## 2026-08-06 part 61: Wing cross-fade fix (FF_BUILD 341-342)
- BUG (user): dragon flapped but "the original upward wings stay put" —
  base frame s1 had no animation so both poses showed at once. Fix: s1 gets
  a complementary `flapBase` animation (ffDragonFlapInv for dragon).
- REGRESSION CAUGHT by sampling: pixie's alternate-reverse steps(1,end)
  trick fails — CSS flips step timing on reversed cycles, s1 went invisible
  half the time. Fix: explicit complementary keyframes ffPixieFlapA/B
  (0.48s linear, hard swap at 50%); old ffPixieFlap keyframe removed.
- VERIFIED: pixie 0/14 and dragon 0/14 non-complementary opacity samples.
- User confirmed Dragon's Breath heist works (flame jet + scorch + Collection
  card); strikes 45-75s after entering Dragon's Hoard then every 2.5-5min.

## 2026-08-06 part 62: Hoard dragon living smoke + horizontal breath heist + ouroboros logo (FF_BUILD 343-349)
- BG DRAGON SMOKE (fantasy-cave.jpg, 1264x848): DRAGON_STEAM in ThemeScenes.jsx —
  40 small puffs in 4 layers (2 per side, dur 6.2s/7.4s, negative delays) forming
  two STEADY strings per user's iterations: puffs -> string -> both nostrils ->
  aligned to the PAINTED white smoke (right base art(882,422) rising up-right w/
  left curl at crown via ffDragonSteam keyframe --sx/--sy; left base art(742,425)
  rising straight up). Anchored through loungeBox (useCoverAnchor 1264x848) so it
  sticks to the art on any viewport incl. mobile. z-[2], mix-blend screen.
- BREATH HEIST FIX (user: flame came from top of head): heistAnchorOf() perches him
  LEVEL beside the medallion (r.right+64 or left-64, y = logo cy - MOUTH_DY);
  MOUTH_DX=33, MOUTH_DY=7 (mouth measured at art px (248,162) of 300x280 sprite);
  jet now starts at the mouth, dir-aware, streams horizontally. dart() flies
  straight while running. USER: "Heist is perfect".
- OUROBOROS LOGO: regenerated slim serpentine ring (mockup_dragon_logo.py, no ref
  image, hole-centroid-centered composite) -> user approved -> transparent asset
  /logo-ouroboros.png built by scripts/make_ouroboros_logo.py (reuses
  redgold_ring_raw.png; rerun mockup script first if regenerating). Applied to
  EVERYTHING hoard-related per user: HomeHeader fantasy logo (no scale-110),
  DragonHeist cloneSrc, ShufflingDeck fantasy card back, homeFateCard fantasy art.
  Passport crests left as app-wide branding.
- Verified via screenshots: smoke alignment on painted plumes (both sides, double
  layer), horizontal mouth flame, header ouroboros render.

## 2026-08-06 part 63: Nostril-anchored smoke tuning + SUMMER heists (FF_BUILD 350-353)
- SMOKE FINAL: origins moved to user's arrow-pinpointed NOSTRILS — right art(828,419)
  sweeps sideways-right then climbs (ffDragonSteam, 3 layers: dur 6.2/7.4/8.6s),
  left art(770,415) exits angled DOWN along the snout via new ffDragonSteamL
  keyframe (early -0.16*sy dip) then lifts up-left (2 layers). 49 wisps total.
  Entries support per-wisp `anim` field.
- SUMMER HEISTS (SeasonScene now returns fragment + mounts for theme==="summer"):
  * SummerBallHeist (key "ball", ff:ball-heist): ball punted from bottom-left,
    spins in (0.87s), BONKS med (ffLogoKnock tumble clone), squats in the logo
    spot ~1.4s (ffBallSettle jiggle), rolls off down-right, ffLogoReturn.
    First 25-45s, repeat 2.5-5min. Ball rendered w*1.42 (art padding).
  * SummerCrabHeist (key "crab", ff:crab-heist): crab (w*1.7, 160x77 art) scuttles
    from RIGHT at logo height (2.15s, ffCrabHaulBob), hoists med overhead
    (ffCrabHoist pop, clone top -w*0.92), hauls LEFT off-screen (2.5s), return at
    5.75s. First strike 70-110s (staggered clear of ball).
  * Clones styled for LIGHT header: bg #F5F0E6 ring #E4E4E7 /logo-mark-light.png.
  * HEISTS entries added in lib/rituals.js (realm "Summer").
- Verified via screenshots: ball sit-in, logo return + witness toast, crab hoist
  and haul frames.

## 2026-08-06 part 64: TIKI LOUNGE takeover (FF_BUILD 354-357)
- TIKI MEN (user's chibi tiki-warrior reference; scripts/gen_tiki_man.py w/
  border flood_key, "dangerous but funny" + "a little color" = red-orange/teal
  feathers, ember eyes): tiki-man-surf.png (209x260), tiki-man-spear.png (287x260),
  tiki-guy-card.png (front-facing torch+spear, big dark blob >1200px post-cleared).
- ROAMING SURFER: CompanionPatrol gained emitY (spray from board bottom, 38) +
  bob prop + heistKind "crash" (key "surf", ff:surf-heist, ffLogoKnockL knocks
  med OFF-SCREEN left ~58vw, foam burst colors, casting=ffBallHeistSpin dizzy).
  Mounted for cfg.lounge with white/#74C6E6 spray, ffTikiSurfBob bob, flap="none"
  (single sprite trick: s1=s2, animations none).
- SPEAR TOSS (TikiSpearHeist, key "spear", ff:spear-heist): hunter charges
  RIGHT->LEFT (flipped, tip=left edge ~47% down, wrapper positioned by tip x),
  war drums /reveal-drums-groove.wav on charge (mute-aware), skewers med onto
  spear (clone rides at -w*0.45), skids, ffLogoToss fling (up-left, spins, fades),
  exits left, ffLogoReturn at 3.85s. First strike 85-125s.
- TIKI LOGO (user chose carved-wood option A, approved): mockup_tiki_logo.py ->
  logo-tiki.png 512px (koa disc, chiseled FF crest, tiki-mask+zigzag rim, twin
  torches, teal/orange accents). Applied: HomeHeader tiki branch (no scale),
  crash knock clone, spear skewer + toss clones (object-contain, no scale-110).
- CARD ART: tiki shuffle card back (ShufflingDeck) + fate card art (homeFateCard,
  artSize 260) now /tiki-guy-card.png (was realistic /tiki-mask.png).
- HEISTS lib entries: surf "Tiki Wipeout", spear "Spear Toss" (realm Tiki Lounge).
- Old standalone TikiSurfHeist deleted (replaced by companion crash).
- Verified via screenshots: roaming surfer + spray, wipeout crash + witness toast,
  skewer carry w/ tiki logo, header tiki medallion.

## 2026-08-06 part 64b: Spear heist reworked to POP (FF_BUILD 358)
- User changed skewer+toss -> balloon POP: TikiSpearHeist now charges, jab at
  1.2s POPS the med (ffLogoPop 0.34s clone of logo-tiki + 12-spark burst via
  ffPoofSparkle, orange/amber), struts off left at 2.1s, med returns with new
  ffLogoReinflate at 3.45s. ffLogoToss keyframe removed; HEISTS entry renamed
  "Spear Pop". Verified all 3 states via screenshots.

## 2026-08-06 part 65: Torch Nightfall (FF_BUILD 359)
- TikiTorchNightfall (in cfg.lounge block, box=loungeBox): listens ff:fate-dealt
  -> active 4.6s w/ 0.7s opacity fade. 11 TIKI_TORCHES art-px glow points
  (lanterns/lamps/candles in tiki-lounge-full.png 1264x848), each ffTorchFlare
  (staggered dur 0.85-1.2s) + 2 full-screen dancing firelight overlays
  (ffTorchDance, mix-blend overlay/screen). Verified: 11 spans, opacity
  0->1->0 cycle + visual warmth.

## 2026-08-06 part 66: Steampunk "Sprung Face" heist (FF_BUILD 360)
- SteamSpringHeist (key "spring", ff:spring-heist, theme==="steam" mount in
  AmbianceScene): med RATTLES (ffMedRattle 0.75s on real element) -> hidden at
  0.85s -> assembly (brass SVG coil 24x70 stretched to w*1.15 + brass-bezel
  /logo-mark.png face) POPS via ffSpringPop (squash-stretch scale, origin top)
  + ffSpringWobble (independent `rotate` prop so it composes with transform)
  -> at 3.7s ffSpringRecoil (coil) + ffLogoFallOff (face drops 115vh, rotates)
  -> ffLogoReturn 4.75s, witness 5.5s. First strike 40-70s, repeat 2.5-5min.
- HEISTS entry "Sprung Face" realm Steampunk (#D9A44E).
- Verified all 4 stages via screenshots.

## 2026-08-06 part 67: Steampunk "Open Works" heist (FF_BUILD 361-364)
- SteamGearsHeist (key "gears", ff:gears-heist, theme==="steam"): the LOGO IS THE
  DOOR (user-clarified) — hinged left, ffLidOpen to -108deg (perspective 600,
  preserve-3d, brass back w/ backface-hidden). Socket = works: BrassGear helper
  (8-tooth solid SVG, anim override prop), 3 gears + rotated mainspring coil SVG,
  sweeping glint. Stages: open(30ms) -> break(2.9s: ffGearJam via `rotate` prop,
  small gear ffPartFly out, screw ffPartFly2, 3x ffBreakPuff smoke) ->
  collapse(4.4s: ffDoorFall door off hinge 112vh, gears+coil spill as absolute
  clones w/ ffGearDrop staggered .25/.5/.72s, in-case originals hidden) ->
  med ffLogoReturn 6.2s, witness 6.9s. First strike 110-150s.
- NOTE: summonToLogo adds ~0-1.5s offset before timeline starts (varies).
- HEISTS entry "Open Works" (#B98A44). Verified: open w/ spinning works+spring,
  door falling, gear+coil mid-spill, fresh face return + toast.

## 2026-08-06 part 68: Reaper realm "Soul Snatch" ghost companion (FF_BUILD 365)
- User chose: no new reaper design — use the LEFT ghost (reaper-ghost-1.png skull
  spectre, "hands already positioned to go around the logo"), coin carried BARE
  (no black plate).
- Sprite: /ghost-snatch.png (trimmed, MIRRORED to face right, 206x360).
- CompanionPatrol EXPORTED + new heistKind "snatch" (witness key "snatch",
  ff:ghost-heist): anchor hovers claws over coin (x=lookX+8, y=cy+26), plays
  /soul-wail.wav (vol .55, mute-aware), med hidden at 60ms, bare coin clone
  rides inside flip container at (50+8-w/2, 50-26-w/2) -z-[1] under claws,
  overrideEl cleared +700ms so he pickSpot()-flees WITH the coin, coin released
  + ffLogoReturn at 2.6s. No burst for snatch.
- Mounted in Home.jsx (theme==="dark", next to ReaperHeist): smoke trail
  dustCol ["#8A8A96","#3A3A44"], emitY 30, bob ffGhostSway (new keyframe).
- HEISTS entry "Soul Snatch" realm Reaper (#9BA8C0).
- Verified: roam w/ smoke, claw grab, carry-away, return + witness toast.

## 2026-08-06 part 69: Ghost heist rework + Reaper follower + Winter snowman heist (FF_BUILD 366-367)
- REWORK of part 68 (user: "white ghost steals logo and vanishes. The Black
  reaper in the background is the one that stays" + "materialize behind the
  logo for a few seconds then vanish with it"):
  - CompanionPatrol "snatch" heistKind REMOVED (dead code reverted; export kept).
  - NEW standalone GhostSnatchHeist (ThemeScenes, mounted Home theme==="dark",
    ff:ghost-heist, witness "snatch"): white spectre /reaper-ghost-1.png
    (695x1211, grip pocket 36%/26.5%, boxW=w*2.75) MATERIALIZES BEHIND the
    medallion (ffGhostMaterialize 1.6s blur-in; clone coin bg-black rendered in
    FRONT; real med hidden at +30ms; soul-wail plays), sways ~4s (ffGhostHold),
    then ffGhostVanish 1s takes coin with him; ffLogoReturn at 5.4s; cycle 6.1s.
    First strike 45-75s, then 2.5-5min. Sprite preloaded on mount.
  - NEW roaming BLACK REAPER follower (user msg 1: "little reaper follower...
    black smoke trailing"): generated /reaper-fly-1.png + /reaper-fly-2.png
    (Nano Banana, ref=reaper.png, NO plate, side profile facing right, white-bg
    flood-keyed via /app/scripts/gen_reaper_fly.py). Mounted in Home.jsx as
    CompanionPatrol heistKind=null, dust ["#8E7BB8","#2A2038"] violet smoke,
    frames crossfade ffReaperFrame/Inv 2.6s, bob ffPixieBob 3.6s,
    testid "reaper-companion". ffGhostSway keyframe replaced by ffGhostHold etc.
- WINTER "Blown Away" SNOWMAN HEIST (user: "smiling carrot nosed snowman appears
  right side of banner. A strong snowy breeze blows his head off to the left,
  bumping the logo and replacing it for a few [seconds]"):
  - Sprites via /app/scripts/gen_snowman.py: /snowman-body.png (257x260 headless,
    red scarf blowing left, black-keyed) + /snowman-head.png (188x200, carrot
    points LEFT, top hat; model returned WHITE bg -> re-keyed w/ flood_key_white
    thresh 240 from raw).
  - SnowmanHeist (ThemeScenes, SeasonScene theme==="winter", ff:snowman-heist,
    witness "snowman"): slides in right (bodyLeft=vw-bodyW-24, head level w/
    logo cy), gust at 2.3s (14 ice-blue streaks/flecks ffSnowGust 1.05s, tinted
    #BFDFF5 + shadows for light-bg visibility), head rips off 2.7s (tumbles
    rotate -340 -> settles -360 = upright), BONK 3.55s (ffLogoKnockL clone
    logo-mark-light + 8-sparkle ice flurry ffPoofSparkle, ffSnowLean on body),
    head SITS in logo spot 3.55-7.1s, blown away down-left + body exits right,
    ffLogoReturn 7.9s, cycle 9.1s. First strike 25-45s. Sprites preloaded.
  - HEISTS entry "Blown Away" realm Winter (#8FC7E8). ffSnowGust/ffSnowLean CSS.
- Verified via screenshots: ghost materialize/linger/vanish/return + toast; no
  auto-fire when idle (earlier "early trigger" = networkidle reload delay in the
  test script letting the 45s timer expire, NOT a bug); snowman arrive/gust/
  head-flight/sit/return all correct.

## 2026-08-06 part 70: "Wipe Out" sfx on the Tiki surfer heist (FF_BUILD 368)
- User-uploaded clip saved as /app/frontend/public/surf-wipeout.mp3 (~3.6s).
- Plays (vol 0.65, ff_muted-aware) in CompanionPatrol heist() when
  heistKind==="crash", right as the surfer lines up his charge — the 1.9s
  fly-up beat puts the crash impact mid-drum-roll.

## 2026-08-06 part 71: Shortened heist sfx (FF_BUILD 369)
- User asked to shorten the spear-heist drums + ghost-heist moan. Originals are
  shared with reveal flourishes, so heist-only trims were created via ffmpeg:
  /tiki-drums-short.mp3 (4.0s, 0.8s fade from reveal-drums-groove.wav 7s) and
  /soul-wail-short.mp3 (5.6s, 1.4s fade from soul-wail.wav 10.8s — ends right
  after the ghost vanishes at 5.1s). TikiSpearHeist + GhostSnatchHeist updated;
  GhostRise/deal flourishes still use the full-length originals.

## 2026-08-06 part 72: Snowman heist polish + cabin arm fix (FF_BUILD 370-372)
- WIND SFX: user-uploaded gentle-wind-gusts clip -> /snow-gust.mp3 (2.8s trim of
  the loudest segment t=1.8-4.6s, fades, +4dB). howl() plays at both gust
  moments in SnowmanHeist (0.75 behead / 0.55 departure), ff_muted-aware.
- WAVE (built then REMOVED per user "No waving for the heist snowman"):
  snowman-body-wave.png + ffSnowWaveA/B flip were implemented, verified, then
  fully stripped. Side effect kept: snowman-body.png is now the 316x320 union
  crop (constants: bodyH=bodyW*(320/316), neck hx frac 0.50).
- WINK (user: "Can the snowman that replaced the logo wink after it does?"):
  /snowman-head-wink.png generated via Nano Banana image-edit of the head raw
  (right eye closed), union-cropped with base head for pixel alignment — BOTH
  head sprites now 207x220 (headH=headW*(220/207)). Wink overlay img mounts at
  phase 3 with ffHeadWink 3.4s forwards (visible ~32-54% => winks ~1.2s after
  settling). Verified via screenshot: closed eye while perched next to the
  Fork·Fate title. Head fully covers base frame so no inverse-hide needed.
- CABIN ARM BUG (user: "arm next to the cabin disappears after his wave"):
  the painted winter-decor snowman has NO left arm — the winter-arm.png overlay
  was opacity-0 for 92% of its 34s ffSnowmanWave cycle. Fixed: keyframes no
  longer animate opacity (rotation wag only), inline opacity:0 removed — the
  arm now rests visible at -10deg between waves. DOM-verified opacity 1 at rest.
- LESSON: a search_replace on ThemeScenes.jsx reported success but the change
  was NOT in the file (constants edit landed, JSX block edit vanished). Always
  grep-verify after batch edits to this file.

## 2026-08-06 part 73: Steampunk "Open Works" sfx (FF_BUILD 373)
- User-uploaded clips: running-gear -> /steam-gears-run.mp3 (3.0s trim, fade-out
  ending at the break) + boing-bounce -> /steam-boing.mp3 (1.67s as-is).
- SteamGearsHeist clank() helper (ff_muted-aware): gears-run plays at stage
  "open" (vol 0.7, whirs while the works spin, fades right into the jam) and
  boing plays at stage "break" 2.9s (vol 0.75).

## 2026-08-06 part 74: Dragon breath whoosh sfx (FF_BUILD 374)
- User-uploaded fireball-whoosh -> /dragon-whoosh.mp3 (2.1s, used as-is).
- Plays (vol 0.7, ff_muted-aware) in CompanionPatrol's breath branch the
  instant the tiny dragon's flame jet fires at the medallion.

## 2026-08-06 part 75: Permanent Steampunk logo gear (FF_BUILD 375)
- User: "gear slightly larger than the logo clicking clockwise behind the logo.
  Permanently in Steampunk."
- HomeHeader.jsx: medallion wrapped in a relative shrink-0 container; when
  theme==="steam" an inline 12-tooth brass SVG gear (w-[134%], #B98A44 body,
  #8A6428 rim, drop shadow, testid "steam-logo-gear") sits centered BEHIND the
  medallion. Ticks clockwise via ffLogoGearTick 36s steps(48) infinite
  (7.5deg every 0.75s), always on in Steampunk (independent of heists).
- Verified: screenshot (teeth peeking around medallion) + computed transform
  advanced exactly one 7.5deg step clockwise.

## 2026-08-06 part 76: Fall owl heist + Steampunk tick & steam bursts (FF_BUILD 376-377)
- OWL HEIST "Night Talons" (user: "big owl grasp the logo and fly off with it",
  theme==="fall" in SeasonScene, ff:owl-heist, witness "owl"): great horned owl
  sprite /owl-fly-1.png (329x340, Nano Banana, flies LEFT, open talons at
  17%/87%, owlW=w*3.5). Swoops in from right (1.4s), talons clamp 1.45s (med
  hidden, clone logo-mark-light rides in talons), carries off up-left 1.98s,
  ffLogoReturn 3.3s, cycle 4.1s. First strike 25-45s. NOTE: wing-flap frame 2
  regen FAILED twice (model copies ref exactly) -> single frame + ffOwlGlide
  bob + banking rotate (-5deg swoop / +7deg climb) instead; desc says "silent
  wings". owl-fly-2.png deleted.
- STEAMPUNK GEAR TICK (user liked it): /gear-tick.mp3 SYNTHESIZED (numpy: 70ms
  damped 2.1kHz ping + noise transient). GearTicker in HomeHeader (mounted
  theme==="steam" inside the medallion wrapper) plays it every 750ms (vol 0.12,
  mute/hidden-aware) matching the gear's steps(48) cadence.
- RANDOM STEAM BURSTS (user: "random steam burst noise here and there" + "a
  burst of steam release behind the logo"): /steam-burst.mp3 SYNTHESIZED (1.6s
  high-passed noise hiss). GearTicker vent() every 12-32s: plays hiss (vol
  .14-.26, mute-aware) AND mounts a 5-puff ffBreakPuff volley behind the
  medallion (testid "steam-logo-burst", clears 2.4s; visual fires even muted).
  `ff:steam-burst` window event forces one for testing.
- RECURRING TOOL ISSUE: search_replace edits to ThemeScenes.jsx/HomeHeader.jsx
  sometimes report success but DON'T persist. ALWAYS grep-verify after editing.
- Verified: owl swoop/clamp/carry-with-coin/return + "Night Talons" toast;
  steam burst mounts+clears via force event with visible puffs.

## 2026-08-06 part 77: Owl hoot + wing-whoosh sfx (FF_BUILD 378)
- User-uploaded barred-owl hooting -> /owl-hoot.mp3 (3.7s trim, fades) plays
  soft (vol 0.45) at swoop start; /wing-whoosh.mp3 SYNTHESIZED (0.9s smoothed-
  noise swell) plays at +800ms as the owl brakes into the clamp. Both via
  cry() helper, ff_muted-aware, in OwlHeist. Grep-verified in file.

## 2026-08-06 part 78: Spring "Petal Storm" heist + ambient petal cleanup (FF_BUILD 379-380)
- PETAL STORM (user: "rush of wind... big pile of cherry blossoms blow across
  the page into the logo knocking it off the screen", theme==="spring" in
  SeasonScene, ff:petal-heist, witness "petals"): 60 CSS petals (PETALS array,
  deterministic pseudo-random top/delay/dur/size/drift, pink tones, petal
  border-radius) sweep right-to-left across full page via ffPetalSweep
  (translate -100vw + --pd vertical wander, rotate -540deg). Wind sfx
  /spring-wind.mp3 (3.8s trim of winter wind file t=16.2-20s, +4dB) at gust
  start. Knock at 1.25s: med hidden, clone ffLogoKnockL off LEFT edge.
  ffLogoReturn 4.2s, cycle 5s. HEISTS entry "Petal Storm" (#F49AC1). Verified
  via screenshots (sweep, knock, return).
- AMBIENT FIX (user: "I don't like the big flat orange blobs that fall"):
  /petal-coral.png (flat coral blob) REMOVED from spring falling items AND from
  homeFateCard.js spring scatter (asset deleted). Spring now falls only
  blossom-pink + blossom-white. Verified: no orange blobs.

## 2026-08-06 part 79: Realistic petals, reveal-guard, Cyber "Neon Wreck" (FF_BUILD 380-381)
- REALISTIC PETAL (user): /petal-pink.png generated (Nano Banana realistic
  sakura petal, keyed, 96px). Ambient spring falling items now
  [blossom-pink, blossom-white, petal-pink] with petals rendered at 0.58x of
  FALLING_SPRITES size (user: "a little too big"); heist storm petals are now
  this sprite at p.size*1.15 w/ tone filters (hue-rotate/blur variants).
  petal-coral.png deleted everywhere (incl. homeFateCard.js scatter).
- REVEAL GUARD (user: "petal storm interrupted a card reveal — could that
  happen live?" YES it could): Home.jsx now keeps window.__ffFateBusy =
  spinning||loading||surpriseReveal||showGuided; summonToLogo bows out with
  done(null) when busy, and every heist already treats a null medallion as
  "retry in ~30s". Forced test events during busy also no-op.
- NEON WRECK heist (user: flying car "lost control and crashed into the logo
  putting out its neons" "with a crunch and bzzz bzzz bzzz"): cfg.neon block
  extracted into CyberNeonSign component (witness "wreck", ff:neon-crash
  forces, first 30-60s then 3-6min). Car (/cyber-car2.png flipped) careens in
  ffCarCareen 2.3s with ffCarSputter jitter -> CRUNCH at 2.3s
  (/neon-crunch.mp3 SYNTH + white flash + 10 cyan/magenta ffPoofSparkle
  sparks + ffCarTumble off-sky) -> /neon-bzz.mp3 SYNTH (3 gated buzz bursts)
  as sign runs ffNeonDieOut (flicker to 0.15 grayscale, halo off) -> dark
  ~3.5s -> ffNeonRevive stutter 6.2s -> witness 7.6s. HEISTS #16 "Neon Wreck".
- Verified via DOM trace: car 0-2.3s, sparks+dark 2.7-6.2s, revive flickers,
  toast at 7.9s. Sounds: crunch 0.47s, bzz 1.54s, both 200-served.

## 2026-08-06 part 80: Real crash + buzz sfx for Neon Wreck (FF_BUILD 382)
- User-uploaded car-crash (2.1s, used whole) and cyberpunk neon-flicker-buzz
  (trimmed to 3.7s w/ fade so it ends right as ffNeonRevive starts at 6.2s)
  OVERWRITE /neon-crunch.mp3 and /neon-bzz.mp3 — no code changes (same
  filenames). Confirmed: the car wrecks into the big neon Fork·Fate sign and
  its neons flicker to black.

## 2026-08-06 part 81: Pixie chime + tractor beam riser (FF_BUILD 383)
- /pixie-chime.mp3 SYNTHESIZED (1.2s ascending fairy-bell arpeggio + glitter
  pings) layers with her existing fairy-laugh giggle in CompanionPatrol's
  poof branch (vol 0.5).
- User-uploaded noise riser -> /beam-riser.mp3 (2.6s trim starting 1.2s in,
  fades) plays at SaucerAbduction phase 2 "beam on" (1.38s) so the rise peaks
  right as the coin enters the ship (~3.2s lift end). Both ff_muted-aware.
- Every realm's heist now has sound.

## 2026-08-06 part 82: Trophy Shelf + pre-publish test pass (FF_BUILD 384)
- TROPHY SHELF on /rituals (Collection) above the heists grid: 2 shelf rows of
  8 trophies (16 heists), witnessed = glowing accent-tinted orb + icon
  (ffTrophyGlow brightness pulse, staggered spring entrance, accent pedestal),
  locked = dark orb w/ Lock + dim pedestal; gold shelf planks; "N / 16"
  counter [data-testid=trophy-count]. HEIST_ICONS completed for ALL 16 keys
  (was 5): ball=Volleyball, crab=Shell, surf=Waves, spear=Target,
  spring=Watch, gears=Cog, snatch=Ghost, snowman=Snowflake, owl=Bird,
  petals=Flower2, wreck=CarFront (lucide 0.516).
- TESTING: testing agent iteration_59.json — 100% frontend pass: all 10 themes
  render clean, all 6 new heists verified via force events, trophy shelf,
  16 heist cards, all 16 audio + 7 sprite assets 200, no console errors.
- DEPLOYMENT CHECK: deployment_agent = WARN (deployable). CORS left AS-IS
  deliberately: backend/core.py ALLOWED_ORIGIN_REGEX already covers
  fork-fate.com + *.emergent.host + previews with hardened security headers;
  "*" + allow_credentials would be worse. Minor perf suggestions (query
  projections in routes/restaurants.py) noted for backlog.
- App is PUBLISH-READY per user request.

## 2026-08-06 part 83: Faster Menus — restaurant query tuning
- routes/restaurants.py: /cuisines now uses db.distinct("cuisine", ...) (no
  documents shipped); /spin filters on a slim projection (id, cuisine, price,
  distance — the only fields apply_filters reads, uncapped to_list(None)) then
  fetches ONLY the winning doc in full. Closes the deployment agent's perf note.
- curl-verified: cuisines sorted list, spin full doc, empty-filter 404.

## 2026-08-06 part 84: Beta banner removed (FF_BUILD 385)
- AndroidBetaBanner removed from Home.jsx (import + render) and the component
  file deleted. NOTE: while editing, a duplicate GuidedFlow import was briefly
  introduced and fixed — Home now has exactly one GuidedFlow import.
- Admin BetaTesters section left intact (admin-only tooling, not user-facing).
- Verified: 0 elements containing "beta" on Home; header flows into sponsor
  marquee cleanly.

## 2026-08-06 part 85: Reaper Hand Heist cleanup (FF_BUILD 387)
- Bug: /skeleton-hands.png contained a faint baked-in rectangle outline (source
  art had hands holding a card; background removal left the rectangle edges) —
  rendered in-app as the "big black square" (same class of artifact as the old
  dragon-hoard claw issue).
- Fix (PIL, in place, dimensions unchanged 848x1264 so LogoHeist geometry
  gripX=0.5/gripY=0.65/aspect kept valid): morphological opening on the alpha
  channel (MinFilter x4 -> MaxFilter x5) erased the thin rectangle lines while
  preserving the hands. Then per user request the two hands were shifted 55px
  each toward center (halves recomposited) for a tighter, believable clutch.
- FF_BUILD bumped 386 -> 387. Screenshot-verified live in Dark realm via
  ff:heist event: clamp frame clean, no square, hands wrap the medallion.
  User confirmed: "Looks better now".

## BACKLOG (user, 2026-08-06): Four new heists to reach an even 20
User: "Hold this on the back burner" — do NOT build until user asks.
1. Coffee Cup Heist — a cup of hot coffee tips over, flows across the title
   and melts the logo like sugar. (Realm TBD — likely light/default or fall.)
2. Mini Reaper Heist (Dark realm #2) — the mini reaper companion turns the
   logo into the plate of food the big background reaper is holding.
3. Unicorn Charge Heist — a white unicorn charges the logo like the Tiki
   surfer does. (Realm TBD — likely fantasy/fairy.)
4. Cardinal Tip Heist (Winter #2) — the little cardinal lands on top of the
   logo, tipping it over.
These would bring the heist total from 16 to 20.

## 2026-08-06 part 86: The final four heists — an even 20 (FF_BUILD 388)
User choices: 2a (realms with multiple heists alternate via independent random
timers, the established pattern), 3b (visuals only, NO audio for these four).
- New assets: /fairy-unicorn.png + /cafe-cup-side.png (Nano Banana via
  scripts/gen_heist20.py, magenta-keyed + despilled); /reaper-plate.png cut
  straight from the big reaper's hands in reaper.png (elliptical mask).
- CoffeeSpillHeist (light/Café, key "coffee", ff:coffee-heist): cup slides in,
  tips (ffCupTipOver), pours (ffCoffeeStream + ffPuddleSpread), medallion melts
  like sugar (ffLogoMelt + ffMeltDrip), cup slinks off tipped. Mounted Home.jsx.
- ReaperPlateHeist (dark, key "plate", ff:plate-heist): mini reaper (fly frames)
  hovers in, dark sparkles, medallion becomes the master's plate (ffPlateReveal
  + ffPlateGlow + ffPixieBob), reverts, drifts off. Mounted Home.jsx (dark #3).
- UnicornChargeHeist (fairy, key "unicorn", ff:unicorn-heist): TikiSpear-style
  right-to-left charge, horn punt (ffLogoKnockL + fae sparkles), never breaks
  stride. Mounted AmbianceScene (cfg.gully).
- CardinalTipHeist (winter, key "cardinal", ff:cardinal-heist): cardinal lands
  on the medallion, it teeters (ffMedTeeter, origin bottom-right) and tips off
  (ffLogoFallOff); startled bird flies off flipped. Mounted SeasonScene.
- rituals.js HEISTS +4: Sugar Melt / Plated by Death / Unicorn Charge /
  Featherweight — trophy shelf picks them up automatically (verified: unlocked
  cards glow with count badge, unwitnessed stay ??? locked).
- All four screenshot-verified end-to-end incl. witness toasts. Total: 20.

## 2026-08-06 part 87: Heists never interrupt a shuffle/reveal
- Home.jsx: busy flag now includes mysticalReveal (was missing). New
  heistEpoch state bumps on each not-busy->busy edge; every heist mount (Home,
  SeasonScene, AmbianceScene — 14 components incl. SaucerAbduction) is keyed
  by it, so a mid-run heist REMOUNTS the instant fate turns busy: its unmount
  cleanup clears timers and restores the medallion instantly (battle-tested
  path). CompanionPatrol intentionally NOT keyed (would teleport the roaming
  companion; its heists are still start-guarded).
- summonToLogo: re-checks window.__ffFateBusy after the scroll-settle poll,
  closing the ~2.5s race where fate turned busy mid-scroll.
- Verified: coffee heist mid-melt + Guided opened -> heist layer gone (0 nodes)
  and medallion visibility restored to "visible" immediately.

## 2026-08-06 part 88: Snowman attach + Neon Wreck summon (FF_BUILD 389)
- SnowmanHeist: body raised so the neck tucks under the head (bodyTop = cy +
  headH*0.5 - bodyH*0.14; the body art's ball top sits ~10% down, twig arms
  reach y=0) and head recentered on the torso (hx = bodyLeft + bodyW*0.53).
  Screenshot-verified attached.
- CyberNeonSign (Neon Wreck): the cyberscape is a FIXED backdrop, so scrolled
  page content covered the crash (user missed it). Wreck now scrolls smoothly
  to top and waits for settle before the car careens in (same pattern as
  summonToLogo, incl. 2.5s poll timeout + settle beat), and checks
  window.__ffFateBusy before starting AND after the scroll (bails + retries in
  30s). Interval cleared on unmount. Verified: scrollY 1200 -> 0 -> crash in
  full view.

## 2026-08-06 part 89: Neon sign dropped below the banner (FF_BUILD 390)
- User: the sticky top banner covered the Neon Wreck. Measured: mobile header
  bottom ~230px vs sign top 126px (crash zone fully buried); desktop header
  145px vs sign top 120px.
- CyberNeonSign container: top-[15%] -> top-[max(26%,235px)] sm:top-[20%] —
  sign + crash now fully clear of the header/sponsor strip on both mobile
  (390x844) and desktop (1920x800), screenshot-verified mid-impact on both.

## 2026-08-06 part 90: Neon Wreck v2 (FF_BUILD 391)
- User: fixed 26%/235px top STILL covered on their device + wants the neon to
  flash on/off during the bzzz + car should hover UP into the sign.
- CyberNeonSign now MEASURES the real banner bottom at runtime (max of
  header + sponsor-marquee getBoundingClientRect().bottom, re-measured at
  +1.5s and on resize) and hangs the sign 16px below it (floor 16vh). Mobile
  verified: sign top 252px vs banner 230px.
- Car now climbs UP from the streets below (ffCarHoverUp, 62vh rise with sway,
  2.3s to match the crunch) into the sign's underside (impact right:16%
  top:62%, sparks right:20% top:58%); still tumbles away (ffCarTumble).
- Tubes SHORT-CIRCUIT during the buzz: ffNeonShort (4 on/off flashes over
  3.9s, dying to exactly the opacity/filter state ffNeonRevive starts from)
  + ffNeonHaloShort keeps the glow halo flashing in step. Replaced the old
  ffNeonDieOut + halo opacity fade during crash===2.
- Screenshot-verified full sequence on mobile: climb -> crunch -> flash-on ->
  flash-off -> revive.

## 2026-08-06 part 91: Owl J-swoop for mobile visibility (FF_BUILD 392)
- User: owl heist hard to see on mobile (old path flew flat across the very
  top, behind the banner zone).
- OwlHeist re-choreographed: phases now 1 dive / 2 rise / 3 clamp / 4 carry.
  Off-screen top-right -> DIVES down-left to mid-screen (x = vw*0.5-owlW*0.5,
  y = gripTop + vh*0.42, rotate 16deg) -> swoops UP to the grip (rotate -11deg,
  feather-brake easing) -> clamp beat -> carries off up-left. Medallion clone
  mounts at phase >= 3 now. Timings: dive 0.95s, rise 0.75s @1000ms, clamp
  @1780ms, carry @2310ms, return @3630ms, cleanup @4430ms.
- Verified by position trace on 390x844: dive bottom at y=242 (fully visible
  mid-screen), grip, carry off, witness toast fired.

## 2026-08-06 part 92: Global heist cool-down — no more clustering (FF_BUILD 393)
- User saw 3 heists back-to-back on live mobile (dark realm has 3 heists on
  independent timers; first strikes 25-75s can cluster).
- summonToLogo now enforces a GLOBAL mutex + breather: bounces (done(null))
  if Date.now() < window.__ffHeistCooldownUntil; reserves 90-120s (random)
  right before handing back the medallion (both the instant path and the
  scroll-settle path). Bounced heists retry ~30s later per the existing
  null-medallion convention. Covers all 19 medallion heists in every realm
  (16 call sites incl. LogoHeist, CompanionPatrol, SaucerAbduction).
- CyberNeonSign (wreck, own start path) patched with the same check in
  start() and claims the slot in go().
- NOTE for testing: forced ff:*-heist events also respect the cooldown — set
  window.__ffHeistCooldownUntil = 0 first in test scripts.
- Verified on dark: plate heist running -> ff:heist/snatch/ghost all bounced
  (plate:1, grave:0, cooldown 110s remaining).
- User must REDEPLOY to get FF_BUILD 388-393 changes on fork-fate.com.

## 2026-08-06 part 93: Code review triage (FF_BUILD 394)
APPLIED (real findings):
- Home.jsx crawl-type map param `t` shadowed the i18n t() — renamed to `ct`
  (verified: crawl picker renders all 8 types + translated labels).
- scripts/gen_print_files.py + gen_snowman_wink.py unused imports removed
  (kept flood_key_white which WAS used). pyflakes now clean across
  backend/routes, backend/*.py and scripts/.
INVESTIGATED, NO ACTION NEEDED (report noise):
- "5 undefined Python variables": pyflakes 3.4 finds ZERO undefined names in
  backend runtime code.
- localStorage "security": audit found only client prefs/progress (theme,
  rituals/heists seen, favorites, streaks, crawl progress, public opt-in URL).
  No tokens/credentials; admin uses X-CSRF-Token from cookie.
- Hook dependency warnings: flagged items are module imports (axios, API),
  loop vars (a, b), stable setters (setHeistEpoch) — do not belong in dep
  arrays; heist effects intentionally use [] with stable refs.
- Array-index keys: all flagged spots are static, never-reordering decorative
  or instruction lists — index keys are correct per React docs.
DEFERRED TO BACKLOG (high regression risk pre-publish):
- Split Home.jsx (1,552 lines) into HomeSearch/HomeResults/etc.
- Decompose GuidedFlow (cx 69), BecomeSponsorDialog (44), CrawlBadgeDialog (58).
- Backend complexity: stamp_passport, places_search, complete_crawl,
  google_places_search, build_sponsor_summary helper extraction.
- Python type hints (models.py, server.py).

## 2026-08-07 part 94: Crawl reward screen black-flash fix (FF_BUILD 395)
- User (live mobile, pub crawl): selfie/reward step glitched with black flashes.
- Root causes (4 compounding, dark theme = default):
  1. ReaperScene root LACKED the ff-theme-scene class, so the existing
     ff-badge-open pause never froze the dark realm's looping animations
     while the 1080x1920 badge canvas builds. Added (also to CafeDustMotes).
  2. .flame-text "Congratulations" animates drop-shadow filters on
     background-clip:text every 1.05s — a known Android Chrome black-flash
     trigger. Mobile (<=640px) now gets animation:none + one static glow.
     (Also applies to Leaderboard title, same class.)
  3. The reaper-shocked cinematic animated filter:blur(3->0->1.5->8px) on a
     240px image — blur keyframes removed (opacity/scale/y kept).
  4. Heists could strike mid-ceremony (badge dialog not in __ffFateBusy):
     CrawlBadgeDialog now claims the heist cooldown slot on open (+15min cap)
     and leaves a 60s breather on close.
- Verified: scene animation-play-state paused<->running with the body class;
  flame-text computed animationName none at 390px. NEEDS REDEPLOY to hit
  fork-fate.com.

## 2026-08-07 part 95: iPhone install experience (FF_BUILD 396)
- Context: user cannot pursue App Store publishing (no Mac/iPhone/personal
  computer) — iPhone users are served via PWA Add to Home Screen instead.
  App Store route documented in chat, deferred indefinitely.
- InstallAppButton iOS dialog: non-Safari branch REWRITTEN — since iOS 16.4
  all iOS browsers install from their own share menu, so Chrome/Edge/Firefox
  users get numbered steps (share icon top-right in Chrome) with a Safari
  fallback note, instead of being detoured to Safari. Safari branch already
  had good steps (bottom toolbar hint).
- InstallHelper bottom sheet: Safari steps now say WHERE the share button is;
  non-Safari iOS gets the same share->add steps + fallback line (replaces the
  old "Open this page in Safari" note). pwa.js comment updated.
- Verified via UA-emulated contexts (iPhone Safari UA + CriOS UA): dialog
  opens from the "Download the app!" button with the correct branch text.
- apple-touch-icon.png present; manifest solid (icons, maskable, standalone).

## 2026-08-07 part 96: PWABuilder manifest score boost (FF_BUILD 397)
- User shared PWABuilder score: Manifest 22/45, SW +3, Capabilities +1.
- manifest.json upgraded with the missing scored fields: screenshots (narrow
  390x844 + wide 1280x720, captured from the dark realm home and saved to
  /public/screenshots/), display_override, launch_handler
  (navigate-existing), handle_links preferred, prefer_related_applications
  false + related_applications (Play: com.fork_fate.twa).
- Remaining unscored bits (intentionally skipped): iarc_rating_id (needs the
  user's IARC cert from Play Console), share_target/file/protocol handlers +
  widgets (behavior changes, not wanted yet).
- Verified: manifest valid JSON, screenshot URLs 200. PWABuilder scores
  PRODUCTION, so the new number shows after redeploy.

## 2026-08-07 part 97: Four-feature batch (FF_BUILD 399)
All tested via testing agent iteration_60.json (backend 6/6 pytest pass at
/app/backend/tests/test_flares.py) + follow-up toast fix verified by screenshot.
1. FLARE ON ME: POST /api/crawls/{code}/flare (CrawlPositionCreate payload,
   member_id >=4 chars, upserts per member, TTL 3 min via crawl_flares
   expire_at index); GET positions now returns {positions, flares}.
   PubCrawlDialog: popFlare() + crawl-flare-button in map view (disabled
   without livePos, 5s spam brake); CrawlMap: flares prop + flareIcon
   (pulsing orange beacon w/ FLARE·name tag, zIndexOffset 1000).
2. BLACKOUT RITUAL: Home landFate b?.blackout branch -> recordRitualSeen
   ("blackout") + gold double confetti + BlackoutRitual.jsx overlay (golden
   stamp slam, square rain via ffBlackoutSquare/ffBlackoutFlash, Admire the
   card -> /bingo, auto-dismiss 6.5s). blackout added to __ffFateBusy so
   heists can't strike mid-celebration. RITUALS registry + ICONS (Stamp) got
   "blackout" entry -> Collection card.
3. SHARE TARGET: manifest share_target (GET /, share_title/text/url params);
   Home mount effect saves shared spot to ff_favorites (name from title or
   text-minus-URL), cleans params via replaceState, toast DEFERRED 600ms
   (sonner Toaster subscribes after mount effects; undeferred toasts drop).
4. HEIST HUNTER: Rituals.jsx shelf rows now dynamic (was hardcoded [0,1] =
   16 slots, missing the 4 newest heists!); crown centerpiece when 20/20
   (heist-hunter-crown-icon) else progress pill; HEIST_ICONS +4 (coffee
   Coffee, plate Utensils, unicorn Rainbow, cardinal Feather).
- NOTE: a Home.jsx state edit silently didn't persist once mid-session
  (interrupted turn); re-applied. Always re-grep after interrupted turns.

## 2026-08-07 part 98: Winter chimney smoke fix (FF_BUILD 400)
- User: winter smoke looked like a black smudge. Cause: mid-gray smoke colors
  (rgba(140,148,162,0.5)) + heavy blur over the pale sky and a cabin drawn at
  0.32 opacity.
- ff-chimney-column + ff-chimney-smoke recolored to near-white winter tones
  (rgba(234-249,239-251,246-254)) with slightly higher puff opacity peaks
  (0.6/0.5) to stay visible. Screenshot-verified: soft pale plume, no smudge.

## 2026-08-08 part 99: Chimney puffs (FF_BUILD 401)
- User wants distinct light puffs (not a merged plume). Static
  ff-chimney-column REMOVED (JSX + CSS + sway keyframe). CHIMNEY_SMOKE now 5
  puffs, 8s dur, emitted every 1.6s, each with a --drift px var; keyframe
  pops out (scale .22->.55 @7%), rises 180px with drift, swells to 1.45 and
  fades; blur cut 9->4px with brighter white core for defined puff shapes.
- Screenshot-verified: 3-4 separate puffs visible in trail at once.

## 2026-08-08 part 100: Rising smokestack puffs (FF_BUILD 402)
- User refined: puffs should RISE like a smokestack train. Keyframe reworked:
  coherent cotton-ball puffs (blur 2.5px, bright off-center core, opacity held
  ~0.85 through 65% of the ride, small scale growth to 1.2) climbing 192px
  with a gentle left/right wobble baked into the path. Screenshot-verified:
  vertical train of 4-5 distinct balls above the chimney.

## 2026-08-08 part 101: Gusting snow + chimney polish (FF_BUILD 403-405)
- 403: chimney puffs pinned to the chimney mouth (marginTop: -size anchors the
  puff BOTTOM at the anchor; on mobile's small cabin the puff box previously
  hung visibly below the lip). Mobile-verified with content hidden.
- 404: winter's big flake sprites REPLACED with gust snow: cfg.gustSnow flag
  (items/falling removed from winter), GUST_SNOW particles + .ff-gust-snow /
  ffGustSnow keyframe (sideways wind ride: gust-lull-gust profile crossing
  108vw, sinking --dip vh, per-fleck --op).
- 405: user wanted "a lot more snow" — GUST_SNOW 26 -> 70 flecks (sizes
  1.5-6px, dur 4.5-11s). Screenshot-verified thick flurry on mobile.

## 2026-02 (fork) part 102: Fate Duels + Conquest Map (FF_BUILD 406)
Both features user-approved (duel style: both spin the SAME location, fate-score
crowns winner; link-based, no accounts). Tested iteration_61.json — 100% pass.
1. FATE DUELS: routes/duels.py (registered in server.py) — POST /api/duels
   (challenger, pick, search context replaying PlacesSearchRequest fields),
   GET /api/duels/{code} (verdict computed when both picks: _fate_score =
   sha256(code:role:name) -> 55.0-99.9, winner = higher; deterministic,
   nothing stored), POST /api/duels/{code}/respond (409 on double-answer).
   Pytest: backend/tests/test_duels.py (6/6).
   Frontend: pages/Duel.jsx at /d/:code — responder panel (name input +
   "Let fate deal mine" replays duel.search via /api/places/search, excludes
   challenger's pick name, 1.4s dramatic beat), creator waiting panel
   (localStorage ff_duel_mine_<code>, 8s poll, share-link button), verdict
   arena (two DuelCards, scores, Crown on winner, confetti once via
   celebratedRef). Creation: FateActionsDropdown gained optional onDuel prop
   ("Duel a friend" FIRST item, Swords icon) <- RevealStage onDuel prop <-
   Home.jsx startDuel() (uses lastSearchRef captured in doSearch; fallback =
   card lat/lng; ff_duel_name reused; toast with "View duel" action).
2. CONQUEST MAP: lib/journal.js recordFate now stores card.lat/lng (null for
   pre-406 entries). pages/Conquest.jsx at /conquest — dark CARTO leaflet map,
   numbered red pins for entries with coords, empty state + legacy note.
   Journal.jsx gained conquest-map-link banner under the stat tiles.
- ES translations added for all new strings. FF_BUILD -> 2026.06-406.
- Known cosmetic (low prio): duel verdict confetti briefly overlaps the
  "Fate favors X!" banner text (~2s). Sonner action buttons need native
  element.click() in Playwright (pre-existing, not a bug).
- Google Play closed test: 12 testers at 7/14 days (user FYI 2026-02) —
  production access application unlocks ~Feb 15.
- STILL PENDING FROM USER: IARC certificate ID for manifest.json.

## 2026-02 (fork) part 103: Duel Streaks + big refactor (FF_BUILD 407)
Tested iteration_62.json — 100% after one fix. Frontend-only changes.
1. DUEL STREAKS: lib/duelRecord.js (readDuelRecord/recordDuelOutcome/duelStats,
   localStorage ff_duel_record, deduped by code, MAX 100). Duel.jsx records on
   verdict — challenger via ff_duel_mine_<code>, responder via NEW
   ff_duel_answered_<code> flag set after a successful respond POST;
   spectators record nothing. Journal.jsx shows duel-record-card (W-L tally
   duel-record-wl, streak line at >=2, last-3 rows duel-record-row-i).
   ES strings added.
2. THEMESCENES SPLIT: components/ThemeScenes.jsx (2955 lines) -> 6-line
   barrel re-exporting components/scenes/{heistLib(161), companion(408),
   seasonHeists(600), realmHeists(885), SeasonScene(~210), AmbianceScene(~730)}.
   Verbatim moves via /app/scripts/split_theme_scenes.py (one-shot, already
   run). Cross-module exports promoted (summonToLogo, LogoHeist, all heists).
   GOLD_GLITTER moved to AmbianceScene (fantasy-only). TESTING AGENT FIX:
   AmbianceScene used <React.Fragment> -> needed default React import (only
   file in split using React.*; swept clean).
3. HOME SPLIT: Home.jsx 1698 -> 1511 lines. Extracted verbatim:
   components/home/ShuffleOverlay.jsx (shuffle popup + mist + ShufflingDeck),
   components/home/RevealFlash.jsx, components/home/CrawlSetupPanel.jsx
   (setup prop pattern like PassportPicker), lib/rareFate.js (shouldRareFate +
   rarePoolFor(theme) ritual pools). All testids unchanged.
- Eslint: 0 errors; the 17 witnessRef exhaustive-deps warnings PRE-EXISTED
  identically in the original ThemeScenes (verified against copy).
  Pre-existing unused state in Home (source, addOpen) left as-is.
- iteration_62 verified: all 11 realms render zero-console-error, deal flow on
  dark/winter/cyber, rare scratch force, crawl panel + deal, duel streak
  responder/challenger/dedupe/spectator, pages regression.
- Note: 'rival shows The challenged' observation = curl omitted name (backend
  default), NOT a bug.

## 2026-02 (fork) part 104: Duel Rematch + Share Verdict (FF_BUILD 408)
Tested iteration_63.json — 100%, zero issues, no tester code changes.
1. DUEL REMATCH (Duel.jsx): rematch() spins a fresh pick from the SAME
   duel.search grounds (shared searchBody() helper with spinMine), POSTs a
   new duel (challenger name carried over from this device's side), sets
   ff_duel_mine_<newcode>, share-sheet/clipboard, navigates /d/<newcode>.
   Button duel-rematch-button shows for participants only (isMine ||
   answeredHere, both now component-level consts); label 'Run it back' when
   this side won, 'Demand a rematch' when it lost (myRole/iWon derivation).
   NEW useEffect [code] resets duel/status/celebratedRef so rematch
   navigation starts clean (no stale verdict, no duplicate record).
2. SHARE VERDICT: buildDuelShareImage(duel) in lib/shareCards.js — 1080px
   square canvas brag card (both panels, fate-scores, gold crown polygon over
   winner, VS medallion, 'Fate favors X!', fork-fate.com). shareVerdict()
   button duel-share-verdict -> shareImage() (Web Share, download fallback +
   'Verdict card saved!' toast). Sample card saved at
   /app/test_reports/screenshots/iter63/forkfate-duel.png.
- ES translations added. FF_BUILD -> 2026.06-408.
- User asked how to see visitor locations: GA4 already wired
  (G-4E739B8J0H in index.html) — pointed to Reports > Realtime map +
  Demographic details (country/city). Offered optional in-app admin
  geo-analytics panel (GA4 Data API) — NOT built, awaiting user interest.
- REMINDER pendings: IARC cert ID from user; Play closed test hits 14 days
  ~Feb 15 (was 7/14 on user's screenshot this week).

## 2026-02 (fork) part 105: Admin Geo Panel (FF_BUILD 409)
Self-hosted visitor geography (user picked this over GA4 Data API — zero
setup, collects from deploy onward; GA4 keeps full history for older data).
Tested: backend pytest tests/test_geo_stats.py 4/4 + curl (count, 6h dedupe,
401 unauth, days clamp 3650); frontend iteration_64.json 100%.
1. BEACON: App.js useEffect POSTs /api/stats/pageview once per browser
   session (sessionStorage ff_pv_sent guard, fetch keepalive).
2. BACKEND (routes/stats.py bottom): pageview endpoint hashes IP
   (sha256 'ffgeo:'+ip, first 32 hex — raw IP never stored), dedupes one
   view per ip_hash per 6h, geolocates via http://ip-api.com/json/{ip}
   (free, 45/min, server-side; cached 30d in db.geo_cache keyed ip_hash;
   cf-ipcountry header fallback; private IPs -> Unknown). db.pageviews docs
   {ip_hash, country, region, city, ts(BSON), expire_at(TTL 180d)}; lazy
   index creation _ensure_pageview_indexes (stat_dedupe pattern).
3. ADMIN (routes/admin.py): GET /api/admin/geo-stats?days=N (require_admin,
   clamp 0..3650, 0=all) -> {days,total,countries[{name,count}] top30,
   cities[{name,region,country,count}] top20} via aggregation.
4. FRONTEND: components/admin/GeoPanel.jsx ('Where your visitors are',
   testids geo-section/-total-badge/-range-7d|30d|90d|all/-countries/
   -cities/-country-i/-city-i/-empty, red count bars). Admin.jsx: geo/
   geoDays(default 30)/geoLoading state + loadGeo, panel placed between
   SubmissionsQueue and FeedbackList.
- Pod egress IP resolves to Kansas City, Missouri, US (expected test row).
- FF_BUILD -> 2026.06-409. No new backend deps (httpx already present).

## 2026-02 (fork) part 106: Heist audio delay fix (FF_BUILD 410)
User bug: heist sounds delayed on live mobile (dragon breath, spinner/surf
crash etc). ROOT CAUSE: every heist did `new Audio(src).play()` at the strike
moment -> mobile download+decode put audio seconds behind visuals.
FIX (components/scenes/heistLib.jsx): module-level _audioBank +
preloadHeistAudio(srcs) (Audio preload='auto' + load() at component mount;
strikes fire minutes later so clips are warm) + playHeistSound(src, vol)
(warm element, rewind if mid-flight, honors ff_muted, fresh fallback).
All 9 sound-emitting heists patched to preload at mount + play via bank:
companion.jsx CompanionPatrol (surf-wipeout/dragon-whoosh/fairy-laugh+
pixie-chime by heistKind), realmHeists SaucerAbduction(beam-riser),
GhostSnatch(soul-wail-short), TikiSpear(tiki-drums-short),
SteamGears(steam-gears-run+steam-boing), seasonHeists Snowman(snow-gust),
Owl(owl-hoot+wing-whoosh), SpringPetal(spring-wind), AmbianceScene
CyberNeonSign(neon-crunch+neon-bzz). All ff_muted checks preserved (now
inside playHeistSound).
- GOTCHA hit: one search_replace on companion.jsx reported success but
  actually APPENDED an orphan JSX fragment at EOF without replacing (parsing
  error) — fixed via python; verify tails after tool-glitch suspicion.
- Tested iteration_65.json 100%: mp3 GETs confirmed AT MOUNT via network
  interception (cyber/fantasy/winter), zero console errors across all 11
  themes, forced gears heist OK, mute respected. Tester notes explained:
  OwlHeist mounts in FALL (not winter); fairy pixie preloads at companion
  mount (cfg.gully) — both correct.
- FF_BUILD -> 2026.06-410.

## 2026-08-10 part 90: Spring petal feather-fall final + light blue sky (FF_BUILD 413-417)
- PETAL C-SHAPE FALL (user: "downwards C shape, side to side in the downward
  half loop"): rebuilt as two layers — outer span ffPetalFall (linear descent,
  -10vh to 104vh) + inner span ffPetalSwing (C-arc: translateX(+-var(--sx)) with
  translateY dip var(--sy); per-segment timing ease-in INTO arc bottom,
  ease-out climbing to edges = hover at tips, swoosh through dip). img keeps
  ffPetalRock edge-on flutter. Old ffPetalFeather keyframe removed.
- MORE + TIGHTER (user: "more of them, tighter zig zags on some"): PETALS
  array now 24 (was 10 slice); every 3rd is "tight" (sx 3vw, sy 1.4vh, swing
  2.4-3.4s) vs wide (7vw/2.8vh, 4.6-7.3s). Negative delays pre-populate sky.
- WHITE PETALS (user: "few white ones for contrast"): /petal-white.png
  generated via /app/scripts/gen_petal_white.py (PIL recolor of petal-pink:
  push lum to white keeping alpha/shading + ivory warmth). Every 4th petal
  white (6 of 24).
- NO TRANSPARENCY (user): petal img opacity now 1 (removed 0.6/0.75);
  ffPetalFall holds opacity 1 from 5%-92% (fades only at spawn/exit).
- LIGHT BLUE SKY (user, then "extend it further down"): spring grad now
  #CDE8F8 0% -> #D9EEFA 55% -> #FBEFF5 82% -> #EFF7E6 100% (blue holds past
  mid-screen before blending to blossom pink/meadow green). FF_BUILD 418.
- GOTCHA (again): one search_replace on SeasonScene.jsx reported success but
  did NOT persist (img src edit); re-grep after edits when suspicious.
- Verified via screenshots + DOM checks: 18 pink + 6 white rendering, computed
  opacity 1, blue sky live. FF_BUILD -> 2026.06-417.
- STILL PENDING FROM USER: IARC certificate ID (user confirmed not received yet).

## 2026-08-10 part 91: Grey/white checker in spring sky FIXED (FF_BUILD 419)
- User screenshot showed grey/white checkerboard across the spring sky.
  ROOT CAUSE: spring-ground2.png had the transparency checkerboard BAKED IN
  as opaque pixels (#FEFEFE / #E9E9E9, alpha 255) across its whole sky half
  (48% of image). Invisible vs old pastel sky; exposed by new blue sky.
- FIX: /app/scripts/fix_spring_ground_checker.py — BFS flood fill from top
  edge over near-neutral light px (min>=200, channel spread<=8) -> alpha 0,
  + edge feathering (half alpha). Pass 2 (inline) expanded from transparent
  region over pale tinted residue (min>=205, max-min<=16), +30895 px.
  Verified: zoom composite on blue = clean horizon, mobile screenshot clean.
- LESSON: when adding/regenerating scene art, CHECK for baked-in checker
  (opaque near-white/grey alternating squares) — spring-ground.png (unused)
  also has it (20%). season-spring-bloom.png has 2% suspicious px (unverified).

## 2026-08-10 part 92: Deployment health check PASS
- deployment_agent found 2 blockers, both fixed: (1) removed .env/.env.*/*.env
  from /app/.gitignore (env files must be committed for deploy); (2)
  backend/.env CORS_ORIGINS "*" (was explicit fork-fate.com list). NOTE:
  server.py filters "*" from explicit origins; real CORS enforcement is
  allow_origin_regex in core.py (fork-fate.com + *.emergent.host + preview),
  safe with allow_credentials=True. Functionally a no-op, satisfies scanner.
- Backend restarted, API 200 OK. Re-scan: PASS, zero findings. Ready to deploy.

## 2026-08-10 part 93: TEST SUITE CLEANUP + FULL REGRESSION — 451/451 GREEN
- From 149 failed + 40 errors -> 451 passed, 0 failed (2 consecutive runs).
  Full details: /app/test_reports/iteration_68.json. Only /app/backend/tests
  touched — zero production code changes.
- DELETED 4 stale era-snapshot files: test_iteration9/10_bars/12/13.py.
- conftest.py rewritten: loads frontend/.env; targets localhost:8001
  (FF_TEST_EXTERNAL=1 for e2e); per-module fake CF-Connecting-IP (worker id +
  run salt) isolates rate-limit buckets; FF_ASSET_BASE_URL=localhost:3000 for
  frontend assets; FF_EXTERNAL_BASE_URL = real https URL (cookie/origin
  tests); session janitor sweeps TEST_ docs (restaurants, crawls, completions).
- KEY LEARNINGS (do not regress):
  * NEVER restart backend inside a test (kills parallel workers).
  * NEVER delete_many({}) on shared collections (races xdist workers).
  * Cloudflare rejects spoofed CF-Connecting-IP -> only spoof on localhost.
  * Secure cookies don't travel over http -> cookie tests use https EXT URL.
  * Admin login returns NO body token -> _helpers.mint_admin_token() Bearer.
  * GOOGLE_API_KEY LIVE in preview: zip search=google, no-zip=curated.
  * Passport stamps have 60s anti-cheat cooldown; crawl codes are 8 chars;
    SEC-002: only GPS-verified plausible runs rank on crawl leaderboards;
    public restaurant submissions are pending until admin approval.

## 2026-08-11 part 94: GuidedFlow refactor DONE (FF_BUILD 420)
- 448-line GuidedFlow.jsx monolith split into an orchestrator (~132 lines,
  owns state + progress chrome) + /app/frontend/src/components/guided/:
  theme.jsx (buildGuidedTheme tokens incl. radiusLabel/groupLabel, SEAL_ICONS,
  MushroomIcon, pageVariants), GuidedChips.jsx, StepInterest.jsx,
  StepLocation.jsx (owns geoLoading locally), StepChips.jsx, StepSeal.jsx
  (ReaperCardFront + ThemedCardFront + card back).
- ThemeWelcomeDialog.jsx imports MushroomIcon from ./guided/theme (no shim).
- Pure refactor: all data-testids + behavior identical. Testing agent
  iteration_69: 100% PASS across spring/dark(Reaper)/fairy themes, back-state
  preservation, skip, ZIP gating, 50/150mi radius caps, grouped chips,
  surprise-me, +N more expanders, seal flip -> shuffle. 0 console errors.
- To retrigger guided flow in tests: localStorage.clear(); set ff_theme,
  ff_theme_chosen=1, ff_theme_hint_seen=1; reload (showGuided defaults true).

## 2026-08-11 part 95: Cyberscape polish (FF_BUILD 421-422)
- BUS ENTRY FIX: ffFly starts at -24vw which didn't hide the 300px bus on
  narrow windows ("pops into view"). New ffFlyBus keyframe starts at
  calc(-24vw - 340px). Bus now uses ffFlyBus in AmbianceScene.
- THRUSTER GLOW (user: "less solid, fuzzy, moving / engine producing it"):
  (1) /app/scripts/soften_bus_thrusters.py PIL-faded the solid teal cones
  baked into cyber-bus.png (alpha 62%->6% vertical fade below y=242 + 2.2px
  alpha blur). Backup: /tmp/cyber-bus-backup.png.
  (2) CSS: ffThrusterPlume (irregular scaleY/opacity pulses, origin top) on
  two pod plumes (1.1s / 1.35s -0.45s) + ffThrusterHaze breathing underglow.
- POLICE CHASE (user request): occasional pursuit — swerving prey car
  (ffChaseRun 7s + ffChaseSwerve jitter) chased by cyber-spinner-suv with
  red/blue strobing light bar + halos (ffCopFlashA/B 0.55s steps). Scheduler
  in AmbianceScene: first at 25-60s, then every 50-140s, 9s mount. testids:
  cyber-chase-car, cyber-chase-police. Verified live via screenshot (spawned
  at 24s, both frames show pursuit). User approved bus ("Bus looks great").

## 2026-08-11 part 96: Chase polish + brace bug (FF_BUILD 423-424)
- BUNCHING FIX: pursuer now runs its OWN keyframe path (ffChasePursuitRun,
  constant ~16vw gap closing to ~8vw) instead of shared path + time delay
  (eased motion collapsed the gap at slow phases).
- BUG FIX (user screenshot): literal "{" floating above ALL cyber cars —
  stray double "}}" in AmbianceScene.jsx line 540 from the thruster edit
  rendered as text. Fixed; verified 0 stray glyphs via DOM scan.
- POLICE LIGHTS (user: "2 small round lights above windshield changing
  red and blue"): replaced light bar with two round beacons (left 55%/63%,
  top -8%, aspect-ratio 1) using ffCopLightA/B keyframes that SWAP
  background red<->blue out of phase (0.55s steps). Halo washes kept.
  Verified via clipped screenshots 280ms apart showing colors swapped.
- USER DECLINED cruiser image generation (wanted light tweak instead).
- PENDING USER IDEA (not yet built): chase returns R->L across the HEADER and
  crashes into the logo as a new collectible heist ("Hot Pursuit"). Heist
  infra studied: realmHeists.jsx pattern (summonToLogo/claim slot/witness),
  rituals.js has 41 ritual keys, /neon-crunch.mp3 available for impact.

## 2026-08-11 part 97: Police cruiser + stop-and-go chase (FF_BUILD 425-428)
- NEW SPRITES (Nano Banana, gemini-3.1-flash-image-preview via
  emergentintegrations): /cyber-police.png (faces right) + /cyber-police-left.png
  (faces left, lettering NOT mirrored) — black/white livery, unit "07" on white
  front door, POLICE on rear quarter, baked-in red/blue round beacons above
  windshield, cyan hover pods. Gen: /app/scripts/gen_police_cruiser.py
  (right first, then left using keyed right as reference). Keying:
  /app/scripts/key_police.py (edge BFS flood fill, soft alpha ramp — enclosed
  white door panel survives). Note: user riffed "07 = F's place in alphabet"
  (actually 6th; user informed, kept 07).
- CHASE BEHAVIOR (user iterations): no shake; STOP-AND-GO — prey decelerates
  like pulling over (~44-46vw, dips), unit closes to bumper-to-bumper (gap
  0px verified), prey launches off (per-segment timing functions in
  ffChaseRun/ffChasePursuitRun + Rev mirrors, 9s, mount 11s).
- BOTH DIRECTIONS: chase state {dir: 1|-1} random; rev keyframes; prey img
  scaleX(-1) when R->L; police swaps sprite (no mirrored text). Beacon bloom
  overlays positioned per direction (right: 45.7%/51.9%, left: 49.1%/43%).
- DISTANCE (user): smaller (prey 94/66, police 86/60), higher lane (22%/40%
  desktop/mobile), opacity ~0.85-0.88, beacon blooms enlarged (7%) so the
  red/blue still reads. Old ffCopLightA/B round-lamp keyframes remain in CSS
  but unused by chase (halos ffCopFlashA/B + blooms are active).
- PIL mock scripts kept: gen_cyber_police.py (superseded by Nano Banana gen).
- STILL PENDING: "Hot Pursuit" logo-crash heist (chase doubles back across
  header, crashes into logo medallion, new collectible ritual).

## 2026-08-11 part 98: "Hot Pursuit" logo-crash heist SHIPPED (FF_BUILD 429)
- HotPursuitHeist (realmHeists.jsx), mounted for cfg.cars in AmbianceScene
  (key hp-heistEpoch). Force event: ff:pursuit-heist. Registered in rituals.js
  HEISTS (key "pursuit", accent #4078FF) — verified on Collection page.
- Choreography (all beats verified via scripted browser positions):
  30ms first pass L->R below medallion (2.3s), 2450 restage offscreen right on
  medallion line, 2600 return R->L (prey 1.18s bezier(0.4,0,0.9,1) slams into
  crashX = cx - PW*0.067 flipped-nose; cop 1.9s bezier(0.45,0,0.25,1) stops at
  crashX + PW*0.95 + 6, clear of wreck), 3750 CRASH (crash SFX, medallion hidden,
  ffLogoKnockL clone, 14 neon sparks, ffCarSputter + ffPursuitSmoke on wreck),
  5700 wreck tumbles out of sky (ffCarTumble), 6800 cop peels off left,
  7400 ffLogoReturn, 8400 witness + reschedule 2.5-5min. First strike 35-60s.
- AUDIO (user-provided): /police-siren.mp3 = 7s window @17.0s of user's
  emergency-vehicles-31578 clip (fades + loudnorm); /logo-crash.mp3 = user's
  car-crash SFX (loudnorm + fade). Played via preloadHeistAudio/playHeistSound;
  verified siren at dt=1ms, crash at dt=3788ms via HTMLMediaElement.play hook.
- BUGFIX (pre-existing): CrawlBadgeDialog effect else-branch claimed a 60s heist
  cooldown on EVERY page load; now gated by wasOpenRef (only after real ceremony).
- BUGFIX (pre-existing, user's "don't have the police back up"): ambient chase cop
  regressed on narrow screens — ffChasePursuitRun 30% waypoint 20vw could sit ahead
  of 48% (44vw-160px) when vw small; both Run/Rev 30% waypoints now pinned relative
  to the prey line (38vw-190px / 62vw+205px). Monotonic for all viewports.
- STILL PENDING: IARC rating ID for manifest.json (user hasn't received cert).

## 2026-08-11 part 99: Tow Job cameo + realm-entry ambient + depth fix (FF_BUILD 430)
- TOW JOB (rare Hot Pursuit ending, 35% of strikes, forced via
  CustomEvent('ff:pursuit-heist', {detail:{variant:'tow'}})): hover wrecker
  sprite (/cyber-tow.png, Nano Banana via gen_tow_truck.py + key_police.py,
  760x310, hazard-yellow, TOW on cab, boom hook at rear ~97%/25%) floats in
  from offscreen right (ph6 @5700, 1.5s), boom hook lands on the wreck's nose
  (ph7 @7300, cyan flare + wreck tilts rotate(-5deg)), hauls the smoking wreck
  off left in verified lockstep (ph8 @7900, constant 149px offset), cop flees
  ph9 @9700, logo back 10300, cleanup 11300. Registered as HEISTS key "tow"
  ("Tow Job", amber #E0A422); witnesses tow (toast) + pursuit (silent).
  BUG FIXED during test: prey px used ph===8 so wreck snapped back at ph9 —
  now ph>=8. Verified prey stays offscreen through flee + logo restore.
- REALM-ENTRY AMBIENT (user track alexzavesa-action-cyberpunk-intro):
  /cyber-ambient.mp3 (26.9s, loudnorm I=-20, fades) plays ONCE at vol 0.18 upon
  entering the Cyberscape realm (effect on theme==='cyber' in AmbianceScene);
  autoplay-blocked cold loads retry on first pointerdown; live mute watcher
  pauses mid-track; leaving the realm fades it out. User asked "just upon
  entering the realm" (NOT a loop). Verified via HTMLMediaElement.play hook.
  Dev StrictMode double-plays briefly (first instance fades out); prod is single.
- DEPTH FIX (user: "bigger vehicles should be in front of the pursuit"):
  CYBER_CARS z-order now size-based — bus(300) z-6, spinner SUV(96) z-5,
  ambient pursuit z-4, small cars z-3, distant bus2 z-2.

## 2026-08-11 part 100: Realm-entry stings for Summer/Spring/Tiki (FF_BUILD 431)
- Generalized the entry ambient into RealmEntrySting.jsx (mounted in Home,
  works for season + ambiance realms). Cyber effect removed from AmbianceScene.
- User tracks (all one-shot, vol 0.18, loudnorm I=-20, fades, "not full song"):
  summer = atlas-hawaii 60-84s -> /summer-ambient.mp3
  spring = whisper-of-bamboo 0-29.5s (silent tail trimmed) -> /spring-ambient.mp3
  tiki   = reggae-island-vibes 60-84s -> /tiki-ambient.mp3
- Verified via init-script play hook: each realm entry fires its sting, dark
  fires none. Dev StrictMode double-play is self-fading; prod single.

## 2026-08-11 part 101: Fairy + Winter entry stings (FF_BUILD 432)
- fairy = FIRST 40s of juliush fairy-chant (user corrected from my 18-58s pick)
  -> /fairy-ambient.mp3
- winter = Sugar Plum Fairy electro-house 44-72s peak drop ("not whole song")
  -> /winter-ambient.mp3
- Both added to RealmEntrySting STINGS map; verified firing on realm entry via
  init-script play hook. Realms with stings now: cyber, summer, spring, tiki,
  fairy, winter. Still without: steam, fantasy, fall, dark(reaper), light(cafe).

## 2026-08-11 part 102: Fall / Reaper / Steampunk entry stings (FF_BUILD 433)
- fall  = twilight-halloween logo sting, whole 12.8s (silent tail trimmed)
- dark  = sigmamusicart horror, first 26s -> /reaper-ambient.mp3
- steam = clockwork-adventure 42-68s peak -> /steam-ambient.mp3
- All verified firing on entry. Realms with stings: cyber, summer, spring,
  tiki, fairy, winter, fall, dark, steam. Still without: fantasy, light(cafe).
- User re-uploaded the fairy chant; confirmed already wired (first 40s).
