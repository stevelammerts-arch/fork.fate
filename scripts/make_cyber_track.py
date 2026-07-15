"""Procedurally synthesize a Blade Runner–style techno shuffle loop (Vangelis-ish
lush detuned pads + slow arpeggio + steady pulse), seamless loop, stereo 44.1k."""
import numpy as np
import wave, struct

SR = 44100
BPM = 92
beat = 60.0 / BPM
BARS = 8
bar = beat * 4
DUR = bar * BARS  # loop length
t = np.arange(int(DUR * SR)) / SR
N = len(t)

def note(semi_from_a4):
    return 440.0 * (2 ** (semi_from_a4 / 12.0))

# Dark minor progression (Cm - Ab - Eb - Bb), two bars each
C2, Eb2, F2, Ab2, Bb2 = note(-21), note(-18), note(-16), note(-13), note(-11)
C3, Eb3, G3, Ab3, Bb3, C4, Eb4, G4 = note(-9), note(-6), note(-2), note(-1), note(1), note(3), note(6), note(10)

def adsr(length, a, d, s, r, sus_level=0.7):
    n = int(length * SR); env = np.ones(n)
    ai, di, ri = int(a*SR), int(d*SR), int(r*SR)
    if ai: env[:ai] = np.linspace(0, 1, ai)
    if di: env[ai:ai+di] = np.linspace(1, sus_level, di)
    env[ai+di:n-ri] = sus_level
    if ri: env[n-ri:] = np.linspace(sus_level, 0, ri)
    return env

def saw(freq, n):
    ph = np.cumsum(np.full(n, freq/SR))
    return 2*(ph - np.floor(ph+0.5))

def detuned_pad(freq, length, detune=0.007, voices=3):
    n = int(length*SR); out = np.zeros(n)
    for v in range(voices):
        d = 1 + detune*(v - (voices-1)/2)
        out += saw(freq*d, n)
    out /= voices
    # gentle lowpass (one-pole) that opens over time for movement
    cutoff = np.linspace(0.06, 0.16, n)
    y = np.zeros(n); prev = 0.0
    for i in range(n):
        prev += cutoff[i]*(out[i]-prev); y[i] = prev
    return y * adsr(length, 0.35, 0.4, 0.8, 0.6, 0.85)

pad = np.zeros(N)
prog = [(C2,C3,Eb3,G3), (Ab2,C3,Eb3,Ab3), (Eb2,Eb3,G3,Bb3), (Bb2,Bb2,Eb3,G3)]
seg = DUR/4
for i,(a,b,c,d) in enumerate(prog):
    s = int(i*seg*SR); chord = np.zeros(int(seg*SR))
    for f in (a,b,c,d):
        p = detuned_pad(f, seg)
        chord[:len(p)] += p
    pad[s:s+len(chord)] += chord*0.25

# Slow evolving arpeggio (sine with slight saw edge)
arp = np.zeros(N)
arp_notes = [C4, Eb4, G4, Bb3, C4, G4, Eb4, G4]
step = beat/2
for i in range(int(DUR/step)):
    f = arp_notes[i % len(arp_notes)]
    s = int(i*step*SR); n = int(step*SR*0.95)
    if s+n > N: break
    tone = 0.7*np.sin(2*np.pi*f*np.arange(n)/SR) + 0.3*saw(f, n)
    tone *= adsr(n/SR, 0.005, 0.08, 0.4, 0.18, 0.5)
    arp[s:s+n] += tone*0.16

# Sub bass pulse (root per chord) + steady techno pulse on each beat
bass = np.zeros(N)
roots = [C2, Ab2, Eb2, Bb2]
for i,f in enumerate(roots):
    s=int(i*seg*SR); n=int(seg*SR)
    b = np.sin(2*np.pi*f*np.arange(min(n,N-s))/SR)
    bass[s:s+len(b)] += b*0.5

# Techno kick + soft hat
kick = np.zeros(N)
for i in range(int(DUR/beat)):
    s=int(i*beat*SR); n=int(0.18*SR)
    if s+n>N: break
    fenv = np.linspace(120, 45, n)
    ph = np.cumsum(2*np.pi*fenv/SR)
    kick[s:s+n] += np.sin(ph)*np.exp(-np.linspace(0,9,n))*0.7
hat = np.zeros(N)
rng = np.random.default_rng(7)
for i in range(int(DUR/(beat/2))):
    if i%2==0: continue
    s=int(i*(beat/2)*SR); n=int(0.05*SR)
    if s+n>N: break
    hat[s:s+n] += rng.standard_normal(n)*np.exp(-np.linspace(0,30,n))*0.06

mix = pad + arp + bass*0.6 + kick + hat

# Simple stereo widening via short haas delay + feedback reverb tail
def reverb(x, delay=0.09, fb=0.35, n=4):
    y = x.copy()
    for k in range(1,n+1):
        d=int(delay*k*SR); dec=fb**k
        y[d:] += x[:-d]*dec
    return y
wet = reverb(mix)
mix = 0.7*mix + 0.3*wet

d = int(0.012*SR)
left = mix.copy(); right = np.concatenate([np.zeros(d), mix[:-d]])

# Crossfade ends for seamless loop
xf = int(1.2*SR)
for ch in (left, right):
    fade = np.linspace(0,1,xf)
    ch[:xf] = ch[:xf]*fade + ch[-xf:]*(1-fade)
left=left[:N-xf]; right=right[:N-xf]

st = np.stack([left,right],axis=1)
st /= np.max(np.abs(st))+1e-9
st = np.tanh(st*1.1)*0.92
data = (st*32767).astype(np.int16)

with wave.open('/app/frontend/public/reveal-cyber-radio.wav','w') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes(data.tobytes())
print('wrote reveal-cyber-radio.wav', round(len(left)/SR,1),'s stereo')
