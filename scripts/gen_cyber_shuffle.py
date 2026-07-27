"""Regenerate /reveal-cyber-radio.wav (cyber theme shuffle bed).

The old asset had most of its energy stacked at ~21.9-22 kHz (near Nyquist
aliasing junk) plus a 67/134 Hz hum, which phone speakers reproduce as a
zap/buzz. This version is band-limited (80 Hz - 8 kHz): airy detuned pad, slow
filtered static sweeps and sparse short data blips.
"""
import wave

import numpy as np

SR = 44100
DUR = 14.0
OUT = "/app/frontend/public/reveal-cyber-radio.wav"

rng = np.random.default_rng(11)
n = int(SR * DUR)
t = np.arange(n) / SR


def lp(x, cutoff):
    a = np.exp(-2 * np.pi * cutoff / SR)
    y = np.empty_like(x)
    acc = 0.0
    for i, v in enumerate(x):
        acc = a * acc + (1 - a) * v
        y[i] = acc
    return y


def lp_n(x, cutoff, times=4):
    for _ in range(times):
        x = lp(x, cutoff)
    return x


def hp(x, cutoff):
    return x - lp(x, cutoff)


# --- pad: three detuned sines, slow tremolo (musical, not a buzz) -------------
pad = sum(
    np.sin(2 * np.pi * f * t * (1 + 0.0012 * np.sin(2 * np.pi * (0.13 + i * 0.05) * t)) + p)
    for i, (f, p) in enumerate(((146.8, 0.0), (220.0, 1.1), (293.7, 2.3)))
)
pad *= 0.08 * (0.7 + 0.3 * np.sin(2 * np.pi * 0.17 * t))

# --- static: noise through a slowly sweeping band -----------------------------
noise = rng.normal(0, 1, n)
static = hp(lp_n(noise, 2600.0, 3), 600.0)
sweep = 0.35 + 0.3 * (0.5 + 0.5 * np.sin(2 * np.pi * 0.09 * t + 0.4))
static *= sweep * 0.5

# --- data blips: short sine beeps, band-limited -------------------------------
blips = np.zeros(n)
for start in (0.6, 1.9, 3.4, 5.2, 6.1, 8.3, 9.7, 11.2, 12.8):
    i0 = int(start * SR)
    m = int(0.07 * SR)
    if i0 + m >= n:
        continue
    tt = np.arange(m) / SR
    f = rng.choice([880.0, 1174.0, 1568.0])
    env = np.minimum(1.0, tt / 0.004) * np.exp(-tt * 28)
    blips[i0:i0 + m] += np.sin(2 * np.pi * f * tt) * env * 0.22

def rms_norm(x, target):
    r = float(np.sqrt((x ** 2).mean())) or 1.0
    return x * (target / r)


# Balance by RMS so the noise bed dominates: a bare sine chord reads as a hum.
pad = rms_norm(pad, 0.035)
static = rms_norm(static, 0.14)

x = pad + static + blips
x = hp(x, 80.0)
x = lp_n(x, 7000.0, 4)  # steep roll-off — the old asset's near-Nyquist junk was the zap

xf = int(0.7 * SR)
fade = np.linspace(0, 1, xf)
head, tail = x[:xf].copy(), x[-xf:].copy()
x[:xf] = head * fade + tail * (1 - fade)
x = x[:-xf]

x /= np.abs(x).max() + 1e-9
x *= 0.7
x[: int(0.04 * SR)] *= np.linspace(0, 1, int(0.04 * SR))

pcm = (np.clip(x, -1, 1) * 32767).astype(np.int16)
with wave.open(OUT, "wb") as w:
    w.setnchannels(1)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(pcm.tobytes())
print("wrote", OUT, round(len(pcm) / SR, 2), "s rms", round(float(np.sqrt((x ** 2).mean())), 4))
