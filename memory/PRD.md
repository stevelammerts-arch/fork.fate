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
  upload one later (drop-in same filename). (3) Reaper reveal flourish =
  GHASTLY spectral shrouds (SVG, gaunt slanted sockets + wailing mouth,
  sickly green-white glow, flicker; iterated 3x from 'comical' -> 'smoke' ->
  'ghastly'); deck keeps skeleton hands. (4) Cyberpunk reveal flourish =
  PURPLE MATRIX RAIN (12 binary columns, glowing lead char) — user first
  asked lasers (built, then 'belay that order'); rain now loops
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
