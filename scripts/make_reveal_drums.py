import numpy as np
import wave, struct

SR = 44100
rng = np.random.default_rng(7)

# Circular-membrane modal ratios (Bessel) -> inharmonic, drum-like (not musical)
MODES = np.array([1.00, 1.59, 2.14, 2.30, 2.65, 2.92, 3.16, 3.50])
MODE_GAIN = np.array([1.00, 0.55, 0.42, 0.30, 0.22, 0.16, 0.12, 0.08])

def bandnoise(n, lo, hi):
    x = rng.standard_normal(n)
    X = np.fft.rfft(x)
    f = np.fft.rfftfreq(n, 1 / SR)
    mask = (f >= lo) & (f <= hi)
    X *= mask
    y = np.fft.irfft(X, n)
    m = np.max(np.abs(y)) + 1e-9
    return y / m

def djembe(kind="bass", dur=0.9):
    """kind: 'bass' (deep open), 'tone' (mid), 'slap' (bright edge)."""
    n = int(SR * dur)
    t = np.linspace(0, dur, n, endpoint=False)
    if kind == "bass":
        f0 = rng.uniform(84, 92)
        body_dec = rng.uniform(4.0, 5.0)
        skin_lo, skin_hi, skin_amp, skin_dec = 120, 900, 0.35, 55
        tone_amp = 1.0
    elif kind == "tone":
        f0 = rng.uniform(150, 168)
        body_dec = rng.uniform(6.0, 7.5)
        skin_lo, skin_hi, skin_amp, skin_dec = 300, 2500, 0.5, 70
        tone_amp = 0.85
    else:  # slap
        f0 = rng.uniform(230, 260)
        body_dec = rng.uniform(9.0, 12.0)
        skin_lo, skin_hi, skin_amp, skin_dec = 1500, 8000, 0.9, 120
        tone_amp = 0.5

    # modal body: each mode a slightly detuned decaying sinusoid, higher modes decay faster
    body = np.zeros(n)
    for r, g in zip(MODES, MODE_GAIN):
        fk = f0 * r * rng.uniform(0.995, 1.005)
        dec = body_dec * (1 + 0.7 * (r - 1))
        body += g * np.sin(2 * np.pi * fk * t + rng.uniform(0, 6.28)) * np.exp(-dec * t)
    body *= tone_amp

    # sub weight for the bass hit (chest thump)
    if kind == "bass":
        body += 0.7 * np.sin(2 * np.pi * (f0 * 0.5) * t) * np.exp(-3.2 * t)

    # skin-slap transient (filtered noise, very fast decay)
    slap = bandnoise(n, skin_lo, skin_hi) * np.exp(-skin_dec * t) * skin_amp

    # a touch of low wood-shell knock
    wood = np.sin(2 * np.pi * rng.uniform(320, 380) * t) * np.exp(-60 * t) * 0.12

    sig = body + slap + wood
    # natural amplitude envelope pluck at the very start
    sig *= np.minimum(1.0, t * SR / 40.0) * 0.0 + 1.0  # (keep sharp attack)
    return sig.astype(np.float32)

# Slow organic tribal groove (humanized timing + velocity)
BEAT = 0.66
seq = ["bass", "tone", "bass", "slap", "bass", "tone", "slap", "bass", "bass"]
total = int(SR * (len(seq) * BEAT + 1.2))
buf = np.zeros(total, dtype=np.float32)
for i, kind in enumerate(seq):
    start = i * BEAT + rng.uniform(-0.02, 0.02)          # timing humanization
    vel = rng.uniform(0.82, 1.0) * (1.0 if kind == "bass" else 0.8)
    hit = djembe(kind) * vel
    s = max(0, int(SR * start))
    e = min(total, s + len(hit))
    buf[s:e] += hit[: e - s]

# gentle room reverb (organic space, not washy)
rev = buf.copy()
for d, g in [(int(SR * 0.021), 0.3), (int(SR * 0.037), 0.22), (int(SR * 0.061), 0.14), (int(SR * 0.09), 0.08)]:
    pad = np.zeros_like(buf)
    pad[d:] = buf[: total - d] * g
    rev += pad
buf = 0.85 * buf + 0.15 * rev

# loudness: normalize + mild soft-knee saturation for weight (kept natural)
buf = buf / (np.max(np.abs(buf)) + 1e-9)
buf = np.tanh(buf * 1.6) / np.tanh(1.6)
buf = buf / (np.max(np.abs(buf)) + 1e-9) * 0.97

with wave.open("/app/frontend/public/reveal-drums.wav", "w") as w:
    w.setnchannels(1)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(b"".join(struct.pack("<h", int(max(-1, min(1, s)) * 32767)) for s in buf))
print("saved organic reveal-drums.wav", total / SR, "s")
