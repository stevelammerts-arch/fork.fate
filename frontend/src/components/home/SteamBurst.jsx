import { useEffect } from "react";
import { motion } from "framer-motion";

// Dense vapor field: staggered starts, sideways drift, grow + fade as they rise.
// Front-loaded delays so the big cloud lands WITH the reveal hiss.
const PUFFS = [
  { left: "12%", delay: 0.0, size: 110, drift: -22, dur: 2.9 },
  { left: "30%", delay: 0.05, size: 140, drift: 14, dur: 3.3 },
  { left: "50%", delay: 0.0, size: 125, drift: -10, dur: 3.0 },
  { left: "68%", delay: 0.1, size: 135, drift: 20, dur: 3.2 },
  { left: "84%", delay: 0.05, size: 105, drift: 26, dur: 2.8 },
  { left: "20%", delay: 0.3, size: 90, drift: -16, dur: 2.6 },
  { left: "42%", delay: 0.25, size: 118, drift: 8, dur: 2.9 },
  { left: "60%", delay: 0.35, size: 96, drift: -8, dur: 2.5 },
  { left: "76%", delay: 0.3, size: 108, drift: 16, dur: 2.7 },
  { left: "8%", delay: 0.55, size: 78, drift: -20, dur: 2.4 },
  { left: "35%", delay: 0.6, size: 92, drift: 10, dur: 2.6 },
  { left: "55%", delay: 0.5, size: 84, drift: -6, dur: 2.4 },
  { left: "72%", delay: 0.65, size: 88, drift: 14, dur: 2.5 },
  { left: "26%", delay: 0.9, size: 66, drift: -12, dur: 2.2 },
  { left: "48%", delay: 1.0, size: 74, drift: 6, dur: 2.3 },
  { left: "64%", delay: 1.1, size: 62, drift: -8, dur: 2.1 },
  { left: "88%", delay: 0.85, size: 70, drift: 22, dur: 2.3 },
  { left: "16%", delay: 1.2, size: 58, drift: -10, dur: 2.0 },
];

// Fast pressure-release jets spurting sideways off the card edges the instant
// the reveal lands — like a boiler valve letting go.
const JETS = [
  { side: "left", top: "18%", delay: 0.0, w: 130, h: 34, dur: 0.9, rise: -18 },
  { side: "right", top: "24%", delay: 0.06, w: 150, h: 38, dur: 1.0, rise: -22 },
  { side: "left", top: "52%", delay: 0.12, w: 110, h: 30, dur: 0.85, rise: -14 },
  { side: "right", top: "60%", delay: 0.05, w: 120, h: 32, dur: 0.9, rise: -16 },
  { side: "left", top: "34%", delay: 0.3, w: 90, h: 26, dur: 0.8, rise: -12 },
  { side: "right", top: "42%", delay: 0.35, w: 95, h: 26, dur: 0.8, rise: -12 },
];

const VAPOR =
  "radial-gradient(circle at 50% 55%, rgba(240,232,216,0.6) 0%, rgba(240,232,216,0.26) 45%, rgba(240,232,216,0) 72%)";

/**
 * Steampunk-only reveal flourish: a heavy one-shot burst of steam — a dense
 * vapor cloud rising off the card plus fast valve-jets escaping the card's
 * edges, timed to land with the reveal hiss. Purely decorative
 * (pointer-events none, aria-hidden); parent unmounts it after the burst.
 * `startBottom`/`travel` position where puffs are born and how far they rise,
 * so the same burst works on the reveal card and above the landed deck card.
 */
export function SteamBurst({ startBottom = "45%", travel = -190, className = "absolute inset-0 z-[5] overflow-visible", sound = true }) {
  // Mechanical clamp clunk-and-hiss as the steam lets go (user-uploaded clip).
  // CrankGear passes sound={false} — it already plays its own hiss.
  useEffect(() => {
    if (!sound) return undefined;
    let clamp = null;
    try {
      if (localStorage.getItem("ff_muted") !== "1") {
        clamp = new Audio("/flourish-steam.mp3");
        clamp.volume = 0.6;
      }
    } catch (e) { /* audio */ }
    let started = false;
    const tm = setTimeout(() => { started = true; clamp?.play().catch(() => {}); }, 150);
    return () => { clearTimeout(tm); if (!started) clamp?.pause(); };
  }, [sound]);
  return (
    <div
      className={`pointer-events-none ${className}`}
      data-testid="steam-burst"
      aria-hidden="true"
    >
      {PUFFS.map((p, i) => (
        <motion.div
          key={`p-${i}`}
          className="absolute rounded-full"
          style={{
            left: p.left,
            bottom: startBottom,
            width: p.size,
            height: p.size,
            background: VAPOR,
            filter: "blur(8px)",
          }}
          initial={{ y: 60, x: 0, opacity: 0, scale: 0.4 }}
          animate={{ y: travel, x: p.drift, opacity: [0, 0.95, 0], scale: 1.9 }}
          transition={{ delay: p.delay, duration: p.dur, ease: "easeOut" }}
        />
      ))}
      {JETS.map((j, i) => (
        <motion.div
          key={`j-${i}`}
          className="absolute rounded-full"
          style={{
            [j.side]: -8,
            top: j.top,
            width: j.w,
            height: j.h,
            background: VAPOR,
            filter: "blur(6px)",
          }}
          initial={{ x: 0, y: 0, opacity: 0, scaleX: 0.2, originX: j.side === "left" ? 1 : 0 }}
          animate={{
            x: j.side === "left" ? -j.w * 0.7 : j.w * 0.7,
            y: j.rise,
            opacity: [0, 0.9, 0],
            scaleX: 1.4,
          }}
          transition={{ delay: j.delay, duration: j.dur, ease: "easeOut" }}
        />
      ))}
    </div>
  );
}
