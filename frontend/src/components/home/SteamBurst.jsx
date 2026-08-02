import { motion } from "framer-motion";

// Soft vapor puffs: staggered starts, sideways drift, grow + fade as they rise.
const PUFFS = [
  { left: "16%", delay: 0.0, size: 74, drift: -16, dur: 2.7 },
  { left: "36%", delay: 0.35, size: 96, drift: 12, dur: 3.1 },
  { left: "55%", delay: 0.15, size: 66, drift: -8, dur: 2.4 },
  { left: "72%", delay: 0.5, size: 88, drift: 18, dur: 2.9 },
  { left: "27%", delay: 0.85, size: 58, drift: -12, dur: 2.3 },
  { left: "62%", delay: 1.0, size: 76, drift: 8, dur: 2.6 },
  { left: "45%", delay: 1.25, size: 64, drift: -6, dur: 2.5 },
];

/**
 * Steampunk-only reveal flourish: a one-shot burst of steam wafting up from
 * the reveal card while the reveal sound plays. Purely decorative
 * (pointer-events none, aria-hidden); parent unmounts it after the burst.
 */
export function SteamBurst() {
  return (
    <div
      className="pointer-events-none absolute inset-0 z-[5] overflow-hidden"
      data-testid="steam-burst"
      aria-hidden="true"
    >
      {PUFFS.map((p, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            left: p.left,
            bottom: "6%",
            width: p.size,
            height: p.size,
            background:
              "radial-gradient(circle at 50% 55%, rgba(240,232,216,0.55) 0%, rgba(240,232,216,0.22) 45%, rgba(240,232,216,0) 72%)",
            filter: "blur(7px)",
          }}
          initial={{ y: 50, x: 0, opacity: 0, scale: 0.45 }}
          animate={{ y: -190, x: p.drift, opacity: [0, 0.9, 0], scale: 1.7 }}
          transition={{ delay: p.delay, duration: p.dur, ease: "easeOut" }}
        />
      ))}
    </div>
  );
}
