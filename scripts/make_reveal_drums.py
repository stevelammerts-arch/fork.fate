import numpy as np
import wave, struct, subprocess, imageio_ffmpeg

SR = 44100
FF = imageio_ffmpeg.get_ffmpeg_exe()
IN = "/tmp/danza.mp3"
TMP = "/tmp/danza_dec.wav"

# decode mp3 -> mono 44.1k 16-bit wav
subprocess.run([FF, "-y", "-i", IN, "-ac", "1", "-ar", str(SR), "-sample_fmt", "s16", TMP],
               check=True, capture_output=True)

with wave.open(TMP) as w:
    n = w.getnframes()
    raw = w.readframes(n)
track = np.frombuffer(raw, dtype="<i2").astype(np.float32) / 32768.0
# trim to a tight excerpt for the reveal (skip a short intro)
START, LEN = 1.0, 7.0
track = track[int(SR * START): int(SR * (START + LEN))]
T = len(track)
print("excerpt seconds:", round(T / SR, 2))

t = np.arange(T) / SR
dur = T / SR

# crescendo: quiet -> loud (ease-in power curve)
env = 0.12 + 0.88 * (np.linspace(0, 1, T) ** 1.7)
track *= env

# timpani (kettle-drum) boom at the end: solid tuned boom, no pitch glide
def boom(dur=1.7):
    n = int(SR * dur)
    tt = np.linspace(0, dur, n, endpoint=False)
    f0 = 98.0  # low tuned boom (~G2), audible fundamental + harmonics
    # dominant fundamental for weight; a few fixed harmonics for pitch/speaker clarity
    partials = [(1.0, 1.00, 2.0), (2.0, 0.45, 3.2), (3.0, 0.22, 4.5), (1.5, 0.18, 3.8)]
    body = np.zeros(n)
    for r, g, d in partials:
        body += g * np.sin(2 * np.pi * f0 * r * tt) * np.exp(-d * tt)
    # crisp, very short mallet click (no long noise wash -> no "air" sound)
    click = np.random.randn(n) * np.exp(-tt * 400) * 0.12
    # smooth 3 ms attack ramp to avoid a click-pop
    atk = np.clip(tt / 0.003, 0, 1)
    b = (body + click) * atk
    return (b / (np.max(np.abs(b)) + 1e-9)).astype(np.float32)

b = boom()
# tiny silent gap so the timpani lands suddenly after the build
gap = int(SR * 0.05)
out_len = T + gap + len(b) + int(SR * 0.2)
buf = np.zeros(out_len, dtype=np.float32)
buf[:T] += track
bi = T + gap
buf[bi:bi + len(b)] += b * 1.15

# light saturation on the GROOVE only (keeps loudness), timpani left with full dynamics
buf[:T] = np.tanh(buf[:T] * 1.3) / np.tanh(1.3) * 0.62
buf = buf / (np.max(np.abs(buf)) + 1e-9) * 0.98

with wave.open("/app/frontend/public/reveal-drums.wav", "w") as w:
    w.setnchannels(1)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(b"".join(struct.pack("<h", int(max(-1, min(1, s)) * 32767)) for s in buf))
print("saved reveal-drums.wav", round(out_len / SR, 2), "s")
