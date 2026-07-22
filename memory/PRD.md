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
- 2026-06 (fork): NEW 10th theme "Dragon's Hoard" (fantasy). Ambiance-type dark theme. Hero art `/fantasy-cave.jpg` (AI-generated: realistic red dragon w/ glowing yellow eyes + nostril smoke over a glittering gold/jewels/weapons hoard in a torchlit dripping cave). Accent = molten gold #E6B23A, sky #F3D9A0. Wired end-to-end: useTheme ALLOWED, AMBIANCE config + AmbianceScene render (full-cover bg, gradient scrim, firelight flicker `ffCaveFlicker`, 18 gold glitter sparkles `ffGoldTwinkle`, 5 ceiling water drips + ripples `ffDripFall`/`ffDripRipple`), Home.jsx theme dropdown ("Dragon's Hoard" + Swords icon), GuidedFlow (AMBIANCE_THEMES + SEAL_ICONS fantasy→Swords), Fate Card share image (FATE_CARD.fantasy: gold dragon crest `/fantasy-emblem.png` keyed transparent from black bg, kicker "THE DRAGON GRANTS YOUR QUEST"). Verified via screenshots: scene, guided seal, and fate card all render correctly. FF_BUILD → 2026.06-262.
- 2026-06 (fork): Dragon's Hoard gold shuffle deck + pulsing eyes. ShufflingDeck now renders gold card borders + a dragon-crest (`/fantasy-emblem.png`) card BACK + gold "Shuffling"/"Fate has chosen" label + gold winner frame (CardFront theme prop) + a gold landed pulse ring (mirrors cyber). Home.jsx reveal-flash gets a gold splash for fantasy (was red). Added a pulsing dragon-eye glow overlay `/fantasy-eyes.png` (same 1264x848 dims + identical object-cover as hero so it stays aligned to the eyes on any viewport; mix-blend screen, `ffEyeGlow` opacity pulse). Verified via screenshots: eyes aligned on desktop, shuffle deck shows gold cards + crest backs. FF_BUILD → 2026.06-266.
- 2026-06 (fork): Dragon's Hoard drip tuning — reduced ceiling drips 5→3 and darkened droplet+ripple to muted slate-blue rgba(58,88,104). Decision: NO ambient/background drip sound (autoplay-blocked + intrusive + would be the only theme with idle audio); audio stays shuffle(wings)+reveal(roar) only. FF_BUILD → 2026.06-265.
- 2026-06 (fork): Dragon's Hoard AUDIO wired + drip tuning. Shuffle loop `/shuffle-dragon.mp3` (wings, vol 0.85, in runShuffle + runCrawlShuffle loop maps), reveal `/reveal-dragon.mp3` (roar, in both reveal maps). Suppressed the reaper voice cue for fantasy (added to the voice-cue exclusion list). Sped up cave water drips ~2.5× (CAVE_DRIPS dur 2.4–3.3s). FF_BUILD → 2026.06-264. Audio files uploaded by user; verified valid+served, wiring is data-map additions (compile clean).
- 2026-06 (fork): Enriched GA4 funnel events + deploy audit. Added `deal_result` (category/theme/group — fires when the winning card lands, in Home.jsx runShuffle + crawl path), `respin` (reSpin), and `theme_select` (hooks/useTheme.js setTheme — tracks which themes are popular). Completes the seal_fate → deal_result → share_fate → app_install funnel. FF_BUILD → 2026.06-261.
- DEPLOY AUDIT (2026-06): Ran deployment_agent. Both reported "blockers" are FALSE POSITIVES verified with evidence — (1) CORS: `core.py` ALLOWED_ORIGIN_REGEX matches both `*.fork-fate.com` and `*.preview.emergentagent.com`; live preflight from preview origin returns 200 with ACAO header; `CORS_ORIGINS` env only adds extra explicit origins and intentionally ignores `*` (do NOT set it to `*`). (2) supervisord.conf exists at /etc/supervisor/conf.d/ and all services RUNNING. App is deployment-ready; no code/env changes required for deploy.
- 2026-06 (fork): Google Analytics 4 integrated. Added `gtag.js` (Measurement ID `G-4E739B8J0H`) in `public/index.html` + a safe `src/lib/analytics.js` `trackEvent()` wrapper (no-ops if gtag absent). Custom events wired: `seal_fate` (category/radius/cuisine_count/theme — in Home.jsx sealFate), `share_fate` (method text|image, category, theme — in RevealStage), `app_install_prompt` (outcome — in InstallAppButton). Page views auto-tracked. Verified gtag loads + test event fires on preview. NOTE: real data only appears in the GA4 dashboard once deployed live + traffic flows (check GA4 Realtime/DebugView). FF_BUILD → 2026.06-260.
- 2026-06 (fork): Guided ritual UX + audio polish. (1) Added a clear "tap to seal" affordance on the final ritual step — a pulsing accent ring around the fate card, an on-card "TAP HERE" cursor badge, and a bouncing "Tap the card to seal your fate" pill (all theme-colored, hidden once sealed). Users previously didn't realize they had to click the card. (2) Added a real page-turn sound (`/turn-page.mp3`, user-supplied) that plays on EVERY guided-step transition (next 0.5 / back 0.35 vol) and on the seal tap (0.6 vol), respecting the existing `ff_muted` localStorage flag. NOTE: `MousePointerClick` must stay imported in GuidedFlow.jsx (a missing import caused a runtime crash during dev). FF_BUILD → 2026.06-259. Verified via screenshots on Winter.
- 2026-06 (fork): Made the guided "Seal your fate" ritual (`GuidedFlow.jsx`) fully theme-aware. It now consumes `theme` + `accent` props from `Home.jsx`. Reaper/dark theme keeps the exact gothic skull/red design; all other themes recolor accents (progress bar, buttons, chips, step labels) to the theme accent, swap the seal Skull for a per-theme lucide icon (winter→Snowflake, summer→Sun, spring→Flower2, fall→Leaf, cyber→Zap, steam→Cog, tiki→Palmtree, light→Sparkles), use a light card surface on bright seasonal themes, and change gothic copy ("The reaper offers your fate" → "Fate offers your card") on non-Reaper themes. Bumped FF_BUILD to 2026.06-256. Verified via screenshots on Winter + Reaper. NOTE: the prior fork's rewrite of this component was lost; re-implemented from scratch. The winning-card `mysticalReveal` aura in Home.jsx was already theme-aware.
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
