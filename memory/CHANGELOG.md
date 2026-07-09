# Fork·Fate — Changelog

## 2026-06 (audio + reveal cinematic session)
- Reveal cinematic finalized in `Home.jsx` (`runShuffle` + reveal-flash overlay):
  - Voice cue ("Behold your fate") plays on the card BEFORE the shuffle starts. Reprocessed from the user's original clean upload, pitched DOWN ~5 semitones + light reverb (`/public/reveal-voice-v2.mp3`).
  - Thunder boom plays on the reveal, timed with the flash. Real recorded thunderclap (Wikimedia "Thunder Claps.ogg", loudness-normalized), preloaded during the click gesture to avoid autoplay blocking, with a 2s fade-out (`/public/reveal-thunder-v3.mp3`).
  - White screen flash now strobes 3 times over a lingering red radial glow (`data-testid="reveal-flash"`).
  - Removed the old reaper-laugh cue at card landing. All cues respect the `ff_muted` localStorage toggle.
- User confirmed voice + thunder are "great"; thunder fade-out added last.

### Notes
- LIVE PAYPAL + PRODUCTION at fork-fate.com. Preview changes are preview-only until deployed.
- Google Places capped at 160 searches/day; only the winning card uses a billed Google photo.
