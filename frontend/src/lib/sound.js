// Shared home-page audio helpers (mute-aware).

// Themed ambience that plays during the shuffle: [src, volume, loop].
// All beds are synthesized band-limited noise (see scripts/gen_theme_beds.py) —
// earlier versions held pure tones or near-Nyquist junk that phone speakers
// reproduced as a buzz or zap.
// Volumes are loudness-matched (RMS x volume) so every bed sits clearly BELOW
// its realm's reveal stinger: cyber/fall/winter files are hot, so they get
// lower gains (audited 2026-02: bed effRMS <= ~0.75x reveal effRMS).
export const SHUFFLE_LOOPS = {
  light: ["/shuffle-cafe.wav?v=2", 0.75, true],
  tiki: ["/reveal-drums-groove.wav", 1.0, false],
  cyber: ["/shuffle-cyber.mp3?v=2", 0.5, true],
  summer: ["/shuffle-seagulls.wav", 0.7, true],
  steam: ["/shuffle-jacobs.wav", 0.85, true],
  spring: ["/shuffle-spring.wav", 0.8, true],
  winter: ["/shuffle-winter.wav", 0.65, true],
  fall: ["/shuffle-fall.wav", 0.55, true],
  fantasy: ["/shuffle-dragon.mp3", 0.85, true],
  fairy: ["/shuffle-fairy.wav", 0.8, true],
};

/** One-shot sound respecting the global mute; returns the Audio element. */
export function playSound(src, volume = 0.9) {
  try {
    if (localStorage.getItem("ff_muted") === "1") return null;
    const a = new Audio(src);
    a.volume = volume;
    a.play().catch(() => {});
    return a;
  } catch (e) { return null; /* audio unavailable — non-critical */ }
}
