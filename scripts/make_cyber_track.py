"""DARK DRIVING TECHNO shuffle loop (Blade Runner mood but strong & aggressive):
punchy 4-on-the-floor kick, resonant sequenced sawtooth bass, hard detuned arp lead,
clap + hats, dark pad, sidechain pump. Seamless stereo 44.1k loop."""
import numpy as np
import wave

SR = 44100
BPM = 126
beat = 60.0 / BPM
sixteenth = beat / 4
BARS = 8
bar = beat * 4
DUR = bar * BARS
N = int(DUR * SR)
t = np.arange(N) / SR

def note(s): return 440.0 * (2 ** (s / 12.0))
# C minor with tritone tension
C1,C2,Eb2,F2,Gb2,G2,Ab2,Bb2 = note(-33),note(-21),note(-18),note(-16),note(-15),note(-14),note(-13),note(-11)
C3,Eb3,Gb3,G3,Ab3,Bb3,C4,Eb4,G4 = note(-9),note(-6),note(-3),note(-2),note(-1),note(1),note(3),note(6),note(10)

def saw(freq, n):
    ph = np.cumsum(np.full(n, freq/SR)); return 2*(ph - np.floor(ph+0.5))

def svf_lp(x, cutoff_hz, res):
    """Chamberlin state-variable lowpass with resonance. cutoff_hz scalar or array."""
    n = len(x); out = np.zeros(n)
    fc = np.asarray(cutoff_hz, dtype=float)
    if fc.ndim == 0: fc = np.full(n, float(cutoff_hz))
    f = 2*np.sin(np.pi*np.clip(fc, 20, SR/6)/SR)
    q = np.clip(1.0 - res, 0.05, 1.0)
    low = 0.0; band = 0.0
    for i in range(n):
        low += f[i]*band
        high = x[i] - low - q*band
        band += f[i]*high
        out[i] = low
    return out

# ---- KICK: four on the floor, punchy ----
kick = np.zeros(N)
for i in range(int(DUR/beat)):
    s = int(i*beat*SR); n = int(0.32*SR)
    if s+n > N: n = N-s
    tt = np.arange(n)
    fenv = 150*np.exp(-tt/(0.03*SR)) + 48
    ph = np.cumsum(2*np.pi*fenv/SR)
    body = np.sin(ph)*np.exp(-tt/(0.16*SR))
    click = (np.random.default_rng(i).standard_normal(n))*np.exp(-tt/(0.004*SR))*0.5
    kick[s:s+n] += (body*1.0 + click)*0.95

# sidechain duck envelope from the kick pattern
duck = np.ones(N)
for i in range(int(DUR/beat)):
    s = int(i*beat*SR); n = int(beat*SR)
    if s+n > N: n = N-s
    shape = 0.25 + 0.75*(1 - np.exp(-np.arange(n)/(0.16*SR)))
    duck[s:s+n] = np.minimum(duck[s:s+n], shape)

# ---- CLAP on beats 2 & 4 ----
clap = np.zeros(N)
rng = np.random.default_rng(3)
for i in range(int(DUR/beat)):
    if i % 2 == 0: continue
    s = int(i*beat*SR)
    for off in (0, int(0.012*SR), int(0.024*SR)):
        n = int(0.09*SR)
        if s+off+n > N: break
        nz = rng.standard_normal(n)
        nz = svf_lp(nz, 2200, 0.4) - svf_lp(nz, 900, 0.2)
        clap[s+off:s+off+n] += nz*np.exp(-np.arange(n)/(0.05*SR))*0.35

# ---- HATS: closed on 16ths, open on off-beats ----
hat = np.zeros(N)
for i in range(int(DUR/sixteenth)):
    s = int(i*sixteenth*SR)
    is_off = (i % 4 == 2)
    n = int((0.14 if is_off else 0.03)*SR)
    if s+n > N: n = N-s
    nz = rng.standard_normal(n)
    nz = nz - svf_lp(nz, 6000, 0.1)  # highpass-ish
    hat[s:s+n] += nz*np.exp(-np.arange(n)/((0.08 if is_off else 0.015)*SR))*(0.14 if is_off else 0.1)

# ---- BASS: resonant sequenced saw, driving 16th pattern per chord ----
bass_seq = [C2, C2, C2, Eb2, Ab2, Ab2, Ab2, C2, Gb2, Gb2, Gb2, F2, C2, C2, G2, C2]  # per bar step roots (16 per 2 bars)
prog_roots = [C2, Ab2, Gb2, C2]
bass = np.zeros(N)
for i in range(int(DUR/sixteenth)):
    # pick root from progression (4 chords across 8 bars => 2 bars each)
    chord_idx = int((i*sixteenth) / (DUR/4)) % 4
    if i % 2 == 1 and (i % 8 not in (1,7)):  # gappy rhythm for groove
        pass
    f = prog_roots[chord_idx]
    s = int(i*sixteenth*SR); n = int(sixteenth*SR*0.92)
    if s+n > N: n = N-s
    raw = saw(f, n) + 0.5*saw(f*0.5, n)
    cut = np.linspace(140, 900, n)  # pluck-ish opening
    filt = svf_lp(raw, cut, 0.62)
    env = np.exp(-np.arange(n)/(0.12*SR))
    bass[s:s+n] += filt*env*0.9

# ---- LEAD ARP: hard detuned saws, 16ths, resonant sweep + delay ----
motif = [C4, G3, Eb4, G3, Gb3, C4, Bb3, G3, Ab3, Eb4, C4, G3, Gb3, Bb3, C4, Eb4]
lead = np.zeros(N)
sweep = 700 + 1500*(0.5+0.5*np.sin(2*np.pi*t/(DUR/2)))  # slow filter sweep
for i in range(int(DUR/sixteenth)):
    f = motif[i % len(motif)]
    s = int(i*sixteenth*SR); n = int(sixteenth*SR*0.95)
    if s+n > N: n = N-s
    raw = saw(f, n) + saw(f*1.007, n) + saw(f*0.5, n)*0.4
    filt = svf_lp(raw, sweep[s:s+n], 0.55)
    env = np.exp(-np.arange(n)/(0.09*SR))
    lead[s:s+n] += filt*env*0.32

# ---- DARK PAD (atmosphere), sidechained ----
def pad_note(f, length):
    n = int(length*SR)
    o = (saw(f,n)+saw(f*1.006,n)+saw(f*0.994,n))/3
    return svf_lp(o, 500, 0.1)
pad = np.zeros(N)
prog = [(C2,Eb3,G3),(Ab2,C3,Eb3),(Gb2,Bb2,Eb3),(C2,G3,Ab3)]
seg = DUR/4
for i,ch in enumerate(prog):
    s=int(i*seg*SR); block=np.zeros(int(seg*SR))
    for f in ch:
        p = pad_note(f, seg); block[:len(p)] += p
    pad[s:s+len(block)] += block*0.14

# delay on lead for space
def delay(x, dt, fb, taps):
    y=x.copy()
    for k in range(1,taps+1):
        d=int(dt*k*SR); y[d:]+=x[:-d]*(fb**k)
    return y
lead = 0.75*lead + 0.25*delay(lead, beat*0.75, 0.4, 3)

# apply sidechain pump to bass + pad + lead
bass *= duck; pad *= duck; lead *= (0.6+0.4*duck)

mix = kick*1.0 + clap*0.9 + hat*0.8 + bass*1.0 + lead*0.9 + pad*0.8

# light reverb tail (short, not washy)
def reverb(x, dt=0.07, fb=0.3, taps=3):
    y=x.copy()
    for k in range(1,taps+1):
        d=int(dt*k*SR); y[d:]+=x[:-d]*(fb**k)
    return y
mix = 0.85*mix + 0.15*reverb(mix)

# stereo
d=int(0.008*SR)
left=mix.copy(); right=np.concatenate([np.zeros(d), mix[:-d]])
xf=int(bar*SR)  # crossfade one bar for seamless loop
for ch in (left,right):
    fade=np.linspace(0,1,xf)
    ch[:xf]=ch[:xf]*fade + ch[-xf:]*(1-fade)
left=left[:N-xf]; right=right[:N-xf]

st=np.stack([left,right],axis=1)
st/=np.max(np.abs(st))+1e-9
st=np.tanh(st*1.4)*0.95   # drive/loudness for strength
data=(st*32767).astype(np.int16)
with wave.open('/app/frontend/public/reveal-cyber-radio.wav','w') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes(data.tobytes())
print('wrote strong dark techno reveal-cyber-radio.wav', round(len(left)/SR,1),'s')
