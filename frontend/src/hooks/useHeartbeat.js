// Accelerating heartbeat: sound + slight haptics + a beat period the caller
// syncs its ffHeartbeat CSS animation to. Starts calm (~71 bpm) and tightens
// ~10% every beat down to a racing floor (~140 bpm) — the drumroll before
// fate shows its hand. One shared <audio> app-wide.
import { useEffect, useState } from "react";

const START_MS = 840;
const FLOOR_MS = 430;
const LOOP_CYCLE_MS = 882; // one lub-dub in /heartbeat-loop.mp3
const FLATLINE_ODDS = 0.22; // rare gag: the racing heart flatlines for a beat
const FLATLINE_MS = 1250;

let shared = null;

/** EKG flatline: a thin steady monitor tone (WebAudio, no asset needed). */
function playFlatTone(ms) {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.001, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.07, ctx.currentTime + 0.03);
    gain.gain.setValueAtTime(0.07, ctx.currentTime + ms / 1000 - 0.08);
    gain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + ms / 1000);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + ms / 1000 + 0.02);
    osc.onended = () => { try { ctx.close(); } catch { /* ignore */ } };
  } catch { /* no WebAudio — silent flatline still reads via the frozen pulse */ }
}

/** Accelerating heartbeat. Returns the current beat period in ms — or 0 while
 * the heart is FLATLINING (opt-in gag: once the beat hits its racing floor it
 * rarely dies for a beat — monitor tone, frozen pulse — then jolts back). */
export function useHeartbeat(active, { flatline = false } = {}) {
  const [period, setPeriod] = useState(START_MS);
  useEffect(() => {
    if (!active) return undefined;
    const muted = () => { try { return localStorage.getItem("ff_muted") === "1"; } catch { return true; } };
    if (!shared) { shared = new Audio("/heartbeat-loop.mp3"); shared.loop = true; }
    const a = shared;
    let p = START_MS;
    setPeriod(p);
    a.volume = 0.3;
    a.playbackRate = LOOP_CYCLE_MS / p;
    const tryPlay = () => { if (!muted() && a.paused) a.play().catch(() => {}); };
    tryPlay();
    window.addEventListener("pointerdown", tryPlay);
    const watch = setInterval(() => { if (muted()) { if (!a.paused) a.pause(); } else tryPlay(); }, 500);
    let t;
    let flat = false; // while true the 500ms watcher must not resurrect audio
    const willFlatline = flatline && Math.random() < FLATLINE_ODDS;
    let flatlined = false;
    const beat = () => {
      // strong lub-dub — short pulses are imperceptible on many phone motors
      try { if (navigator.vibrate) navigator.vibrate(p > 620 ? [85, Math.round(p * 0.22), 60] : [70, 70, 55]); } catch { /* no haptics */ }
      const wasRacing = p <= FLOOR_MS;
      p = Math.max(FLOOR_MS, p * 0.9);        // every beat lands a little sooner
      // THE GAG: the moment the heart maxes out, it rarely just... stops.
      // One long EKG tone, the pulse freezes — then a hard jolt brings it back.
      if (willFlatline && !flatlined && wasRacing) {
        flatlined = true;
        flat = true;
        a.pause();
        setPeriod(0);
        if (!muted()) playFlatTone(FLATLINE_MS);
        try { if (navigator.vibrate) navigator.vibrate(0); } catch { /* ignore */ }
        t = setTimeout(() => {
          flat = false;
          // the jolt back — defibrillator thump
          try { if (navigator.vibrate) navigator.vibrate([140, 70, 110]); } catch { /* ignore */ }
          setPeriod(p);
          tryPlay();
          t = setTimeout(beat, p);
        }, FLATLINE_MS);
        return;
      }
      setPeriod(p);
      a.playbackRate = Math.min(2.06, LOOP_CYCLE_MS / p);
      t = setTimeout(beat, p);
    };
    beat();
    const watchFlat = setInterval(() => { if (flat && !a.paused) a.pause(); }, 120);
    return () => {
      clearTimeout(t); clearInterval(watch); clearInterval(watchFlat);
      window.removeEventListener("pointerdown", tryPlay);
      a.pause(); a.currentTime = 0;
    };
  }, [active]);
  return period;
}
