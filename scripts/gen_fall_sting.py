"""Synthesize a fall flourish sting: a wind gust with crisp leaf rustle,
~4.5s, fading to silence. Writes /app/frontend/public/flourish-fall.mp3."""
import math
import random
import struct
import subprocess
import wave

SR = 44100
DUR = 4.5
N = int(SR * DUR)
random.seed(7)

# Brown noise (wind body)
brown = [0.0] * N
acc = 0.0
for i in range(N):
    acc += (random.random() * 2 - 1) * 0.02
    acc *= 0.998
    brown[i] = acc

# White noise (leaf rustle, high band via simple differencing)
prev = 0.0
rustle = [0.0] * N
for i in range(N):
    w = random.random() * 2 - 1
    rustle[i] = w - prev  # crude high-pass
    prev = w

samples = []
for i in range(N):
    t = i / SR
    # Wind envelope: two overlapping gusts
    g1 = math.exp(-((t - 1.1) ** 2) / 0.9)
    g2 = 0.7 * math.exp(-((t - 2.9) ** 2) / 1.1)
    wind_env = (g1 + g2)
    # Rustle envelope: flutters riding the gusts
    flutter = 0.5 + 0.5 * math.sin(2 * math.pi * 9 * t + math.sin(t * 3) * 2)
    rustle_env = wind_env * flutter * 0.7
    # Overall fade to silence
    fade = min(1.0, t / 0.3) * min(1.0, max(0.0, (DUR - t) / 1.2))
    s = (brown[i] * 3.2 * wind_env + rustle[i] * 0.16 * rustle_env) * fade
    samples.append(max(-1.0, min(1.0, s)))

peak = max(abs(s) for s in samples) or 1.0
pcm = b"".join(struct.pack("<h", int(s / peak * 0.85 * 32767)) for s in samples)
with wave.open("/tmp/flourish-fall.wav", "wb") as f:
    f.setnchannels(1)
    f.setsampwidth(2)
    f.setframerate(SR)
    f.writeframes(pcm)

subprocess.run([
    "/usr/bin/ffmpeg", "-y", "-i", "/tmp/flourish-fall.wav",
    "-c:a", "libmp3lame", "-q:a", "4", "/app/frontend/public/flourish-fall.mp3",
], check=True, capture_output=True)
print("saved /app/frontend/public/flourish-fall.mp3")
