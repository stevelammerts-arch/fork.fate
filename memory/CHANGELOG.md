# Fork·Fate — Changelog

## 2026-02 (fork) — Local vs. chain tier split, Need Help sheet, coupons, social card

**Sponsorship tier split (local vs. national chain):**
- **New `tier` field on Sponsor** (`local` | `chain_coupon_only`; default `local`, existing rows treated as local via `$or` in the query so nothing breaks).
- **Fate deck query** (`places.py::fetch_active_sponsors`) now filters to `tier=local`. National chains **never** occupy a slot in the winner or 3 alternates — protects the local hidden-gem brand.
- **New public endpoint** `GET /api/coupons/chains-nearby?category=X&limit=N` returns randomized chain coupons for the current category.
- **New `<ChainCouponStrip>`** on the reveal card renders 1 bonus chain coupon as a subtle blue-gray strip beside the local winner: "Bonus offer nearby · {chain name}". Chains ride shotgun, users still see local first.
- **Admin `SponsorForm` tier selector**: "Local — appears in fate deck ($19/mo)" vs "National chain — coupon-only ($499/mo)". Copy explicitly frames the local-first positioning.
- **End-to-end verified**: test chain sponsor created → showed in `/coupons/chains-nearby` but was correctly excluded from `/places/search` fate deck.

**Need Help? sheet:**
- **In-sheet location controls**: ZIP input (auto-cleans to 5 digits) + "Use my location" button (geolocation API). Users can open the sheet fresh without having typed a ZIP in the main search first — critical for crisis moments.
- **Radius selector**: 5 / 10 / 25 / 50 mile chips (default 25). Sent to backend as `radius_mi`; clamped 1–100 and converted to Google's `locationBias.circle.radius`. Changing radius clears the results cache so a re-tap fetches fresh.
- **Trigger label** always visible on mobile (was hidden `sm:inline`).
- **Trigger renamed** "Nearby help" → **"Need Help?"** in the header.
- **6-category grid** (ER, urgent care, dentist, vet, pharmacy, food bank & pantry) — gas removed since it's covered by the main "Fuel & Go" tab.
- **Non-shuffle flow** — plain list of the 3 closest results per category, direct call-and-directions actions, no roulette animation (deliberately different from the main app).
- **Crisis lifelines strip** below chip picker: tel:988 · 988 press 1 (Veterans Crisis) · text 838255.
- **Inline sheet disclaimer**: "Not a medical/dental/vet service. In a life-threatening emergency, call 911."
- **Legal page**: new Section 4 "Nearby Help — Emergency, Medical & Care Listings" with "not liable for diagnosis, treatment, care, outcome, delay, or harm" language.
- **Veteran-owned & managed** mention in footer.

**Sponsor Coupon System (previous):**
- Coupon model, `<CouponReveal>` tap-to-reveal (winner + compact badge on alternates), `POST /api/sponsors/{id}/coupon-copy` deduped tracking, admin form fields.

**"Find us on Fork·Fate" social/print card (previous):**
- `GET /api/sponsors/{id}/social-card?format=square|story|pdf` — PIL + qrcode. Coupon-aware tagline: "FIND US & GET A COUPON AT FORK-FATE.COM".

**Dragon claw on shuffle-land, admin weekly-impressions tile, and P0 security fixes** — previously landed.


## 2026-06 (fork) — Hardenings, weekly leaderboard tab & Fall theme polish

- **CORS hardening**: `backend/.env` `CORS_ORIGINS` changed from misleading `"*"` (which the code already filtered out) to explicit `https://fork-fate.com,https://www.fork-fate.com`. Verified preflight from prod origin returns 204.
- **Removed client-side `ipapi.co` call** (`hooks/useTheme.js`): hemisphere for the seasonal default is now inferred from the device timezone's DST pattern — no network, no CORS error, privacy-friendly.
- **Weekly leaderboard**: `GET /api/crawls/leaderboard` now returns a `week` board (last 7 days) alongside `global`; public `/leaderboard` page gained an **All-Time / This Week** period toggle (`data-testid leaderboard-period-all|week`). Verified rendering.
- **Fall theme**: bumped tree/scarecrow/ground-pumpkins/owl opacity to 0.72 to match the jack-o'-lanterns; added a generated warm ground surface (`fall-ground.png`, slightly darker than sky) with small leaf piles and tiny in-scale leaves (`groundH`/`groundOpacity` config added to `SeasonScene`). Also added `treeOpacity`/`decorLeftOpacity` overrides earlier for Summer. Build → `2026.06-228`.



- `pages/Home.jsx` reduced **1,981 → 1,380 lines** by extracting two zero-coupling blocks (no behavior change):
  - `pages/homeFateCard.js` — Fate Card canvas utilities (`buildFateCard`, `buildThemedCard`, `buildReaperCard`, `loadImage`, `wrapLines`, `hexA`, `FATE_CARD`); moved the `qrcode` import here.
  - `components/home/RevealStage.jsx` — the spin-result component (result card, alternatives, share/respin/favorite actions).
  - Removed now-unused imports from Home (`QRCode`, `GroupVote`, `CheckInButton`, `RESULT_SPRING`, `DETAIL_*`, `reaperLineFor`, `lightLineFor`, icons `RotateCcw/Flag/Share2/ImageDown/Heart`). Build compiles with 0 warnings.
  - Verified end-to-end by testing agent (iteration_71, frontend 100%): deal → result card → respin → alternative swap → favorite → Share-as-image (buildFateCard) → reset → theme switch → crawl/leaderboard nav. Zero regressions.
- **Deployment-readiness scan: PASS** (deployment_agent) — no hardcoded secrets/URLs, env vars correct, /api routing + supervisor config valid, frontend build healthy. Build → `2026.06-222`.
- Note: pre-existing (not from refactor) `ipapi.co` client-side CORS console error on load — non-blocking geolocation fallback. Optional hardening: lock backend CORS from `*` to the production domain.



- `pages/Admin.jsx` reduced **733 → 359 lines**, now a pure container (all state, API calls, handlers) that composes new presentational components under `components/admin/`: `AdminLogin`, `StatsPanel` (MRR + cost/security card), `BetaTesters`, `SubmissionsQueue`, `SponsorForm`, `SponsorList`.
- Pure UI extraction — **zero behavior change**; every `data-testid` preserved verbatim. Verified end-to-end by testing agent (iteration_70, frontend 100%: login → all 18 dashboard testids → add/toggle/delete sponsor → logout).
- Removed now-unused imports from Admin.jsx. Frontend build compiles with 0 warnings.



- `POST /api/crawls/complete` now returns the crew's **global rank** (`rank_stops`, `rank_fastest`, `total`) computed with fastest-time tiebreak. Verified: faster crew outranks slower at equal stops; untimed crews get `rank_fastest: null`.
- `CrawlLeaderboard.jsx` shows a post-submit nudge ("Ranked #1 globally by stops · #1 fastest of N crews. Share it and dare your friends to beat you!") plus a "See the full Hall of Fate" link to `/leaderboard`.
- `CrawlBadgeDialog.jsx` share/story text auto-appends the taunt + `/leaderboard` link when a rank is known (`shareText()` helper); rank resets on each dialog open. Build → `2026.06-220`.

## 2026-06 (fork) — Public /leaderboard "Hall of Fate" page

- **New route `/leaderboard`** (`pages/Leaderboard.jsx`): standalone dark "Crawl Champions" hall-of-fame browsable without finishing a crawl. Global board with Most Stops / Fastest tabs, top-3 gold/silver/bronze chips, crown on #1, rank titles, staggered entrance animation, empty state + "Start a crawl" CTA. Linked from Home header via a new "Champions" button (`data-testid header-leaderboard-link`).
- `fmtTime` now also exported from `CrawlLeaderboard.jsx` for reuse by the page. Build → `2026.06-219`.

## 2026-06 (fork) — Pub Crawl Leaderboard + silent timing (gamification / viral loop)

- **New leaderboard** (`components/CrawlLeaderboard.jsx`): opt-in board surfaced inside the Crawl Complete/badge dialog via "See the Leaderboard". Team-name/nickname entry (no real names), then submits the run. Two scope tabs (**Global** + **Your Crew** — the latter only when a shared crawl `code` exists) × two sort tabs (**Most Stops** + **Fastest**). Top-3 get gold/silver/bronze rank chips; each row shows stops + time + a rank title.
- **Silent crawl timing** (`PubCrawlDialog.jsx`): a background clock starts on the **first check-in** (localStorage `${progressKey}_start`), no visible live timer. Duration computed at completion and passed to the badge/leaderboard so the "Fastest" board works.
- **Backend** (`routes/crawls.py`, `models.py`): `POST /api/crawls/complete` (`CrawlCompletionCreate`: team_name→"Anonymous Crew" fallback, stops 1-12, optional code + duration_seconds) stores to `crawl_completions`. `GET /api/crawls/leaderboard[?code=]` returns `{global:{stops,fastest}, crawl:{stops,fastest}|null}`, top-10 each; stops board = most stops desc w/ fastest tiebreak, fastest board = timed runs asc. Literal routes placed ABOVE `/crawls/{code}` to avoid shadowing.
- Community stat counter (`/api/stats/crawl-completed`) is unchanged and still counts every dialog-open; leaderboard submission is separate/opt-in (no double count).
- Tested: backend 11/11 pytest (`tests/test_crawl_leaderboard.py`), frontend full flow 100% (iteration_69). Build → `2026.06-218`. Preview-only; user must redeploy to reach fork-fate.com.



## 2026-07-15/16 (fork) — Tiki redo + Fall/Winter fixes + alternatives upsell

- **Tiki theme redesigned**: replaced scattered props (bar/torches/totem/grass) with a full **Tiki lounge interior** backdrop (`tiki-lounge-full.png`) + dark overlay for text legibility. Added **randomly twinkling string lights** (3 interleaved transparent overlays on the same 1264×848 canvas + identical `object-cover` → always aligned; opacity flicker via `ffTikiTwinkle`). Added a gentle **red flame** (no blue) on the tall straw drink and the empty coconut (3 cross-fading frames, `ffTikiFlame`).
- **Fall fix**: jack-o'-lantern pumpkins were translucent (tree showing through) — bumped their opacity to 0.72 via new `decorRightOpacity` config so they read as solid.
- **Winter fix**: Santa now flies **behind** the big tree on laptop (`sm:z-[1]` on santa, new `treeZ: z-[2]` on winter tree); still in front on mobile.
- **Result card "N more to consider"**: enlarged from tiny rows to tactile cards — 72px thumbnails, text-lg names, rating/distance, "PICK THIS" dice affordance, hover-lift, corner Sponsored badge, and a friendly re-roll subheading (more enticing for sponsored slots).
- Builds bumped through `2026.06-208`. All preview-only; user must redeploy to reach fork-fate.com.


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

## 2026-06 — Final UI/category tweak batch (verified, iteration_10)
- Explore chips: added `Safaris`, `Children's Museums` (homeConstants.js)
- Shop chips: added `Plant Shop`, `Craft Store` (homeConstants.js)
- `Skip intro` button restyled as bordered pill, dark green text (rgb(14,74,48)) for contrast (GuidedFlow.jsx)
- BUGFIX: Google Places results now stamped with `category` = requested category (places.py:185),
  so delivery/Order buttons no longer leak onto shops/explore/stay/fuel tiles.
- Verified by testing_agent: 7/7 backend pytest + full E2E frontend (Explore/Shops = 0 order buttons, Food = 6). No console errors.

## 2026-06 — Chip grouping, guided tour parity, per-chip Google queries
- Tabs: 8 modes now render as one 4x2 grid box (all visible, no horizontal scroll).
- Guided tour: Explore + Stay tiles added (8 total); radius max 150 mi for those two;
  Step 3 chips grouped with per-group "+N more" (new `groupMap` prop).
- Filters.jsx: new `cuisineGroups` prop + ChipSection (limit 10/group). Grouped:
  Food (7 groups), Bars (5), Explore (4). Other tabs stay flat A–Z.
- New Explore chips: swimming (Holes/Beaches/Public Pools/Aquatic Centers),
  Theme/Amusement Parks + Fairgrounds, Gyms/Fitness/Yoga/Pickleball/Tennis,
  Rock Climbing, Ski Resorts, Snow Tubing, Boat/Jet Ski/Paddleboard Rentals.
- BUGFIX (user report: "Breakfast + Filipino returned Subway"): places.py used to mash
  all selected chips into ONE Google textQuery. Now one query per chip (max 4,
  interleaved + de-duped) and each result is relevance-checked against its chip via
  `_CUISINE_TYPE_HINTS` (primaryType/name fragments). Result label = the chip name.

## 2026-06 — Phase 1: Fate Passport (verified, iteration_12)
- NEW backend routes/passports.py: POST /api/passports, GET /api/passports/{code},
  POST /{code}/stamp (GPS ring 0.4 mi -> verified, else 409; manual fallback), DELETE stamp.
  Stamps stored inside the passport doc (persist; no TTL). Models: PassportCreate, PassportStamp.
- NEW frontend page /p/:code (Passport.jsx) — progress bar, per-stop stamp/undo, directions,
  completion banner, share; lib/passports.js remembers codes per device.
- Home: "Fate Passport" toggle + 3-10 stop picker, mutually exclusive with Group/Crawl modes;
  Deal button becomes "Deal My Passport"; "Your passports" quick links.
- Also: Fuel tab -> "Fuel & Go" (+ grouped chips), Catering (Food/Style),
  Cake/Custom/Wedding Cakes (Desserts), Party Supplies/Home Decor/Furniture/Candle Shop (Shops).
- 14/14 backend pytest + full frontend e2e pass (iteration_12).

## 2026-06 — UX fixes (iterations 13-15, all verified)
- Summer theme buzz: /shuffle-seagulls.wav was a sustained ~1.35kHz sine drone
  (tonality 6813). Regenerated as surf noise + short gull glides (tonality 17).
  Generator: /app/scripts/gen_summer_shuffle.py
- Special modes were unusable on mobile (had to scroll up to Deal/radius/location):
  new components/home/ModeSetup.jsx puts a 3-step guide + ZIP + Use-my-location +
  radius + that mode's own Deal button inside each panel; main Deal button hides while
  a mode is active; panel auto-scrolls into view. Crawl panel got a guide + own radius.
- Passport/Group panels now include their own 8-category picker + "Dealing from X · types"
  summary (user dealt a Food passport thinking it was camping). MODE_TABS is now one array.

## 2026-06 — Iteration 16 batch (all verified by testing agent)
- AUDIO: every themed shuffle bed regenerated artifact-free (scripts/gen_theme_beds.py,
  audit via scripts/audit_audio.py). Root causes of user-reported buzz/zap: sustained pure
  tones, near-Nyquist aliasing energy, loop-seam clicks. fantasy now /shuffle-dragon.wav
  (mp3 pruned from public/); Home.jsx SHUFFLE_LOOPS replaces two duplicated maps.
  NOTE: the audit's tonality ratio inflates for bass-dominant beds (dragon = 857) because the
  median is taken over a passband that's mostly quiet — verified as broadband, not a tone.
- PHOTOS: cardImage(r) = photo_url || image, applied to alternatives, RestaurantCard,
  ShufflingDeck, GroupVote, FavoritesDrawer (splash-pad results were all hiking placeholders).
- Chip list now collapsible (filters-toggle) and auto-collapses on deal.
- Phase 2 Double or Nothing: two-tap dare -> random different pick -> locked (no respin,
  no alternatives). Home.doubleOrNothing + RevealStage locked state.
- Passports are deletable: DELETE /api/passports/{code} + two-tap delete on the page.
- Steampunk: two extra vents anchored to painted pipe mouths via an object-cover-matched
  overlay box (steam-vents / steam-jet-low / steam-jet-floor).

## 2026-06 — Hot Pursuit heist (Cyberscape) — self-tested via scripted browser beats
- NEW HEIST "Hot Pursuit" (key: pursuit): police chase screams L->R across the header
  under the user's siren (public/police-siren.mp3, best 7s window @17.0s of their
  emergency-vehicles clip), doubles back on the medallion line, prey slams nose-first
  into the logo (public/logo-crash.mp3 at impact, dt=3788ms verified), medallion
  knocked off screen (ffLogoKnockL), wreck sputters + smokes (ffPursuitSmoke), cop
  skids to a stop clear behind the wreck, wreck tumbles out of the sky (ffCarTumble),
  cop peels off, logo returns. HotPursuitHeist in realmHeists.jsx, mounted for
  cfg.cars in AmbianceScene; force event: ff:pursuit-heist. Registered in
  rituals.js HEISTS -> shows on Collection page (verified unlocked card).
- BUGFIX: CrawlBadgeDialog claimed a 60s heist cooldown on every page load (effect's
  else branch ran on mount). Now only after a real ceremony (wasOpenRef).
- BUGFIX: ambient chase cop backed up mid-pursuit on narrow screens (mixed vw/px
  waypoints in ffChasePursuitRun/-Rev); 30% waypoints now pinned relative to prey line.
- Verified: cop trailing gap stays positive through entire return approach
  (+134..+463px sampled at 6 beats), stop position clear of wreck content edge.
- FF_BUILD bumped to 2026.06-429.

## 2026-06 — Bidirectional Cyberscape traffic — self-tested (DOM anim check + screenshot)
- Ambient cyber traffic now flows BOTH directions (user request). Added an oncoming
  lane to CYBER_CARS in AmbianceScene.jsx: reversed spinner SUV (16s, 15% top),
  reversed runabout (14s, 7% top), and a second close-up people bus heading
  right-to-left (31s, 32% top, 235px — slightly higher/further back than the L->R one).
- New keyframe ffFlyBusRev in index.css (enters beyond sprite width from the right,
  scaleX(-1) mirrored so the bus faces its travel direction; thruster plumes flip
  with the wrapper and stay under the hover pods).
- Animation pick logic now: bus? (rev? ffFlyBusRev : ffFlyBus) : rev? ffFlyRev : ffFly.
- Final mix: 3 vehicles L->R (spinner, car, close bus) + 5 R->L (2 cars, spinner,
  close bus, far transit bus). Verified all 8 mounted with correct anim names via DOM.
- FF_BUILD bumped to 2026.06-446.

## 2026-06 — Traffic rework: round trips, no doubles (FF_BUILD 447) — self-tested (DOM dx sampling)
- User: "have the vehicles not double on the screen" — the oncoming-lane approach
  duplicated sprites (two spinners, two buses). REPLACED with round-trip scheme:
  back to 5 vehicles, each appears ONCE and flies L->R then returns R->L mirrored.
- New keyframes ffFlyBoth / ffFlyBusBoth (index.css): 0-49% outbound scaleX(1),
  49-51% off-screen hold flips to scaleX(-1), 51-99% return leg, 99-100% flips
  back off-screen left. REMOVED ffFly / ffFlyBus / ffFlyRev / ffFlyBusRev (dead).
- CYBER_CARS: dur now full round trip (28/32/36/54/68s); negative delays (-22, -40)
  start car2 + far bus mid-return so both directions flow from page load; `rev`
  flag renamed `alt` (cars2 sprite pick only).
- Verified via DOM matrix sampling: 5 unique sprites, spinner+bus moving L->R
  facing right, car2+bus2 moving R->L facing left, flips never visible.

## 2026-06 — Tow truck sprite cleanup (FF_BUILD 448) — verified in-situ (forced tow variant)
- User saw the Tow Job cameo live: cyber-tow.png was "riddled with white pockets" —
  enclosed white background regions (boom/piston triangle, hook strip, cab-back
  gaps) that the original corner flood-fill couldn't reach.
- Fixed via targeted component removal (one-off PIL pass): white components >50px
  fully above y=240 cleared, grown into the light-gray anti-alias fringe (tol 208),
  then boundary rim half-alpha'd. Thruster glow whites (y>=245) explicitly protected.
- Backup of original at /app/scripts/cyber_tow_backup.png. Remaining whites are
  only 1-2px specular slivers (windshield glint, cable shine) — intentional art.
- Verified with composite render + live forced heist (ff:pursuit-heist detail
  variant:'tow'): boom gaps show realm background, no pockets.

## 2026-06 — Tow Job re-choreographed: drive-past + beeping reverse (FF_BUILD 449) — self-tested (beat sampling)
- User request: instead of swooping down, the wrecker now CRUISES the whole banner
  (unhurried 3.4s, staged offscreen right on the wreck's hover line), flies past
  the cop AND the smoking wreck, overshoots left (towOverX = towX - min(24vw,400px),
  clamped to keep it mostly on-screen), then BACKS UP beeping (2.6s careful reverse)
  until the boom hook sits over the wreck's nose, hooks on, and hauls it off left.
- NEW SOUND public/tow-reverse-beep.wav: synthesized 1.1kHz piezo backup alarm
  (fund + odd harmonics, 4 beeps 0.34s on/0.36s off, 2.54s) — preloaded via
  preloadHeistAudio, played at vol 0.5 when the reverse starts.
- NEW visual: white reverse lamp blinking at the boom-side rear during the backup
  (data-testid tow-reverse-lamp, ffCopFlashA 0.7s steps).
- Tow phases renumbered: 6 cruise-across, 7 reverse+beeps, 8 hooked, 9 hauling,
  10 unit flees. Timeline: 5700/9400/12200/12800/14600, logoBack 15200, wrap 16200
  (heist total 16.2s, was 11.3s). All ph conditionals updated (prey haul, cop flee,
  wreck tilt, hook flare).
- Verified via forced heist + DOM transform sampling: cruise x1710 -> overshoot
  x-58 -> reversing x123 (lamp ON) -> parked x306 -> hauling x-365. Screenshots OK.

## 2026-06 — Steampunk sentinels: cabinet replaced by sleeping golems (FF_BUILD 450)
- Generated 4 dormant clockwork automaton golem concepts via Gemini Nano Banana
  (gen_golem_concepts.py; golem-concept-1..4.png kept in public for reference).
  User picked: concept 3 (Furnace Golem) LEFT + concept 1 (Boiler-Chest Colossus)
  RIGHT, as "silent sentinels"; only ONE (left) shows on mobile.
- REMOVED the steam-console cabinet block + its brass-goggles shelf prop (goggles
  can be re-homed later if user wants; steam-console.png kept in public).
- NEW sprites steam-golem-left.png (684x1222) / steam-golem-right.png (696x1180):
  white studio bg + floor shadow keyed out (edge flood tol 196-200, rim feather),
  then enclosed light pockets around the feet cleared (bottom-20% component pass).
- Scene: golemLeft bottom-0 left z-[4] h-46vh/66vh; golemRight bottom-0 right
  z-[3] hidden sm:block h-64vh (renders BEHIND the arc-device table, which sits
  in front like a workbench). Both get radial ground shadow + drop-shadow +
  brightness(0.92) to sit in the dark scene. Dormant: no glow, no animation.
- Verified desktop + mobile screenshots; mobile right golem display:none.

## 2026-06 — Golem polish: white pockets gone, bronze grade, 10-ft scale (FF_BUILD 451)
- User: "Lots of white on both" + "needs more bronze" + "make them larger like 10 feet".
- WHITE FIX: strict bright-pocket pass (>232 low-chroma components >100px) caught the
  enclosed bg pockets (armpits, crotch, neck, arm gaps) WITHOUT touching the legit
  gray paint-scuff speckles on the armor; grown into 202+ fringe, rim half-alpha'd.
  Also nuked all semi-transparent light haze (soft floor-shadow remnants, numpy pass).
- BRONZE GRADE: luminance-mapped bronze duotone blend (K=0.34 toward 236/168/96),
  plus red lift x1.06+6 and blue sink x0.86 — baked into both sprites; matches the
  amber wall. (Backups: original gens still at golem-concept-1/3.png.)
- SCALE: left h-54vh mobile / 84vh desktop (was 46/66), right 84vh desktop (was 64).
- Verified desktop + mobile screenshots: no white, warm tones, towering sentinels.

## 2026-06 — Golem sizing iterations (FF_BUILD 452-453)
- User: "Double the size" -> 108vh mobile / 168vh desktop (FF_BUILD 452), then
  "drop size by a third" -> FINAL: left 72vh mobile / 112vh desktop (left -10% /
  -3%), right 112vh desktop (right -4%), mobile right still hidden.
- At 112vh the heads crop slightly above the scene top — reads as colossal
  sentinels standing just inside the hall. Verified desktop + mobile screenshots.

## 2026-06 — Furnace fire + stack smoke on left golem (FF_BUILD 454)
- SMOLDERING FURNACE behind the belly grate (sprite box 54-79% x, 37.5-51% y):
  two screen-blended radial ember layers with irregular ffFurnaceSmolder breathing
  (3.4s + 2.1s offset). data-testid golem-furnace-glow.
- COAL SMOKE from the two stacks behind his head (40.5%/52% x, ~3% y): 4 staggered
  dark-gray puffs per stack, ffGolemSmoke rise -14vh with drift + scale 2 fade.
  data-testid golem-stack-smoke.
- KNOWN LIMIT: at 112vh desktop the stacks sit ~69px above the viewport top, so
  smoke is MOBILE-ONLY; user offered a ~92vh desktop option to reveal it. Verified
  mobile anchor y=241 on-screen + zoom screenshot showing gray puffs.

## 2026-06 — Stack smoke strengthened + re-anchored (FF_BUILD 455)
- User marked the two real stacks (tall capped stack on the shoulder + short one
  right behind the head): anchors moved to (41%, 1%) and (55.5%, 5%) of the box.
- Stronger smoke: 5 puffs per stack (was 4), bigger (4.4vh base), core opacity
  .85, darker richer gradient, blur 1.5px; rise extended to -16/-17vh; NEW
  ffGolemSmokeB alternate drift lane (odd puffs) so the plume rolls organically.
- Verified via two timed zoom screenshots on mobile: thick visible plume from both.

## 2026-06 — Smoke anchor nudge (FF_BUILD 456)
- Left stack smoke raised (top 1% -> -1.5%); right stack smoke moved right
  (55.5% -> 58.5%). Verified via mobile zoom screenshot.

## 2026-06 — Golem polish round: steam, feet, ember eyes (FF_BUILD 457-460)
- RIGHT GOLEM WHITE STEAM: 3 vents at his back stacks (35%/0.5%, 60%/0.5%,
  68.5%/2.5% of box), 4 white wisps each reusing ffGolemSmoke/B lanes.
  data-testid golem-stack-steam.
- LEFT SMOKE ANCHORS (user-tuned over several rounds): (41%, -3%) and (64%, 0.5%)
  — the second aligned to the user-marked stack mouth at (64%, 4.5%).
- FEET CLEANUP (user: "paint those pixels black"): after several removal attempts
  (edge flood, ground-side kill, luminance rolloff — mauve-cast attempt REVERTED
  via git checkout bb4c0bc), final approach paints all pale low-chroma px
  (lum>100, chroma<58) in the bottom 16% sooty near-black (26,20,15). Verified
  0 matching px after save on both sprites.
- EMBER EYES (left golem): two screen-blended amber glows on the eye lenses at
  (75.5%, 16.5%) and (82%, 18%) with bright cores, flickering via ffFurnaceSmolder
  like the belly fire. data-testid golem-eye-glow.
- DESKTOP SIZE: 84vh still hid plumes behind the 145px header -> FINAL 78vh both
  golems (mobile stays 72vh, left only). Stacks + plumes now clear the header.
- Verified via zoomed desktop screenshots (eyes aligned + glowing, furnace grate
  lit, right golem full view with stacks).

## 2026-06 — Right golem: oil leak, armpit bleed fix, mobile visibility (FF_BUILD 461-463)
- WHITE BLEED ROOT CAUSE: sprites were fully clean (0 pale px) — the "white bits"
  between arms/bodies were ambient steam puffs BEHIND the golems showing through
  the transparent armpit cutouts, plus stale HTTP-cached sprites. Fixes:
  (1) sprite URLs now versioned (?v=462) since FF_BUILD cache-bust doesn't clear
  HTTP image cache; (2) enclosed transparent holes filled with opaque shadow
  (13,10,7) via border-flood inversion — 8.5k px left, 14.7k px right.
- OIL LEAK (right golem, his left arm = sprite right): dark glossy streak from
  cuff (84%, 60.5%) down the hand; droplet lane (84.6%, 76.8%, h 19.6%) with bead
  that swells, free-falls (top 0->96% of lane), lands; glistening puddle at
  (79.5%, 95.9%) with splash ring synced to landing. Keyframes ffOilDrip/
  ffOilGlisten/ffOilRing (3.6s cycle). testids golem-oil-streak/-lane/-drip/-puddle.
- RIGHT GOLEM NOW ON MOBILE (user couldn't verify him): 72vh right-[-5%]
  (same size as left per user), desktop unchanged 78vh right-[-3%].
- STEAM FIX: left vent anchor (35%,0.5%) sat on the head — moved to the real
  bottle stack (52%, 2%). Verified via mobile zoom screenshot.

## 2026-06 — Right golem awakening + oil streams + mobile recomposition (FF_BUILD 464-469)
- OIL: drips became viscous STREAMS (ffOilStream: strand stretches from source,
  sags, detaches, falls; 3 lanes fanned at 80/84.2/88.3%), wider 2-run oily stain
  on the hand, puddle widened (77%, 14.5%) with RIPPLE rings per stream landing
  (ffOilRing retimed 72-96%, ffPuddleWobble surface shiver). Oil lives in its own
  z-[4] layer (steam-golem-right-oil) mirroring the golem box so the arc table
  never hides it; golem desktop right-[-1%] so his left hand is on-screen.
- MOBILE: too cluttered with both -> LEFT golem hidden on mobile (sm:block), RIGHT
  golem is the mobile one (72vh right-[-5%]); arc device table moved to left[2%]
  on mobile (sm:left-auto sm:right-[3%]). Verified clean composition.
- AWAKENING (rare ambient, ff:golem-wake forces): useGolemWake hook, phases
  0 asleep/1 awake/2 step fwd/3 back/4 power down (2.3/4.8/7.0/8.6s), first 45-85s
  then every 3-5.5min. Pose sprites generated via Nano Banana image-edit from the
  base sprite (gen_golem_wake.py): steam-golem-right-awake.png (head up, smoky
  green eyes) + -step.png (right leg forward), keyed/normalized to 696x1180
  bottom-anchored, white collar patches shadow-filled. Crossfade stack + container
  translateX(-3.5%) step + ffGolemRumble shudder + green head aura + steam bursts
  masking each pose swap. Verified all 4 beats via forced-event screenshots.

## 2026-06 — User-provided awakening sounds wired (FF_BUILD 470)
- User uploaded 3 clips -> public/golem-wake-up.mp3 (132KB), golem-step-forward.mp3,
  golem-step-back.mp3. Played via warm preloadHeistAudio bank at phases 1/2/3 of
  useGolemWake (vol 0.5/0.55/0.55), honoring ff_muted. Verified files serve 200 via
  preview URL, wake fired visually, no console audio errors.

## 2026-06 — Power-down sound (FF_BUILD 471)
- User's power down.mp3 -> public/golem-power-down.mp3, played at wake phase 4
  (head lowers, eyes die out) vol 0.5, preloaded in the warm bank. Verified 200.

## 2026-06 — Step motion rework (FF_BUILD 472)
- User: no whole-body slide; leg should lift/move/fall back. Removed the
  translateX(-3.5%) container slide. New: ffGolemStepLift (phase 2: body rises
  -1.3% + rotate -0.7deg from bottom origin as the leg lifts, settles as foot
  plants) + ffGolemStepSettle (phase 3: push-off bob). The step SPRITE carries
  the visible leg motion. Verified via forced-wake screenshot (foot raised).

## 2026-06 — Multi-shot step + table spacing (FF_BUILD 473-474)
- NEW POSE steam-golem-right-lift.png (gen_golem_lift.py + same key/hole/normalize
  pipeline): right knee high, foot OFF the ground, leaning forward.
- Wake phases now 0 asleep / 1 awake / 2 knee lifts / 3 foot plants fwd (step
  sprite) / 4 leg lifts back / 5 stands (awake) / 6 power down. Timers 2.3/3.4/
  5.6/6.7/8.3/9.9s; sounds: wake@1, fwd-step@3 (plant), back-step@5, power-down@6.
  Crossfades 0.5s; lift phases use ffGolemStepLift, settle on 3/5.
- Mobile arc table moved left-[-7%] (was 2%) — "too close to him". Verified via
  forced-wake screenshots (lift + planted frames, table spacing).

## 2026-06 — Other-leg step frames + floating sound toggle (FF_BUILD 475)
- STEP LEG SWAP (user: "other leg"): regenerated lift + step frames leading with
  the viewer-LEFT leg (gen_golem_otherleg.py, explicit image-side language to
  avoid mirror confusion). Shared pipeline extracted to
  /app/scripts/process_golem_pose.py. Pose img srcs cache-busted ?v=475.
- SOUND TOGGLE MOVED: removed speaker from HomeHeader (props/imports cleaned);
  new fixed floating button bottom-[4.75rem] right-5 z-[75], directly ABOVE the
  scenery eye, same pill styling, present in all realms incl. scenery mode.
  Same data-testid sound-toggle-button. Verified stack (sound y680 / eye y736),
  header clean, ff_muted toggling, other-leg step visually.

## 2026-06 — Furnace Blast event + crackle fix (FF_BUILD 476-477)
- FIX: useFurnaceCrackle was defined but never called (lint caught it) — now
  wired; woodstove loop (public/golem-furnace-crackle.mp3, vol 0.14, desktop-only,
  live mute sync every 1.5s) verified requesting.
- NEW EVENT useFurnaceBlast (left golem, desktop-only, ff:furnace-blast forces,
  every ~3.5-6min after 70-130s first): ph1 gears grind (golem-gears.mp3, grate
  glow surges 0.7s smolder + ffGolemRumble on the sprite, 2s) -> ph2 fire spews
  (golem-fire-blast.mp3): 3-layer jet cone from the grate (red sheath/orange
  body/white-hot core, ffFurnaceJet 3.1s roar-gutter-die) + 10 sparks + 4 embers
  flying on per-particle --sx/--sy vectors (ffSparkFly). testids
  furnace-blast-surge / furnace-blast-jet. Verified via forced event screenshot.

## 2026-02 (fork) — Workstation final layout, shrink + room grade (FF_BUILD 483-484)
- SWAP DONE (user msg): valve pedestal now LEFT of robot rack, alchemy bench RIGHT.
  Sprites verified already white-free (prev fork's cleanup landed); "white" user saw
  was stale PWA cache — all prop srcs cache-busted (?v=490/491).
- Rack robot's fluttering green eye glow re-aligned onto the actual eye
  (x 47->30.5%, y 16->16.5% — old coords floated beside the head).
- SHRINK (user: "1/3 smaller"): valve 42->28vh @ left-[calc(50%-32vh)]; bench
  38->25.5vh @ left-[calc(50%+15vh)]; robot rack "size of other 2" -> 27vh.
- ROOM GRADE: scripts/grade_workstations.py — luminance duotone (shadow 26,18,11 ->
  highlight 214,168,106) blended 42% + 0.96 darken over valve+bench PNGs; warm
  bronze now matches wall (room avg 55,40,26).
- REMOVED: jacob's ladder arc table — `device:` key deleted from steam cfg and the
  whole cfg.device render block (arc SVG/glow) deleted. /steam-arc-device.png kept
  on disk but unreferenced.
- Mask prop follows the bench (left calc(50%+24vh)); goggles stay in front of robot.
  Verified via scenery-mode screenshots + bounding boxes at 1920x800. FF_BUILD 484.

## 2026-02 (fork) — Robot brother-sized + Collectible Fates + Golem Duet + Home refactor (FF_BUILD 485-487)
- Middle rack robot resized to match his two golem brothers (h-78vh, centered);
  valve/bench spread to left-[calc(50%-48vh)] / left-[calc(50%+31vh)], mask follows.
- COLLECTIBLE FATES: 2 new HEISTS in lib/rituals.js — 'awakening' (recorded by
  useGolemWake at 9.9s) + 'furnace' (useFurnaceBlast at 5.2s) via useHeistWitness.
  Icons Bot/Anvil in Rituals.jsx; ES translations added. Shelf now 25 trophies.
- GOLEM DUET: while right golem awakens (golemWake 1-5), left golem's ember eyes
  flicker (golem-duet-flicker spans, ffBroFlicker keyframes in index.css, 3x1.9s).
- HOME REFACTOR: Home.jsx 1564 -> 1157 lines. Extracted to components/home/:
  HeroCopy, LocationRadiusPanel, ModeTabsGrid+CuisineSection, DealRow,
  MoreWaysToPlay, StatsRibbon, FloatingToggles, RealmLayers, NearbyResults.
  New libs: lib/sound.js (SHUFFLE_LOOPS, playSound), lib/geo.js (haversineMi,
  resolveCoords, computeFateOfDay). New hook: hooks/useShareTarget.js.
- Tested: testing agent iteration_70.json ~95% pass, 0 issues; fate-of-day-card
  false alarm self-verified working (Ci Siamo card renders after Deal).

## 2026-02 (fork) — Rack lamp/eye fixes + mobile duet glow (FF_BUILD 488-489)
- Rack robot fixes (user): blink lamps moved off the tool tray onto the real
  panel bulbs (71.3/29.4 + 71.3/33.1); bench blinkers moved onto its actual 4
  indicator bulbs (56.1/38.2, 61.7/39, 73.5/41.6); green eye now ON the left
  lens (x31.5,y20); white dots killed via scripts/fix_rack_whites.py (isolated
  alpha specks erased + near-white glints warmed to bronze). Rack src ?v=492.
- MOBILE DUET: left golem is hidden <640px, so his awakening response now
  bleeds in as an amber edge glow (golem-duet-flicker-mobile, sm:hidden inverse,
  two "eyes" + haze, same ffBroFlicker timing). Verified display:block at 390px
  while steam-golem-left is display:none.

## 2026-02 (fork) — Flat-footed step frame (FF_BUILD 490)
- User: step pose had toes pointing up. Regenerated steam-golem-right-step.png
  via Gemini Nano (scripts/gen_golem_step_flat.py: 'forward foot COMPLETELY FLAT')
  + process_golem_pose.py pipeline; erased a leftover white steam blob at the
  chimneys (y<120 whitish clear). src ?v=490. Verified live at wake phase 3.

## 2026-02 (fork) — Floor Thud (FF_BUILD 491)
- Synthesized /golem-thud.wav (scripts/gen_golem_thud.py: 85->42Hz pitch-drop
  body + 34Hz sub + noise click + inharmonic clank ring, 1.1s).
- useGolemWake: thud plays at 3950ms (foot-contact mid-settle), preloaded;
  step sprite preload URL fixed to ?v=490 (was stale ?v=475).
- Dust kick: golem-thud-dust — 6 puffs burst sideways from the forward foot
  (left 30% / top 94.5% of right-golem box), ffThudDust keyframes, delayed
  0.55s into phase 3. Verified: opacities ramp+fade, audio decodable.

## 2026-02 (fork) — Pump lights, arm sparks, floor arm, fireworks, stomp pause (FF_BUILD 492-493)
- Valve/pump: 3 blink fixtures added on the FRONT face (x37.5, y43/53/63) and the
  4 blinkers realigned onto the real bulb column (x70.9, y40/50.2/59/67.9).
- Rack robot: weld sparks (rack-arm-sparks, ffWeldFlash + ffArmSpark 4.2s burst
  cycle) spit from the open shoulder socket (65%,39%) where his arm is missing.
- His unfinished arm generated (scripts/gen_rack_arm.py, Gemini Nano) -> keyed,
  white glints warmed + specks erased; lies on floor RIGHT of the rack
  (left calc(50%+8vh), 22vh wide, scaleX(-1)) as steam-arm-floor ?v=493.
- Furnace blast beefed up: bouncers 7->12 + 14 NEW firework embers (ffEmberFw:
  launch up along --fx*0.55/--fy, crest, rain down) from the grate.
- Awakening: stomp held 1s longer (ph4 5600->6600, ph5 7700, ph6 9300, end
  10900) and step-back sound moved to ph4 start (leg-return) per user.

## 2026-02 (fork) — Black spot fix, burn-down, alert robot, heist traffic control (FF_BUILD 494-495)
- WHITE/TAN SPOTS: rack restored from git (6ae036c) + arm re-keyed from raw;
  near-white px now mapped to DARK (22,16,10) per user ("pixels should be
  black"); arm's painted gray floor shadow cleared. rack/arm ?v=494.
- FURNACE BURN-DOWN: new blastPh 3 (5200-7400ms) — surge fades 1.4s, rumble
  stops, 9 resting embers (furnace-ember-rest) flicker + die on the floor line
  (translate(bx, 43vh), ffEmberDie staggered). Witness records at 7400.
- ALERT ROBOT: steam-robot-rack-alert.png (Gemini head-straight variant,
  aligned to 558x742). During ANY golem event (workshopEvent = wake 1-5 or
  blast >= 1) the rack robot cross-fades to head-straight and BOTH lenses hold
  solid green (rack-alert-eye at 33.3/15.4 + 39.7/15.4); flutter hides.
  NOTE: config keys alert/alertEyes were silently lost once — re-applied.
- HEIST TRAFFIC CONTROL: golem wake/blast run() now bail+reschedule (25-45s)
  when __ffFateBusy or __ffHeistCooldownUntil holds, and reserve the cooldown
  (25s wake / 20s blast) so medallion heists can't scroll the page mid-show.
  Forced dev events (ff:golem-wake / ff:furnace-blast) bypass the guard.

## 2026-02 (fork) — Workshop Trophy + code review fixes (FF_BUILD 496-497)
- WORKSHOP TROPHY: new HEISTS entry 'workshop' ("The Apprentice", green, Wrench
  icon, ES translations). Recorded 3s into any rack power-up (workshopEvent
  effect in AmbianceScene, desktop-only). Shelf now 26. Verified E2E: record,
  toast, trophy card, count 1/26.
- CODE REVIEW fixes:
  * Home.jsx had a stray duplicated closing tail (`</div> ); }`) after the
    component end — latent from an earlier edit collision; removed (was an
    eslint parse error).
  * Dead state removed: source/setSource (3 sites) + addOpen/setAddOpen.
  * Rituals.jsx: pursuit/tow/stash trophies showed a Lock even when unlocked —
    mapped to Siren/Truck/Nut (verified present in lucide 0.516).
  * Audited: no duplicate CSS keyframes (226 unique), golem sprite preloads
    match rendered ?v= params, eslint 0 errors, deal flow re-smoke-tested.
- LESSON: two parallel search_replace batches silently lost edits this session
  (alert config keys, and the Home tail corruption). Prefer sequential edits on
  the same file region.

## 2026-02 (fork) — Realm Seals (FF_BUILD 498)
- Rituals page: new "Realm Seals" strip between the Heist Hunter crown and the
  trophy shelf (data-testid realm-badges / realm-badge-<realm>). Groups HEISTS
  by realm: completed realm -> golden Medal pill (spring pop-in, ffTrophyGlow);
  incomplete -> dim pill with "Realm · got/total". ES: "Sellos de Reino".
- Steampunk set = crank, spring, gears, awakening, furnace, workshop (6).
- NOTE: the Medal lucide import was AGAIN silently dropped from a parallel edit
  batch (crashed /rituals with white screen, "Medal is not defined") — re-applied
  solo and verified. Avoid parallel search_replace on the same file.

## 2026-02 (fork) — Live mobile fixes (FF_BUILD 499-500)
- LIVE BUG (production report, reproduced in preview): goggles floor prop sat
  under the right golem's feet on phones (golem spans nearly full width at
  390px). Goggles + mask now hidden sm:block like the arm — their anchor
  stations (rack/bench) are desktop-only anyway. Verified display:none at 390px.
- LANDSCAPE: manifest.json orientation "portrait" -> "any". Verified served +
  landscape layout (844x390) renders the sm layout fine. NOTE: installed PWAs
  pick up manifest orientation on app update; some devices need reinstall.

## 2026-02 (fork) — Golem white specks + landscape support resolved (FF_BUILD 499-503)
- Goggles/mask hidden on mobile (were under right golem's feet on live phones).
- manifest orientation -> "any"; landscape verified. Diagnosed user's phone:
  rotation worked once auto-rotate/Chrome-tab confusion resolved.
- WHITE SPECKS (user circled live screenshot): they were (a) semi-transparent
  bright remnants and (b) light-TAN opaque artifacts (dodge min-channel
  filters). Cleaned via scripts inline: ghost alpha<200&lum>140 -> erased;
  lum/chroma graded pull to DARK(24,18,12); left golem floor-strip (y>86%)
  darkened harder to kill tan haze under feet. ALL steam sprites treated
  (golems, 3 pose frames, rack, alert, arm, valve, bench). All ?v=501-503.
- FF_BUILD 503. User must REDEPLOY to push to fork-fate.com.

## 2026-02 (fork) — Invisible shuffle/reveal watchdog (FF_BUILD 504)
- LIVE BUG (Dragon's Hoard, installed app, happened once): sound played and the
  result eventually appeared but the shuffle + reveal visuals never showed.
  Diagnosis: framer-motion entrances start at inline opacity 0 and rely on
  rAF; Samsung power management can throttle rAF in WebAPKs -> animation
  freezes at opacity 0 while audio/timeouts run on. Could not repro in preview
  (both verified visible at 390px).
- FIX: hooks/useVisibilityRescue.js — 1.5s after mount (re-armed per card id),
  if computed opacity < 0.5 the element is forced visible (opacity 1,
  transform none). Wired into ShuffleOverlay's root motion.div and
  RevealStage's card motion.div (hook placed above early returns to satisfy
  rules-of-hooks). No-op in normal operation — e2e verified.

## 2026-02 (fork) — Invisible shuffle/reveal: hardened watchdog (FF_BUILD 504-505)
- 2nd live report (friend, Winter realm, intermittent) confirmed systemic:
  heavy realm scenes starve rAF on phones -> framer entrances freeze at
  opacity 0 while audio/timers continue (CSS animations unaffected).
- hooks/useVisibilityRescue.js: polls (first 700ms, then every 900ms, 8x),
  stops once seen visible (protects exit fades), forces opacity/transform
  with setProperty(..., "important") because framer re-applies its frozen
  plain inline value on every re-render (name-cycle re-renders every ~100ms).
- Wired: ShuffleOverlay root (data-testid shuffle-popup) + RevealStage card
  (re-armed per result.id). Adversarial test passed: interval writing
  opacity 0 every 120ms could not keep it hidden; normal flow untouched.

## 2026-02 (fork) — Floor arm rebuilt as true LEFT arm + heist overlap fix (FF_BUILD 506-508)
- User: floor arm's "white" was a tray-like read + wrong handedness (no thumb
  visible). Regenerated via scripts/gen_steam_arm_left.py (Nano Banana,
  magenta-key pipeline; bg came back muted magenta ~(173,64,121) so keying
  flood-fills from the sampled corner color, not pure #FF00FF).
- CHIRALITY: palm-down + fingers viewer-left + near-side thumb = RIGHT hand
  (user caught this). Horizontal mirror swaps chirality -> final sprite
  /steam-arm-left.png (1241x418): fingers point RIGHT, thumb toward viewer,
  torn shoulder left = true LEFT arm (robot's open socket is his left).
- Weathered to match golems (Color .82/.72, Brightness .86/.78, +16% rust
  blend (92,62,34)); stats now lum 42 / sat .50 / 0% bright vs rack 45/.48.
- AmbianceScene.jsx: arm box now 23vh wide, aspect 1241/418, no CSS flip.
- heistLib.jsx summonToLogo: 6s provisional __ffHeistCooldownUntil hold
  before the smooth-scroll (was: golem awakening could start during the
  ~2.75s scroll window -> overlapped the medallion heist; user report).
- Screenshot tool NOTE: script must be TOP-LEVEL statements (no async def
  wrapper) or it silently no-ops. Realm chooser: click
  [data-testid=theme-welcome-option-steam], then "Skip intro", then
  [data-testid=scenery-toggle] to bare the scene.
- User observation (open): phone-landscape packs props toward center — vh
  offsets shrink at 390px height. Offered min(vh,vw) spread; awaiting reply.

## 2026-02 (fork) — Workshop set-dressing wave (FF_BUILD 509)
- Alchemy bench moved closer to the rack robot: left 50%+9vh -> 50%+3vh.
- Floor cables: hand-drawn SVG inside the steam-floor strip (viewBox 1000x140,
  preserveAspectRatio none) — 2 sagging runs + a crossing wire, each dark base
  stroke + brass highlight stroke, 4 brass coupling rects. First pass was
  invisible against the dark floor; highlights brightened to #8A6432/#96703A.
- Workshop rats: generated /steam-rat.png (gen_steam_rat.py, corner-sampled
  magenta key). Two rats scurry along the wall/floor corner (bottom 12.1/12.7vh
  inside the floor strip) between the outer golems, never stopping:
  ffRatRun 13vw->82vw linear alternate + ffRatFace steps(1) flip at 2x duration
  (keeps sprite facing travel direction) + ffRatScurry 0.22s gallop bob.
  Desktop-only (hidden sm:block), z under the props.
- Spring heist: black-hole socket (radial void + inset shadows + brass rim)
  rendered at the medallion spot while the watch face dangles on its spring
  (component only renders when stage is set, so timing needs no extra gating).

## 2026-02 (fork) — Rat/mask polish (FF_BUILD 510)
- Rats bigger + brighter (3.4/2.7vh, brightness 1.08 contrast 1.06, no dim);
  ffRatRun now 3vw->88vw so turnarounds happen hidden behind the outer golems
  (rats z-2 inside floor, golems z-3/4).
- Mask moved NEXT TO THE PUMP: left calc(50% - 56vh), relocated OUT of the
  floor div to top level z-3 (floor's z-2 stacking context let the rack post
  draw over it).
- User asked if pump lights were removed — untouched; ffLampBlink dims to
  opacity 0.2 half-cycle so stills can catch them "off". Verified lit.

## 2026-02 (fork) — Black weaving cables + THE ARM DROP heist (FF_BUILD 511-513)
- Cables redrawn: 5 black rubber runs weaving/overlapping across the floor
  (incl. one doubling back + a diagonal stray), dark-iron couplings.
- NEW HIDDEN FATE "armdrop" (The Arm Drop) added to HEISTS in lib/rituals.js:
  arm starts MOUNTED on the rack robot's socket, weld fails (0.55s spark
  burst at socket), tears loose + falls (0.85s accelerate transition),
  slams floor with /golem-thud.wav + ffThudDust kick + fast bust-end burst,
  rests 2.5-4min (slow spark loop), fades + re-mounts, repeats. Hook
  useArmDrop in AmbianceScene (ph 0-5); force event `ff:arm-drop`; traffic
  control via __ffHeistCooldownUntil; desktop-only (min-width 640).
- GEOMETRY: arm box at REST spot (bottom 0.6vh, left 50%-37.5vh, w 31vh);
  attached pose = translate(21.5vh,-41.2vh) rotate(78deg) about origin
  9%/40% (the torn shoulder) which pins it on the socket (65%,39% of rack
  box). Formula: dx = socket_x - (rest_left + 0.09*w); dy = 48.08vh -
  (0.6 + h*0.6). Arm upsized 23vh->31vh after user compared to intact arm.
- Socket weld sparks now GATED: hidden while arm mounted (ph 0/1), intense
  0.55s failing burst at ph1, normal loop at ph>=2.
- Rats: now `hidden landscape:block` (portrait phones never show them;
  Tailwind 3.4 has orientation variants).
- Phase machine verified via live computed-style probe (attached 0-1.6s,
  fall 1.6-2.45s, landed burst, resting loop) + witness toast fired.
- NOTE: screenshot captures have 1-2s latency per shot — probe computed
  styles instead of relying on timed screenshots for animation QA.

## 2026-02 (fork) — Arm restyled to match the robot (FF_BUILD 514)
- gen_steam_arm_match.py: IMAGE-TO-IMAGE via Nano Banana — passed
  steam-robot-rack.png as ImageContent reference, asked for "his other arm"
  in the exact same style. Result matches plating/rust/verdigris perfectly.
- Pipeline: corner-sampled magenta key -> mirror flip (hand-left+thumb =
  right arm; flip = LEFT arm) -> mild grade -> opaque-magenta despill pass
  (b>g+25 && r>g+25 -> b=g*0.75; 1236 px fixed on wire strands).
- New dims 1288x589 (aspect 2.187): box 29vh wide left calc(50%-36.5vh),
  origin 12%/45%, attached transform translate(19.8vh,-40.2vh) rotate(78deg).
- Verified attached + fallen in-scene; ?v=514.

## 2026-02 (fork) — Exact-mirror mounted arm + smooth two-frame fall (FF_BUILD 515-517)
- MOUNTED sprite is now the robot's OWN right arm cropped from
  steam-robot-rack.png (region x64-152, y264-564, piecewise right boundary
  136/139/149 to exclude torso, fragments erased, top cut soft-faded 12px)
  then mirror-flipped -> perfect 1:1 left arm, thumb inward, NO pauldron
  (user: robot's own shoulder plate covers the join). 86x299 px.
- Mounted box: left calc(50%-17.7vh), bottom 17.5vh, w 9.1vh, z-3 (z-2
  hid it behind the rack frame post's opaque pixels — learned the hard way).
- Fall is now a TWO-FRAME hand-off: mounted arm shudders (ffArmShudder)
  during weld-fail ph1, detaches at ph2 (ffArmDetach 0.4s: tilt -16deg,
  drop 7vh, fade) while the torn floor arm fades in mid-tumble
  (pre-fall pose translate(19.8vh,-41.1vh) rotate(60deg), opacity 0->1
  0.25s) and falls 0.85s to rest. Much smoother than single-sprite swing.
- Floor arm regenerated thicker (user: gauntlet too thin) 1287x513; then
  magenta shadow blob killed (min(r,b)>g+45), red fringe knocked back, and
  finally a HUE-ROTATE pass (285-358deg sat>0.12 -> hue 22deg rust) to
  remove the raspberry-pink cast (48752 px). Sprites at ?v=517/516.
- ffArmShudder + ffArmDetach keyframes added to index.css.

## 2026-02 (fork) — Spark showers + zap + mousetrap (FF_BUILD 518)
- Break-away: LARGE one-shot spark shower (14 sparks + flash core, keyframe
  ffSparkShower) erupts at the socket at ph2 + quick zap audio /arm-zap.mp3
  (user asset soundzee-glitchy zap, ffmpeg-trimmed to 1.2s with fade).
- Ground impact: second large shower from the arm's torn socket at ph3
  (replaced the old looping mini-burst).
- Mousetrap: /steam-mousetrap.png (Nano Banana gen, magenta-keyed) at the
  wall base, left calc(50%+36vh) bottom 12.8vh w 7.5vh — NOTE: first spot
  (50%+26vh) was hidden BEHIND the alchemy bench (bench z-3 > floor z-2).
  Rendered before the rats in the floor div so they scurry in front.
- Verified: trap+rat close-up, socket flash and ground flash captured live.

## 2026-02 (fork) — Code-review audit + photo cache fix
- Audited automated review findings; most were false positives:
  - `is`-vs-`==` in tests: ZERO string-identity comparisons exist (grep
    proved it); flagged `is None` usages are correct Python.
  - seed_data.py random: intentionally deterministic (SHA-256-seeded RNG for
    reproducible fake data, commented as non-cryptographic).
  - Hook deps: intentional mount-once heist schedulers (adding deps would
    restart multi-minute timers every render). axios/API are module consts.
  - localStorage: only game state (themes, heists seen, journal) — no
    tokens/secrets (grep verified 0 matches).
  - Index keys: static particle arrays that never reorder — valid.
  - Complexity/component splits: real but deferred to refactor backlog.
- REAL FIX (found via full pytest run): routes/places.py photo proxy —
  photos > 400KB cache ceiling were NEVER cached, so every view re-billed
  the Google budget and shipped 620KB originals to phones. Now recompressed
  server-side (PIL JPEG q72) to fit the cache. 451/451 tests pass.

## 2026-02 (fork) — TRAP SNAP hidden fate (FF_BUILD 519)
- NEW HIDDEN FATE "cheesethief" (The Cheese Thief) in lib/rituals.js.
- Asset prep via PIL: cheese flood-extracted from steam-mousetrap.png
  (seed-grown hue 22-70deg mask, brightest-blob + dilation) ->
  steam-cheese.png (159x90, rel pos left 68% top 13.5% w 12.8%);
  steam-mousetrap-empty.png = 4-direction-average fill + local blur
  (leftover chunk above the wire needed a second targeted pass).
- Trap block now: empty-trap base + cheese OVERLAY (hidden ph>=3, jolts
  via ffTrapJolt at snap) + thief rat (base at calc(50%+42.5vh), faces
  left via scaleX(-1) wrapper; ffThiefIn 26vw->0 2.3s, ffThiefNibble,
  ffThiefFlee 0->-46vw 1.15s with cheese img in tow). Snap sound:
  /stash-pop.mp3 0.6.
- Hook useTrapSnap ph 0-4, force event `ff:trap-snap`, first run 70-120s,
  sprung/empty 2.5-4min then re-baited. Verified all 4 stages via
  screenshots (baited/nibble/snap-flee/empty).

## 2026-02 (fork) — Publish batch (FF_BUILD 520-523)
- SEAL TOAST: heistLib witness toast now checks realm completion -> golden
  "Realm Seal earned!" toast 1.6s after the final fate's toast.
- TROPHY SHARING: buildCollectionShareImage in shareCards.js (1080px card:
  rituals/heists/seals counts + golden seal shelf) + share button on
  /rituals (share-collection-btn). Exercised headless: no page errors.
- SEASONAL EVENTS: lib/seasons.js (SEASONS windows MM-DD, activeSeason,
  ff_seasonal_seen storage). 4 seasons: Sweethearts (Feb, hearts), Firefly
  Nights (Aug, fireflies), Haunting (Oct, wisps), Longest Night (Dec,
  aurora). useSeasonalDrift in AmbianceScene sweeps the effect every 3-5min,
  first sighting records + toasts. Collection page has Seasonal section w/
  Live-now badge. NOTE: POD CLOCK IS 2026-08-16 (August!) so Firefly Nights
  is live in preview; user's real Feb device shows Sweethearts.
- LANDSCAPE: .ff-bg-fit -> object-contain on short-landscape + .ff-bg-blurfill
  blurred cover copy fills sides (letterbox fill); useCoverAnchor mirrors the
  contain formula so wing/unicorn patches stay pinned. ff-lsp-* classes
  spread pump/mask/goggles/trap outward in landscape.
- TROPHY ROOM: 5 Home pills collapsed into one accordion button
  (trophy-room-btn, grid-rows transition) in MoreWaysToPlay.jsx; FAQ entry
  "What's in the Trophy Room?" added to HomeInfoSections.jsx.
- UNICORN LIFE: gen_unicorn_life.py image-edits two patches of fairy-gully
  (rect 250,380-460,600): head-lowered graze (ffUniBob 17s) + muzzle-turned
  fast fly-shake (ffUniShake 23s linear: 3 rapid flips over ~2.5s at 60-71%).
  Feathered 44px + gain-matched like the wings.
- FAIRY SQUARE GLOW FIX: wing patches gain-matched per channel to base art
  + feather widened (56px, right 20px) — rectangular seam gone.
- Photo proxy recompression fix + full pytest green (see earlier entry).

## 2026-02 (fork) — Unicorn fly-shake completed (FF_BUILD 524)
- Third patch fairy-uni-shake-r.png (muzzle swung to ITS RIGHT, away from
  viewer) generated via same image-edit pipeline.
- ffUniShakeR keyframes fill the exact gaps of ffUniShake (62.8-64.4,
  67.2-68.8 of the 23s cycle) -> full sequence: L R L R L center, ~0.4s
  per swing = shaking off a fly. Verified right patch hits opacity 1 live.

## 2026-02 (fork) — Double-speed shake variant (FF_BUILD 525)
- ffUniShakeFast/-FastR on a separate 41s cycle (12s delay): ~0.2s per swing
  (half the normal 0.37s) in a 1.6s burst at 70-74% — non-harmonic with the
  23s cycle so fast shakes feel random. 5 unicorn patches total mounted
  (keys: bob, shake, shake-r, shake-fast, shake-fast-r).

## 2026-02 (fork) — Landscape reverted to full-bleed (FF_BUILD 526)
- User saw the contain+blurfill landscape and chose FILL instead: removed
  .ff-bg-fit contain rule, .ff-bg-blurfill imgs/rules, and the contain
  branch in useCoverAnchor (pure cover again). ff-lsp-* prop spread kept.
- Verified 844x390: painting fills edge to edge.

## 2026-02 (fork) — Pixie green halo removed (FF_BUILD 527)
- Two causes: (1) baked dark-teal outline in fairy-pixie-1/2.png — stripped
  ~3.5k px each (teal hue band within 6px of alpha edge or semi-transparent);
  (2) CSS glow prop was green rgba(94,224,168,.7) -> warm white
  rgba(255,244,214,.45). Sprites at ?v=527.

## 2026-02 (fork) — Steampunk batch: Peek-a-Boo heist, landscape spread v2, sound sync, longer fire (FF_BUILD 528)
- NEW HEIST "Peek-a-Boo" (key: peek, 6th Steampunk fate in rituals.js): medallion
  rattles + POPS off (stash-pop.mp3 + sparkle burst) -> black-hole socket ->
  right sentinel's head (/steam-peek-head.png, cropped from awake sprite via PIL,
  bottom faded to shadow) rises inside the overflow-hidden hole, ffPeekLook 2.4s
  glances left/right, sinks back, logo returns. SteamPeekHeist in realmHeists.jsx,
  forced by `ff:peek-heist`. First strike 2.5-4 min, repeat 3-6 min.
- LANDSCAPE SPREAD v2 (index.css @media landscape+max-h520): pump clamped
  max(52vh, 50%-56vh) so it can never sit under fire golem's foot; middle
  cluster shifted ~10vh right: ff-lsp-rack 50%-12vh, ff-lsp-bench 50%+13vh,
  ff-lsp-arm-mounted 50%-7.7vh, ff-lsp-arm-shower 50%-3.2vh, ff-lsp-arm-floor
  50%-26.5vh, mask 50%-42vh. New classes added to the JSX boxes.
  Verified at 1000x471 (user's Android) and 844x390.
- SOUND SYNC (right golem wake): step-forward sound now fires WITH the leg
  lift (ph2 @2300) not the plant; leading silences trimmed via ffmpeg from
  golem-step-back.mp3 (2.09->1.87s) + golem-wake-up.mp3 (4.15->3.91s);
  golem-power-down.mp3 internal pauses removed (7.56->4.22s continuous).
  URLs cache-busted with ?v=530 in preload+play. Originals in /app/scripts/bak-*.mp3.
- FURNACE FIRE LONGER: blast fire phase 3.2s -> 5.6s (ph3 @7600, end @9800),
  ffFurnaceJet 3.1s -> 5.6s on all 3 jet layers, fire-blast roar re-fed at
  +4200/+6350 (clip only 2.4s), cooldown reserve 24s.
- EVENTS SOONER: furnace first 70-130s -> 35-65s, repeat 200-360s -> 140-260s;
  arm drop first 50-90s -> 30-55s, re-mount reschedule 60-120s -> 45-90s.

## 2026-02 (fork) — Peek Jump-Scare variant (FF_BUILD 529)
- ~1 in 3 peeks (Math.random()<0.35) the head SNAPS from mid-ffPeekLook to
  center (stage "lock"): ffPeekLock leans in (scale 1.14-1.17), both lenses
  flare via ffPeekEyeFlare spans (left 25%/62.5%, top 56.5%, w 18%), head
  filter brightens + green wash surges; arm-zap.mp3 @0.3 on lock. Then stage
  "duck": translateY(150%) in 0.25s cubic-bezier(0.6,0,1,0.6) + steam-boing
  @0.45. Scare timeline: lock @3550, duck @4800, hole @5150, return @5850,
  done @6550 (normal path unchanged). Force w/ detail:
  `new CustomEvent('ff:peek-heist', {detail:{scare:true}})` (false forces normal).
- rituals.js peek desc extended with the catch-you-watching line.

## 2026-02 (fork) — Summer gulls, ambient loops, realm takeovers (FF_BUILD 530-532)
- SUMMER GULL HEIST "Mine! Mine! Mine!" (key: gulls, rituals.js): 5 photoreal
  gull heads (/summer-gull-head.png, nano-banana magenta-keyed) pop out one at
  a time FROM BEHIND the medallion rim — necks planted on the logo (anchor
  r=0.46w, rotate a+90, origin bottom-center, headW 0.4w) — while 6.5s of
  user's mine.mp3 (/gull-mine.mp3) plays; then a photoreal gull flaps off with
  the logo (2 frames /summer-gull-fly-1|2.png, beak-aligned 305x243 canvas,
  ffWingA/B 0.42s steps toggle, flies up-LEFT since art faces left).
  SummerGullHeist in seasonHeists.jsx, forced by ff:gull-heist.
- AMBIENT FLYING BIRDS (SeasonScene summer): now use the 2 photoreal flap
  frames, flipped scaleX(-1) to face their L->R cruise (user caught them
  flying backwards in build 531 -> fixed in 532).
- AMBIENT LOOPS (RealmEntrySting.jsx AMBIENT_LOOPS): summer waves+gulls loop
  (/summer-waves-loop.mp3, vol .16, plays whole visit) and dragon-hoard mine
  shaft (/fantasy-mine-loop.mp3, vol .15, afterSting:true — starts when the
  entry song ends; mute watcher pauses/resumes both).
- BALL HEIST: ~50% of strikes now rebound BACK off the side they came from
  (run.back, exitRight logic + matching spin direction).
- AUGUST SEASON swapped: fireflies -> "Endless Summer" beach balls bouncing
  around the screen (id beachballs, fateKey beachball, effect beachballs:
  6 balls, nested Fade/X/Y/spin keyframes ffSeasonBallFade/X/Y).
  activeSeason() honors localStorage ff_season_test=<id> for testing.
- REALM TAKEOVERS (useAmbientTakeover in AmbianceScene, z-45, first 40-90s,
  gap 100-220s): fairy fireflies (ff:fireflies, 21s), dragon-hoard gold coins
  falling from the top banner (ff:coins, 18s, /fantasy-coin.png,
  ffCoinFall/ffCoinFlip), steampunk green-eyed head peeking in from screen
  edges (ff:peekin, 15.5s, left @0.3s + right @8.2s, ffPeekInL/R), cyber
  police chase sweep (ff:chase, 8s, ffChaseSweep + siren @0.3).
- Sprites via /app/scripts/gen_gull_real.py; fly frames beak-aligned via numpy.

## 2026-02 (fork) — Gulls coast (FF_BUILD 533)
- Ambient summer gulls: ffWingGlideA/B keyframes = 3 quick beats then a long
  wings-up COAST (frame 1 held 50-100% of each b.cycle), synced with ffGullBob
  climb/sink rhythm. Getaway heist gull keeps constant ffWingA/B flapping.

## 2026-02 (fork) — Season alerts, takeover trophies, splat gag, coin pile-up (FF_BUILD 534)
- SEASON OPENING ALERT (Home.jsx): one-time toast per season per year
  (ff_season_announced = "<id>-<year>"), fires 6s after load with the season's
  name, window dates and desc in its accent color.
- TAKEOVER TROPHIES: useAmbientTakeover now takes a fateKey and witnesses via
  useHeistWitness ~6s into the show. New rituals.js fates: fireflies ("The
  Firefly Drift", Fairy Gully), coinrain ("The Coin Spill", Dragon's Hoard),
  watcher ("The Watcher", Steampunk), chase ("Code 3", Cyberscape).
- SPLAT! gag (SummerPoopHeist in seasonHeists.jsx, fate key splat, Summer):
  a gull sweeps the top (ffPoopGullSweep 3.6s, flap frames) -> white splat
  blob-cluster pops onto the banner glass @1.5s (ffSplatPop) -> wiper blade
  pivots two passes @4.1s (ffWiperSweep 1.9s) while the splat wipes/smears
  away (ffSplatWipe). Forced by ff:poop-heist; first 3-5 min, repeat 5-9 min.
- COIN PILE-UP: hoard coins now land at --land (85-93vh) with a touchdown hop
  (ffCoinFallLand), flip animation iteration-count sized to stop at landing,
  whole layer fades at window end (ffTakeoverFade 18s).

## 2026-02 (fork) — Wiper squeak, collection filters, rarity tags, streak calendar (FF_BUILD 535)
- WIPER SOUND: user clip cut to 2.0s (/wiper-squeak.mp3, ffmpeg ss 0.4 t 2.0,
  fades) and played at ph3 of SummerPoopHeist (vol 0.55) + preloaded.
- COLLECTION FILTERS (Rituals.jsx): statusF (all/found/missing) + realmF chips
  (unique realms across RITUALS+HEISTS); both grids filter via matches();
  empty-state notes (rituals-empty / heists-empty testids).
- RARITY TAGS: rituals.js exports RARITY {uncommon/rare/epic/legendary} +
  rarityOf(key, kind); EPIC_KEYS = blackout, tow, cheesethief, peek, splat,
  awakening, furnace, workshop, armdrop. RarityTag pill on ritual cards
  (uncommon), heist cards (rare/epic), season cards (legendary, hidden while
  "Live now" shows).
- STREAK CALENDAR: bumpStreak() now logs local YYYY-MM-DD into ff_deal_days
  (last 120, sorted); readDealDays() exported from homeConstants.
  StreakCalendar card on Collection under progress: current month grid,
  flame cells for deal days, today outlined, streak count shown at >=2.
- NOTE: pod/browser clock reads Aug 16 2026 -> "Endless Summer" is the live
  season in preview tests (explains earlier season toasts). Not a bug.

## 2026-02 (fork) — Group/Pub window: top placement + gold standout (FF_BUILD 536)
- MoreWaysToPlay card restyled: gold gradient (#FFF9EC->#FBEED3), 2px
  #E6B23A/70 border, gold glow shadow, header text #8F6A18 — stands out from
  the white setup cards.
- Home.jsx: new guidedSealed state (set in sealFate). modesCard extracted to
  a const; renders at the TOP of the left setup column while !guidedSealed
  (i.e., when the guided intro was skipped/clicked off), and settles back
  below the DealRow once a guided fate is sealed. Verified via DOM-order
  check + screenshot after skipping intro.

## 2026-02 (fork) — "A Table for One" solo window (FF_BUILD 537)
- Home solo-fate flow (location -> category tabs -> cuisine/open-now -> deal
  row) wrapped in a translucent card (bg-white/55, backdrop-blur, testid
  solo-fate-window) titled "A Table for One" with sub "Your single fate —
  four quick steps." + UtensilsCrossed icon.
- Numbered StepLabel badges (red circle 1-4): Where are you? / What calls to
  you? / Narrow it (optional) / Let fate deal. Steps + window render only in
  solo mode (soloFlow = !group && !passport && !crawl); step pair-divs hide
  in group/passport so no stray gaps; crawl mode keeps panels visible w/o
  the window chrome.

## 2026-02 (fork) — Step auto-advance + closed dropdowns (FF_BUILD 538)
- Solo flow auto-advance: scrollToStep(n) smooth-scrolls (target -88px) 300ms
  after a step completes. Triggers: ZIP reaches 5 chars or coords set
  (soloSetZip/soloSetCoords wrappers) -> step 2; any category tab -> step 3;
  first cuisine pick or enabling Open Now -> step 4.
- All dropdowns start CLOSED on fresh visits: filtersOpen default true->false
  (cuisine/drink-type list). Trophy Room accordion already defaulted closed.
- Verified: tab click scrolled 188px, step 3 landed at exactly 88px viewport top.

## 2026-02 (fork) — Shuffle again button size match (FF_BUILD 539)
- RevealStage respin-button: added w-full justify-center + border-2 (brand
  red) so it exactly matches the Double or Nothing button below it.
  Measured live: both 151x32.

## 2026-02 (fork) — Deal button heartbeat + haptics (FF_BUILD 540)
- /heartbeat-loop.mp3: first 4 clean lub-dub cycles of user's clip (3.53s,
  cycle 882ms ~68bpm). DealRow gets `pulse` prop (Home: soloFlow && !result &&
  zip>=5 || coords). While beating: wrapper span animates ffHeartbeat 882ms
  (thump @0%, echo @32%) so framer hover/tap transforms stay intact; audio
  loops at vol 0.22 (mute-watched, pointerdown retry); navigator.vibrate
  ([26,240,18]) every 882ms on supporting devices. Stops on spin/result/mode
  change/unmount.

## 2026-02 (fork) — Reveal drumroll (FF_BUILD 541)
- DealRow heartbeat now has two modes: "beat" (882ms, vol .22) and "race"
  during spinning (460ms cycle, audio playbackRate 1.917, vol .32, haptics
  [16,120,12] @460ms). Wrapper testids deal-heartbeat-beat/-race. Verified:
  0.882s calm -> 0.46s racing during shuffle.

## 2026-02 (fork) — Heartbeat always-on + modes card standard top spot (FF_BUILD 542)
- Heartbeat pulse no longer waits for ZIP/coords: pulse = soloFlow && !result
  (ZIP resets each visit, so users never saw it). Beats on load; audio still
  needs first tap (autoplay policy) + mute-aware; haptics Android-only
  (iOS Safari has no vibration API).
- "More ways to play" card now ALWAYS renders at the top of the setup column
  (guidedSealed state and conditional placement removed entirely).
- Confirmed all accordions default closed (trophyOpen false, filtersOpen false).

## 2026-02 (fork) — Top box frosted to match (FF_BUILD 543)
- MoreWaysToPlay card: solid gold gradient -> frosted translucent
  (bg-[#FBEED3]/55 + backdrop-blur-md), matching the solo window's glass
  treatment while keeping the gold border/glow identity.

## 2026-02 (fork) — Heartbeat rework: event-driven accelerating drumroll (FF_BUILD 544)
- New shared hook /app/frontend/src/hooks/useHeartbeat.js: starts at 840ms
  cycle, tightens 10% per beat to 430ms floor; single shared Audio, ramping
  playbackRate (max 2.06), vol .3, mute-watched, pointerdown autoplay retry;
  haptics per beat ([24,~p*.27,16] slow / [15,110,12] fast).
- DealRow: idle pulse REMOVED (pulse prop deleted from Home). Heartbeat now
  runs only while spinning||loading — starts on shuffle press, accelerates,
  cuts at reveal.
- RevealStage: first tap on a covered rare fate card (onPointerDownCapture on
  the card wrapper) starts the same accelerating heartbeat + ffHeartbeat
  animation on the card, stopping when the ritual unveils (cardTapped reset
  when isCovered clears).
- Verified acceleration live: 0.68s -> 0.61s -> 0.50s -> 0.43s during shuffle.

## 2026-02 (fork) — Save Progress backup/restore in crawl tab (FF_BUILD 545)
- /app/frontend/src/lib/backup.js: exportProgress() bundles ALL ff_* localStorage
  keys (skips dev keys ff_season_test/ff_rare_force) into base64 JSON
  {v:1, app:"forkfate", ts, data}; importProgress(code) validates + writes back.
- SaveProgress.jsx card mounted at the bottom of CrawlSetupPanel: "Save my
  progress" copies the code to clipboard AND downloads forkfate-progress.txt;
  "Restore" reveals a paste textarea -> importProgress -> reload. Testids:
  save-progress-backup/-toggle-restore/-code/-restore.
- Verified live round-trip: export -> remove ff_heists_seen -> import -> trophy back.

## 2026-02 (fork) — Frosted boxes everywhere + stronger haptics (FF_BUILD 546-547)
- All card-level white boxes frosted translucent (bg-white/60-70 or tinted /60
  + backdrop-blur): crawl/group/passport pickers, reveal card, radius control,
  ZIP pill, mode tabs grid, cuisine trigger, ModeSetup lists, SaveProgress
  card, HomeInfoSections cards. Dropdown overlays (TypePicker) kept solid.
- Haptic pulses strengthened for phone motors (Galaxy etc.): slow beat
  [50,~p*.25,35], racing [40,85,30] (was 15-25ms, imperceptible on many
  devices). User confirmed prod has heartbeat build; awaiting redeploy of 547.

## 2026-02 (fork) — Save Progress moved + unmistakable haptics (FF_BUILD 548-549)
- SaveProgress card moved from CrawlSetupPanel to MoreWaysToPlay, full-width
  directly under the Trophy Room pill/accordion (user request).
- Haptics strengthened again: beat patterns now [85, p*.22, 60] slow /
  [70,70,55] racing; PLUS a guaranteed 90ms buzz fired directly inside the
  shuffle button onClick and the covered-card onPointerDownCapture (direct
  touch handlers — Android always honors these). If THAT buzz isn't felt,
  it's a device/settings issue (Touch interaction off, or iOS).

## 2026-02 (fork) — Restore reminder nudge (FF_BUILD 550)
- Home: one-time toast 12s after load when rituals+heists witnessed >= 5,
  never backed up (ff_progress_saved != 1) and never nudged
  (ff_backup_nudged != 1). "Save now" action scrolls to the SaveProgress card
  and pulses .ff-nudge-glow (gold ring x4). SaveProgress backup()/restore()
  now set ff_progress_saved=1. Verified end-to-end.

## 2026-02 (fork) — Reaper landscape fixes verified + completed (FF_BUILD 551)
- Previous session left ReaperScene.jsx referencing .ff-bat-cross /
  ffBatCrossL / ffBatCrossR that never existed in index.css — added them:
  rare crossing bats (L->R at 34s cycle, R->L at 43s, each crossing in the
  first ~18% then hidden; reduced-motion safe).
- Added mobile-landscape media query (orientation: landscape, max-height
  520px): Reaper 96vh (life-size, taller than gravestones), wrap top 54%,
  cemetery pulled down to 54vh, moon shrunk to 96px / top 8%.
- Moon z-order verified correct (cemetery z-[2] paints above moon z-auto).
- Lightning already present (ffBolt 13s/17s) — verified rendering.
- Screenshot-verified in 844x390 landscape: reaper 376px vs graves 211px,
  lightning + both crossing bat animations active. FF_BUILD bumped to 551.

## 2026-02 (fork) — Fate Points + Parchment Guide + Promo Video (FF_BUILD 552-554)
- FATE POINTS (lib/points.js): device-local rewards. +10 daily login
  (+5/day streak bonus capped +50), +15 per ritual reveal, +25 per heist
  sighting. Pill in MoreWaysToPlay under Trophy Room; RewardsDialog
  (portal to body) with 4 DEMO sponsors, two-tap redeem (auto-disarm 4s),
  FF-XXXX-XXXX cashier coupons valid 7 days, My Coupons list. Auto-included
  in Save Progress backups (ff_ prefix). Tested 100% (iteration_71.json).
- PARCHMENT INTRO (ParchmentIntro.jsx): first-run field guide on AI-generated
  parchment (guide-parchment.png), ink #241305, "Don't show this again"
  checkbox (unchecked = reshows), paper-flip sound (paper-flip.mp3,
  synthesized), first close ALWAYS opens realm chooser, reopen via footer
  "How to play" (ff:open-guide event). Points line reads "Coming soon".
- PROMO VIDEO: /app/frontend/public/promo/forkfate-promo.mp4 (1080x1920,
  66s) — Sora 2 intro + real app footage (record_promo.py) + end card,
  captions with dark backing boxes, reaper-ambient music bed. Assembly:
  /app/scripts/assemble_promo.sh.
- PENDING (user key balance empty): regenerate Sora intro (reaper picks ONE
  card + chuckles), Sora outro (warm restaurant), parchment beer-mug doodle
  swap (edit_parchment.py ready). Rerun gen_promo_clips.py + edit_parchment.py
  + assemble_promo.sh after user recharges Universal Key.

## 2026-02 (fork) — Dark Fall Forest makeover + promo v2 (FF_BUILD 555)
- FALL REALM is now a DARK realm (Home.jsx light flag excludes fall):
  moonlit forest backgrounds (fall-forest-dark.png portrait /
  fall-forest-dark-wide.png landscape v2 with genuinely DISTANT treeline),
  orientation-swapped via .ff-forest-p/.ff-forest-l CSS. Depth: blur+darken
  filters. Hero text warm tan w/ deep shadows (HeroCopy fall branch),
  hint #FF9E4A.
- Lurking eyes: small (3-5px) glowing pairs in dark pockets, per-orientation
  placements (FOREST_EYES_P/L), ffEyesLurk (long hidden gaps) + ffEyesBlink.
- Scarecrow: bigger (62svh portrait left-[-8%], 100vh sm), 3-frame WAVE
  (base/mid/up swap, ffScareBaseHide/ffScareMid/ffScareWave 52s cycle);
  frames white-keyed + de-haloed (MinFilter erosion). Front tree 60svh /
  150vh sm (sm:max-w-none uncaps width on desktop only). Jack-o-lantern
  tree decorRight z-[3] IN FRONT (decorRightZ cfg added). Old owl + moon
  overlays removed.
- Parchment now uses guide-parchment-v2.png (beer mug replaces duplicate
  cutlery); hint line on solid parchment-tone chip; coupon validity text
  contrast up; RewardsDialog confirm auto-disarms after 4s.
- Promo video v2 (70s): NEW Sora intro (reaper picks ONE card + chuckles),
  NEW Sora outro (warm restaurant, sponsor captions), captions on dark
  boxes, no white flash (two-pass webm->mp4 trims), end card "Let fate
  decide". /promo/forkfate-promo.mp4
