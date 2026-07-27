"""Regenerate /shuffle-seagulls.wav (summer theme shuffle bed).

The previous synth held a narrow ~1.35 kHz tone for seconds at a time, which reads
as a buzz on phone speakers. This version is soft surf noise plus short, gliding
gull calls (sine + light 2nd harmonic, fast decay) — no sustained tones.
"""
import wave

import numpy as np

SR = 44100
DUR = 12.0
OUT = "/app/frontend/public/shuffle-seagulls.wav"

rng = np.random.default_rng(7)
n = int(SR * DUR)
t = np.arange(n) / SR


def one_pole_lp(x, cutoff):
    a = np.exp(-2 * np.pi * cutoff / SR)
    y = np.empty_like(x)
    acc = 0.0
    for i, v in enumerate(x):
        acc = a * acc + (1 - a) * v
        y[i] = acc
    return y


def one_pole_hp(x, cutoff):
    return x - one_pole_lp(x, cutoff)


# --- surf: filtered noise with slow swells -----------------------------------
noise = rng.normal(0, 1, n)
surf = one_pole_lp(noise, 900.0)
surf = one_pole_hp(surf, 120.0)
swell = 0.55 + 0.45 * (0.5 + 0.5 * np.sin(2 * np.pi * 0.11 * t - 1.2))
hiss = one_pole_hp(one_pole_lp(noise, 5000.0), 2200.0) * 0.18
bed = (surf * swell + hiss * swell) * 0.9
bed /= np.abs(bed).max() + 1e-9
bed *= 0.42

# --- gull calls: short "kee-aw" glides ---------------------------------------
calls = np.zeros(n)


def gull(start, f0, f1, dur, amp):
    i0 = int(start * SR)
    m = int(dur * SR)
    if i0 + m >= n:
        return
    tt = np.arange(m) / SR
    # pitch glide + gentle vibrato (keeps it bird-like instead of tonal)
    f = f0 * (f1 / f0) ** (tt / dur) * (1 + 0.03 * np.sin(2 * np.pi * 11 * tt))
    ph = 2 * np.pi * np.cumsum(f) / SR
    tone = np.sin(ph) + 0.25 * np.sin(2 * ph)
    env = np.exp(-tt * 9.0) * np.minimum(1.0, tt / 0.008)
    calls[i0:i0 + m] += tone * env * amp


for start in (0.85, 2.15, 2.42, 4.8, 7.2, 7.5, 9.6):
    gull(start, rng.uniform(1500, 2000), rng.uniform(750, 1000), rng.uniform(0.14, 0.2), rng.uniform(0.28, 0.38))

x = bed + calls
x = one_pole_hp(x, 90.0)

# --- seamless loop: crossfade the tail into the head -------------------------
xf = int(0.6 * SR)
fade = np.linspace(0, 1, xf)
head, tail = x[:xf].copy(), x[-xf:].copy()
x[:xf] = head * fade + tail * (1 - fade)
x = x[:-xf]

x /= np.abs(x).max() + 1e-9
x *= 0.72
x[: int(0.03 * SR)] *= np.linspace(0, 1, int(0.03 * SR))

pcm = (np.clip(x, -1, 1) * 32767).astype(np.int16)
with wave.open(OUT, "wb") as w:
    w.setnchannels(1)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(pcm.tobytes())
print("wrote", OUT, round(len(pcm) / SR, 2), "s rms", round(float(np.sqrt((x ** 2).mean())), 4))
