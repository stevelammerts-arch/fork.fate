# Fork·Fate — Changelog

## 2026-06 — Reveal cinematic, card back, mobile layout, cache-buster

### Reveal cinematic audio + flash (USER APPROVED)
Final sequence in `Home.jsx` `runShuffle`:
1. Tap "Deal Your Fate!" → voice "Behold your fate" plays first (`/public/reveal-voice-v5.mp3`, pitched down ~5 semitones from the user's original upload, leading silence trimmed).
2. ~1.2s lead-in, then the deck shuffles.
3. Deck lands on winner → thunder boom (`/public/reveal-thunder-v4.mp3`, real Wikimedia recording, boom at t=0, 2s fade, preloaded during tap) + white flash strobing 3× over a red glow (`data-testid="reveal-flash"`).
4. 5.5s hold, then result panel. All cues respect `ff_muted`.

### Shuffle deck branded card back (USER APPROVED)
- `CardBack` component: black card, red double-border, skull + "FORK · FATE". Shown on all shuffling cards; the winning photo appears only on the landed card.
- Nearby-spots grid kept as free Unsplash stock (confirmed no Google billing) per user (option A).

### Reveal card "lines" regression — fixed & forensically verified
- Root cause: backing card-backs peeking behind the landed winner.
- Fix: `if (landed && i !== 0) return null;` in `ShufflingDeck` — backing cards fully unmount when landed. Forensic DOM audit (iteration_42) confirmed exactly ONE bordered element remains (the white-bordered winner card); no stray outlines in the current build.
- If lines still appear on production: it's an older deployed build (needs redeploy) or a Tor Browser fingerprint-resist letterbox artifact (verify in a mainstream browser).

### Mobile header + result card
- Header: `flex-col` on mobile so action buttons wrap into a full-width row below the logo (`flex-wrap`), no clipping. All button labels shown on mobile. Desktop unchanged.
- Result card right-overflow fixed: added `min-w-0` to the right reveal-stage grid column (`Home.jsx` ~L728). QA (iteration_41) confirmed no horizontal overflow at 412×915.

### Cache-buster (index.html)
- Added a `FF_BUILD` version stamp script that clears caches + does one guarded reload when the version changes. Current: `2026.06-3`. Bump this on each UI ship so returning users get the fresh bundle.

### Test reports
- iteration_39 (desktop reveal clean), 40 (mobile reveal clean), 41 (mobile result-card no overflow), 42 (forensic border audit — only winner card bordered).

### Guardrails (unchanged)
- LIVE PAYPAL + PRODUCTION at fork-fate.com. Preview changes are preview-only until redeploy.
- Google Places capped 160/day; only the winning reveal card uses a billed Google photo.
- Rate-limit IP via CF-Connecting-IP; sponsor PII stripped from public endpoints.
