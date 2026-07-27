"""Audit the themed shuffle/reveal audio for artifacts that read as a buzz or zap.

Flags three problems, all of which users have reported:
  DRONE  - a sustained near-pure tone (FFT peak / median very high)
  HF     - energy piled up near Nyquist (aliasing junk)
  CLICK  - sample-level discontinuities (each one is an audible zap/pop),
           including the loop seam (last sample -> first sample)
"""
import sys

import numpy as np
import soundfile as sf

FILES = [
    "shuffle-seagulls.wav", "shuffle-spring.wav", "shuffle-winter.wav", "shuffle-fall.wav",
    "shuffle-jacobs.wav", "shuffle-dragon.mp3", "reveal-cyber-radio.wav", "reveal-drums-groove.wav",
]
BASE = "/app/frontend/public/"


def audit(name):
    x, sr = sf.read(BASE + name, always_2d=False)
    if x.ndim > 1:
        x = x.mean(axis=1)
    out = [f"{name}: {len(x)/sr:.2f}s sr={sr} rms={np.sqrt((x**2).mean()):.3f} peak={np.abs(x).max():.3f}"]

    ton, hf = [], []
    win = 2 * sr
    for s in range(0, max(1, len(x) - win), win // 2):
        a = x[s:s + win]
        if len(a) < win // 2:
            break
        S = np.abs(np.fft.rfft(a * np.hanning(len(a))))
        fr = np.fft.rfftfreq(len(a), 1 / sr)
        # Measure tonality INSIDE the audible passband only — comparing a peak to
        # the median of a spectrum that includes brick-walled (near-zero) bins
        # would report a huge ratio for perfectly smooth, band-limited noise.
        pb = (fr > 100) & (fr < 8000)
        ton.append(S[pb].max() / np.median(S[pb]))
        hf.append(S[fr > 0.42 * sr].sum() / S.sum())
    out.append(f"  tonality max={max(ton):.0f} (DRONE if > 400)")
    out.append(f"  near-Nyquist frac max={max(hf):.4f} (HF if > 0.02)")

    # clicks: a jump much larger than the local typical step
    d = np.abs(np.diff(x))
    thr = max(np.percentile(d, 99.99) * 6, 0.12)
    idx = np.where(d > thr)[0]
    groups = []
    for i in idx:
        if groups and i - groups[-1][-1] < sr // 50:
            groups[-1].append(i)
        else:
            groups.append([i])
    out.append(f"  clicks={len(groups)} at " + ", ".join(f"{g[0]/sr:.2f}s({d[g].max():.2f})" for g in groups[:8]))
    seam = abs(float(x[0] - x[-1]))
    out.append(f"  loop seam jump={seam:.3f} (CLICK if > 0.05)")
    return "\n".join(out)


if __name__ == "__main__":
    for f in (sys.argv[1:] or FILES):
        try:
            print(audit(f))
        except Exception as e:  # noqa: BLE001
            print(f"{f}: ERROR {e}")
