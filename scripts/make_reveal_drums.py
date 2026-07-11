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

# real cinematic timpani hit (uploaded) for the ending boom
def load_timpani(dur=2.0, tail_fade=0.9):
    with wave.open("/tmp/timpani_dec.wav") as w:
        raw = w.readframes(w.getnframes())
    y = np.frombuffer(raw, dtype="<i2").astype(np.float32) / 32768.0
    # pitch DOWN one octave: resample 2x (half frequency), keeps the natural timbre
    idx = np.arange(0, len(y) - 1, 0.5)
    y = np.interp(idx, np.arange(len(y)), y).astype(np.float32)
    # find onset (first sample crossing a small threshold) and trim leading silence
    thr = 0.02 * np.max(np.abs(y))
    onset = int(np.argmax(np.abs(y) > thr))
    y = y[onset: onset + int(SR * dur)]
    # fade out the ring tail
    f = int(SR * tail_fade)
    if len(y) > f:
        y[-f:] *= np.linspace(1, 0, f)
    return (y / (np.max(np.abs(y)) + 1e-9)).astype(np.float32)

b = load_timpani()
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
