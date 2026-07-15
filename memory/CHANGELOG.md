# Fork·Fate — Changelog

## 2026-07-15 (fork) — Refactor: extracted ShufflingDeck into its own module

- **New component `components/ShufflingDeck.jsx`** (194 lines): moved `ShufflingDeck` + internal `CardBack`, `CardFront`, and `DECK_SIZE` out of `Home.jsx`. Only `ShufflingDeck` is exported. **All per-theme card visuals are unchanged** (skull/dark, neon-SUV/cyber, tiki mask, steam gears, seasonal sprites, light) — the shared shuffle animation stays identical.
- `Home.jsx` shrank ~2061 → 1967 lines (now under 2k; total across refactors: 2470 → 1967). Verified the cyber-theme deal opens the shuffle popup with its themed card-backs ("NEON NIGHTS") animating correctly, landing on a result. Build → `2026.06-198`.


## 2026-07-15 (fork) — Refactor: extracted dark-mode ReaperScene from Home.jsx

- **New component `components/ReaperScene.jsx`** (102 lines): moved the dark-theme decorative background (smoke/haze, lightning SVGs, flapping `REAPER_BATS`, cursor-parallax reaper + flickering lantern) plus its `useMotionValue`/`useSpring`/`useTransform` hooks and the mousemove listener out of `Home.jsx`. Home now renders `{theme === "dark" && <ReaperScene />}` and no longer imports the framer-motion motion-value hooks.
- `Home.jsx` shrank ~2251 → 2157 lines. Verified dark theme renders reaper-ambiance + reaper-bg + reaper-lantern with cursor parallax and no errors. Build → `2026.06-197`.


## 2026-07-15 (fork) — Refactor: extracted theme scenes out of Home.jsx

- **New module `components/ThemeScenes.jsx`** (220 lines): moved `SeasonScene` + `AmbianceScene` components and their data/constants (`SEASONS`, `AMBIANCE`, `FALLING_SPRITES`, `FLYING_BIRDS`, `STEAM_PUFFS`, `STEAM_JET`, `CYBER_CARS`, `STEAM_CABLES`, `TIKI_FLAME_FRAMES*`) out of `Home.jsx`. `Home.jsx` now imports `{ SEASONS, AMBIANCE, SeasonScene, AmbianceScene }`. `REAPER_BATS` stays in Home (dark-mode reaper).
- `Home.jsx` shrank ~2470 → 2251 lines. Behavior identical — verified all 4 themed scenes (fall/winter SeasonScene, cyber/steam AmbianceScene) render with no errors. Build → `2026.06-196`.


## 2026-07-15 (fork) — Code-review cleanup: places.py refactor + content-based keys

- **`google_places_search` refactored** (`routes/places.py`): split the ~114-line, complexity-35 function into a small orchestrator + 4 focused helpers — `_resolve_latlng`, `_build_text_query`, `_build_search_payload`, `_place_to_result` (plus a `_PLACES_FIELD_MASK` constant). Behavior is identical; verified via curl across all 6 categories, ZIP + coords paths, cuisine/price/open_now filters, radius filtering, and the liquor-store bar special case.
- **Array-index keys** → content-based in FAQ (`Home.jsx`) and legal paragraphs (`LegalPage.jsx`).
- **Reviewed & declined (false positives):** `is None` "comparison anti-patterns" (correct Python), non-sensitive UI localStorage (theme/favorites/mute — admin token already on HttpOnly cookie), `console.debug` in catch blocks. Report also referenced a nonexistent "MapView"/map — generic/auto-generated. Large component splits deferred (intricate, production-critical; not worth regression risk without dedicated effort).


## 2026-07-15 (fork) — P3 security: Admin session moved to HttpOnly cookie + Fall scarecrow eye tuning

- **Admin auth hardening (P3)**: Migrated admin session from a localStorage `Authorization: Bearer` JWT (XSS-exposed) to an **HttpOnly, Secure, SameSite=Lax cookie** `ff_admin` (12h).
  - Backend `core.py`: added `ADMIN_COOKIE`, `set_admin_cookie`/`clear_admin_cookie`; `require_admin` now reads the cookie first, falls back to Bearer header (for curl/tooling).
  - `POST /api/admin/login` + passkey `POST /api/auth/passkey/login-verify` set the cookie and return `{ok:true}` (no token in body). Added `POST /api/admin/logout` to clear it.
  - `server.py` CORS: `allow_credentials=True` (origins still restricted by regex/env).
  - Frontend `Admin.jsx`: removed all localStorage token handling; uses axios `withCredentials`, checks session via `GET /api/admin/verify` on mount, spinner while checking.
  - Verified via curl (cookie set/verify/logout/401) and browser flow (login→dashboard→logout; confirmed no localStorage token).
- **Fall scarecrow eyes**: changed strobe flash to a slow smooth pulse (`ffEyeFlash` 5s ease-in-out); repositioned both eye glows onto the actual eyes (amber eye 64.6%,14.9% + dark socket 70.6%,17.8%) fixing wrong-direction tilt; enlarged scarecrow to 46vh desktop / 34vh mobile.


## 2026-07-15 (fork) — Fall scene: pumpkins, taller scarecrow, red eye flash; cyber header logo

- **Cyber header logo**: header shows the round neon logo ONLY on the cyber theme (`theme === "cyber"`); all other themes keep the red badge.
- **Fall jack-o'-lanterns**: two batches now — the original group by the tree (right) plus a second centered group on the ground (`groundPumpkins`), proportionate.
- **Fall scarecrow**: extended the wooden stake (~+30% via a smooth stretched+affine-sheared pole matching the original's rightward lean) so he sits higher; render moved to a ratio-locked wrapper (`766/1585`), height bumped to h-28vh/sm:h-39vh. Backup at `fall-scarecrow-orig.png`.
- **Scarecrow red eye flash**: overlaid a small red radial glow on his eye with a periodic flicker (`ffEyeFlash`).
- Verified all active fall assets (jack-o'-lanterns, scarecrow, tree, owl) are transparent — no baked-in backgrounds. Bumped FF_BUILD to 2026.06-185.


## 2026-07-15 (fork) — Cyber neon logo, spinner SUV, dark techno shuffle audio

- **Cyber neon logo**: replaced the "Fork Fate" neon with a round neon sign of the app logo (purple ring border, elegant magenta FF monogram layered in FRONT of crossed cyan fork & knife). Baked luminance-based transparency so there's no black square; render now has a pulsing background flash glow (`ffNeonFlash`) plus the existing float/flicker (`ffNeonFloat`).
- **Cyber spinner SUV**: generated `cyber-spinner-suv.png` (rembg-cleaned transparent). Flies as the lead car in the sky (`CYBER_CARS`) AND appears on the cyber shuffle-deck card backs (`CardBack` cyber) with a neon glow + "NEON NIGHTS".
- **Cyber shuffle audio**: rebuilt `reveal-cyber-radio.wav` as a strong DARK DRIVING TECHNO loop (126 BPM, punchy 4-on-the-floor kick, resonant sequenced saw bass, hard detuned arp lead, clap/hats, sidechain pump, tritone tension) via `/app/scripts/make_cyber_track.py`. Earlier ambient/elevator versions rejected.
- Bumped `FF_BUILD` to `2026.06-179`.


## 2026-07-15 (fork) — Seasonal/ambiance theme polish (winter, steampunk, cyber)

- **Winter tree**: cropped `winter-tree.png` to drop the disconnected bottom stump + gap that made the trunk look "cut off in the middle"; trunk now reaches the ground when anchored bottom.
- **Winter flying Santa**: added `santa-sleigh.png` (realistic Santa + sleigh + reindeer) flying a diagonal upward climb (`ffSantaFly`, ~12° to match the nose-up sleigh) with a gentle bob (`ffSantaBob`) across the winter sky. New winter config `santa`.
- **Steampunk full wall**: generated `steam-wall-full.png` (tall vertical steampunk machine wall) replacing the landscape `steam-wall.png`; now fills the entire page (`inset-0 h-full w-full object-cover`, `object-position center top`) so it spans full width/height with the top never cropped, cables layered on top.
- **Steampunk steam jet**: constant plume (`STEAM_JET`) venting from the pipe coupling right of center; anchored with `top:16vw` so it tracks the coupling on the object-cover wall across widths.
- **Steampunk floor**: added a riveted metal floor band (bottom 14vh, z-[2], behind the console/device) so the cabinet and table look grounded instead of floating. New steam config `floor`.
- **Steampunk table**: flipped the arc-device ("little table") with `scaleX(-1)` so it faces inward.
- **Cyber spinner SUV**: generated `cyber-spinner-suv.png`, added as the lead flying vehicle in `CYBER_CARS` (bigger, z-[4]) ahead of the existing cars. New cyber config `spinner`.
- Bumped `FF_BUILD` to `2026.06-175` for the new image assets. (Old `steam-wall.png` now unused.)


## 2026-07-15 (fork) — Guided wizard overflow fix on short laptop screens

- **GuidedFlow modal too tall**: on short laptop viewports the vertically-centered ritual wizard overflowed and clipped the top "Skip intro" (exit) and bottom. Restructured to the standard scrollable-modal pattern: outer `fixed inset-0 overflow-y-auto`, fixed backdrop, inner `flex min-h-full items-center justify-center` wrapper. Exit button now always reachable; verified at 1280×600 (`guided-skip` visible). (`GuidedFlow.jsx`)


## 2026-07-15 (fork) — Security audit hardening (P3 items)

- **Security audit**: ran read-only audit → PASS, no Critical/High/Medium. Implemented 2 approved P3 hardening items below.
- **Security headers** (`server.py`): added global middleware setting `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy`, `Strict-Transport-Security`, and a locked-down `Content-Security-Policy` (`default-src 'none'; img-src 'self'; frame-ancestors 'none'`) on all API responses (incl. the image-serve route).
- **Sponsor counter dedupe** (`sponsors.py`): impressions/clicks now deduped per client-IP window (impressions 60s, clicks 300s/sponsor) via an atomic, cross-worker MongoDB `stat_dedupe` collection with a TTL index, preventing casual inflation of sponsor analytics.
- Remaining P3 (not implemented, user's call): forwarded-header trust verification at ingress, admin token in localStorage → HttpOnly cookie, subscription-status name echo.


## 2026-07-15 (fork) — Curated fallback for Shops & Fuel + new filter chips

- **Curated fallback DB for Shops & Fuel**: added ~31 curated seed spots (21 shops, 10 fuel) to `backend/seed_data.py` so these tabs no longer break or burn Google quota when the 300/day cap is hit or Google is down. Covers antiques, thrift, vintage, consignment, record stores, bookstores, farmers markets, flea markets, comics, trading cards, toys, LEGO, hobby, bicycle, jewelry, pawn (shops) and gas, EV charging, truck stop, diesel, car wash, touchless (fuel). Verified: `/api/places/search` returns `source:curated` with 21 shops / 10 fuel.
- **Seed backfill**: `seed_db()` now backfills newly-added curated spots into an already-seeded DB (dedupe by name) instead of only seeding on an empty collection.
- **New filter chips**: added "Banh Mi" to Food and "Farmers Market" to Shops (`homeConstants.js`). Farmers Market filter verified against curated data.


## 2026-07-14 (fork) — Android launch support: TWA verification, beta funnel, icons, Play paperwork

- **Digital Asset Links verified**: fixed `assetlinks.json` package to `com.fork_fate.twa` (extracted from the PWABuilder `.aab` via openssl) + both SHA-256 fingerprints (upload key `21:D0:...` + Google Play app-signing key `92:45:...`). Google DAL API returns 2 valid statements on production.
- **Android beta email collector**: replaced the direct-link "Join beta" banner with an email-capture form (`AndroidBetaBanner.jsx`) → `POST /api/beta-testers` (dedupe by lowercased email, validated). Admin panel (`/admin`) gained an "Android beta testers" card with X/12 counter + "Copy all emails" (`GET /api/admin/beta-testers`, admin-auth). New model `BetaSignup`. Banner + marquee lifted to `relative z-40` so seasonal decorations don't cover them.
- **All 6 category tabs now have icons** (Food=UtensilsCrossed, Drinks=Coffee, Bars=Beer, Desserts=IceCream, Shops=ShoppingBag, Fuel=Fuel).
- **More Shops chips**: Toy Trains, LEGO Store, Toy Store, Bicycle Shop (SHOP_CUISINES now 21).
- **Copy**: manifest + meta description updated to mention shops/fuel; privacy policy (`LegalPage.jsx`) gained a beta-email-collection disclosure. Privacy URL for Play = https://fork-fate.com/privacy.
- Provided Play Content Rating (references alcohol = Yes; user-initiated location share for crawls = Yes) + Data Safety answers (email collected/not shared; location collected+shared ephemerally for functionality; check-in = pure social share, no location data). Store listing copy drafted.


## 2026-07-14 (fork) — P2: "Sponsored" tag on secondary results + Touchless Car Wash

- **Sponsored tag on alternatives**: the "3 more to consider" list now shows a red "SPONSORED" pill (with Store icon) next to any sponsor entry (`alt.sponsored`), matching the main card's ribbon. `Home.jsx` alternatives block (~2375), testid `alternative-sponsored-{id}`. Verified by seeding 3 active food sponsors — all 3 tagged in alternatives — then cleaned up.
- Added **Touchless Car Wash** to `FUEL_CUISINES`.


## 2026-07-14 (fork) — Fuel category (6th tab), order-button gating, snappier shuffle, Shops bugfix

- **Bugfix (Shops → food card)**: the `PlacesSearchRequest` category validator (`models.py:97`) was missing `"shops"`, silently coercing `shops→food` and running a "Record Store restaurant" query with food images. Added `"shops"` (and now `"fuel"`) to all 5 validators. Verified: shops searches return real shops with shop imagery.
- **Shops relevance**: dropped the noisy `"...shop"` query suffix; added `_NON_SHOP_TYPES` filter (`places.py`) excluding food/bar Google primaryTypes so e.g. "Vinyl Steakhouse" no longer appears under Record Store. `prettify_type` now takes a category for a sensible default label ("Shop"/"Gas Station" vs "Restaurant").
- **New "Fuel" category (6th tab)**: `FUEL_CUISINES = Gas Station, EV Charging, Truck Stop, Car Wash, Diesel`. Fuel-pump icon tab (`mode-fuel`), fuel hero/empty-state copy ("Let fate pick your pit stop."), guided-flow card, placeholder + query building (`"gas station ev charging station"` default), i18n. Verified: Gas Station→Mobil, EV Charging→Tesla/Blink chargers.
- **Order buttons hidden for Shops & Fuel**: DoorDash / Order-online gated by `mode !== "shops" && mode !== "fuel"` (Home.jsx). Verified hidden on shop/fuel cards, present on food/drinks.
- **Sponsors under Shops**: `BecomeSponsorDialog` category list now includes `shops` (fuel intentionally not offered for sponsorship).
- **Snappier shuffle**: end-of-shuffle hold cut from ~6.7s (1200ms pre-boom + 5500ms post-boom) to ~1.7s (140ms + 1600ms) so the boom hits as the card lands and the result reveals promptly. Crawl shuffle already snappy.
- Verified end-to-end by testing_agent (iteration_64.json): 15/15 flows PASS, 100% frontend.


## 2026-07-14 (fork) — New "Shops" category + Antique/Thrift crawls

Added a full **Shops** category (local-business roulette) alongside Food/Drinks/Bars/Desserts, plus Antique & Thrift crawl types.
- **Backend**: `"shops"` added to all 5 category validators + crawl-mode validator (`models.py`); `places.py` builds a shops Google query (`"<cuisines> shop"` or default `"antique thrift vintage consignment resale shop"`); `core.py` `PLACEHOLDER_IMGS["shops"]` (antique/thrift stock) + CUISINE_IMGS keys (antique/vintage/consignment/thrift) for sponsor fallback. Verified via curl: `category=shops` returns real antique stores.
- **Frontend**: `SHOP_CUISINES` (17 chips: Antiques, Thrift Store, Vintage, Flea Market, Consignment, Record Store, Bookstore, Pawn Shop, Gem Store, Jewelry Store, Bead/Quilt/Yarn/Hobby/Comic/Model shops, Trading Cards). New **Shops** mode pill with a `ShoppingBag` icon (`data-testid="mode-shops"`); shops branch added to `cuisineList`, `cuisineMap`, `cuisineLabel`, and hero/empty-state copy ("Feeling like a treasure hunt?"). Guided-flow interest card added (ShoppingBag). Crawl toggle (`CRAWL_TYPES`) gained **Antiques** ("Antique Crawl") and **Thrift** ("Thrift Crawl"), both `mode:"shops"`; `PubCrawlDialog` label map + `crawlLabelForType` handle shops.
- **i18n**: Spanish strings for Shops tab, Shop type, hero copy, and treasure-hunt lines.
- Verified via screenshots: Shops tab + all chips render; Antiques/Thrift appear in "Pick your crawl".


## 2026-07-14 (fork) — Developer audit remediation + logo black ring

**Whole-app audit (code review + security + deployment).** Deployment: PASS. Fixed all findings:
- **[HIGH] Google outage bypassed curated fallback** (`places.py`): `places_search` now also catches `httpx.HTTPError`/`ValueError`/`KeyError`, so timeouts/connection resets/bad-JSON degrade to curated seed data instead of 500. Verified search still returns `source: google`.
- **[MED] Daily Google cost cap undercounted geocode leg** (`places.py` `google_places_search`): cold-ZIP searches now reserve the geocode call via `_google_reserve()` too (both billed legs counted).
- **[MED] Transient PayPal error orphaned pending sponsor rows** (`sponsors.py`): PayPal calls wrapped in try/except that deletes the pending row on any failure; also cleanup on missing approval link. Prevents 24h per-IP lockout.
- **[SEC-001 MED] Unauthenticated sponsor upload cost abuse** (`sponsors.py`): added global `_MAX_UPLOADS_PER_DAY=300` cap + magic-byte image validation (`_sniff_image`) rejecting non-image bytes. Verified fake PNG → 400, real PNG → 200.
- **[LOW] Lint**: removed unused `FALLBACK_IMG` import (sponsors), unused `price` (admin), renamed ambiguous `l`→`lnk`.
- SEC-002 (spoofable client-IP headers) already mitigated in code via `peer_is_trusted_proxy`; remains a P3 infra reminder to confirm ingress strips inbound `cf-connecting-ip`/`true-client-ip`.

**Logo — thick glossy black ring on all red versions** (Gemini 3.1 edit + PIL flood-fill cutout). Updated: `logo-mark.png`, `logo-bubble-master.png` (transparent masters), `logo-mark-full.png` (dark-red bg), `ff-logo-1024/512.png/.jpg`, `logo-mark-192/512.png`, `logo-mark-maskable-512.png`, `apple-touch-icon.png`, and all 14 `splash/*.png`. Bumped `FF_BUILD` → `2026.06-172`. NOTE: gold `logo-mark-light.png` left unchanged (not red). Business-card composites (`ff-card-4096x2304.*`, `ff-business-card.*`) still use the pre-ring logo — pending user go-ahead to regenerate.


## 2026-06-11 (fork) — Security re-audit remediation

Re-audit verdict: CONDITIONAL PASS (all 4 new features verified safe). Fixed:
- **[MEDIUM] Poisoned crawl links (stored XSS / open-redirect)**: `CrawlStop.google_url` now validated to `http(s)://` only (rejects `javascript:`/`data:` etc.) in `models.py`; verified `javascript:alert(1)` is stripped to empty while https URLs pass. Frontend `PubCrawlDialog.jsx` adds a `safeHttp()` guard on both the "Map" anchor and the leg `dirUrl` fallback (defense-in-depth).
- **[P3] Webhook abuse**: `/paypal/webhook` now has `rate_limit(60)` + 100KB body-size bound (`sponsors.py`). Forged event still correctly 400s.
- **[P3] Alert in request path**: the 90% Resend email is now fire-and-forget (`asyncio.create_task`) with a 10s `wait_for` timeout, so the threshold-crossing request never stalls (`core.py`).
- Noted infra-only P3 (confirm ingress strips client `cf-connecting-ip`/`true-client-ip`) — no code change.
- FF_BUILD → `2026.06-134`.


## 2026-06-11 (fork) — Summer water/gull polish + PayPal webhook live

- **Ocean shimmer** reworked for realism + mobile: driven by GPU `transform:translateY` (mobile refused to animate `background-position`), warped into organic S-curve ripples via an SVG `feTurbulence`+`feDisplacementMap` filter (`#ff-sea-warp`), sparse/soft/irregular glints flowing slowly shoreward, brightness tuned up. (`Home.jsx` ocean block + `.ff-sea-*` in `index.css`).
- **Seagulls**: added wingbeat (`.ff-gull` scaleY flap), bumped to 8 birds with **negative staggered delays** so none sit frozen off-screen at load (fixes "appearing/disappearing" + "not moving"), GPU hints to stop mobile throttling.
- **PayPal webhook LIVE**: `PAYPAL_WEBHOOK_ID=2YH39827SD3373602` set; forged event correctly rejected (400), signature verification confirmed active. Enables auto activate/cancel/suspend/expire of sponsors. (Must also be set in production env + redeploy.)
- FF_BUILD → `2026.06-133`.


## 2026-06-11 (fork) — Cap raise, 90% email alert, Summer mobile fix, secret hygiene

- **Google cost cap raised 160 → 300** (`core.py` default; overridable via `GOOGLE_SEARCH_DAILY_CAP`). Alert threshold `GOOGLE_SEARCH_ALERT_PCT=90`.
- **Daily usage email alert** via Resend (`core.py::_send_google_cap_alert`): fires exactly once/day when usage crosses 90% (270/300), tracked idempotently via an `alerted` flag on the Mongo `google_budget` doc. Falls back to log-only when Resend not configured. Local imports (asyncio/resend) used to survive the recurring checkpoint import-stripping. Test email delivered successfully to stevelammerts@gmail.com. Env: `RESEND_API_KEY`, `ALERT_EMAIL_TO`, `SENDER_EMAIL` (default onboarding@resend.dev). `/admin/cost-status` now also returns `alert_pct` + `alerted`.
- **Summer theme mobile fix** (`Home.jsx` + `index.css`): seagulls 5 → 6 with shorter/overlapping durations + `will-change:transform` + `backface-visibility:hidden` so mobile Safari no longer throttles/freezes them; ocean shimmer strengthened (0.12→0.30 white, 0.55→0.9 opacity, `mix-blend-mode:screen`) so it's visible on bright mobile screens. Verified on 402px viewport.
- **Secret hygiene**: removed hardcoded admin password `GrimReaper!2026` from 6 tracked `backend/tests/*.py` files — now read from `os.environ["ADMIN_PASSWORD"]`. Confirmed no `.env`/Resend/PayPal/Google secrets are tracked or in git history.
- Bumped `FF_BUILD` → `2026.06-124`.
- GitHub "third-party OAuth app (Resend)" email was benign — user's Resend signup via GitHub OAuth (`user:email` scope only).


## 2026-06-11 (fork) — Admin "Security & cost" widget

- New endpoint `GET /admin/cost-status` (`admin.py`, admin-gated): returns today's billed Google search/geocode count, the daily cap, remaining, percent used, and last-7-days history from the Mongo `config` google_budget counters.
- New dashboard card in `Admin.jsx` (`data-testid="cost-card"`): live usage vs cap with a color-coded progress bar + status pill (Healthy <70% green / Watch 70-90% amber / Near cap ≥90% red) and a recent-days list. Verified via screenshot (118/160, 73.8%, "Watch", 4-day history).
- Bumped `FF_BUILD` → `2026.06-123`.
- Note: had to re-fix the recurring trailing-garbage file corruption (this time in `Admin.jsx`) that the fork checkpoint keeps introducing.


## 2026-06-11 (fork) — Security audit remediation

Audit verdict: CONDITIONAL PASS. Remediated:
- **[MEDIUM] Atomic Google daily cost cap** (`core.py`): replaced check-then-increment (`_google_budget_ok` + `_google_record_call`) with a single race-safe `_google_reserve()` using `find_one_and_update` `$inc` + `ReturnDocument.AFTER`, rolling the counter back when a reservation lands over the ceiling. Updated both callers in `places.py` (geocode + cached search). Verified: 50 concurrent reservations against a cap of 10 → exactly 10 granted, counter settled at 10.
- **[P3] CORS tightened** (`core.py`): `ALLOWED_ORIGIN_REGEX` no longer trusts arbitrary `*.emergentagent.com` service subdomains — now only `*.fork-fate.com` + `*.preview.emergentagent.com`.
- **[P3] Crawl share codes** lengthened 5→8 chars (`crawls.py`), reducing enumeration surface (~1T space). Existing codes still resolve.

Deferred (documented, low impact): shared-store rate-limit/login-lockout (adds per-request Mongo round-trip + latency for marginal benefit on multi-replica); analytics click/impression endpoints already rate-limited and only touch existing sponsors; subscription-status already withholds business name unless active (needed for sponsor success-page polling).


## 2026-06-11 (fork) — Spanish Translation Phase 2 complete (crawl dialogs)

- Fixed a build-breaking corruption at the end of `PubCrawlDialog.jsx` (leftover duplicate JSX from a mid-edit) that was crashing webpack.
- `PubCrawlDialog.jsx`: wrapped remaining strings in `t()` — dialog title ("Tu/Grupo Ruta de bares"), description, crew line, share text/toasts, aria-labels, and crawl-type labels. Crawl type names now translate per user request (Pub Crawl → Ruta de bares, etc.).
- `CrawlBadgeDialog.jsx`: added `useLang` hook and wrapped all UI chrome — "Crawl Complete", "Congratulations", selfie CTAs, privacy/orientation notes, buttons, placeholders, and toasts. NOTE: the badge canvas graphic + its live mirror preview deliberately stay English as a brand artifact.
- Added ~45 neutral LatAm Spanish keys to `i18n/i18n.js`.
- Bumped `FF_BUILD` to `2026.06-122` for PWA cache-busting.
- Verified: app compiles (only harmless eslint dep warnings) and renders cleanly in Spanish.


## 2026-06-11 (cont. 2) — Per-theme shuffle/reveal audio system + scene polish

### Per-theme audio (shuffle ambience loops during deck, reveal sound on land)
Wired in BOTH `runShuffle` and `runCrawlShuffle` (Home.jsx) via `grooveRef` (shuffle loop) + `thunderRef` (reveal). `grooveRef` stopped on reveal + on unmount + before each new spin. All respect `localStorage.ff_muted`.
Matrix:
- Tiki: shuffle `/reveal-drums-groove.wav` (danza-concheros build, non-loop) → reveal `/reveal-drums-boom.wav` (3× timpani).
- Cyber: shuffle `/reveal-cyber-radio.wav` (loop, futuristic-city cop dispatch via OpenAI TTS onyx/ash + radio FX) → reveal `/reveal-electric.wav`.
- Summer: shuffle `/shuffle-seagulls.wav` (loop, real sea+gulls, user upload) → reveal ta-da.
- Spring: shuffle `/shuffle-spring.wav` (loop, real birds+water, user upload) → reveal `/reveal-koto.wav` (user upload).
- Steam: shuffle `/shuffle-jacobs.wav` (loop, real Jacob's-ladder, user upload) → reveal `/reveal-steam.wav` (real steam release, user upload). Reaper voice cue removed for steam.
- Winter: shuffle `/shuffle-winter.wav` (loop, sleigh/christmas bells, user upload) → reveal `/reveal-santa.wav` (ho-ho-ho, user upload).
- Dark: reaper voice cue → thunder (unchanged).
Audio build scripts in /app/scripts/: make_reveal_drums.py, make_cyber_radio.py (uses emergentintegrations OpenAITextToSpeech + EMERGENT_LLM_KEY), make_seagulls.py (synth, replaced by real upload). Source mp3s in /tmp. mp3 decoding via imageio-ffmpeg binary (pip installed).

### Steampunk scene rebuild
- Removed spinning gears overlay from scene; removed then re-added `wall` (steam-wall.png) BEHIND console+device, enlarged to maxHeight 70vh.
- Left `console` enlarged to h-[74vh], z-[4], sits in front of wall.
- Removed original wall/gears, added `device` = `/steam-arc-device.png` (rembg-isolated AI table+Jacob's-ladder) at bottom-right with an animated electric arc (SVG polyline + ffArcClimb/ffArcFlicker/ffArcGlow keyframes) climbing between the electrodes.
- Roof cables: STEAM_CABLES (22 swaying pendulum cables from top, ffCableSway keyframe).
- **Steam card back** now shows spinning `/steam-gears.png` (ffSpin) instead of the logo. Verified live.

### Cyber
- Neon sign re-centered (wrapped in centered container; float animation was overriding -translate-x-1/2).

### Verified live (spent ~3 Google Places calls, credits recharged): Tiki mask card backs + Steam gear card backs render in the shuffling deck.
- FF_BUILD → 2026.06-99.


## 2026-06-11 (cont.) — Tiki polish: readability, flame, fringe, mask, reveal audio

### Dark/ambiance readability (USER REQUEST)
- Fixed dark-on-dark text on dark/ambiance themes: "fates dealt / crawls survived" counters, "YOUR ZIP CODE" label, "CUISINE" label + "+N more" button now use theme-aware color (`ambCfg.sky`, or white for `dark`). Added `labelColor` in `Home.jsx` and threaded it into `Filters.jsx`. Seasonal/light themes untouched (still use existing CSS overrides).
- Radius slider now starts at **0 mi** (min 0, label "0 mi").

### Tiki scene
- Torch & totem moved farther from the bar (`left-[-6%]`/`right-[-6%]`). Bar not resized this session.
- **Grass fringe** is now a child of the `<header>` (`absolute top-full`), so it moves/scrolls WITH the banner and stays aligned at any width; darkened (`brightness(0.8)`); share bar bumped to `z-40` so the social icons sit in front of the fringe.
- **Animated flame** (kept default "warp"): split `/tiki-torch.png` into `/tiki-torch-base.png` (static) + flame frames. Warp set = 5 frames warped from the original (`tiki-flame-1..5.png`); Gen set = 4 rembg-isolated AI fire frames (`tiki-flame-gen-1..4.png`). Cross-faded via `ffFlameCycle` keyframe; swap via `localStorage.ff_flame = 'gen'|'warp'`. Only the flame flickers, not the torch. Scripts: `split_torch_flame.py`, `make_flame_frames.py`, `make_gen_flames.py`.
- **Tiki mask card back** (`/tiki-mask.png`, rembg-isolated AI carved mask): `CardBack` now has a dedicated `tiki` branch showing the mask; `steam` split back out to the logo. (Card back only shows during a reveal shuffle — code verified, not visually tested to preserve Google quota.)

### Tiki reveal audio (USER REQUEST, iterated with user)
- Tiki reveal now plays `/reveal-drums.wav` (replaces reaper voice + thunder) in both normal and crawl shuffle paths.
- Final audio = user-uploaded **danza concheros** groove excerpt (~7s) building quiet→loud (ease-in crescendo) → tiny gap → user-uploaded **cinematic timpani**, pitched **down one octave** (2× resample), trimmed to ~1.5s with fade, layered as **3 simultaneous timpani** (root + fifth + octave chord). Script: `make_reveal_drums.py` (uses imageio-ffmpeg to decode mp3). Source mp3s in /tmp (danza.mp3, timpani.mp3).
- Cache-buster `FF_BUILD` bumped to 2026.06-88.


## 2026-06-11 — Session: Light/Dark theme toggle (public pages) + horizontal crawl award

### Theme menu + Fall (autumn) seasonal theme (USER REQUEST, tested iter57/58)
- Replaced the Sun/Moon toggle with a **"Theme" dropdown** (`theme-menu-button`) → Dark / Light / Fall. One-time discovery hint bubble (`theme-hint`).
- New **Fall theme** (`data-ff-theme="fall"`): warm cream page with a realistic ancient oak tree on the right, three jack-o'-lanterns + pumpkins at the base, and tumbling leaves (CSS `ffLeafFall`/`ffGlow`). Burnt-orange/red + brown accents via a `[data-ff-theme="fall"]` CSS block. Shuffle shows autumn **leaves** instead of cards (landed winner still flips to the restaurant photo).
- `useTheme` now supports/persists `'dark'|'light'|'fall'` (shared store).
- Assets: `/fall-tree.png`, `/fall-pumpkins.png`, `/fall-jackolanterns.png`, `/leaf-{red,orange,yellow,brown}.png`.

### Light-mode dialogs
- All portaled dialogs (`data-ff-dialog`: Add spot, Sponsor, Pub Crawl, iOS Install) now light-theme in light/fall via one scoped CSS block; `AddRestaurant`/`Sponsor` were already light. `GroupVote` is inline (auto-recolored).



### Light-mode accent recolor + polish (USER REQUEST, tested iter55/56)
- Recolored the entire light-mode accent: red → sage green (`#A8C99E` fills / `#4F6F47` text) and black → warm tan (`#D8C3A5`), via theme-scoped CSS overrides in `index.css` (`[data-ff-theme="light"] [data-ff-scope="app"] ...`). Deep green/brown text on pastel fills for contrast. Removed the red glow on green buttons.
- `useTheme` refactored to a **shared store** (`useSyncExternalStore`) so all consumers (Home, FavoritesDrawer, CrawlBadgeDialog) sync on toggle — fixed FavoritesDrawer staying dark.
- `FavoritesDrawer` fully theme-aware (was invisible white-on-white trigger + dark drawer in light mode).
- Header: toggle now shows a "Light"/"Dark" word label; bigger `Fork·Fate` title; "Add spot" button tan in light.
- Primary CTA copy in light = "Shuffle the Deck".
- Footer fully themed for light (cream bg, light logo, dark text, green/tan accents); disclaimer reads "A word from management:" (no reaper/skull — uses UtensilsCrossed icon) with sign-off "— The Fork·Fate team".


### Light/Dark theme (USER REQUEST, tested iter53/54 — 100% pass)
- New `hooks/useTheme.js`: localStorage `ff_theme`, default **dark** (Grim Reaper), sets `document.documentElement.dataset.ffTheme`.
- Header Sun/Moon toggle (`data-testid=theme-toggle-button`) with rotate/scale hover.
- Light mode = professional cream/editorial reskin: faded bright café background (`/cafe-bg-light.png`), light header, cream+bronze `F·F` logo (`/logo-mark-light.png` — cream dome, metallic-brown ring & big F·F, gold silverware), softened copy ("Deal Your Fate!"→"Spin the Wheel", reaper-line→`LIGHT_LINES` via `lightLineFor`), coffee+bagel playing-card backs (`/card-back-light.png`) during shuffle (restaurant photo still on landed winner), no skeleton hand, cheerful **Ta-Da!** reveal sound (`/reveal-tada.wav`) instead of thunder.
- Dark mode unchanged. `homeConstants.js`: added `LIGHT_LINES`/`lightLineFor`.

### Pub-Crawl award redesign (USER REQUEST, tested iter54)
- `CrawlBadgeDialog.jsx` rewritten: badge is now a **horizontal 16:9 card** — Fork·Fate logo LEFT, congratulations MIDDLE, selfie box RIGHT. Theme-aware (cream/professional in light, red/black in dark). Light mode skips the reaper cinematic and plays Ta-Da. Story (9:16) variant retained for IG.

### Backlog idea captured
- Seasonal/monthly themes (fall/winter/spring/summer) — future enhancement on top of the theme system.


## 2026-06-10 — Session: reward reveal, thunder, crawl-first-stop, security, passkey, iOS install

### Crawl reward reveal (USER APPROVED)
- Replaced the cartoony CSS "wall of fire" with: a red radial burst flash + the golden-gradient "Congratulations" surging forward out of darkness (scale 0.28→1, blur 14→0). Fire CSS removed; kept `.flame-text` golden gradient. `CrawlBadgeDialog.jsx` + `index.css`.
- Thunder clap (`reveal-thunder-v4.mp3`) fires ~350ms into the badge cinematic, synced to the shocked reaper's face jolt; respects `ff_muted`.

### Crawl reveal card = first stop (USER REQUEST, tested iter51)
- `homeConstants.js`: shared `orderCrawlRoute` + `crawlHaversine` helpers (dedup from PubCrawlDialog).
- `Home.jsx` `dealCrawl`/`doSearch`: pick+order stops up front, land `runCrawlShuffle` on `ordered[0]`, pass `initialStops` to the dialog. `PubCrawlDialog.jsx` uses `initialStops` when provided so the reveal card == stop #1.

### Security hardening (USER APPROVED, tested iter51/52)
- JWT now carries `iss=fork-fate` + `aud=fork-fate-admin`; `require_admin` validates issuer/audience (require exp/iss/aud). Pre-change tokens rejected.
- Global admin-login throttle (`admin_login_throttle`, 30/60s across all IPs) on `/admin/login`, complementing per-IP limit.
- CORS restricted via `allow_origin_regex` to `*.fork-fate.com` + `*.emergentagent.com` (server.py); `*` no longer used.

### Admin passkey / WebAuthn login (NEW, tested iter52 with CDP virtual authenticator)
- Backend `routes/passkey.py` (webauthn 3.0.0): register-options/verify (JWT-gated), status, delete, auth available/login-options/login-verify (issues admin JWT). Stored in Mongo `admin_auth` doc `_id="admin"`.
- Origin/RP_ID derived per-request; `_request_origin` PREFERS `x-forwarded-proto`+`x-forwarded-host` (real external host) because the Emergent ingress rewrites the browser Origin to an internal `emergentcf.cloud` host. WebAuthn's signed clientDataJSON.origin is the real cross-origin defense.
- Frontend `Admin.jsx`: "Add passkey"/"Passkey on" in header, "Unlock with fingerprint / Face ID" on login screen (shown when `/auth/passkey/available`). @simplewebauthn/browser v13 `{optionsJSON}` API.
- Verify handlers scrub raw exception detail (log server-side, generic client message).

### iPhone install UX (NEW, verified via screenshot)
- `InstallAppButton.jsx`: on iOS, opens a step-by-step popup (Share → Add to Home Screen → Add) instead of a toast; detects non-Safari iOS browsers and tells the user to open in Safari.
- Added 180×180 `apple-touch-icon.png` (black bg composite) + explicit `<link>` in index.html.

### Cache-buster
- FF_BUILD bumped through 2026.06-49. Bump on each UI ship.

### Security audit remediation — SEC-001 + SEC-002 (verified)
- Audit verdict was CONDITIONAL PASS (no critical/high). Fixed the two actionable items in `core.py` + `routes/admin.py`:
  - SEC-001 (admin-login DoS): replaced the single GLOBAL login throttle with a PER-IP failed-attempt lockout (`check_login_lockout`/`record_login_failure`/`clear_login_failures`, 8 fails / 5 min per IP) + a generous 240/min global backstop. An attacker can only lock their own IP, not the admin. Verified via unit test (locks attacker at attempt 9, different IP unaffected) + curl (correct login still works).
  - SEC-002 (header-spoof rate-limit bypass): `client_ip` and `_request_origin` now trust CF/forwarded headers only when the direct TCP peer is a private/loopback proxy hop (`peer_is_trusted_proxy`, mode via env `TRUST_PROXY_HEADERS`=auto|always|never). Verified peer in this env is 10.x (private) and WebAuthn rp.id still resolves to the real host.
- Removed `admin_login_throttle`; `admin_login` now takes `request` and uses the per-IP lockout. No .env change (TRUST_PROXY_HEADERS defaults to auto). Backend-only change — no FF_BUILD bump needed.
- Deferred (P3 hardening, user not requested): secrets rotation to a manager, JWT in localStorage, auth on /sponsors/subscription-status.
- Added `qrcode` lib. `buildFateCard()` in `Home.jsx` now draws a scannable QR (→ window.location.origin, i.e. fork-fate.com in prod) on a white rounded box bottom-right, with a left-aligned "Scan the code to shuffle your own fate" CTA. Drives new diners from screenshot shares. FF_BUILD 2026.06-50.
- Note: existing share flow (Web Share text, Fate Card image download, SocialShare FB/X/WhatsApp/IG/Copy) was already present — the QR is the additive enhancement.
- After several iterations the user reverted to the ORIGINAL first version and asked to ONLY drag the wrist down.
- FINAL values in `Home.jsx` ShufflingDeck: hand `w-[310px]`, overlay transform `translate(-50%, calc(-50% + 48px))`. CardFront is the ORIGINAL (photo `inset-[13px]`, thin red borders `inset-2 /70` + `inset-[10px] /25`, `bg-[#0E0E0E]` class). Card container `bg-[#0E0E0E]` class. DO NOT widen the hand or change the card frame — the user rejected the bolder-frame + wider-hand experiments.
- Recurring gotcha this session: the user repeatedly saw STALE builds (mobile/PWA + production cache). Always confirm environment (preview vs fork-fate.com) and advise an incognito/fresh load before iterating on visuals.

### Guardrails
- LIVE PAYPAL + PRODUCTION at fork-fate.com. Preview changes are preview-only until redeploy.
- Google Places capped 160/day; only the winning reveal card uses a billed Google photo.

## 2026-06-11 — Seasonal themes completed + asset transparency fixes
- Completed Winter, Spring, Summer seasonal scenes (generalized SEASONS config, SeasonScene, ShufflingDeck season sprites).
- Fixed runtime crash: added missing lucide icons (Snowflake, Flower2, Umbrella); removed stray corrupted lines + undefined `fall` var in Home.jsx.
- Summer: flying seagulls (ffFly), realistic beach umbrella + 2 chairs facing ocean + beer bottle; palm tree restored.
- Spring: Chinese gazebo + blossom tree decor, enlarged right cherry-blossom tree layered above gazebo, pink button/slider palette.
- Winter: tree flipped to left, cottage enlarged (fills page) on right.
- All seasonal objects faded to opacity 0.32 (like light theme) so UI text pops.
- CRITICAL FIX: Gemini-generated "transparent" PNGs had checkerboard baked in (0% alpha). Cut out via rembg (decor) + chroma-key green/blue (regenerated decor) + flood-fill de-checker on ORIGINAL tree backups (preserves exact approved trees). Backups in /app/scripts/orig_backup.
- FF_BUILD bumped to 2026.06-68.

## 2026-06-11 (cont.) — 3 ambiance themes + auto-season + themed award card
- Added 3 dark ambiance themes: Cyberpunk (rainy neon skyline, flickering neon FORK·FATE sign, 2 flying spinners in opposite directions, cyan accents), Steampunk (brass pipes + gauges + rising steam, brass accents), Tiki Lounge (carved bar w/ voodoo mask + rum, lit torches, amber accents). AmbianceScene + AMBIANCE config in Home.jsx; assets keyed via chroma-green.
- Per-theme accent CSS for cyber/steam/tiki + slider accents for fall/winter/summer/spring. `light` now = non-dark/non-ambiance set.
- Award card (CrawlBadgeDialog) now adopts each season's accent (was mirroring light/dark only).
- Shuffle card backs themed: cyber = neon Fork·Fate, steam/tiki = logo mark.
- Auto-season: first-visit default picks season by date (Northern) then refines hemisphere via ipapi.co latitude; manual pick persists and overrides. useTheme.js.
- FF_BUILD=2026.06-73. New public assets: cyber-skyline, cyber-neon-logo, cyber-car, steam-pipes, tiki-bar, tiki-torch, tiki-decor.
- NOTE: shuffle card backs implemented but not visually verified in a live deal (needs geolocation + Google Places).

## 2026-06-11 (cont. 2) — Ambiance theme polish
- Cyberpunk: neon FORK·FATE billboard floats in sky (behind cars, centered via content-crop), 2 distinct flying spinners in opposite directions (fixed off-screen start via fill-mode both), purple secondary buttons + purple pub-crawl outline, neon-purple sky/hero text, rain + skyline.
- Steampunk: horizontal gear/pipe machinery wall (rotated from the vertical panel design) along the bottom, brass console left, rotating gears (ffSpin), fewer irregular steam vents, cream hero text.
- Tiki: single left bamboo torch (flame-only flicker, no bob) + right totem pole + center bar + top grass valance + torch glow on bar.
- Hero heading/description now use per-ambiance light 'sky' color for readability on dark scenes.
- New assets: cyber-car2, cyber-console(unused), steam-console, steam-gears, steam-wall (rotated vertical), tiki-totem, tiki-grass. FF_BUILD=2026.06-83.
- NOTE: shuffle card backs (cyber neon / steam+tiki logo) implemented, not yet verified in a live deal (needs geolocation + Google Places quota).

## 2026-06-11
- Fixed Fall tree mobile slash: canopy was cropped at PNG top edge. Regenerated a twisted-trunk autumn tree on green-screen, chroma-keyed for clean transparency (preserves full canopy), enlarged in scene (treeH override) and scaled scarecrow down for realistic proportion.
- Made Fall hazy moon whiter (radial white gradient + white glow).
- Bumped FF_BUILD to 2026.06-109.
- Verified for redeployment (iteration_60): deployment scan PASS; backend 14/14, frontend 100%, no issues. Confirmed Sponsor Analytics (impressions in places.py, clicks in RestaurantCard, admin CTR UI) and Submission Moderation (admin approve/reject) already complete.
- Security audit (iteration): CONDITIONAL PASS. Fixed SEC-001 (MEDIUM open-redirect) — /api/sponsors/subscribe now validates payload.origin via origin_allowed(), returns 400 on disallowed origins (verified). Remaining: SEC-002 wildcard CORS at edge (ingress-level, low risk); P3 hardening items (shared cost-cap counter, subscription-status name echo, /cuisines pending leak).
- Security P3 hardening (all fixed & verified): (1) Google daily cost cap now Mongo-backed atomic counter in db.config {key:google_budget,date} — restart-safe & multi-replica safe (core.py _google_budget_ok/_google_record_call async; places.py awaits). (2) GET /cuisines excludes status:pending. (3) GET /sponsors/subscription-status echoes business name only when active, else null.
- Fixed themed-header inconsistency on mobile: FavoritesDrawer treated only theme==="light" as light, so seasonal themes (fall/winter/spring/summer) used the dark palette -> white "Favorites" text invisible on light bg. Now treats all non-dark/non-ambiance themes as light. Verified summer/winter/tiki/dark mobile headers now match reaper (Favorites/Guided/Download all legible). Bumped FF_BUILD to 2026.06-110.
- P2 shipped: theme-stamped shareable Fate Card. buildFateCard(card,theme) now dispatches to a per-theme themed card (FATE_CARD config: bg gradient, accent, hero art, headline, seasonal scatter) for all non-dark themes; Dark keeps the reaper/skeleton-hand card. Verified rendering for fall/winter/summer/cyber/steam/tiki via standalone canvas test. FF_BUILD at 2026.06-110.
- Fixed Summer palm crop on mobile (same root cause as fall): summer-tree.png fronds were cut at the PNG top edge. Regenerated a full-crown coconut palm on a magenta screen (green-screen would eat green fronds), chroma-keyed with de-spill, replaced /summer-tree.png. Verified summer mobile scene. FF_BUILD -> 2026.06-111.
- Fixed Steampunk mobile overlap: the console (control panel, z-4, h-74vh left-[-2- Fixed Steampunk mobile overlap: the console (control panel, z-4, h-74vh) obscured the Jacobs-ladder arc device on mobile. Added mobile offsets to slide them apart (console further left + smaller; device further right) with sm: overrides preserving desktop. Verified on preview mobile. FF_BUILD -> 2026.06-112.
- Tiki polish: enlarged bar (responsive w mobile/desktop), slimmed torch & totem, added a mirrored second torch outboard of the totem; all sized with sm: overrides to scale on mobile+desktop.
- Summer palm follow-up: after the crop fix the new palm rendered small and its trunk sat behind the beach-chair decor on mobile. Added treeH (h-60svh mobile / h-92vh desktop, z-3) so the palm is larger and drawn above the chairs. FF_BUILD -> 2026.06-114.
- Summer chairs overlap fix: added decorLeftW override; summer chairs shrunk on mobile (w-92vw -> w-50vw) so they no longer overlap the palm. Only affects summer (spring keeps its size). FF_BUILD -> 2026.06-115.
- Summer ocean backdrop: added a full-width CSS ocean band + foam shoreline (percentage-based, scales mobile/desktop) behind palm/chairs (cfg.ocean). Removed the baked-in beach (ocean+sand) from summer-decor.png via rembg so the umbrella+chairs+bottle now composite cleanly onto the scene's real ocean/sand (no more isolated "stream in the desert" patch). FF_BUILD -> 2026.06-116; then dropped the summer water line ~3% (shoreline 62% -> 65%), FF_BUILD -> 2026.06-117.
- Added CSS-only summer ocean shimmer (ffSeaShimmer + ffSeaBob keyframes). Ran mobile sweep across all 9 themes (all clean). Deployment readiness scan: PASS (no blockers). FF_BUILD -> 2026.06-118. Ready for redeploy.
- i18n Phase 1: EN/ES language toggle. Added src/i18n/i18n.js (LangProvider/useLang, English-string-keyed neutral LatAm Spanish dict, localStorage 'ff_lang' persistence + navigator.language auto-detect). Header EN|ES pill toggle. Translated full Home page: header nav, hero (all modes), controls/filters, mode tabs, crawl planner, counters, how-it-works, FAQ, footer, reveal stage, plus FavoritesDrawer, InstallAppButton, SocialShare. Live restaurant data stays English. Verified: live switch, persistence across reload, browser-detect, no i18n console errors. FF_BUILD -> 2026.06-120. PENDING (Phase 2): dialogs (BecomeSponsor, AddRestaurant, guided intro wizard, GroupVote, CrawlBadge) still English.
- 2026-06 UI polish (FF_BUILD -> 2026.06-151):
  - App icon white/silver ring fix: logo-mark-512/192.png + apple-touch-icon.png regenerated from logo-mark.png master. Removed the glossy silver rim and filled the square with a deep-maroon radial background so the red FF badge bleeds edge-to-edge (no white border on the installed home-screen icon). Script cropped inner disc (center 511,498 / red radius ~322) over gradient inner #560810 -> outer #1a0305.
  - Reaper (data-ff-theme="dark") panel theming: the How-it-works and FAQ boxes use bg-white/95 which the existing `.bg-white` Reaper override never matched, so they stayed stark white. Added overrides for .bg-white/95, .bg-white/90, .bg-white/60 -> faint gray #D6D3DC to match the rest of the Reaper UI.
  - Toggle thumb visibility fix (Open now / Group / Pub Crawl): off-track bg-[#D5D8DC] darkened to #7C7986 in Reaper so the gray thumb stays visible.
  - Location button already turns red when coords granted (bg-[#E01E26]); confirmed no change needed.
  - User confirmed fixes look good and is deploying.
- 2026-06 Yearly sponsorship + revenue email button + install nudge + Reaper lightning (FF_BUILD -> 2026.06-153):
  - Yearly sponsorship plan ($290/yr = 2 months free, NO trial, charged up front) alongside $29/mo. Backend: core.py SPONSOR_PRICE_ANNUAL="290.00"; sponsors.py refactored ensure_paypal_plan(period) + _ensure_paypal_product + _plan_spec, subscribe accepts plan monthly|yearly (cached under config keys paypal_plan / paypal_plan_annual). models.py SponsorSubscribe.plan field (validated). Sponsor doc stores billing_period. admin.py MRR now normalizes yearly (=/12) via _monthly_value; stats + summary email add yearly_subscribers. Frontend: BecomeSponsorDialog Monthly/Yearly toggle with 'Save $58/yr' badge + note switching. ES i18n added.
  - Monthly sponsor revenue email: backend was already complete (build_sponsor_summary + POST /admin/email-summary + _monthly_summary_loop auto on 1st). Added the missing frontend on-demand 'Send summary now' button in Admin Security&cost card (data-testid=send-summary-email-button). Curl-verified: login ok, stats returns yearly_subscribers, email-summary -> {sent:true}.
  - Install nudge: Home.jsx dispatches 'ff:shuffle-success' ~2.5s after a reveal; InstallAppButton shows a one-time toast (guarded by localStorage ff_install_nudged) with an Install action wired to the real deferred prompt / iOS flow.
  - Reaper lightning: occasional thin lightning tendrils (2 SVG bolts + faint sky-flash) behind the reaper, index.css ffBolt keyframes (brief double-flicker + long dark gap), opacity-only (GPU-safe), reduced-motion aware.
  - Testing agent iteration_61.json: frontend 100% pass (sponsor toggle, admin email button). Install nudge non-testable headless (platform beforeinstallprompt). Deployment audit: PASS (only WARN = one-time ML asset scripts, not runtime).
- 2026-06 PWA installability + splash root-cause fix (FF_BUILD -> 2026.06-162):
  - ROOT CAUSE: app had NO service worker and an inline script that actively unregistered any SW + purged caches. Chrome (2026) requires a registered SW with a functional fetch handler to fire beforeinstallprompt, so the "Download the app!" button never got a real Android install (fell through to a toast). Without a true install, Android used a generic shortcut icon/splash — which is why manifest splash/icon changes "never took" in production.
  - FIX: added /public/service-worker.js (minimal network-passthrough, no caching -> no stale content risk; skipWaiting + clients.claim; SW_VERSION bumps to force update). Replaced the SW-purge script in index.html with a proper registration: navigator.serviceWorker.register('/service-worker.js',{scope:'/'}) on load. Verified served 200 as application/javascript; no SW console errors; app loads (guided intro shows).
  - Icon split retained: maskable=logo-mark-maskable-512.png (glossy red bubble, launcher), any=logo-mark-192/512.png (FF disc on black, splash). Once truly installed, manifest splash (black bg) + icons apply.
  - Also confirmed earlier fixes live on preview: guided intro shows on every app load; Liquor Store added to bar search.
  - USER ACTION for production: redeploy, then on phone REMOVE the old shortcut/app, revisit fork-fate.com in Chrome, tap + wait ~30s (engagement heuristic), then tap Download -> native install; reinstall required for new splash/icon.
- 2026-06 Sponsor photos + sponsorship visibility (FF_BUILD -> 2026.06-167):
  - Sponsor photo UPLOAD to Emergent object storage: core.py init_storage/storage_put/storage_get (httpx async, 403->reinit retry); server.py startup init; routes/sponsors.py POST /api/sponsors/upload-photo (jpg/png/webp, 5MB cap, stores db.files record) + public GET /api/files/{path} (Cache-Control 1d). Verified via curl (upload {path}; serve 200 image/jpeg).
  - Smart per-cuisine fallback: core.py CUISINE_IMGS + sponsor_fallback_image(category,cuisine,key); sponsors subscribe uses it instead of a single FALLBACK_IMG so photo-less sponsors get a relevant image (varies by cuisine/name), not one generic shot.
  - BecomeSponsorDialog: photo upload UI (preview, replace, remove) + secondary URL paste + helper note. EMERGENT_LLM_KEY already present in backend/.env.
  - Homepage 'Feature your business' band (feature-business-band) above footer: pitch + $29/mo & $290/yr (Save $58/yr) + CTA (feature-business-cta) -> opens sponsor dialog.
  - EN+ES i18n added. testing_agent iteration_62.json: 100% pass, no issues. Frontend compiles.
ROADMAP idea (user): future categories beyond food/drinks/bars/desserts -> antiques, gas stations, thrift/bookstores etc. ("local businesses roulette"). Modular add: category + Google Places query + cuisine chips.
