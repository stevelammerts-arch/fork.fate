import numpy as np
import wave, struct

SR = 44100

def tom_hit(freq, dur=0.7, decay=8.0, noise=0.18, pitch_drop=0.28):
    """Deep menacing tribal tom: low fundamental with a downward pitch bend."""
    n = int(SR * dur)
    t = np.linspace(0, dur, n, endpoint=False)
    env = np.exp(-decay * t)
    # pitch bends downward over the hit for a heavy, ominous feel
    inst_freq = freq * (1.0 - pitch_drop * (1 - np.exp(-6 * t)))
    phase = 2 * np.pi * np.cumsum(inst_freq) / SR
    tone = np.sin(phase) + 0.35 * np.sin(2 * phase)
    # sub layer for chest-thump weight
    sub = 0.6 * np.sin(2 * np.pi * (freq * 0.5) * t) * np.exp(-decay * 0.7 * t)
    # muffled skin slap (low-passed noise)
    slap = np.random.randn(n) * np.exp(-45 * t) * noise
    slap = np.convolve(slap, np.ones(30) / 30, mode="same")
    sig = (tone * 0.8 + sub + slap) * env
    return sig

LOW = 72.0    # deep tom
MID = 96.0    # menacing mid tom

# slow, heavy, ritualistic pattern (time seconds, freq, gain)
pattern = [
    (0.00, LOW, 1.0),
    (0.55, MID, 0.7),
    (0.95, LOW, 0.9),
    (1.55, MID, 0.65),
    (1.95, LOW, 0.95),
    (2.35, MID, 0.7),
    (2.75, LOW, 1.0),   # building
    (3.05, MID, 0.85),
    (3.30, LOW, 1.0),   # final heavy double
    (3.45, LOW, 1.0),
]

total = int(SR * 4.4)
buf = np.zeros(total, dtype=np.float32)
for start, freq, gain in pattern:
    hit = tom_hit(freq).astype(np.float32) * gain
    i = int(SR * start)
    end = min(total, i + len(hit))
    buf[i:end] += hit[: end - i]

# low ominous drone underneath (very quiet), slow tremolo
t = np.linspace(0, total / SR, total, endpoint=False)
drone = (0.10 * np.sin(2 * np.pi * 48 * t) + 0.06 * np.sin(2 * np.pi * 36 * t))
drone *= (0.6 + 0.4 * np.sin(2 * np.pi * 0.7 * t))
buf += drone.astype(np.float32)

# soft simple reverb tail (few delayed, decaying copies)
rev = buf.copy()
for d, g in [(int(SR * 0.09), 0.28), (int(SR * 0.17), 0.18), (int(SR * 0.26), 0.1)]:
    pad = np.zeros_like(buf)
    pad[d:] = buf[: total - d] * g
    rev += pad
buf = rev

# normalize (leave a touch of headroom, keep it weighty not harsh)
buf = buf / (np.max(np.abs(buf)) + 1e-6) * 0.9

with wave.open("/app/frontend/public/reveal-drums.wav", "w") as w:
    w.setnchannels(1)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(b"".join(struct.pack("<h", int(max(-1, min(1, s)) * 32767)) for s in buf))
print("saved menacing reveal-drums.wav", total / SR, "s")
