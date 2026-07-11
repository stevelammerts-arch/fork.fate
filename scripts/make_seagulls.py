import numpy as np
import wave, struct

SR = 44100
rng = np.random.default_rng(21)
DUR = 11.0
N = int(SR * DUR)

def lowpass(x, hi):
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR)
    X *= (f <= hi)
    return np.fft.irfft(X, len(x))

def bandpass(x, lo, hi):
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR)
    X *= ((f >= lo) & (f <= hi))
    return np.fft.irfft(X, len(x))

def syllable(f_peak, dur, harm=7):
    n = int(SR * dur)
    tt = np.linspace(0, dur, n, endpoint=False)
    # pitch contour: quick rise then fall (nasal "yah")
    contour = f_peak * (0.7 + 0.3 * np.sin(np.pi * (tt / dur)))
    contour *= (1 + 0.04 * np.sin(2 * np.pi * 18 * tt))  # vibrato
    ph = 2 * np.pi * np.cumsum(contour) / SR
    tone = np.zeros(n)
    for k in range(1, harm + 1):
        tone += (1.0 / k) * np.sin(k * ph)              # sawtooth-ish = harsh/nasal
    trem = 0.65 + 0.35 * np.sin(2 * np.pi * 42 * tt)     # raspy tremolo
    env = np.minimum(1, tt * 90) * np.exp(-tt * (2.2 / dur))
    breath = rng.standard_normal(n) * 0.05 * env
    return (tone * env * trem + breath)

def gull_call():
    # a call = a few syllables: short rising chirps then longer descending cries
    base = rng.uniform(950, 1450)
    plan = [(base * 1.25, 0.10), (base * 1.15, 0.11), (base, 0.22), (base * 0.9, 0.26)]
    if rng.random() < 0.5:
        plan = plan[1:]  # vary call length
    parts, gain = [], 1.0
    for fp, d in plan:
        parts.append(syllable(fp, d) * gain)
        parts.append(np.zeros(int(SR * rng.uniform(0.03, 0.08))))
        gain *= rng.uniform(0.82, 0.98)
    call = np.concatenate(parts)
    return call / (np.max(np.abs(call)) + 1e-9)

out = np.zeros(N, dtype=np.float32)

# surf/wave bed: lowpassed noise with slow swelling waves
surf = lowpass(rng.standard_normal(N), 1100)
t = np.arange(N) / SR
waves = 0.5 + 0.5 * np.sin(2 * np.pi * 0.11 * t - 0.6) ** 2   # wave swells
out += (surf * waves * 0.16).astype(np.float32)

# soft wind hiss
out += (bandpass(rng.standard_normal(N), 400, 2500) * 0.03).astype(np.float32)

# scatter gull calls (a few near, a couple distant)
pos = 0.4
while pos < DUR - 1.0:
    call = gull_call()
    near = rng.random() < 0.7
    if near:
        c = call * rng.uniform(0.55, 0.8)
        pan = 1.0
    else:  # distant gull: quieter + more low-passed (muffled) + reverb-ish
        c = lowpass(call, 2200) * rng.uniform(0.2, 0.32)
    s = int(SR * pos); e = min(N, s + len(c))
    out[s:e] += c[:e - s].astype(np.float32)
    pos += rng.uniform(0.7, 1.9)

# add a light slap-back so gulls feel outdoors/airy
rev = out.copy()
for d, g in [(int(SR * 0.11), 0.18), (int(SR * 0.21), 0.1)]:
    pad = np.zeros_like(out); pad[d:] = out[:N - d] * g; rev += pad
out = 0.88 * out + 0.12 * rev

# loopable fades + normalize
fade = int(SR * 0.05)
out[:fade] *= np.linspace(0, 1, fade); out[-fade:] *= np.linspace(1, 0, fade)
out = out / (np.max(np.abs(out)) + 1e-9) * 0.9

with wave.open("/app/frontend/public/shuffle-seagulls.wav", "w") as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes(b"".join(struct.pack("<h", int(max(-1, min(1, s)) * 32767)) for s in out))
print("saved shuffle-seagulls.wav", round(DUR, 2), "s")
