"""Synthesize the Coffee Shop shuffle bed: warm cafe murmur + porcelain cup
clinks + espresso machine hiss swells. Same artifact-free pipeline as
gen_theme_beds.py (noise-dominant, band-limited, crossfade-looped).

Run:  python3 scripts/gen_cafe_bed.py
"""
import sys

sys.path.insert(0, "/app/scripts")
import numpy as np
from gen_theme_beds import SR, band, rms_norm, finish, bursts, pings


def cafe():
    rng = np.random.default_rng(11)
    n = int(12.0 * SR)
    t = np.arange(n) / SR
    out = np.zeros(n)
    # Crowd babble: ~90 short voice-like syllables (narrow-band noise puffs in
    # the speech band) instead of a steady noise wash — no static hiss.
    for _ in range(90):
        start = rng.uniform(0.0, 11.4)
        dur = rng.uniform(0.12, 0.38)
        i0, m = int(start * SR), int(dur * SR)
        if i0 + m >= n:
            continue
        c = rng.uniform(220, 850)
        tt = np.arange(m) / SR
        env = np.sin(np.pi * tt / dur) ** 2
        out[i0:i0 + m] += band(rng.normal(0, 1, m), c * 0.7, c * 1.3) * env * rng.uniform(0.05, 0.12)
    # Very low, warm room tone (kept far below the babble)
    out += rms_norm(band(rng.normal(0, 1, n), 120, 420), 0.028) * (0.7 + 0.3 * np.sin(2 * np.pi * 0.17 * t))
    # Porcelain cup clinks + cups set down on saucers
    out += pings(n, (1.3, 3.9, 6.7, 8.1, 10.6), (1850.0, 2400.0, 3050.0), 0.07, 30.0, rng)
    out += bursts(n, (2.6, 7.4, 11.2), 0.22, 90, 320, 0.20, 16.0, rng)
    # One gentle espresso steam-wand swell (mellower band, quieter)
    i0, m = int(5.2 * SR), int(1.0 * SR)
    tt = np.arange(m) / SR
    out[i0:i0 + m] += band(rng.normal(0, 1, m), 1500, 4200) * (np.sin(np.pi * tt / 1.0) ** 2) * 0.10
    finish(out, "shuffle-cafe.wav")


if __name__ == "__main__":
    cafe()
