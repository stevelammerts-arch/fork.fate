# Fork·Fate — Changelog

## 2026-07-09 (batch 5 — monetization/cost control + audio + AdSense removal)
- Reveal sound changed from laugh to a "DUN DUN DUNNN" sting built from a REAL bowed double-bass recording (University of Iowa MIS, free for any use); low E1, lower held final, reverb. Plays once per app-open, respects mute toggle. File: /public/reaper-laugh.mp3.
- AdSense fully removed: meta tag + loader script (index.html), both ad slots (Home.jsx), deleted AdUnit.jsx, cleared ADSENSE keys from frontend/.env. (Reason: unusable behind Cloudflare + empty boxes.)
- Google Maps cost controls:
  * Hard daily search cap GOOGLE_SEARCH_DAILY_CAP (env-overridable) — currently 160/day to stay under Google's 5,000/mo free text-search tier. When exceeded, app falls back to curated data (no error).
  * Photo cost fix: real (billed) Google photo now loaded ONLY for the revealed winner (photo_url). Suggestion grid + shuffle deck + "3 more to consider" use free varied placeholder images (PLACEHOLDER_IMGS by category, hashed per spot). Verified: a full deal fires exactly 1 places/photo call (was ~20+).
  * 300s search result cache + X-Forwarded-For rate limiting (from batch 4) still in place.
- Monetization guidance given: affiliate links (DoorDash/UberEats/OpenTable), sponsor tiers, Cloudflare-friendly ad networks (Media.net/Ezoic), Pro tier, tip jar. Sponsor model ($29/mo) covers hosting.
- NOTE: user to set Google Cloud API key restriction (Places API New + Geocoding) + $50 budget alert (console-side). When sponsors land, raise GOOGLE_SEARCH_DAILY_CAP.

## 2026-07-09 (batch 4 — security audit fixes)
- Rate limiter now uses real client IP via X-Forwarded-For (per-user throttling behind ingress/CDN).
- Places search: 300s TTL result cache (cached_google_search) to curb billed Google calls; limits tightened (search 60→20, photo 300→200/min).
- /sponsors/subscribe: 10→5/min + per-IP cap of 3 pending/24h (stores created_ip); daily reconcile purges abandoned pending rows >2 days (returns purged count).
- Generic error on Google 502 (no upstream leak); /sponsors/subscription-status rate-limited (30/min).
- CORS left permissive (safe, credentials off) to avoid breaking multi-domain deploy. NOTE: restrict Google API key in Google Cloud Console (console-side, not code).

## 2026-07-09 (batch 3)
- Sound toggle in header (icon-only, mobile too): permanent mute preference in localStorage `ff_muted`; reaper laugh checks it before playing. data-testid sound-toggle-button.
- Confirmed sponsor impressions already tracked in backend (fetch_active_sponsors increments per search); surfaced in Admin engagement widget.

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
