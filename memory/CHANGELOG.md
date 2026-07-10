# Fork·Fate — Changelog

## 2026-06 — Reveal cinematic, tarot reveal card, cuisines, bubble logo

### Reveal cinematic audio + flash (USER APPROVED)
`Home.jsx` `runShuffle`: tap → voice "Behold your fate" (`/public/reveal-voice-v5.mp3`, pitched down, trimmed) → ~1.2s → deck shuffles → lands → thunder boom (`/public/reveal-thunder-v4.mp3`, real recording, boom at t=0, 2s fade, preloaded) + white flash strobes 3× over red glow (`reveal-flash`) → 5.5s hold → result panel. Respects `ff_muted`.

### Shuffle deck / reveal card (tarot)
- `CardBack`: black card, red double-border, skull + "FORK · FATE" for all shuffling cards.
- `CardFront`: winning card is now a tarot-style black card with matching red double-border frame and the restaurant PHOTO INSET/CENTERED (not edge-to-edge).
- Landed state renders ONLY the winner (`if (landed && i !== 0) return null;`) — no backing-card lines (forensically verified, iteration_42).
- `skeleton-hand.png` regenerated: removed the baked-in white card (that was the source of the phantom "lines"); background flood-filled to transparent (scipy connected-components); only bones remain.
- Card container height `h-60` → `h-72` so the card reaches the skeleton wrists (no gap). Verified via local composite.

### Cuisine chips (`Home.jsx` top constants)
- FOOD (30+): added Steakhouse, Burgers, Sushi, Vietnamese, Diner, Tacos, Sandwiches, Ramen, Halal, Vegetarian, Poke, Soul Food, Cajun, Hot Pot, Dim Sum, Buffet, Food Trucks.
- DRINKS: added Espresso, Tea House, Juice Bar, Milkshakes, Kombucha, Cider.
- DESSERTS: added Gelato, Donuts, Cupcakes, Chocolate, Crepes, Cheesecake, Pie.
- BARS: Brewery + Distillery moved to FRONT (user has many nearby); added Wine Bar, Pub, Dive Bar, Rooftop Bar, Speakeasy, Nightclub, Karaoke, Cigar Bar, Hookah Lounge, Live Music.
- NOTE: each chip label doubles as the Google Places search keyword.

### Bubble logo (all 13 logo files)
- Regenerated the Fork·Fate badge as a glossy 3D glass bubble/orb (transparent PNG). Applied to logo-mark(.png/-192/-512), logo-app(.png/-192/-512), logo-icon(.png/-192/-512), logo-v8/9/10/11. Used by header, footer, favicon, apple-touch-icon, PWA/splash, and the shareable Fate Card canvas.

### Mobile layout fixes
- Header: `flex-col` on mobile, action buttons wrap into a full-width row below the logo (labels visible). Desktop unchanged.
- Result card right-overflow fixed via `min-w-0` on the right reveal-stage grid column (QA iteration_41).

### Cache-buster (index.html)
- `FF_BUILD` version stamp clears caches + one guarded reload on version change. Current: `2026.06-4`. Bump on each UI ship.

### Test reports
- iter 39 (desktop reveal clean), 40 (mobile reveal clean), 41 (mobile result-card no overflow), 42 (forensic border audit — only winner card bordered), 43 (hero result-card aura audit).

### Guardrails
- LIVE PAYPAL + PRODUCTION at fork-fate.com. Preview changes are preview-only until redeploy.
- Google Places capped 160/day; only the winning reveal card uses a billed Google photo.
- Rate-limit IP via CF-Connecting-IP; sponsor PII stripped from public endpoints.
