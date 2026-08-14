# Fork·Fate — Suggestions Roadmap

## Phase 5 — DONE (2026-02, fork session)
**Sponsor monetization split (local-first architecture):**
- New `tier` field on Sponsor: `local` (fate-deck slots, $19/mo) vs `chain_coupon_only` (bonus offer only, $499/mo).
- `fetch_active_sponsors` filters to `tier=local` — chains NEVER crowd out hidden gems.
- `<ChainCouponStrip>` renders 1 chain coupon beside the local winner: "Bonus offer nearby · {chain name}".
- Admin `SponsorForm` tier selector.

**Sponsor Coupon System:**
- `Coupon` model (code, discount type, value, terms, expiry) on Sponsor.
- `<CouponReveal>` tap-to-reveal on winning card; compact badge on 3 alternates.
- `POST /api/sponsors/{id}/coupon-copy` deduped tracking → `coupon_copies` counter.
- Admin form: amber coupon block with Clear button.

**"Find us on Fork·Fate" social card:**
- `GET /api/sponsors/{id}/social-card?format=square|story|pdf` — PIL + qrcode.
- Coupon-aware tagline: "FIND US & GET A COUPON AT FORK-FATE.COM".
- QR → `https://fork-fate.com/?sponsor={id}`. Fork·Fate logo bottom-right.

**Need Help? sheet (safety flow):**
- Trigger: "Need Help?" pill in header (mobile + desktop).
- ZIP input + "Use my location" button (geolocation with 10s failsafe timeout, permission-code-aware error messages).
- Radius chips: 5 / 10 / 25 / 50 mi (default 25).
- 6 categories: ER, Urgent Care, Dentist, Vet, Pharmacy, Food Bank & Pantry.
- Non-shuffle direct list of 3 nearest with Call + Directions buttons.
- `GET /api/places/essentials` (rate-limited, radius clamped 1-100 mi).
- Crisis lifelines strip on Home: 988 · 988+1 (Veterans) · text 838255.
- Inline disclaimer + Legal Section 4 "Not liable for treatment/care" language.

**Admin ROI tools:**
- Weekly Impressions tile: `GET /api/admin/sponsors/impressions-week` + `sponsor_impression_events` (35-day TTL) + top-5 bar chart.
- CSV export of beta testers (previous phase).

**Brand & polish:**
- Dragon claw overlay on shuffle-land for Dragon's Hoard theme (transparent PNG, alpha-keyed via PIL).
- Veteran-owned & managed pill in footer.
- Legal Terms fully renumbered (11 sections).

**P0 security fixes:**
- MD5 → SHA-256 in `seed_data.py`.
- Unsafe `eval()` → `json.loads()` in tests.
- Hardcoded admin passwords in 5 test files → `os.environ["ADMIN_PASSWORD"]` + `conftest.py`.

**Deploy hygiene:**
- 320MB unused `/public/downloads/` → `/app/assets/print_files/` (fixes inotify ENOSPC on cold boot).
- Deployment agent: PASS, no blockers.

## Phase 1 — DONE (2026-07-07, screenshot-verified)
- "The reaper has spoken" one-liner on result card (data-testid reaper-line) + led into social share text.
- Nearby grid sort control (data-testid sort-select): Featured/Closest/Top rated/Cheapest.
- Reroll-if-closed hint on result card when card.open_now is false (data-testid closed-reroll-hint).

## Phase 2 — QUEUED (backend + admin)
- Sponsor analytics: track impressions (increment when sponsor shown in fetch_active_sponsors) + click endpoint; show stats in /admin sponsor rows.
- Light moderation for public "Add spot": user submissions saved as approved=false, hidden from search until admin approves; add admin pending-approval list + approve/reject endpoints & UI.

## Phase 3 — DONE (2026-06, testing-agent verified iter28/29)
- Favorites: heart on result + grid cards, localStorage, "Favorites" drawer + count. ✅
- Daily streak (localStorage) near Deal button. ✅
- Group mode: deal 3 picks to vote on, lock in winner. ✅

## Phase 4 (previously "Deferred") — DEFERRED
- Auto-activate sponsors on PayPal payment: requires PayPal REST API Client ID + Secret (currently manual PayPal.Me/QR). ASK USER for keys to build.
- Home.jsx refactor: DONE 2026-02 fork (1564 -> 1157 lines; extracted components/home/* + lib/sound.js + lib/geo.js + hooks/useShareTarget.js; regression-tested iter70). Optional further pass: extract doSearch/runShuffle into a useShuffle hook.
- Sponsor social card auto-email on subscription activation (route exists; just needs the mailer hook).
- Sponsor-status page download buttons for the 3 social card formats.

## Update 2026-06
- PayPal self-serve sponsor subscriptions: CODE-COMPLETE (frontend verified iter31). Pending user setup: add PAYPAL_SECRET + PAYPAL_WEBHOOK_ID to backend/.env, create PayPal webhook. Then full E2E test. Live requires PayPal Business account (currently sandbox-only).

## Update 2026-02 (fork)
- Collectible Fates: DONE — golem awakening + furnace blast unlock 'The Awakening' and 'Furnace Blast' trophies on /rituals (25 total).
- Golem Duet: DONE — left golem's ember eyes flicker while the right brother awakens.
- Remaining backlog: Seasonal events (limited-time realm takeovers w/ exclusive rituals); IARC rating ID for manifest (user hasn't received it yet); optional useShuffle hook extraction.
