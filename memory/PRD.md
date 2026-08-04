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
