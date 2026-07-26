"""Synthesize the themed shuffle beds with an artifact-free pipeline.

Users reported buzzing (summer) and zaps (cyber, dragon). Root causes found by
scripts/audit_audio.py: sustained near-pure tones (drone), energy piled near
Nyquist (aliasing sizzle) and loop-seam discontinuities. Every bed produced here
is noise-dominant, band-limited to 70 Hz - 9 kHz with a steep FFT filter,
crossfade-looped and faded to zero at both ends so the wrap can never click.

Run:  python3 scripts/gen_theme_beds.py
Then: python3 scripts/audit_audio.py
"""
import wave

import numpy as np

SR = 44100
PUB = "/app/frontend/public/"


def band(x, lo, hi, taper=0.25):
    """Steep zero-phase band-pass with a cosine taper (no ringing artifacts)."""
    n = len(x)
    X = np.fft.rfft(x)
    f = np.fft.rfftfreq(n, 1 / SR)
    m = np.ones_like(f)
    if lo > 0:
        w = lo * taper
        m *= np.clip((f - (lo - w)) / (2 * w), 0, 1)
    if hi < SR / 2:
        w = hi * taper
        m *= np.clip(((hi + w) - f) / (2 * w), 0, 1)
    m = np.sin(m * np.pi / 2)  # smooth the mask edges
    return np.fft.irfft(X * m, n)


def rms_norm(x, target):
    r = float(np.sqrt((x ** 2).mean())) or 1.0
    return x * (target / r)


def finish(x, name, peak=0.72, xfade=0.6):
    """Crossfade the tail into the head, then fade both ends to zero."""
    xf = int(xfade * SR)
    fade = np.linspace(0, 1, xf)
    head, tail = x[:xf].copy(), x[-xf:].copy()
    x[:xf] = head * fade + tail * (1 - fade)
    x = x[:-xf]
    x = band(x, 70, 9000)
    x = x / (np.abs(x).max() + 1e-9) * peak
    e = int(0.012 * SR)
    x[:e] *= np.linspace(0, 1, e)
    x[-e:] *= np.linspace(1, 0, e)
    pcm = (np.clip(x, -1, 1) * 32767).astype(np.int16)
    with wave.open(PUB + name, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())
    print(f"wrote {name} {len(pcm)/SR:.2f}s rms={np.sqrt((x**2).mean()):.3f}")


def bursts(n, times, dur, lo, hi, amp, decay, rng):
    """Sparse band-limited noise hits (chuffs, thumps, flaps) — never tonal."""
    out = np.zeros(n)
    for start in times:
        i0 = int(start * SR)
        m = int(dur * SR)
        if i0 + m >= n:
            continue
        tt = np.arange(m) / SR
        env = np.minimum(1.0, tt / 0.012) * np.exp(-tt * decay)
        out[i0:i0 + m] += band(rng.normal(0, 1, m), lo, hi) * env * amp
    return out


def pings(n, times, freqs, amp, decay, rng):
    """Short decaying sines — brief enough that a 2s window stays non-tonal."""
    out = np.zeros(n)
    for start in times:
        i0 = int(start * SR)
        m = int(0.18 * SR)
        if i0 + m >= n:
            continue
        tt = np.arange(m) / SR
        f = float(rng.choice(freqs))
        env = np.minimum(1.0, tt / 0.004) * np.exp(-tt * decay)
        out[i0:i0 + m] += (np.sin(2 * np.pi * f * tt) + 0.3 * np.sin(4 * np.pi * f * tt)) * env * amp
    return out


# ---------------------------------------------------------------- summer -----
def summer():
    rng = np.random.default_rng(7)
    dur, n = 12.0, int(12.0 * SR)
    t = np.arange(n) / SR
    noise = rng.normal(0, 1, n)
    swell = 0.55 + 0.45 * (0.5 + 0.5 * np.sin(2 * np.pi * 0.11 * t - 1.2))
    surf = rms_norm(band(noise, 150, 3200), 0.16) * swell
    hiss = rms_norm(band(noise, 3200, 7000), 0.035) * swell
    gulls = np.zeros(n)
    for start in (0.85, 2.15, 2.42, 4.8, 7.2, 7.5, 9.6):
        i0, m = int(start * SR), int(0.17 * SR)
        tt = np.arange(m) / SR
        f0, f1 = rng.uniform(1500, 2000), rng.uniform(750, 1000)
        f = f0 * (f1 / f0) ** (tt / 0.17) * (1 + 0.03 * np.sin(2 * np.pi * 11 * tt))
        ph = 2 * np.pi * np.cumsum(f) / SR
        env = np.exp(-tt * 9.0) * np.minimum(1.0, tt / 0.008)
        gulls[i0:i0 + m] += (np.sin(ph) + 0.25 * np.sin(2 * ph)) * env * rng.uniform(0.3, 0.4)
    finish(surf + hiss + gulls, "shuffle-seagulls.wav")
    assert dur


# ------------------------------------------------------------------ steam ----
def steam():
    rng = np.random.default_rng(23)
    n = int(13.0 * SR)
    t = np.arange(n) / SR
    bed = rms_norm(band(rng.normal(0, 1, n), 250, 2600), 0.09) * (0.7 + 0.3 * np.sin(2 * np.pi * 0.19 * t))
    chuffs = bursts(n, np.arange(0.25, 12.6, 0.62), 0.34, 300, 5200, 0.55, 11.0, rng)
    clanks = pings(n, (1.5, 4.6, 8.2, 11.1), (620.0, 940.0, 1180.0), 0.10, 26.0, rng)
    finish(bed + chuffs + clanks, "shuffle-jacobs.wav")


# ---------------------------------------------------------------- fantasy ----
def fantasy():
    rng = np.random.default_rng(41)
    n = int(14.0 * SR)
    t = np.arange(n) / SR
    breath = rms_norm(band(rng.normal(0, 1, n), 80, 1500), 0.13) * (0.4 + 0.6 * (0.5 + 0.5 * np.sin(2 * np.pi * 0.13 * t - 0.8)))
    cave = rms_norm(band(rng.normal(0, 1, n), 700, 3200), 0.045) * (0.6 + 0.4 * np.sin(2 * np.pi * 0.09 * t + 1.4))
    shimmer = rms_norm(band(rng.normal(0, 1, n), 3200, 8000), 0.03) * (0.5 + 0.5 * np.sin(2 * np.pi * 0.07 * t))
    flaps = bursts(n, (1.2, 3.0, 6.4, 9.1, 12.2), 0.5, 45, 320, 0.7, 7.5, rng)
    embers = pings(n, (2.4, 5.5, 10.6), (330.0, 415.0), 0.07, 22.0, rng)
    finish(breath + cave + shimmer + flaps + embers, "shuffle-dragon.wav")


# ------------------------------------------------------------------ cyber ----
def cyber():
    rng = np.random.default_rng(11)
    n = int(13.0 * SR)
    t = np.arange(n) / SR
    sweep = 0.4 + 0.35 * (0.5 + 0.5 * np.sin(2 * np.pi * 0.09 * t + 0.4))
    static = rms_norm(band(rng.normal(0, 1, n), 500, 3600), 0.14) * sweep
    # A hint of harmonic colour, kept far below the noise so it can't drone.
    pad = sum(
        np.sin(2 * np.pi * f * t * (1 + 0.0015 * np.sin(2 * np.pi * (0.13 + i * 0.05) * t)) + p)
        for i, (f, p) in enumerate(((146.8, 0.0), (220.0, 1.1), (293.7, 2.3)))
    )
    pad = rms_norm(pad, 0.012) * (0.6 + 0.4 * np.sin(2 * np.pi * 0.17 * t))
    blips = pings(n, (0.6, 1.9, 3.4, 5.2, 6.1, 8.3, 9.7, 11.2), (880.0, 1174.0, 1568.0), 0.13, 34.0, rng)
    finish(static + pad + blips, "reveal-cyber-radio.wav")


# ------------------------------------------- spring / winter / fall cleanup ---
def clean_existing():
    """Keep these beds but strip the HF sizzle and any loop-seam click."""
    for name in ("shuffle-spring.wav", "shuffle-winter.wav", "shuffle-fall.wav"):
        with wave.open(PUB + name) as w:
            sr, x = w.getframerate(), np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(float) / 32768
        assert sr == SR, f"{name} sample rate {sr}"
        peak = float(np.abs(x).max())
        x = band(x, 70, 9000)
        x = x / (np.abs(x).max() + 1e-9) * peak
        e = int(0.012 * SR)
        x[:e] *= np.linspace(0, 1, e)
        x[-e:] *= np.linspace(1, 0, e)
        pcm = (np.clip(x, -1, 1) * 32767).astype(np.int16)
        with wave.open(PUB + name, "wb") as w:
            w.setnchannels(1)
            w.setsampwidth(2)
            w.setframerate(SR)
            w.writeframes(pcm.tobytes())
        print(f"cleaned {name}")


if __name__ == "__main__":
    summer()
    steam()
    fantasy()
    cyber()
    clean_existing()
