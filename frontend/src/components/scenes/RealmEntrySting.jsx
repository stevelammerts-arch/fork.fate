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
};

export function RealmEntrySting({ theme }) {
  useEffect(() => {
    const src = STINGS[theme];
    if (!src) return;
    let a = null;
    const retry = () => { if (a) a.play().catch(() => {}); };
    try {
      if (localStorage.getItem("ff_muted") !== "1") {
        a = new Audio(src);
        a.volume = 0.18;
        a.play().catch(() => window.addEventListener("pointerdown", retry, { once: true }));
      }
    } catch { /* audio unavailable */ }
    const muteWatch = setInterval(() => {
      try { if (a && localStorage.getItem("ff_muted") === "1") { a.pause(); a = null; } } catch { /* ignore */ }
    }, 400);
    return () => {
      clearInterval(muteWatch);
      window.removeEventListener("pointerdown", retry);
      if (!a) return;
      const el = a; // quick fade so leaving the realm doesn't clip the track
      const fade = setInterval(() => {
        el.volume = Math.max(0, el.volume - 0.03);
        if (el.volume <= 0) { clearInterval(fade); el.pause(); }
      }, 60);
    };
  }, [theme]);
  return null;
}
