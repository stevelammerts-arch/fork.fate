// Accelerating heartbeat: sound + slight haptics + a beat period the caller
// syncs its ffHeartbeat CSS animation to. Starts calm (~71 bpm) and tightens
// ~10% every beat down to a racing floor (~140 bpm) — the drumroll before
// fate shows its hand. One shared <audio> app-wide.
import { useEffect, useState } from "react";

const START_MS = 840;
const FLOOR_MS = 430;
const LOOP_CYCLE_MS = 882; // one lub-dub in /heartbeat-loop.mp3

let shared = null;

export function useHeartbeat(active) {
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
    const beat = () => {
      // strong lub-dub — short pulses are imperceptible on many phone motors
      try { if (navigator.vibrate) navigator.vibrate(p > 620 ? [85, Math.round(p * 0.22), 60] : [70, 70, 55]); } catch { /* no haptics */ }
      p = Math.max(FLOOR_MS, p * 0.9);        // every beat lands a little sooner
      setPeriod(p);
      a.playbackRate = Math.min(2.06, LOOP_CYCLE_MS / p);
      t = setTimeout(beat, p);
    };
    beat();
    return () => {
      clearTimeout(t); clearInterval(watch);
      window.removeEventListener("pointerdown", tryPlay);
      a.pause(); a.currentTime = 0;
    };
  }, [active]);
  return period;
}
