# Fork·Fate — Changelog

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
