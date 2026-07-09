# Fork·Fate — Changelog

## 2026-06 (reveal cinematic audio + flash — USER APPROVED "Perfect")
Final reveal sequence in `Home.jsx` (`runShuffle`):
1. Tap "Deal Your Fate!" → **voice** "Behold your fate" plays immediately (`/public/reveal-voice-v5.mp3`).
2. ~1.2s lead-in, then the deck shuffles (fast→slow).
3. Deck **lands on the winner** → ~1.2s later, as the skeleton hand presents the card:
   - ⚡ **thunder boom** fires instantly (`/public/reveal-thunder-v4.mp3`, preloaded during the tap gesture to avoid autoplay blocking; re-cut so the big boom is at t=0; 2s fade-out).
   - ⚪ **white screen flash strobes 3×** over a lingering red radial glow (`data-testid="reveal-flash"`, fixed full-screen z-70).
4. Card holds 5.5s, then transitions silently into the result panel.

Audio processing notes (ffmpeg in-container):
- Voice: from user's original upload (`20260709_102118.m4a`, 16kHz). Pitched DOWN ~5 semitones (asetrate 0.749 + atempo 1.3351), light aecho reverb, loudnorm. v5 = tighter leading-silence trim (silenceremove threshold -33dB) to remove the ~0.4s start delay.
- Thunder: real recording from Wikimedia Commons "Thunder Claps.ogg". v4 = cut from 4.18s (loudest clap onset) so the boom is immediate; compressed + loudnorm; 2s fade-out.
- Removed the old reaper-laugh cue and the old single camera-flash at landing. All cues respect the `ff_muted` localStorage toggle.

### Notes / guardrails (unchanged this session)
- LIVE PAYPAL + PRODUCTION at fork-fate.com. Preview changes are preview-only until the user deploys.
- Google Places capped at 160 searches/day; only the winning card uses a billed Google photo (shuffle deck + suggestions use free Unsplash placeholders). Do NOT revert.
- Rate-limiter IP detection uses CF-Connecting-IP; sponsor PII stripped from public endpoints. Do NOT revert.
