# Synthesize the golem's floor thud: deep pitch-dropping impact + sub rumble
# + a faint metallic clank ring, ~1.1s, 44.1kHz 16-bit mono WAV.
import wave

import numpy as np

SR = 44100
DUR = 1.1
t = np.linspace(0, DUR, int(SR * DUR), endpoint=False)

# Deep body: pitch drops 85 -> 42 Hz, fast decay
f = 42 + 43 * np.exp(-t * 9.0)
phase = 2 * np.pi * np.cumsum(f) / SR
body = np.sin(phase) * np.exp(-t * 6.5) * 1.0

# Sub rumble tail
sub = np.sin(2 * np.pi * 34 * t) * np.exp(-t * 3.2) * 0.4

# Impact click: short filtered noise burst
rng = np.random.default_rng(7)
noise = rng.standard_normal(len(t))
# crude lowpass via cumulative mean window
k = 24
kernel = np.ones(k) / k
noise_lp = np.convolve(noise, kernel, mode="same")
click = noise_lp * np.exp(-t * 70) * 0.9

# Metallic clank: inharmonic partials, quiet, ringing out
ring = (
    np.sin(2 * np.pi * 141 * t) * 0.5
    + np.sin(2 * np.pi * 187 * t) * 0.3
    + np.sin(2 * np.pi * 233 * t) * 0.2
) * np.exp(-t * 5.0) * 0.16

mix = body + sub + click + ring
# gentle fade-in over 3ms to avoid a pop, fade-out last 80ms
fi = int(SR * 0.003)
mix[:fi] *= np.linspace(0, 1, fi)
fo = int(SR * 0.08)
mix[-fo:] *= np.linspace(1, 0, fo)
mix = mix / np.max(np.abs(mix)) * 0.88

pcm = (mix * 32767).astype(np.int16)
with wave.open("/app/frontend/public/golem-thud.wav", "wb") as w:
    w.setnchannels(1)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(pcm.tobytes())
print("saved golem-thud.wav", len(pcm) / SR, "s")
