#!/usr/bin/env python3
"""Focused verification for the summer-theme shuffle audio bug.

Checks the regenerated /shuffle-seagulls.wav for loop seam/click risk,
tonality audit compatibility, and whether high-energy gull-call moments are
broadband/noise-like rather than narrow sine chirps.
"""
from __future__ import annotations

import json
import re
import subprocess
from pathlib import Path

import numpy as np
import soundfile as sf


ROOT = Path("/app")
WAV = ROOT / "frontend/public/shuffle-seagulls.wav"
AUDIT = ROOT / "scripts/audit_audio.py"
OUT = ROOT / "test_reports/summer_audio_analysis.json"


def spectral_metrics(frame: np.ndarray, sr: int) -> dict:
    frame = frame.astype(float)
    frame = frame - np.mean(frame)
    win = np.hanning(len(frame))
    spec = np.abs(np.fft.rfft(frame * win)) ** 2 + 1e-18
    freqs = np.fft.rfftfreq(len(frame), 1 / sr)
    band = (freqs >= 300) & (freqs <= 8000)
    s = spec[band]
    f = freqs[band]
    total = float(np.sum(s))
    p = s / total
    peak_frac = float(np.max(s) / total)
    tonality = float(np.max(s) / np.median(s))
    # Spectral flatness near 0 == pure tone; higher == noise-like.
    flatness = float(np.exp(np.mean(np.log(s))) / np.mean(s))
    # Occupied bandwidth between 5th and 95th cumulative energy percentiles.
    c = np.cumsum(p)
    f05 = float(f[np.searchsorted(c, 0.05)])
    f95 = float(f[np.searchsorted(c, 0.95)])
    return {
        "peak_frac": peak_frac,
        "tonality": tonality,
        "flatness": flatness,
        "occupied_bw_90hz": f95 - f05,
        "centroid_hz": float(np.sum(f * p)),
    }


def main() -> int:
    x, sr = sf.read(str(WAV), always_2d=False)
    if x.ndim > 1:
        x = x.mean(axis=1)
    x = x.astype(float)
    duration = len(x) / sr
    seam = abs(float(x[0] - x[-1]))
    rms = float(np.sqrt(np.mean(x * x)))
    peak = float(np.max(np.abs(x)))

    audit_text = subprocess.check_output(
        ["python3", str(AUDIT), "shuffle-seagulls.wav"], text=True
    )
    tonality_match = re.search(r"tonality max=(\d+)", audit_text)
    audit_tonality = int(tonality_match.group(1)) if tonality_match else None
    hf_match = re.search(r"near-Nyquist frac max=([0-9.]+)", audit_text)
    audit_hf = float(hf_match.group(1)) if hf_match else None
    seam_match = re.search(r"loop seam jump=([0-9.]+)", audit_text)
    audit_seam = float(seam_match.group(1)) if seam_match else None

    # Detect likely gull-call windows: elevated 700-6000Hz energy over the surf bed.
    frame_len = int(0.25 * sr)
    hop = int(0.05 * sr)
    energies = []
    frames = []
    for start in range(0, len(x) - frame_len, hop):
        frame = x[start : start + frame_len]
        spec = np.abs(np.fft.rfft((frame - np.mean(frame)) * np.hanning(frame_len))) ** 2
        freqs = np.fft.rfftfreq(frame_len, 1 / sr)
        hi = float(spec[(freqs >= 700) & (freqs <= 6000)].sum())
        lo = float(spec[(freqs >= 100) & (freqs < 700)].sum())
        ratio = hi / (lo + 1e-12)
        energies.append(ratio)
        frames.append((start, frame))

    ratios = np.array(energies)
    # The surf bed itself is intentionally broadband, so gull calls are not huge
    # isolated spikes. Use the upper tail of high/low-band ratio to sample likely
    # gull-call moments without requiring them to tower over the waves.
    threshold = max(float(np.percentile(ratios, 82)), float(np.median(ratios) * 1.35))
    candidate_indices = np.where(ratios >= threshold)[0]
    # Keep separated/local maxima windows to avoid counting the same call repeatedly.
    selected = []
    last_i = -999
    for i in candidate_indices[np.argsort(ratios[candidate_indices])[::-1]]:
        if all(abs(i - j) >= 4 for j in selected):
            selected.append(int(i))
        if len(selected) >= 8:
            break
    selected = sorted(selected)

    call_metrics = []
    for i in selected:
        start, frame = frames[i]
        m = spectral_metrics(frame, sr)
        m["start_sec"] = round(start / sr, 3)
        m["hi_lo_ratio"] = float(ratios[i])
        call_metrics.append(m)

    median_call = {
        k: float(np.median([m[k] for m in call_metrics]))
        for k in ["peak_frac", "tonality", "flatness", "occupied_bw_90hz", "centroid_hz", "hi_lo_ratio"]
    }

    # Ocean/surf evidence: non-trivial low/mid noise bed present throughout.
    spec_all = np.abs(np.fft.rfft((x - np.mean(x)) * np.hanning(len(x)))) ** 2
    freqs_all = np.fft.rfftfreq(len(x), 1 / sr)
    total = float(spec_all.sum())
    surf_low_frac = float(spec_all[(freqs_all >= 100) & (freqs_all <= 900)].sum() / total)
    surf_hiss_frac = float(spec_all[(freqs_all >= 2200) & (freqs_all <= 5000)].sum() / total)

    checks = {
        "file_exists": WAV.exists(),
        "duration_reasonable_10s_plus": duration >= 10,
        "audit_tonality_lt_400": audit_tonality is not None and audit_tonality < 400,
        # The existing audit prints HF but the user's bug is pew-pew/tonality;
        # keep HF in the output for visibility without failing this focused check.
        "loop_seam_jump_lt_0_02": seam < 0.02,
        "surf_low_band_present": surf_low_frac > 0.15,
        "surf_hiss_band_present": surf_hiss_frac > 0.02,
        # Noise-like gulls should not be dominated by one or two FFT bins.
        "gull_windows_detected": len(call_metrics) >= 4,
        "gulls_not_narrow_sine_peak": median_call["peak_frac"] < 0.08 and median_call["tonality"] < 250,
        "gulls_broadband_noise_like": median_call["flatness"] > 0.02 and median_call["occupied_bw_90hz"] > 1500,
    }

    result = {
        "wav": str(WAV),
        "sr": sr,
        "duration_sec": duration,
        "rms": rms,
        "peak": peak,
        "seam_jump": seam,
        "audit_text": audit_text.strip(),
        "audit_tonality_max": audit_tonality,
        "audit_hf_max": audit_hf,
        "audit_reported_seam": audit_seam,
        "surf_low_frac_100_900hz": surf_low_frac,
        "surf_hiss_frac_2200_5000hz": surf_hiss_frac,
        "call_windows": call_metrics,
        "median_call_metrics": median_call,
        "checks": checks,
        "pass": all(checks.values()),
    }
    OUT.write_text(json.dumps(result, indent=2), encoding="utf-8")
    print(json.dumps(result, indent=2))
    return 0 if result["pass"] else 1


if __name__ == "__main__":
    raise SystemExit(main())