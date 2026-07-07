# Fork·Fate — Suggestions Roadmap (requested: "do all")

## Phase 1 — DONE (2026-07-07, screenshot-verified)
- "The reaper has spoken" one-liner on result card (data-testid reaper-line) + led into social share text.
- Nearby grid sort control (data-testid sort-select): Featured/Closest/Top rated/Cheapest.
- Reroll-if-closed hint on result card when card.open_now is false (data-testid closed-reroll-hint).

## Phase 2 — QUEUED (backend + admin)
- Sponsor analytics: track impressions (increment when sponsor shown in fetch_active_sponsors) + click endpoint; show stats in /admin sponsor rows.
- Light moderation for public "Add spot": user submissions saved as approved=false, hidden from search until admin approves; add admin pending-approval list + approve/reject endpoints & UI.

## Phase 3 — QUEUED (engagement/discovery, frontend)
- Favorites: heart on result + grid cards, saved to localStorage, a "Favorites" viewer + count.
- Spin history + daily streak (localStorage) shown near spin button/footer.
- Group mode: spin and present 3 picks to vote on.

## Deferred (needs input)
- Auto-activate sponsors on PayPal payment: requires PayPal REST API Client ID + Secret (currently manual PayPal.Me/QR). Ask user for keys to build.
- Refactor server.py (~790 lines) into route/service modules — dedicated low-risk pass, test after.
