import numpy as np
import wave, struct, io, asyncio, os
from dotenv import load_dotenv
from emergentintegrations.llm.openai import OpenAITextToSpeech

load_dotenv("/app/backend/.env")
SR = 44100
rng = np.random.default_rng(11)

PHRASES = [
    ("onyx", "Dispatch, all units be advised, we have a two-eleven in progress, over."),
    ("ash",  "Copy that, unit seven responding, code three."),
    ("onyx", "Suspect last seen heading north on Fifth Street, requesting backup."),
    ("ash",  "Ten-four, maintain position and await further instructions."),
    ("onyx", "Control, this is unit twelve, we are ten-eight and clear."),
    ("ash",  "Be advised, we have eyes on the target, moving in now."),
]


async def tts_bytes(voice, text):
    tts = OpenAITextToSpeech(api_key=os.getenv("EMERGENT_LLM_KEY"))
    return await tts.generate_speech(text=text, model="tts-1", voice=voice, response_format="wav", speed=1.06)


def decode_wav(b):
    with wave.open(io.BytesIO(b)) as w:
        sr = w.getframerate(); nch = w.getnchannels(); n = w.getnframes()
        raw = w.readframes(n)
    y = np.frombuffer(raw, dtype="<i2").astype(np.float32) / 32768.0
    if nch == 2:
        y = y.reshape(-1, 2).mean(axis=1)
    if sr != SR:  # resample to 44.1k
        idx = np.linspace(0, len(y) - 1, int(len(y) * SR / sr))
        y = np.interp(idx, np.arange(len(y)), y)
    return y.astype(np.float32)


def bandpass(x, lo, hi):
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR)
    X *= ((f >= lo) & (f <= hi))
    return np.fft.irfft(X, len(x))


def beep(freq, dur):
    n = int(SR * dur); tt = np.linspace(0, dur, n, endpoint=False)
    env = np.minimum(1, tt * 200) * np.minimum(1, (dur - tt) * 200)
    return 0.45 * np.sin(2 * np.pi * freq * tt) * env


def radioize(v):
    # comms band + light distortion, keeps voice intelligible but radio-thin
    v = v / (np.max(np.abs(v)) + 1e-9)
    v = bandpass(v, 380, 3000)
    v = np.tanh(v * 2.2)                      # radio saturation
    v *= (0.85 + 0.15 * np.sin(2 * np.pi * 90 * np.arange(len(v)) / SR))  # subtle AM buzz
    return v * 0.7


async def build():
    clips = []
    for voice, text in PHRASES:
        try:
            b = await tts_bytes(voice, text)
            clips.append(radioize(decode_wav(b)))
            print("tts ok:", text[:32])
        except Exception as e:
            print("tts FAIL:", e)
    if not clips:
        raise SystemExit("no TTS clips generated")

    total_len = sum(len(c) for c in clips) + int(SR * (len(clips) * 0.9 + 1.5))
    out = bandpass(rng.standard_normal(total_len), 500, 3200) * 0.045  # radio hiss bed

    pos = 0.3
    for c in clips:
        out[int(SR * pos): int(SR * pos)] = 0  # noop keep
        b1 = beep(rng.uniform(1000, 1350), 0.05)
        s = int(SR * pos); out[s:s + len(b1)] += b1
        pos += 0.09
        s = int(SR * pos); e = min(total_len, s + len(c)); out[s:e] += c[:e - s]
        pos += len(c) / SR + 0.05
        b2 = beep(rng.uniform(700, 950), 0.04)
        s = int(SR * pos)
        if s + len(b2) < total_len: out[s:s + len(b2)] += b2
        burst = bandpass(rng.standard_normal(int(SR * 0.12)), 800, 3000) * np.exp(-np.linspace(0, 6, int(SR * 0.12))) * 0.3
        s = int(SR * (pos + 0.03)); e = min(total_len, s + len(burst)); out[s:e] += burst[:e - s]
        pos += rng.uniform(0.5, 0.9)

    out = out[: int(SR * (pos + 0.4))]
    out = np.tanh(out * 1.3)
    fade = int(SR * 0.04)
    out[:fade] *= np.linspace(0, 1, fade); out[-fade:] *= np.linspace(1, 0, fade)
    out = out / (np.max(np.abs(out)) + 1e-9) * 0.9

    with wave.open("/app/frontend/public/reveal-cyber-radio.wav", "w") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes(b"".join(struct.pack("<h", int(max(-1, min(1, s)) * 32767)) for s in out))
    print("saved reveal-cyber-radio.wav", round(len(out) / SR, 2), "s")


asyncio.run(build())
