import numpy as np
import wave, struct

SR = 44100

def tom_hit(freq, dur=0.85, decay=6.5, noise=0.16, pitch_drop=0.26):
    """Deep menacing tribal tom with a downward pitch bend."""
    n = int(SR * dur)
    t = np.linspace(0, dur, n, endpoint=False)
    env = np.exp(-decay * t)
    inst_freq = freq * (1.0 - pitch_drop * (1 - np.exp(-6 * t)))
    phase = 2 * np.pi * np.cumsum(inst_freq) / SR
    tone = np.sin(phase) + 0.35 * np.sin(2 * phase)
    sub = 0.7 * np.sin(2 * np.pi * (freq * 0.5) * t) * np.exp(-decay * 0.7 * t)
    slap = np.random.randn(n) * np.exp(-40 * t) * noise
    slap = np.convolve(slap, np.ones(28) / 28, mode="same")
    return (tone * 0.85 + sub + slap) * env

LOW = 72.0
MID = 92.0

# steady, slow, rhythmic beat — one hit every 0.62s, low with mid accents
BEAT = 0.62
seq = [LOW, MID, LOW, MID, LOW, MID, LOW, LOW]
pattern = [(i * BEAT, f, 1.0 if f == LOW else 0.85) for i, f in enumerate(seq)]

total = int(SR * (len(seq) * BEAT + 1.0))
buf = np.zeros(total, dtype=np.float32)
for start, freq, gain in pattern:
    hit = tom_hit(freq).astype(np.float32) * gain
    i = int(SR * start)
    end = min(total, i + len(hit))
    buf[i:end] += hit[: end - i]

# quiet ominous drone underneath
t = np.linspace(0, total / SR, total, endpoint=False)
drone = (0.09 * np.sin(2 * np.pi * 48 * t) + 0.05 * np.sin(2 * np.pi * 36 * t))
drone *= (0.6 + 0.4 * np.sin(2 * np.pi * 0.7 * t))
buf += drone.astype(np.float32)

# short reverb tail (light, so it doesn't wash out the loudness)
rev = buf.copy()
for d, g in [(int(SR * 0.08), 0.2), (int(SR * 0.15), 0.12)]:
    pad = np.zeros_like(buf)
    pad[d:] = buf[: total - d] * g
    rev += pad
buf = rev

# LOUD: normalize then soft-clip (tanh) to raise perceived loudness / RMS
buf = buf / (np.max(np.abs(buf)) + 1e-6)
buf = np.tanh(buf * 2.4)            # drive into soft saturation for punch + loudness
buf = buf / (np.max(np.abs(buf)) + 1e-6) * 0.99

with wave.open("/app/frontend/public/reveal-drums.wav", "w") as w:
    w.setnchannels(1)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(b"".join(struct.pack("<h", int(max(-1, min(1, s)) * 32767)) for s in buf))
print("saved loud slow reveal-drums.wav", total / SR, "s")
