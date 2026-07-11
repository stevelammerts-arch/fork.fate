import numpy as np
import wave, struct

SR = 44100

def bongo_hit(freq, dur=0.28, decay=22.0, noise=0.35):
    n = int(SR * dur)
    t = np.linspace(0, dur, n, endpoint=False)
    env = np.exp(-decay * t)
    # membrane tone: fundamental + slightly sharp overtone
    tone = np.sin(2 * np.pi * freq * t) + 0.4 * np.sin(2 * np.pi * freq * 2.02 * t)
    # attack transient (skin slap)
    burst = np.random.randn(n) * np.exp(-90 * t) * noise
    body = np.random.randn(n) * np.exp(-40 * t) * 0.12
    sig = (tone * 0.8 + burst + body) * env
    return sig

LOW = 196.0   # low bongo (open tone)
HIGH = 330.0  # high bongo

# tribal pattern (time in seconds, freq, gain)
pattern = [
    (0.00, LOW, 1.0),
    (0.18, HIGH, 0.8),
    (0.30, HIGH, 0.7),
    (0.48, LOW, 0.95),
    (0.66, HIGH, 0.85),
    (0.78, LOW, 0.7),
    (0.90, HIGH, 0.75),
    (1.02, HIGH, 0.7),
    (1.14, LOW, 1.0),
    (1.32, HIGH, 0.9),
    (1.44, LOW, 0.85),
    (1.56, HIGH, 0.8),
    (1.62, LOW, 1.0),   # final accent (double)
    (1.66, HIGH, 0.9),
]

total = int(SR * 2.1)
buf = np.zeros(total, dtype=np.float32)
for start, freq, gain in pattern:
    hit = bongo_hit(freq).astype(np.float32) * gain
    i = int(SR * start)
    end = min(total, i + len(hit))
    buf[i:end] += hit[: end - i]

# gentle low shaker/rattle bed for texture
t = np.linspace(0, 2.1, total, endpoint=False)
rattle = (np.random.randn(total) * 0.05) * (0.5 + 0.5 * np.sin(2 * np.pi * 6 * t))
buf += rattle.astype(np.float32)

# normalize
buf = buf / (np.max(np.abs(buf)) + 1e-6) * 0.92

with wave.open("/app/frontend/public/reveal-drums.wav", "w") as w:
    w.setnchannels(1)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(b"".join(struct.pack("<h", int(max(-1, min(1, s)) * 32767)) for s in buf))
print("saved reveal-drums.wav", total / SR, "s")
