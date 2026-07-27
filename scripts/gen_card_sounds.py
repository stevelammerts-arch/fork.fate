"""Re-synthesize the card sounds as band-limited bursts.

The old card-riffle/card-deal had sample-level jumps up to 0.8 and ~6% of their
energy above 16 kHz — on a phone speaker that reads as a buzz/zap, and because
the riffle loops under every shuffle, users heard it on every theme.

Every snap here is shaped noise with a 2 ms attack and a smooth decay, the whole
bed is low-passed at 14 kHz, and the loop seam is silent.
"""
import numpy as np
import soundfile as sf

SR = 44100
OUT = "/app/frontend/public/"


def band_noise(n, lo, hi, rng):
    x = rng.standard_normal(n)
    F = np.fft.rfft(x)
    fr = np.fft.rfftfreq(n, 1 / SR)
    F[(fr < lo) | (fr > hi)] = 0
    y = np.fft.irfft(F, n)
    m = np.abs(y).max()
    return y / m if m else y


def snap(dur, lo, hi, rng, attack=0.002):
    n = int(SR * dur)
    y = band_noise(n, lo, hi, rng)
    t = np.arange(n) / SR
    env = np.minimum(t / attack, 1.0) * np.exp(-t / (dur * 0.28))
    return y * env


def lowpass(x, cut=14000):
    F = np.fft.rfft(x)
    fr = np.fft.rfftfreq(len(x), 1 / SR)
    roll = np.clip((fr - cut) / 2500, 0, 1)
    F *= (1 - roll) ** 2
    return np.fft.irfft(F, len(x))


def edges(x, fade=0.006):
    n = int(SR * fade)
    ramp = np.linspace(0, 1, n)
    x[:n] *= ramp
    x[-n:] *= ramp[::-1]
    return x


def normalize(x, peak=0.72):
    m = np.abs(x).max()
    return x * (peak / m) if m else x


def riffle(seed=7, dur=0.7):
    """One riffle cycle: a cascade of card snaps that loops cleanly."""
    rng = np.random.default_rng(seed)
    n = int(SR * dur)
    out = np.zeros(n)
    # cards accelerate through the middle of the cycle, then the deck settles
    times = np.concatenate([
        np.linspace(0.02, 0.30, 12) + rng.normal(0, 0.004, 12),
        np.linspace(0.31, 0.52, 14) + rng.normal(0, 0.003, 14),
    ])
    for i, t0 in enumerate(times):
        s = snap(0.026 + rng.random() * 0.014, 1400, 7000, rng)
        amp = 0.35 + 0.5 * rng.random() * (1 - i / len(times) * 0.35)
        i0 = int(t0 * SR)
        seg = s[: max(0, n - i0)]
        out[i0:i0 + len(seg)] += seg * amp
    # a soft body thump for the deck landing, well away from the seam
    body = snap(0.18, 90, 320, rng, attack=0.004) * 0.35
    i0 = int(0.30 * SR)
    out[i0:i0 + len(body)] += body[: n - i0]
    out[int(SR * 0.62):] *= np.linspace(1, 0, n - int(SR * 0.62))
    return normalize(edges(lowpass(out)))


def deal(seed=11, dur=0.5):
    """A single card laid down: whoosh into a soft snap."""
    rng = np.random.default_rng(seed)
    n = int(SR * dur)
    out = np.zeros(n)
    wh = band_noise(int(SR * 0.16), 700, 5200, rng)
    t = np.arange(len(wh)) / SR
    out[: len(wh)] += wh * (np.minimum(t / 0.03, 1) * np.exp(-t / 0.06)) * 0.55
    s = snap(0.09, 1200, 6500, rng)
    i0 = int(0.12 * SR)
    out[i0:i0 + len(s)] += s[: n - i0] * 0.9
    b = snap(0.2, 80, 260, rng, attack=0.003)
    out[i0:i0 + len(b)] += b[: n - i0] * 0.4
    return normalize(edges(lowpass(out)), 0.8)


if __name__ == "__main__":
    sf.write(OUT + "card-riffle.wav", riffle(), SR)
    sf.write(OUT + "card-deal.wav", deal(), SR)
    print("wrote card-riffle.wav, card-deal.wav")
