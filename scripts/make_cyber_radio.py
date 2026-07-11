import numpy as np
import wave, struct

SR = 44100
rng = np.random.default_rng(11)
DUR = 6.0
N = int(SR * DUR)
t = np.linspace(0, DUR, N, endpoint=False)

def bandpass(x, lo, hi):
    X = np.fft.rfft(x)
    f = np.fft.rfftfreq(len(x), 1 / SR)
    X *= ((f >= lo) & (f <= hi))
    return np.fft.irfft(X, len(x))

# constant low radio hiss
hiss = bandpass(rng.standard_normal(N), 500, 3200) * 0.05

out = hiss.copy()

def beep(freq, dur):
    n = int(SR * dur)
    tt = np.linspace(0, dur, n, endpoint=False)
    env = np.minimum(1, tt * 200) * np.minimum(1, (dur - tt) * 200)
    return 0.5 * np.sin(2 * np.pi * freq * tt) * env

def garbled_voice(dur):
    n = int(SR * dur)
    tt = np.linspace(0, dur, n, endpoint=False)
    # formants -> vowel-ish timbre, with a wobbling pitch
    pitch = 120 + 30 * np.sin(2 * np.pi * 3 * tt) + rng.uniform(-15, 15)
    ph = 2 * np.pi * np.cumsum(pitch) / SR
    voice = np.zeros(n)
    for fmt, g in [(500, 1.0), (1200, 0.6), (2400, 0.35)]:
        voice += g * np.sin(ph * (fmt / 120.0))
    # syllabic amplitude envelope (random on/off chunks)
    env = np.zeros(n)
    i = 0
    while i < n:
        seg = int(SR * rng.uniform(0.06, 0.18))
        lvl = rng.choice([0.0, 0.0, 1.0, 0.85])
        env[i:i + seg] = lvl
        i += seg
    # smooth the env a touch
    env = np.convolve(env, np.ones(400) / 400, mode="same")
    voice *= env
    # ring-mod for a garbled/robotic radio quality
    voice *= (0.6 + 0.4 * np.sin(2 * np.pi * 55 * tt))
    voice = bandpass(voice, 350, 2800)
    voice = np.tanh(voice * 3.0)  # radio distortion/clip
    return voice * 0.5

# lay down a few transmissions with squelch beeps + static bursts
pos = 0.25
while pos < DUR - 0.8:
    # squelch open
    b = beep(rng.uniform(1000, 1400), 0.05)
    s = int(SR * pos)
    out[s:s + len(b)] += b
    pos += 0.08
    # garbled speech
    vdur = rng.uniform(0.7, 1.4)
    v = garbled_voice(vdur)
    s = int(SR * pos)
    e = min(N, s + len(v))
    out[s:e] += v[:e - s]
    pos += vdur
    # squelch close + static burst
    b = beep(rng.uniform(700, 950), 0.04)
    s = int(SR * pos)
    if s + len(b) < N:
        out[s:s + len(b)] += b
    burst = bandpass(rng.standard_normal(int(SR * 0.12)), 800, 3000) * np.exp(-np.linspace(0, 6, int(SR * 0.12))) * 0.35
    s = int(SR * (pos + 0.03))
    e = min(N, s + len(burst))
    out[s:e] += burst[:e - s]
    pos += rng.uniform(0.5, 1.0)  # gap before next transmission

# overall telephone/radio band + gentle limiter, loopable (fade edges tiny)
out = bandpass(out, 400, 3200)
out = np.tanh(out * 1.4)
fade = int(SR * 0.03)
out[:fade] *= np.linspace(0, 1, fade)
out[-fade:] *= np.linspace(1, 0, fade)
out = out / (np.max(np.abs(out)) + 1e-9) * 0.85

with wave.open("/app/frontend/public/reveal-cyber-radio.wav", "w") as w:
    w.setnchannels(1)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(b"".join(struct.pack("<h", int(max(-1, min(1, s)) * 32767)) for s in out))
print("saved reveal-cyber-radio.wav", round(DUR, 2), "s")
