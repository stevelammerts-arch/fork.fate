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
def load_timpani(dur=1.5, tail_fade=0.8):
    with wave.open("/tmp/timpani_dec.wav") as w:
        raw = w.readframes(w.getnframes())
    y0 = np.frombuffer(raw, dtype="<i2").astype(np.float32) / 32768.0
    src_idx = np.arange(len(y0))

    def pitch(factor):
        # stretch by `factor` -> pitch divides by `factor` (factor 2 = one octave down)
        idx = np.arange(0, len(y0) - 1, 1.0 / factor)
        return np.interp(idx, src_idx, y0).astype(np.float32)

    # 3 simultaneous "bongs": root (octave down) + a fifth + an octave on top
    layers = [pitch(2.0) * 1.0, pitch(1.3333) * 0.75, pitch(1.0) * 0.6]
    L = min(len(l) for l in layers)
    y = sum(l[:L] for l in layers)

    # find onset and trim leading silence
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


def write_wav(path, data):
    with wave.open(path, "w") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(b"".join(struct.pack("<h", int(max(-1, min(1, s)) * 32767)) for s in data))


# full combined clip (kept for reference / fallback)
write_wav("/app/frontend/public/reveal-drums.wav", buf)

# SPLIT: groove plays during the shuffle, boom (timpani) plays on the reveal
groove = np.tanh(track * 1.3) / np.tanh(1.3) * 0.62
groove = groove / (np.max(np.abs(groove)) + 1e-9) * 0.9
write_wav("/app/frontend/public/reveal-drums-groove.wav", groove)

boom = b / (np.max(np.abs(b)) + 1e-9) * 0.98
write_wav("/app/frontend/public/reveal-drums-boom.wav", boom)

print("saved reveal-drums.wav", round(out_len / SR, 2), "s |",
      "groove", round(len(groove) / SR, 2), "s | boom", round(len(boom) / SR, 2), "s")
