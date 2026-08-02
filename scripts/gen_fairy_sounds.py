"""Fairy Gully theme audio — SUPERSEDED (Feb 2026).

The user replaced both outputs with real recordings (piano-bell shuffle,
magic-bottles reveal), processed via ffmpeg into /shuffle-fairy.wav and
/reveal-fairy.wav. DO NOT re-run this script — it would clobber them.
Kept for reference only.
"""
import numpy as np
from scipy.signal import butter, sosfilt
from scipy.io import wavfile

SR = 44100


def chime(freq, dur, sr=SR, bright=0.5):
    """Struck-chime partial stack with exponential decay."""
    t = np.linspace(0, dur, int(sr * dur), endpoint=False)
    out = np.zeros_like(t)
    for h, amp in [(1, 1.0), (2.76, 0.45 * bright), (5.4, 0.2 * bright), (8.9, 0.08 * bright)]:
        out += amp * np.sin(2 * np.pi * freq * h * t) * np.exp(-t * (3.2 + h))
    out *= np.exp(-t * 1.6)
    return out


def place(mix, sound, at, gain=1.0):
    i = int(SR * at)
    end = min(len(mix), i + len(sound))
    mix[i:end] += sound[: end - i] * gain


# ---------- shuffle loop (12s) ----------
DUR = 12.0
n = int(SR * DUR)
t = np.linspace(0, DUR, n, endpoint=False)
rng = np.random.default_rng(42)

# Breeze: lowpassed noise with slow amplitude swells
breeze = rng.standard_normal(n)
sos = butter(3, 600, btype="low", fs=SR, output="sos")
breeze = sosfilt(sos, breeze)
swell = 0.55 + 0.45 * np.sin(2 * np.pi * t / 6.0 + 1.2) * np.sin(2 * np.pi * t / 3.7)
breeze *= swell * 0.16

# Wind chimes: sparse pentatonic plinks (A major pentatonic, airy register)
NOTES = [880.0, 987.77, 1108.73, 1318.51, 1479.98, 1760.0]
mix = breeze.copy()
for at in np.sort(rng.uniform(0.2, DUR - 1.6, 14)):
    f = NOTES[rng.integers(0, len(NOTES))]
    place(mix, chime(f, 1.5, bright=0.6), at, gain=rng.uniform(0.1, 0.24))

# Faint bird trills: two quick warbles
def trill(f0):
    d = 0.5
    tt = np.linspace(0, d, int(SR * d), endpoint=False)
    f = f0 * (1 + 0.06 * np.sin(2 * np.pi * 11 * tt))
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 5) * np.hanning(len(tt))

place(mix, trill(2400), 3.4, 0.05)
place(mix, trill(2800), 8.9, 0.04)

# Loop-safe: crossfade tail into head
xf = int(SR * 0.5)
fade = np.linspace(0, 1, xf)
mix[:xf] = mix[:xf] * fade + mix[-xf:] * (1 - fade)
mix = mix[: n - xf]
mix /= np.max(np.abs(mix))
mix *= 0.85
wavfile.write("/app/frontend/public/shuffle-fairy.wav", SR, (mix * 32767).astype(np.int16))
print("wrote shuffle-fairy.wav", len(mix) / SR, "s")

# ---------- reveal sparkle (2.6s) ----------
RD = 2.6
rn = int(SR * RD)
rmix = np.zeros(rn)
# Ascending glissando of tiny sparkles
gliss = [659.26, 783.99, 987.77, 1318.51, 1567.98, 1975.53]
for k, f in enumerate(gliss):
    place(rmix, chime(f, 0.9, bright=0.8), 0.06 + k * 0.09, gain=0.3)
# Warm landing chime + its octave shimmer
place(rmix, chime(1046.5, 2.0, bright=0.7), 0.62, gain=0.55)
place(rmix, chime(2093.0, 1.6, bright=0.5), 0.66, gain=0.2)
# Stardust: brief high shimmer noise
shim = rng.standard_normal(int(SR * 1.1))
sos_hi = butter(4, [4000, 9000], btype="band", fs=SR, output="sos")
shim = sosfilt(sos_hi, shim) * np.exp(-np.linspace(0, 1.1, len(shim)) * 4)
place(rmix, shim, 0.05, gain=0.05)
rmix /= np.max(np.abs(rmix))
rmix *= 0.9
wavfile.write("/app/frontend/public/reveal-fairy.wav", SR, (rmix * 32767).astype(np.int16))
print("wrote reveal-fairy.wav", RD, "s")
