"""Procedurally synthesize a DARK, OMINOUS Blade Runner–style techno loop:
deep sub drone + lush low detuned pads over a dread-laden minor progression,
sparse low arpeggio, tritone tension, heavy reverb, slow pulse. Stereo 44.1k loop."""
import numpy as np
import wave

SR = 44100
BPM = 74
beat = 60.0 / BPM
BARS = 8
bar = beat * 4
DUR = bar * BARS
t = np.arange(int(DUR * SR)) / SR
N = len(t)

def note(semi_from_a4):
    return 440.0 * (2 ** (semi_from_a4 / 12.0))

C1, C2, Eb2, Gb2, Ab2, Bb2 = note(-33), note(-21), note(-18), note(-15), note(-13), note(-11)
C3, Eb3, Gb3, G3, Ab3, Bb3 = note(-9), note(-6), note(-3), note(-2), note(-1), note(1)

def adsr(length, a, d, s, r, sus=0.7):
    n = int(length * SR); env = np.ones(n)
    ai, di, ri = int(a*SR), int(d*SR), int(r*SR)
    if ai: env[:ai] = np.linspace(0, 1, ai)
    if di: env[ai:ai+di] = np.linspace(1, sus, di)
    env[ai+di:n-ri] = sus
    if ri: env[n-ri:] = np.linspace(sus, 0, ri)
    return env

def saw(freq, n):
    ph = np.cumsum(np.full(n, freq/SR)); return 2*(ph - np.floor(ph+0.5))

def detuned_pad(freq, length, detune=0.006, voices=3):
    n = int(length*SR); out = np.zeros(n)
    for v in range(voices):
        d = 1 + detune*(v - (voices-1)/2)
        out += saw(freq*d, n)
    out /= voices
    cutoff = np.linspace(0.025, 0.075, n)
    y = np.zeros(n); prev = 0.0
    for i in range(n):
        prev += cutoff[i]*(out[i]-prev); y[i] = prev
    return y * adsr(length, 0.5, 0.5, 0.85, 0.8, 0.9)

pad = np.zeros(N)
prog = [(C2, Eb3, G3), (Ab2, C3, Eb3), (Gb2, Bb2, Eb3), (C2, G3, Ab3)]
seg = DUR/4
for i, chord_notes in enumerate(prog):
    s = int(i*seg*SR); chord = np.zeros(int(seg*SR))
    for f in chord_notes:
        p = detuned_pad(f, seg)
        chord[:len(p)] += p
    pad[s:s+len(chord)] += chord*0.22

drone = 0.5*np.sin(2*np.pi*C1*t) + 0.28*np.sin(2*np.pi*C2*t)
drone *= (0.7 + 0.3*np.sin(2*np.pi*t/(DUR/2)))

arp = np.zeros(N)
motif = [C3, Eb3, G3, Gb3, C3, Ab2, Eb3, Gb3]
step = beat
for i in range(int(DUR/step)):
    f = motif[i % len(motif)]
    s = int(i*step*SR); n = int(step*SR*0.9)
    if s+n > N: break
    tone = 0.6*np.sin(2*np.pi*f*np.arange(n)/SR) + 0.4*saw(f, n)
    tone *= adsr(n/SR, 0.02, 0.3, 0.3, 0.35, 0.35)
    arp[s:s+n] += tone*0.1

kick = np.zeros(N)
for i in range(int(DUR/beat)):
    if i % 2 != 0: continue
    s = int(i*beat*SR); n = int(0.26*SR)
    if s+n > N: break
    fenv = np.linspace(95, 34, n); ph = np.cumsum(2*np.pi*fenv/SR)
    kick[s:s+n] += np.sin(ph)*np.exp(-np.linspace(0,7,n))*0.7
boom = np.zeros(N)
for i in range(BARS):
    s = int(i*bar*SR); n = int(1.1*SR)
    if s+n > N: break
    fenv = np.linspace(48, 22, n); ph = np.cumsum(2*np.pi*fenv/SR)
    boom[s:s+n] += np.sin(ph)*np.exp(-np.linspace(0,5,n))*0.5

rng = np.random.default_rng(11)
wind = rng.standard_normal(N)
wc = 0.0008; y = np.zeros(N); prev = 0.0
for i in range(N):
    prev += wc*(wind[i]-prev); y[i] = prev
wind = y * 6.0 * (0.5 + 0.5*np.sin(2*np.pi*t/7.0)) * 0.05

mix = pad + drone*0.5 + arp + kick + boom + wind

def reverb(x, delay=0.11, fb=0.45, n=5):
    y = x.copy()
    for k in range(1, n+1):
        d = int(delay*k*SR); dec = fb**k
        y[d:] += x[:-d]*dec
    return y
wet = reverb(mix)
mix = 0.6*mix + 0.4*wet

d = int(0.014*SR)
left = mix.copy(); right = np.concatenate([np.zeros(d), mix[:-d]])

xf = int(1.6*SR)
for ch in (left, right):
    fade = np.linspace(0, 1, xf)
    ch[:xf] = ch[:xf]*fade + ch[-xf:]*(1-fade)
left = left[:N-xf]; right = right[:N-xf]

st = np.stack([left, right], axis=1)
st /= np.max(np.abs(st)) + 1e-9
st = np.tanh(st*1.15)*0.9
data = (st*32767).astype(np.int16)

with wave.open('/app/frontend/public/reveal-cyber-radio.wav', 'w') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes(data.tobytes())
print('wrote dark reveal-cyber-radio.wav', round(len(left)/SR,1), 's stereo')
