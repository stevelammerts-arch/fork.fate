"""Band-limit + de-thump the remaining one-shot WAVs.

The themed shuffle beds were already regenerated (gen_theme_beds.py); these are
the reveal/one-shot files that were left alone and still buzzed on phone
speakers: sub-bass that makes small drivers rattle, ultrasonic junk (the cyber
zap was 22% of its energy above 16 kHz), and hard cuts at the tail.
"""
import numpy as np
import soundfile as sf

BASE = "/app/frontend/public/"
FILES = [
    # name, high-pass Hz, low-pass Hz, peak
    ("reveal-drums-groove.wav", 80, 14000, 0.86),
    ("reveal-drums-boom.wav", 80, 14000, 0.9),
    ("reveal-electric.wav", 120, 11000, 0.86),
    ("reveal-koto.wav", 90, 14000, 0.9),
    ("reveal-steam.wav", 90, 14000, 0.9),
    ("reveal-santa.wav", 90, 14000, 0.9),
    ("reveal-owl.wav", 90, 14000, 0.9),
    ("reveal-tada.wav", 90, 14000, 0.86),
]


def shape(x, sr, hp, lp):
    n = len(x)
    F = np.fft.rfft(x)
    fr = np.fft.rfftfreq(n, 1 / sr)
    # gentle slopes — a brick wall of its own rings and reads as a click
    F *= np.clip((fr - hp * 0.5) / (hp * 0.5), 0, 1) ** 2
    F *= (1 - np.clip((fr - lp) / 2500, 0, 1)) ** 2
    return np.fft.irfft(F, n)


def edges(x, sr, fade_in=0.008, fade_out=0.09):
    a, b = int(sr * fade_in), int(sr * fade_out)
    x[:a] *= np.linspace(0, 1, a)
    x[-b:] *= np.linspace(1, 0, b) ** 0.7
    return x


if __name__ == "__main__":
    for name, hp, lp, peak in FILES:
        x, sr = sf.read(BASE + name, always_2d=False)
        mono = x if x.ndim == 1 else x.mean(axis=1)
        y = edges(shape(mono, sr, hp, lp), sr)
        m = np.abs(y).max()
        if m:
            y *= peak / m
        sf.write(BASE + name, y, sr)
        print(f"{name}: peak={np.abs(y).max():.2f} seam={abs(y[0]-y[-1]):.4f}")
