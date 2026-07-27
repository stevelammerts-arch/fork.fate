"""Put the wing-beats back into the Dragon's Hoard shuffle bed.

The bed was regenerated to kill a buzz and lost its wing-flaps in the process.
Each flap is band-limited (a downstroke whoosh plus a low body thump), the flap
period divides the loop length exactly, and the seam stays silent so the loop
never clicks.
"""
import numpy as np
import soundfile as sf

PATH = "/app/frontend/public/shuffle-dragon.wav"
FLAPS = 12


def band_noise(n, lo, hi, sr, rng):
    F = np.fft.rfft(rng.standard_normal(n))
    fr = np.fft.rfftfreq(n, 1 / sr)
    F[(fr < lo) | (fr > hi)] = 0
    y = np.fft.irfft(F, n)
    m = np.abs(y).max()
    return y / m if m else y


def flap(sr, rng, dur=0.62):
    """A downstroke: air whoosh swelling then falling, with a leathery thump."""
    n = int(sr * dur)
    t = np.arange(n) / sr
    whoosh = band_noise(n, 150, 2800, sr, rng)
    env = np.sin(np.pi * np.clip(t / dur, 0, 1)) ** 1.6
    # the air moves faster mid-stroke: sweep the noise brightness with a tremolo
    whoosh = whoosh * env * (0.86 + 0.14 * np.sin(2 * np.pi * 3.1 * t))
    body = band_noise(n, 60, 190, sr, rng) * np.exp(-t / 0.12) * 0.8
    return whoosh * 0.85 + body


def main():
    x, sr = sf.read(PATH, always_2d=False)
    if x.ndim > 1:
        x = x.mean(axis=1)
    n = len(x)
    rng = np.random.default_rng(3)
    wings = np.zeros(n)
    period = n // FLAPS
    for i in range(FLAPS):
        f = flap(sr, rng, dur=0.58 + rng.random() * 0.1)
        start = i * period + int(rng.integers(0, period // 6))
        seg = f[: max(0, n - start)]
        wings[start:start + len(seg)] += seg * (0.55 + 0.25 * rng.random())

    # band-limit the wings the same way the bed is, then keep the seam silent
    F = np.fft.rfft(wings)
    fr = np.fft.rfftfreq(n, 1 / sr)
    F *= np.clip((fr - 35) / 35, 0, 1) ** 2
    F *= (1 - np.clip((fr - 12000) / 2500, 0, 1)) ** 2
    wings = np.fft.irfft(F, n)

    out = x + wings * 0.42
    fade = int(sr * 0.01)
    out[:fade] *= np.linspace(0, 1, fade)
    out[-fade:] *= np.linspace(1, 0, fade)
    out *= 0.78 / np.abs(out).max()
    sf.write(PATH, out, sr)
    print(f"wings mixed: peak={np.abs(out).max():.2f} seam={abs(out[0]-out[-1]):.4f}")


if __name__ == "__main__":
    main()
