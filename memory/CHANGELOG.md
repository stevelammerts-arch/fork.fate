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
