"""Synthesize a faint, mournful ghostly wail for the Reaper reveal flourish.

Two overlapping "voices" (detuned harmonic stacks with slow vibrato) glide
up then sink down — the classic "oooOOOooo" — over a bed of airy band-passed
breath noise, finished with a cheap multi-tap reverb. Output is deliberately
quiet: it sits UNDER the reveal thunder while the souls drift up.

Writes /app/frontend/public/soul-wail.wav (mono 44.1k 16-bit).
"""
import numpy as np
from scipy.signal import butter, sosfilt
from scipy.io import wavfile

SR = 44100
DUR = 4.2
t = np.linspace(0, DUR, int(SR * DUR), endpoint=False)


def env(attack, release, dur=DUR):
    e = np.ones_like(t)
    a = int(SR * attack)
    r = int(SR * release)
    e[:a] = np.linspace(0, 1, a) ** 2
    e[-r:] = np.linspace(1, 0, r) ** 2
    e[t > dur] = 0
    return e


def voice(f0_pts, vib_hz, vib_amt, detune=1.0, seed=0):
    """Harmonic wail voice following a pitch contour (times, freqs)."""
    times, freqs = zip(*f0_pts)
    f0 = np.interp(t, times, freqs) * detune
    rng = np.random.default_rng(seed)
    vib = 1 + vib_amt * np.sin(2 * np.pi * vib_hz * t + rng.uniform(0, 6.28))
    phase = 2 * np.pi * np.cumsum(f0 * vib) / SR
    out = np.zeros_like(t)
    for h, amp in [(1, 1.0), (2, 0.35), (3, 0.12), (4, 0.05)]:
        out += amp * np.sin(h * phase)
    return out


# Voice 1: rise-and-fall wail — an octave down, dark and mournful
v1 = voice([(0, 98), (1.3, 156), (2.4, 131), (4.2, 82)], 4.6, 0.022, seed=1)
v1 *= env(0.9, 1.4)
# Voice 2: a second soul, delayed, slightly detuned, quieter
v2 = voice([(0, 117), (1.8, 175), (3.0, 147), (4.2, 93)], 4.1, 0.028, detune=1.012, seed=2)
d = int(SR * 0.55)
v2 = np.roll(v2 * env(1.1, 1.5), d)
v2[:d] = 0

# Airy breath: band-passed noise following a softer envelope — kept low and dark
rng = np.random.default_rng(7)
noise = rng.standard_normal(len(t))
sos = butter(4, [180, 700], btype="band", fs=SR, output="sos")
breath = sosfilt(sos, noise) * env(1.2, 1.6) * 0.3

mix = v1 * 0.8 + v2 * 0.5 + breath

# Roll the top end off hard so it sounds like it rises from a crypt
sos_lp = butter(2, 1300, btype="low", fs=SR, output="sos")
mix = sosfilt(sos_lp, mix)

# Cheap reverb: decaying delay taps
wet = mix.copy()
for delay_s, gain in [(0.09, 0.4), (0.17, 0.28), (0.29, 0.18), (0.43, 0.1)]:
    ds = int(SR * delay_s)
    tap = np.roll(mix, ds) * gain
    tap[:ds] = 0
    wet += tap

wet /= np.max(np.abs(wet))
wet *= 0.55  # keep it faint
wavfile.write("/app/frontend/public/soul-wail.wav", SR, (wet * 32767).astype(np.int16))
print("wrote /app/frontend/public/soul-wail.wav", len(wet) / SR, "s")
