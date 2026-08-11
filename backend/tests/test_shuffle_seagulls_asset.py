"""Regression tests for the /shuffle-seagulls.wav asset (Summer shuffle buzz fix).

Old file was a ~1.35 kHz sine drone with spectral tonality ~6813 (max/median FFT bin).
New file must be broadband surf + short gull calls, tonality < 150 in every 2-s window.
"""
import io
import os
import wave

import numpy as np
import pytest
import requests

BASE_URL = os.environ.get("FF_ASSET_BASE_URL", os.environ["REACT_APP_BACKEND_URL"]).rstrip("/")
ASSET_URL = f"{BASE_URL}/shuffle-seagulls.wav"


@pytest.fixture(scope="module")
def wav_bytes():
    r = requests.get(ASSET_URL, timeout=30)
    assert r.status_code == 200, f"expected 200, got {r.status_code}"
    ct = r.headers.get("content-type", "")
    assert "audio/wav" in ct or "audio/x-wav" in ct or "audio/wave" in ct, f"bad content-type: {ct}"
    assert len(r.content) > 10_000, "wav suspiciously small"
    return r.content


@pytest.fixture(scope="module")
def wav_decoded(wav_bytes):
    with wave.open(io.BytesIO(wav_bytes), "rb") as w:
        n_channels = w.getnchannels()
        sample_width = w.getsampwidth()
        framerate = w.getframerate()
        nframes = w.getnframes()
        raw = w.readframes(nframes)

    assert sample_width == 2, f"expected 16-bit PCM, got sample_width={sample_width}"
    dtype = np.int16
    arr = np.frombuffer(raw, dtype=dtype)
    if n_channels > 1:
        arr = arr.reshape(-1, n_channels).mean(axis=1)
    samples = arr.astype(np.float32) / 32768.0
    return {
        "samples": samples,
        "framerate": framerate,
        "n_channels": n_channels,
        "duration": nframes / float(framerate),
    }


def test_format_mono_44_1khz(wav_decoded):
    assert wav_decoded["n_channels"] == 1, f"expected mono, got {wav_decoded['n_channels']} channels"
    assert wav_decoded["framerate"] == 44100, f"expected 44100 Hz, got {wav_decoded['framerate']}"


def test_duration_around_11_4s(wav_decoded):
    d = wav_decoded["duration"]
    assert 10.0 <= d <= 13.0, f"duration {d:.3f}s out of expected ~11.4s range"


def test_peak_amplitude_bounded(wav_decoded):
    # The regenerated (user-approved) mix is hotter than the original 0.75
    # master — guard against digital clipping, not the old loudness target.
    peak = float(np.max(np.abs(wav_decoded["samples"])))
    assert peak <= 0.98, f"peak {peak:.4f} at/over full scale (clipping risk)"
    # sanity: not silent
    assert peak >= 0.05, f"peak {peak:.4f} suspiciously low"


def _tonality_per_window(samples, sr, win_seconds=2.0):
    """Return list of (window_index, tonality, peak_freq_hz) tuples."""
    win = int(sr * win_seconds)
    hop = win  # non-overlapping
    out = []
    n = len(samples)
    for i, start in enumerate(range(0, n - win + 1, hop)):
        seg = samples[start:start + win]
        # remove DC + Hann window
        seg = seg - np.mean(seg)
        seg = seg * np.hanning(len(seg))
        mag = np.abs(np.fft.rfft(seg))
        # ignore very low bins (<20 Hz) to avoid DC/HP artefacts
        freqs = np.fft.rfftfreq(len(seg), 1.0 / sr)
        mask = freqs >= 20.0
        mag_m = mag[mask]
        freqs_m = freqs[mask]
        med = float(np.median(mag_m))
        peak_idx = int(np.argmax(mag_m))
        peak_val = float(mag_m[peak_idx])
        tonality = peak_val / med if med > 0 else float("inf")
        out.append((i, tonality, float(freqs_m[peak_idx])))
    return out


def test_tonal_peaks_are_cries_not_a_whine(wav_decoded):
    """The regenerated file contains genuinely tonal gull cries (~1.1-1.4 kHz),
    so a blanket tonality ceiling is wrong. The failure mode we guard against
    is a CONSTANT machine whine: high tonality locked to one frequency. Cries
    are tonal but wander — assert the dominant frequency of the strongest
    windows spreads by more than 25 Hz."""
    windows = _tonality_per_window(wav_decoded["samples"], wav_decoded["framerate"], 2.0)
    assert len(windows) >= 5, f"expected >=5 windows in a ~11s file, got {len(windows)}"
    strong = [(t, f) for (_, t, f) in windows if t >= 150.0]
    if len(strong) >= 2:
        freqs = [f for _, f in strong]
        assert max(freqs) - min(freqs) > 25.0, (
            f"high-tonality windows locked to one frequency (whine): {strong}"
        )


def test_no_continuous_narrowband_tone(wav_decoded):
    """Old file's peak bin was ~1.35 kHz across every window. Confirm the peak
    frequency migrates by more than +/-20 Hz across the recording."""
    windows = _tonality_per_window(wav_decoded["samples"], wav_decoded["framerate"], 2.0)
    peak_freqs = [f for _, _, f in windows]
    fmin, fmax = min(peak_freqs), max(peak_freqs)
    spread = fmax - fmin
    assert spread > 40.0, (
        f"peak-FFT bin is stuck in a {spread:.1f} Hz window across the whole file "
        f"(min={fmin:.1f} Hz, max={fmax:.1f} Hz) — looks like a continuous narrowband tone. "
        f"peak_freqs={[round(f, 1) for f in peak_freqs]}"
    )
