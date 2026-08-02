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
    rng = np.random.default_rng(42)
    n = int(12.0 * SR)
    t = np.arange(n) / SR
    noise = rng.normal(0, 1, n)
    # Crowd murmur: low-mid noise with slow, layered undulation (voice-like ebb)
    undulate = 0.62 + 0.22 * np.sin(2 * np.pi * 0.13 * t) + 0.16 * np.sin(2 * np.pi * 0.31 * t + 1.7)
    murmur = rms_norm(band(noise, 180, 1100), 0.105) * undulate
    # Room air: gentle high hiss
    air = rms_norm(band(rng.normal(0, 1, n), 2000, 6000), 0.018)
    # Porcelain cup clinks: short bright pings, sparse and randomized
    clinks = pings(n, (1.3, 3.9, 6.7, 8.1, 10.6), (1850.0, 2400.0, 3050.0), 0.085, 30.0, rng)
    # Cups set down on saucers: soft low thumps
    thumps = bursts(n, (2.6, 7.4, 11.2), 0.22, 90, 320, 0.22, 16.0, rng)
    # Espresso machine: two steam-wand hiss swells
    espresso = np.zeros(n)
    for start, dur in ((3.3, 1.1), (9.1, 0.9)):
        i0, m = int(start * SR), int(dur * SR)
        tt = np.arange(m) / SR
        env = np.sin(np.pi * tt / dur) ** 2
        espresso[i0:i0 + m] += band(rng.normal(0, 1, m), 2500, 7000) * env * 0.16
    finish(murmur + air + clinks + thumps + espresso, "shuffle-cafe.wav")


if __name__ == "__main__":
    cafe()
