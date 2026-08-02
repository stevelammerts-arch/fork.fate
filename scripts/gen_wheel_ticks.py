"""Wheel of Fate tick track, mathematically matched to the wheel animation.

The wheel spins ~7.5 turns over 5.4s with easing p(t) = 1 - (1-t)^3.2
(see WheelOfFate.jsx). A tick fires every time the wheel crosses a segment
boundary (45° for an 8-slice wheel): fast rattle at launch, satisfying
slow-down, final landing thock. Writes /app/frontend/public/wheel-tick-end.mp3
"""
import subprocess

import numpy as np
from scipy.io import wavfile

SR = 44100
DUR = 5.4
POWER = 3.2
TOTAL_DEG = 7.5 * 360  # turns + average landing offset
SEG = 45.0             # 8-segment wheel

n = int(SR * DUR)
mix = np.zeros(n)


def tick(strength=1.0):
    """Wooden peg click: damped high burst + noise transient."""
    d = 0.030
    t = np.linspace(0, d, int(SR * d), endpoint=False)
    body = np.sin(2 * np.pi * 2100 * t) * np.exp(-t * 260)
    snap = np.random.default_rng(3).standard_normal(len(t)) * np.exp(-t * 700) * 0.6
    return (body + snap) * strength


def place(at, s):
    i = int(SR * at)
    end = min(n, i + len(s))
    if i < n:
        mix[i:end] += s[: end - i]


# Tick whenever rotation crosses k*SEG: solve p(t) = k*SEG/TOTAL for t.
k = 1
while k * SEG <= TOTAL_DEG:
    p = k * SEG / TOTAL_DEG
    t_k = 1 - (1 - p) ** (1 / POWER)
    at = t_k * DUR
    # ticks soften slightly as the wheel slows, then the last few get weighty
    frac = k * SEG / TOTAL_DEG
    strength = 0.9 - 0.35 * frac if frac < 0.85 else 0.75 + 0.5 * (frac - 0.85)
    place(at, tick(strength))
    k += 1

# Landing thock
d = 0.09
t = np.linspace(0, d, int(SR * d), endpoint=False)
thock = (np.sin(2 * np.pi * 320 * t) + 0.5 * np.sin(2 * np.pi * 190 * t)) * np.exp(-t * 60)
place(DUR - 0.06, thock * 1.1)

mix /= np.max(np.abs(mix))
mix *= 0.9
wavfile.write("/tmp/wheel_ticks.wav", SR, (mix * 32767).astype(np.int16))
subprocess.run(["ffmpeg", "-y", "-i", "/tmp/wheel_ticks.wav", "-b:a", "128k", "/app/frontend/public/wheel-tick-end.mp3"], check=True, capture_output=True)
print("wrote wheel-tick-end.mp3", DUR, "s,", k - 1, "ticks")
