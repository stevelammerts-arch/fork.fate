# Fork·Fate — Changelog

## 2026-07-08
- **Logo finalized**: switched to fully opaque `logo-icon.png` (logo composited on solid black, zero transparency). Header/footer/admin/favicon/PWA icon all use it. Badge is a black circle with a silver ring (`ring-white/25`), logo scaled `scale-[1.6]` to fill the circle tightly (no black gap). Fixes the long-standing "checkered/white ring" complaint — root cause was (a) semi-transparent halo baked into old logo PNGs and (b) black padding gap between logo and badge edge.
- **Header enlarged**: taller bar (`py-6`), logo `h-16`, title `text-3xl`.
- **Lamp glow fix**: removed `translateZ(60px)` from the reaper lantern glow so it stays locked to the lamp under 3D tilt (was drifting due to perspective parallax). Glow shares the skew wrapper with the reaper image.
- **Cache/PWA**: added service-worker kill-switch inline script in index.html (unregisters stale SWs, clears caches, reloads once). Hardened "Check for updates" button to purge caches + cache-bust reload.
- **Moderation queue**: public "Add spot" submissions now save as `status:"pending"` (hidden from spin/list/search). Admin `/admin` has a "Pending submissions" section (approve/reject) with count badge. Endpoints: GET/POST approve/DELETE reject under `/api/admin/submissions`.
- **SEO**: added `robots.txt` (Disallow /admin + sitemap ref) and `sitemap.xml`; re-added canonical/OG/Twitter meta tags for fork-fate.com. Added "How it works" + FAQ section to homepage (fixes thin-content warning). SEO health score 89.
- **Code review fixes (safe subset)**: `useMemo` for results sort; logging added to previously-empty catch blocks (Home shareFate, CheckUpdatesButton, AdUnit); converted 24 `is True/False` → `== True/False` in backend test files. Deferred (documented): localStorage→httpOnly auth, large component splits — flagged as separate testing-heavy refactors; most "missing hook deps" and server.py `is not None` flags were false positives.

## 2026-07-08 (analytics + icon)
- **Sponsor Analytics (P1 done)**: tracks impressions (incremented in `fetch_active_sponsors` when a sponsor is shown in a search) and clicks (public `POST /api/track/sponsor-click`, fired from RestaurantCard outbound links when `r.sponsored`). Admin `/admin` shows a totals summary (impressions/clicks/CTR) + per-sponsor stats row. Counters init on `create_sponsor`. Verified end-to-end (curl + UI).
- **PWA icon root-cause fix**: previous logo PNGs had the transparency **checkerboard baked into the pixels** (AI-generated), which showed on the home icon + splash. Regenerated `logo-app.png` (red circle on SOLID black square, no checker) + opaque `logo-app-192/512.png`. Updated manifest icons, favicon, apple-touch-icon, header/footer/admin (scale-110). New filenames force Android WebAPK re-mint. Requires deploy + phone: remove app, Chrome→Site settings→fork-fate.com→Clear & reset, reinstall.

## 2026-07-08 (shareable fate card)
- **Shareable result image**: new "Share as image" button on the result card generates a branded 1080x1080 PNG (canvas-based `buildFateCard` in Home.jsx) — dark bg + red glow, FF logo badge, "THE REAPER HAS SPOKEN", restaurant name, meta (cuisine/price/rating/distance), and "fork-fate.com" CTA footer. Mobile uses Web Share API with the image file; desktop downloads the PNG. Uses same-origin /logo-app.png (no CORS taint). Verified: downloads correctly, no console errors.

## 2026-07-08 (fates dealt counter)
- **Social-proof counter**: homepage shows "N fates dealt" (data-testid=fates-dealt-counter) under the Deal button with a red dice icon. Backend: `stats` collection doc {key:"fates_dealt"}, seeded at 1042 on startup (independent of restaurant seed). Endpoints `GET /api/stats/fates` (read) and `POST /api/stats/fate-dealt` (increment, rate-limited, upsert + ReturnDocument.AFTER). Frontend fetches on mount and increments in runShuffle when the result is revealed. Verified: 1044 -> 1045 on spin, no console errors. NOTE: base seed of 1042 is a chosen social-proof starting number (adjustable).

## 2026-07-08 (daily streak)
- **Daily streak**: localStorage-based (`ff_streak` = {date, count}). Homepage shows a "🔥 N-day streak" pill (data-testid=streak-badge, Flame icon) next to the fates counter when streak >= 2. `readStreak()` shows current active streak on load (today/yesterday), `bumpStreak()` runs on each completed spin (same-day = no change, consecutive day = +1, gap = reset to 1). Verified: 2-day on load -> 3-day after spin, no console errors. No backend needed (per-device).

## Deployment notes
- Production: https://fork-fate.com (custom domain, user-owned, connected via Entri).
- All logo/header/glow changes are in PREVIEW; require Save to GitHub → Deploy to reach production.
- After deploy, hard-refresh live site once; SW kill-switch handles future cache automatically.
- Admin password: GrimReaper!2026.
- Health check: PASS (no deployment blockers).

## 2026-06 (backlog features + fixes — fork session)
- **Save Favorites**: localStorage hook `useFavorites` (keyed by name+address). Heart toggle on result card (`result-favorite-toggle`) and each nearby card (`favorite-toggle-<id>`). Header "Favorites" button (`open-favorites-button`) opens a right Sheet drawer (`favorites-drawer`) with count badge, remove, and open-on-Google. Persists across reloads. Verified via testing agent iter28/29.
- **Group Mode**: toggle (`group-mode-toggle`); Deal button becomes "Deal 3 Fates!". After shuffle, `GroupVote` panel shows 3 distinct picks with +vote counters and "Lock in winner" -> reveals standard result card. Component: `components/GroupVote.jsx`.
- **Reroll-if-closed** (runShuffle in Home.jsx): gently prefers open spots but ONLY when >=5 are open (else full pool) to preserve variety; `lastPickRef` prevents back-to-back repeats. FIXES user bug "every deal lands on the same spot (the deli sponsor)" caused by an earlier strict open-only pool that collapsed to always-open sponsors. Verified iter29 (no back-to-back repeats, rotates across spots).
- **Share-link OG image fixed**: old `og:image` = logo-icon.png had a checkerboard baked in (flattened transparency). New branded opaque `public/og-image.png` (1200x630, circular logo on black + red glow + wordmark/tagline/URL). index.html og:image/twitter:image now point to it with width/height/alt meta.
- **Copy: "spin" -> "shuffle"**: all user-facing "spin" wording changed to the deck metaphor ("shuffle"/"shuffle the deck"/"Shuffle again") across Home.jsx (FAQ, closed hint, respin button, canvas card, share text), SocialShare.jsx, BecomeSponsorDialog.jsx, index.html meta, manifest.json, and the OG image.
- **Fixes from iter28**: result-favorite-toggle now `e.stopPropagation()+preventDefault()` (was not saving); shuffle-popup `pointer-events:none` while flashHit (was absorbing early clicks); FavoritesDrawer SheetDescription added (a11y).
- **Logo shine cadence**: header logo sheen `repeatDelay` 8s -> 5s.
- NOTE: All in PREVIEW; require Save to GitHub -> Deploy for production. Social platforms cache OG previews — re-scrape via platform debugger after deploy (new og-image.png filename helps force refetch).

## 2026-06 (Deal from my favorites)
- **Deal from my favorites**: one-tap shuffle limited to hearted spots. `dealFromFavorites()` in Home.jsx sets results=favorites and runs runShuffle(favorites). Red CTA in the Favorites drawer (`deal-from-favorites-button`), shown only when favorites>0; label becomes "Deal 3 from favorites" in group mode. Verified iter30 (3/3: empty state, single deal lands on a favorite, group variant drives vote panel).

## 2026-06 (security hardening + AdSense verify)
- **SEC-004**: /api/places/photo now validates `name` against strict regex `places/[A-Za-z0-9_-]+/photos/[A-Za-z0-9_-]+` (was `startswith("places/")`). Blocks path/query tampering. Verified: malformed=404 "Not found", well-formed passes gate, real Google photos still load (200 image/jpeg).
- **SEC-002**: rate limiter now purges empty buckets once `_RL_BUCKETS` exceeds 10k keys (bounds in-memory growth). Note: per-IP accuracy behind ingress + CORS scoping (CORS_ORIGINS) + strong ADMIN_PASSWORD/JWT_SECRET are DEPLOY-TIME concerns on the user's side (not code).
- Security audit verdict: CONDITIONAL PASS — no critical/high; 4 LOW (defense-in-depth). No secrets in source/bundle; admin gated by JWT; React escapes Google text (no XSS).
- **AdSense**: added `<meta name="google-adsense-account" content="ca-pub-7078042401291684">` to index.html <head> (verification). Loader script + ads.txt already correct. Requires DEPLOY to fork-fate.com to verify (account-specific, done from AdSense dashboard). If AdSense provides a unique google-site-verification tag, user must supply the content string.

## 2026-06 (PayPal self-serve sponsor subscriptions)
- **Self-serve sponsor subscriptions via PayPal REST Subscriptions API** (recurring $29/mo, free 1-month trial). Implemented with httpx (no SDK). Backend (server.py): paypal_token(), ensure_paypal_plan() (creates+caches product+plan in db.config), POST /api/sponsors/subscribe (creates pending sponsor active=False + PayPal subscription with custom_id=sponsor_id, returns approval_url), POST /api/paypal/webhook (verifies signature via PAYPAL_WEBHOOK_ID; ACTIVATED->active=true, CANCELLED/SUSPENDED/EXPIRED->active=false), GET /api/sponsors/subscription-status.
- Frontend: BecomeSponsorDialog.jsx rewritten to a self-serve form (name/category/price/cuisine/address/website/image/email) -> Subscribe with PayPal -> redirect to approval_url. New SponsorStatus.jsx page at /sponsor/success and /sponsor/cancelled (polls status). Manual /admin add kept as fallback for comped sponsors.
- Env: PAYPAL_ENV (sandbox|live), PAYPAL_CLIENT_ID (public, set to user's sandbox id), PAYPAL_SECRET (user adds), PAYPAL_WEBHOOK_ID (user adds after creating webhook). Endpoint returns 503 gracefully when secret unset.
- Verified iter31 (frontend): dialog/form/validation/graceful-503/status-pages/admin-regression all pass. NOTE: full PayPal E2E (real approval URL + webhook activation) PENDING user adding sandbox secret + creating webhook. User is SANDBOX-only until they upgrade to PayPal Business for live creds.
- Webhook URL: {backend}/api/paypal/webhook — preview: https://lucky-bite-1.preview.emergentagent.com/api/paypal/webhook ; prod: https://fork-fate.com/api/paypal/webhook. Events: BILLING.SUBSCRIPTION.ACTIVATED/CANCELLED/SUSPENDED/EXPIRED.

## 2026-06 (PayPal sandbox live + resilient activation)
- PayPal sandbox credentials now VALID and working (token 200). Full flow verified end-to-end: POST /api/sponsors/subscribe creates product+plan (cached in db.config: plan_id P-8NL45177PG907673CNJG7IYA) + subscription and returns a real sandbox approval_url + subscription_id. Cleaned up test records.
- RESILIENCE: /api/sponsors/subscription-status now confirms status DIRECTLY with PayPal (GET /v1/billing/subscriptions/{id}) and activates the sponsor if ACTIVE — webhook-INDEPENDENT. This is critical because the Cloudflare edge (same one that blocks the AdSense crawler) may block PayPal's server-to-server webhook. So sponsors auto-activate on the return page even if the webhook never arrives.
- Webhook (PAYPAL_WEBHOOK_ID) still empty/optional — recommended for ongoing events (cancel/suspend/expire/payment-failure -> auto-pause). Activation no longer depends on it.
- MINOR future cleanup: abandoned checkouts leave active=False pending_payment sponsor docs (harmless, never shown). Could add a TTL/cleanup job later.
- Env now set: PAYPAL_CLIENT_ID (correct 80-char id), PAYPAL_SECRET (valid), PAYPAL_ENV=sandbox. Live requires PayPal Business upgrade -> live creds + PAYPAL_ENV=live + prod webhook.

## 2026-06 (PayPal LIVE)
- Switched to LIVE: PAYPAL_ENV="live", live Client ID + Secret (validated against api-m.paypal.com, token 200). Live subscribe verified -> returns real www.paypal.com approval_url. Live plan cached in db.config: plan P-76Y23062VD544251HNJG7OLQ, product PROD-95555227G0136450S. Cleaned up verification docs.
- REMINDER: real charges now active. Must Deploy (Save to GitHub) so fork-fate.com uses live. Live webhook (https://fork-fate.com/api/paypal/webhook) still optional (activation is webhook-independent via subscription-status PayPal check). First month free means a real test subscription charges $0 upfront.

## 2026-06 (sponsor CTA prominence + copy)
- Sponsor acquisition CTAs made more prevalent (user request A+C): BecomeSponsorDialog now takes a `variant` prop. (a) subtle 'Sponsor your spot' link in the HEADER; (c) 'Own a spot like this?' featured card at the bottom of each deal result (hidden when the result itself is sponsored). Footer 'Become a sponsor' kept. Verified iter33.
- Hero kicker 'Can't decide where to eat?' made bolder (font-bold->font-extrabold, text-xs->text-sm).
- Deployment health check: PASS (no blockers; .env not gitignored, routes /api-prefixed, env-only secrets).
