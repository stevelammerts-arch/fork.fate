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

# sudden punchy bass-drum thump at the end (tight kick, not a slow boom)
def boom(dur=0.55):
    n = int(SR * dur)
    tt = np.linspace(0, dur, n, endpoint=False)
    # fast pitch drop 150 -> 50 Hz in ~25 ms = tight kick "thump"
    f = 50 + 100 * np.exp(-tt * 45)
    phase = 2 * np.pi * np.cumsum(f) / SR
    tone = np.sin(phase)
    sub = 0.8 * np.sin(2 * np.pi * 48 * tt) * np.exp(-tt * 9)
    click = np.random.randn(n) * np.exp(-tt * 900) * 0.5   # beater attack
    body_env = np.exp(-tt * 8)                              # short, punchy decay
    return ((tone * body_env + sub) + click).astype(np.float32)

b = boom()
# tiny silent gap so the thump lands suddenly after the build
gap = int(SR * 0.05)
out_len = T + gap + len(b) + int(SR * 0.2)
buf = np.zeros(out_len, dtype=np.float32)
buf[:T] += track
bi = T + gap
buf[bi:bi + len(b)] += b * 1.15

# normalize loud with gentle soft-clip for weight
buf = buf / (np.max(np.abs(buf)) + 1e-9)
buf = np.tanh(buf * 1.5) / np.tanh(1.5)
buf = buf / (np.max(np.abs(buf)) + 1e-9) * 0.98

with wave.open("/app/frontend/public/reveal-drums.wav", "w") as w:
    w.setnchannels(1)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(b"".join(struct.pack("<h", int(max(-1, min(1, s)) * 32767)) for s in buf))
print("saved reveal-drums.wav", round(out_len / SR, 2), "s")
