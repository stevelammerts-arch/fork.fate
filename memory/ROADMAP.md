# Fork·Fate — Suggestions Roadmap (requested: "do all")

## Phase 1 — DONE (2026-07-07, screenshot-verified)
- "The reaper has spoken" one-liner on result card (data-testid reaper-line) + led into social share text.
- Nearby grid sort control (data-testid sort-select): Featured/Closest/Top rated/Cheapest.
- Reroll-if-closed hint on result card when card.open_now is false (data-testid closed-reroll-hint).

## Phase 2 — QUEUED (backend + admin)
- Sponsor analytics: track impressions (increment when sponsor shown in fetch_active_sponsors) + click endpoint; show stats in /admin sponsor rows.
- Light moderation for public "Add spot": user submissions saved as approved=false, hidden from search until admin approves; add admin pending-approval list + approve/reject endpoints & UI.

## Phase 3 — DONE (2026-06, testing-agent verified iter28/29)
- Favorites: heart on result + grid cards, localStorage, "Favorites" drawer + count. ✅
- Daily streak (localStorage) near Deal button. ✅ (streak done earlier; favorites this session)
- Group mode: deal 3 picks to vote on, lock in winner. ✅

## Deferred (needs input / dedicated pass)
- Auto-activate sponsors on PayPal payment: requires PayPal REST API Client ID + Secret (currently manual PayPal.Me/QR). ASK USER for keys to build.
- Refactor: Home.jsx is ~1146 lines (extract RevealStage, ShufflingDeck, buildFateCard, GroupVote already split out); server.py ~826 lines into route/service modules. Dedicated low-risk pass, test after.

## Update 2026-06
- PayPal self-serve sponsor subscriptions: CODE-COMPLETE (frontend verified iter31). Pending user setup: add PAYPAL_SECRET + PAYPAL_WEBHOOK_ID to backend/.env, create PayPal webhook. Then full E2E test. Live requires PayPal Business account (currently sandbox-only).
