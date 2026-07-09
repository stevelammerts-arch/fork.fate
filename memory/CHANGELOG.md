# Fork·Fate — Changelog

## 2026-07-09 (batch 2)
- Reveal drama: added drifting red/black mist behind the full-screen shuffle popup (Home.jsx, data-testid shuffle-mist).
- Shareable Fate Card (`buildFateCard`) redesigned: skeleton hand presents a dark card with logo, "THE REAPER HAS SPOKEN", pick name, meta + Fork·Fate footer. No external photo (avoids canvas CORS taint). Verified via generated PNG.
- Admin MRR widget: new `GET /api/admin/sponsors/stats` (MRR/ARR, paying subs, active spots, impressions/clicks). Cards shown atop /admin (data-testid mrr-overview / stat-*). Endpoint verified via curl.
- Reveal laugh: plays once per app-open (sessionStorage `ff_laugh_played`) on first reveal. Source = Wikimedia Commons "Evil laughter" (public domain), processed with ffmpeg: pitched to ~0.72, isolated single "muah-ha-ha-haaa" phrase, final vowel time-stretched (~0.3x) + echo, ~2.5s. File: /public/reaper-laugh.mp3.
- Skeleton hand image (`/public/skeleton-hand.png`) regenerated (single hand, palm behind, fingers gripping edges, thumb on front); baked-in checkerboard stripped to true alpha.
- Reveal hold extended to 5.5s.

## 2026-07-09 (batch 1)
- Skeleton hand overlay grips the winning card during the "landed" reveal moment (ShufflingDeck).

## Prior sessions (summary)
- Guided ritual on every open; live Google Places search (1-50mi); roulette shuffle; PayPal Live sponsor subscriptions + daily auto-reconcile; favorites; group mode; gothic tarot reveal; PWA + AdSense; secure /admin portal.
