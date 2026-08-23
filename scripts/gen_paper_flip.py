"""Paper-flip sound for the parchment guide close -> realm chooser handoff.

A page turn = a quick crinkly noise sweep: soft grab, fast flip whoosh
(band-limited noise with rising pitch feel), and a gentle settle flap.
Band-limited + low-passed at 13 kHz so phone speakers don't buzz
(same hygiene as gen_card_sounds.py).
"""
import numpy as np
import soundfile as sf

SR = 44100
OUT = "/app/frontend/public/paper-flip.mp3"


def band_noise(n, lo, hi, rng):
    x = rng.standard_normal(n)
    F = np.fft.rfft(x)
    fr = np.fft.rfftfreq(n, 1 / SR)
    F[(fr < lo) | (fr > hi)] = 0
    y = np.fft.irfft(F, n)
    m = np.abs(y).max()
    return y / m if m else y


def lowpass(x, cut=13000):
    F = np.fft.rfft(x)
    fr = np.fft.rfftfreq(len(x), 1 / SR)
    roll = np.clip((fr - cut) / 2500, 0, 1)
    F *= (1 - roll) ** 2
    return np.fft.irfft(F, len(x))


rng = np.random.default_rng(11)
dur = 0.5
n = int(SR * dur)
t = np.arange(n) / SR
out = np.zeros(n)

# 1) soft grab crinkle (0-90ms): sparse high crackle
grab = band_noise(n, 2500, 9500, rng) * np.exp(-((t - 0.03) ** 2) / (2 * 0.02 ** 2)) * 0.35

# 2) the flip whoosh (60-260ms): mid-band noise, envelope swells fast and falls
env = np.exp(-((t - 0.16) ** 2) / (2 * 0.045 ** 2))
whoosh = band_noise(n, 600, 7000, rng) * env * 0.9

# 3) settle flap (260-380ms): low soft thump of the page landing
flap = band_noise(n, 120, 1800, rng) * np.exp(-((t - 0.3) ** 2) / (2 * 0.022 ** 2)) * 0.5

out = lowpass(grab + whoosh + flap)
# fade edges
f = int(SR * 0.008)
out[:f] *= np.linspace(0, 1, f)
out[-f:] *= np.linspace(1, 0, f)
out *= 0.72 / np.abs(out).max()

sf.write("/tmp/paper-flip.wav", out, SR)
print("wav written")
