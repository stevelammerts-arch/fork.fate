// Realm-entry stings: a one-shot ambient-level music cue that plays ONCE when
// the user enters a realm (user-provided tracks, cropped to their best window).
// Not a loop — it plays through and ends. Leaving the realm fades it out,
// autoplay-blocked cold loads retry on the first tap, and the live mute
// watcher stops it mid-track if the user hits the mute pill.
import { useEffect } from "react";

const STINGS = {
  cyber: "/cyber-ambient.mp3",
  summer: "/summer-ambient.mp3",
  spring: "/spring-ambient.mp3",
  tiki: "/tiki-ambient.mp3",
  fairy: "/fairy-ambient.mp3",
  winter: "/winter-ambient.mp3",
  fall: "/fall-ambient.mp3",
  dark: "/reaper-ambient.mp3",
  steam: "/steam-ambient.mp3",
  fantasy: "/fantasy-ambient.mp3",
  light: "/cafe-ambient.mp3",
};

// Quiet looping bed that lives UNDER the realm. `afterSting: true` waits for
// the entry track to finish (the loop takes over as the song fades);
// otherwise it runs the whole visit.
const AMBIENT_LOOPS = {
  summer: { src: "/summer-waves-loop.mp3", vol: 0.16, afterSting: false }, // waves + gulls
  fantasy: { src: "/fantasy-mine-loop.mp3", vol: 0.15, afterSting: true }, // creaking mine shaft
};

// Random faint one-shots layered over a realm — the dark fall forest gets
// night critters: an owl hooting somewhere far off and leaves rustling in
// the undergrowth. Each fires on its own randomized clock (min..max ms).
const CRITTERS = {
  fall: [
    { src: "/owl-hoot.mp3", vol: 0.05, min: 75000, max: 180000 },
    { src: "/leaf-rustle.mp3", vol: 0.06, min: 50000, max: 130000 },
  ],
};

export function RealmEntrySting({ theme }) {
  useEffect(() => {
    const src = STINGS[theme];
    const loopCfg = AMBIENT_LOOPS[theme];
    const critters = CRITTERS[theme];
    if (!src && !loopCfg && !critters) return;
    let a = null;
    let loop = null;
    // afterSting loops stay "pending" until the song has played through
    let loopReady = !loopCfg || !loopCfg.afterSting;
    const muted = () => { try { return localStorage.getItem("ff_muted") === "1"; } catch { return true; } };
    const playLoop = () => {
      if (!loopCfg || !loopReady || muted()) return;
      if (!loop) { loop = new Audio(loopCfg.src); loop.loop = true; loop.volume = loopCfg.vol; }
      if (loop.paused) loop.play().catch(() => {});
    };
    const retry = () => { if (a) a.play().catch(() => {}); playLoop(); };
    try {
      if (!muted() && src) {
        a = new Audio(src);
        a.volume = 0.1; // gentle — an entry sting should never startle
        a.addEventListener("ended", () => { loopReady = true; playLoop(); });
        a.play().catch(() => window.addEventListener("pointerdown", retry, { once: true }));
      } else {
        loopReady = true; // no song to wait for
      }
      playLoop();
    } catch { /* audio unavailable */ }
    // night critters: self-rescheduling faint one-shots, silent while muted
    const critterTimers = [];
    const critterEls = [];
    (critters || []).forEach((c, i) => {
      const el = new Audio(c.src);
      el.volume = c.vol;
      critterEls.push(el);
      const schedule = () => {
        const wait = c.min + Math.random() * (c.max - c.min);
        critterTimers[i] = setTimeout(() => {
          if (!muted()) { el.currentTime = 0; el.play().catch(() => {}); }
          schedule();
        }, wait);
      };
      schedule();
    });
    const watch = setInterval(() => {
      try {
        if (muted()) {
          if (a) { a.pause(); a = null; loopReady = true; }
          if (loop && !loop.paused) loop.pause();
          critterEls.forEach((el) => { if (!el.paused) el.pause(); });
        } else {
          playLoop(); // resumes (or starts) the bed after an unmute
        }
      } catch { /* ignore */ }
    }, 400);
    return () => {
      clearInterval(watch);
      critterTimers.forEach(clearTimeout);
      critterEls.forEach((el) => { try { el.pause(); } catch { /* ignore */ } });
      window.removeEventListener("pointerdown", retry);
      const els = [a, loop].filter(Boolean);
      if (!els.length) return;
      const fade = setInterval(() => { // quick fade so leaving doesn't clip
        let alive = false;
        els.forEach((el) => {
          el.volume = Math.max(0, el.volume - 0.03);
          if (el.volume <= 0) el.pause(); else alive = true;
        });
        if (!alive) clearInterval(fade);
      }, 60);
    };
  }, [theme]);
  return null;
}
