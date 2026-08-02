import { motion } from "framer-motion";
import { SteamBurst } from "./SteamBurst";

// Deterministic pseudo-random per particle index so re-renders don't reshuffle.
const rnd = (i, salt) => {
  const x = Math.sin(i * 127.1 + salt * 311.7) * 43758.5453;
  return x - Math.floor(x);
};

/** Falling particles (snow / petals / leaves) drifting down with sway + spin. */
function FallingBurst({ kind, height }) {
  const styleFor = (i) => {
    const r = rnd(i, 9);
    if (kind === "winter") {
      const s = 4 + r * 6;
      return { width: s, height: s, borderRadius: "50%", background: "rgba(255,255,255,0.95)", boxShadow: "0 0 6px rgba(255,255,255,0.8)", filter: "blur(0.4px)" };
    }
    if (kind === "spring") {
      const petals = ["#F2A9C4", "#E87BA8", "#F7C9DC"];
      return { width: 10 + r * 6, height: 7 + r * 4, borderRadius: "70% 30% 65% 35%", background: petals[i % petals.length], boxShadow: "0 1px 3px rgba(0,0,0,0.2)" };
    }
    // fall leaves
    const leaves = ["#D97A2B", "#B5541C", "#C9A227", "#A33B12"];
    return { width: 11 + r * 7, height: 8 + r * 5, borderRadius: "72% 28% 68% 32%", background: leaves[i % leaves.length], boxShadow: "0 1px 3px rgba(0,0,0,0.25)" };
  };
  return Array.from({ length: 14 }, (_, i) => {
    const sway = 8 + rnd(i, 4) * 16;
    return (
      <motion.div
        key={i}
        className="absolute"
        style={{ left: `${4 + rnd(i, 1) * 92}%`, top: -14, ...styleFor(i) }}
        initial={{ y: -10, opacity: 0, rotate: 0 }}
        animate={{
          y: height,
          x: [0, sway, -sway * 0.6, sway * 0.5, 0],
          opacity: [0, 1, 1, 0.9, 0],
          rotate: kind === "winter" ? 0 : (rnd(i, 5) - 0.5) * 560,
        }}
        transition={{ delay: rnd(i, 2) * 1.4, duration: 2.4 + rnd(i, 3) * 1.5, ease: "easeIn" }}
      />
    );
  });
}

/** Tiki: warm fireflies blinking and drifting over the card. */
function Fireflies() {
  return Array.from({ length: 11 }, (_, i) => {
    const s = 4 + rnd(i, 1) * 3;
    return (
      <motion.div
        key={i}
        className="absolute rounded-full"
        style={{
          left: `${8 + rnd(i, 2) * 84}%`,
          top: `${10 + rnd(i, 3) * 75}%`,
          width: s,
          height: s,
          background: "#FFD27A",
          boxShadow: "0 0 10px 3px rgba(255,190,80,0.85)",
        }}
        initial={{ opacity: 0, scale: 0.4 }}
        animate={{
          opacity: [0, 1, 0.25, 1, 0.4, 0.9, 0],
          scale: [0.4, 1, 0.7, 1.1, 0.8, 1, 0.5],
          x: [0, (rnd(i, 4) - 0.5) * 46, (rnd(i, 5) - 0.5) * 34],
          y: [0, (rnd(i, 6) - 0.5) * 40, -14 - rnd(i, 7) * 22],
        }}
        transition={{ delay: rnd(i, 8) * 1.1, duration: 3.0 + rnd(i, 9) * 1.2, ease: "easeInOut" }}
      />
    );
  });
}

/** Summer: golden sun glints twinkling across the card. */
function SunSparkles() {
  return Array.from({ length: 15 }, (_, i) => {
    const s = 5 + rnd(i, 1) * 6;
    return (
      <motion.div
        key={i}
        className="absolute rounded-full"
        style={{
          left: `${6 + rnd(i, 2) * 88}%`,
          top: `${8 + rnd(i, 3) * 80}%`,
          width: s,
          height: s,
          background: "radial-gradient(circle, #FFF6D8 0%, #FFD27A 45%, rgba(255,180,60,0) 75%)",
          boxShadow: "0 0 12px 4px rgba(255,205,110,0.7)",
        }}
        initial={{ opacity: 0, scale: 0.2, rotate: 0 }}
        animate={{ opacity: [0, 1, 0.3, 1, 0], scale: [0.2, 1.2, 0.6, 1.1, 0.3], rotate: 90 }}
        transition={{ delay: rnd(i, 4) * 1.6, duration: 2.2 + rnd(i, 5) * 1.4, ease: "easeInOut" }}
      />
    );
  });
}

/** Dragon's Hoard: a realistic wall of fire that roars up, flickers and dissipates. */
function FireWall() {
  const flames = Array.from({ length: 12 }, (_, i) => ({
    left: `${i * 8.2 + rnd(i, 1) * 4 - 2}%`,
    w: 32 + rnd(i, 2) * 30,
    h: 84 + rnd(i, 3) * 72,
    delay: rnd(i, 4) * 0.45,
    dur: 3.1 + rnd(i, 5) * 0.7,
  }));
  return (
    <>
      {/* Base heat glow along the card floor */}
      <motion.div
        className="absolute inset-x-0 bottom-0 h-24"
        style={{ background: "linear-gradient(to top, rgba(224,86,30,0.8), rgba(224,30,38,0.3) 55%, transparent)", filter: "blur(7px)", mixBlendMode: "screen" }}
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 0.9, 0] }}
        transition={{ duration: 3.7, times: [0, 0.14, 0.55, 1], ease: "easeInOut" }}
      />
      {/* Flame tongues: rise, flicker, then thin out and vanish */}
      {flames.map((f, i) => (
        <motion.div
          key={i}
          className="absolute"
          style={{
            left: f.left,
            bottom: -10,
            width: f.w,
            height: f.h,
            transformOrigin: "50% 100%",
            background: "radial-gradient(50% 68% at 50% 86%, #FFE9A8 0%, #FFB84D 26%, #F0741F 52%, rgba(224,30,38,0.6) 74%, rgba(224,30,38,0) 92%)",
            borderRadius: "50% 50% 44% 44% / 74% 74% 28% 28%",
            filter: "blur(3px)",
            mixBlendMode: "screen",
          }}
          initial={{ opacity: 0, scaleY: 0.25, scaleX: 1 }}
          animate={{
            opacity: [0, 0.95, 0.85, 0.9, 0],
            scaleY: [0.3, 1, 0.72, 1.12, 0.15],
            scaleX: [1, 0.92, 1.06, 0.9, 0.6],
            y: [0, -4, 0, -10, -20],
          }}
          transition={{ delay: f.delay, duration: f.dur, times: [0, 0.2, 0.45, 0.7, 1], ease: "easeInOut" }}
        />
      ))}
      {/* Embers sparking upward as the wall breaks apart */}
      {Array.from({ length: 22 }, (_, i) => {
        const s = 3 + rnd(i, 6) * 4;
        return (
          <motion.div
            key={`e${i}`}
            className="absolute rounded-full"
            style={{
              left: `${5 + rnd(i, 7) * 90}%`,
              bottom: 4,
              width: s,
              height: s,
              background: "#FFC062",
              boxShadow: "0 0 10px 3px rgba(255,140,40,0.95)",
            }}
            initial={{ y: 0, opacity: 0 }}
            animate={{ y: -140 - rnd(i, 8) * 130, x: (rnd(i, 9) - 0.5) * 60, opacity: [0, 1, 0.85, 0] }}
            transition={{ delay: 0.4 + rnd(i, 10) * 1.6, duration: 1.9 + rnd(i, 11) * 1.4, ease: "easeOut" }}
          />
        );
      })}
    </>
  );
}

/** Coffee Shop: a latte poured in — cup of crema with a cream heart drawn in. */
function LatteArt({ compact = false }) {
  const size = compact ? 76 : 116;
  return (
    <motion.div
      className="absolute left-1/2"
      style={compact ? { bottom: 0, marginLeft: -size / 2 } : { top: "50%", marginLeft: -size / 2, marginTop: -size / 2 }}
      initial={{ opacity: 0, scale: 0.55, rotate: -6 }}
      animate={{ opacity: [0, 1, 1, 0], scale: [0.55, 1.06, 1, 0.97], rotate: [-6, 2, 0, 0] }}
      transition={{ duration: 3.8, times: [0, 0.16, 0.75, 1], ease: "easeInOut" }}
    >
      <div
        className="relative rounded-full"
        style={{
          width: size,
          height: size,
          background: "radial-gradient(circle at 42% 36%, #C58A4A 0%, #A96F35 45%, #7A4B20 100%)",
          boxShadow: "0 0 0 5px #F5EFE2, 0 0 0 7px #D9CDB8, 0 8px 18px rgba(0,0,0,0.4)",
        }}
      >
        <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full">
          {/* Cream swirl ring */}
          <motion.circle
            cx="50" cy="50" r="34" fill="none" stroke="rgba(247,238,221,0.5)" strokeWidth="3.5"
            strokeDasharray="30 18" strokeLinecap="round"
            initial={{ opacity: 0, rotate: 0 }}
            animate={{ opacity: [0, 0.8, 0.5], rotate: 60 }}
            style={{ transformOrigin: "50% 50%" }}
            transition={{ delay: 0.3, duration: 2.6, ease: "easeOut" }}
          />
          {/* The heart pours itself in, then fills */}
          <motion.path
            d="M50 76 C 24 57, 31 30, 50 43 C 69 30, 76 57, 50 76 Z"
            fill="none" stroke="#F7EEDD" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ delay: 0.45, duration: 1.3, ease: "easeInOut" }}
          />
          <motion.path
            d="M50 76 C 24 57, 31 30, 50 43 C 69 30, 76 57, 50 76 Z"
            fill="#F7EEDD" stroke="none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.9 }}
            transition={{ delay: 1.6, duration: 0.6, ease: "easeIn" }}
          />
        </svg>
      </div>
    </motion.div>
  );
}

/** Reaper: ghostly apparitions with faint skull faces ascending off the card. */
function GhostRise() {
  return Array.from({ length: 6 }, (_, i) => {
    const w = 34 + rnd(i, 1) * 26;
    const sway = 10 + rnd(i, 2) * 16;
    return (
      <motion.div
        key={i}
        className="absolute"
        style={{ left: `${6 + rnd(i, 3) * 76}%`, bottom: -10, width: w, height: w * 1.3, filter: "blur(1.2px)" }}
        initial={{ y: 30, opacity: 0, scale: 0.6 }}
        animate={{
          y: -230 - rnd(i, 4) * 60,
          x: [0, sway, -sway * 0.7, sway * 0.5],
          opacity: [0, 0.75, 0.55, 0],
          scale: [0.6, 1, 1.15],
        }}
        transition={{ delay: rnd(i, 5) * 1.3, duration: 2.8 + rnd(i, 6) * 1.2, ease: "easeOut" }}
      >
        <svg viewBox="0 0 40 52" className="h-full w-full">
          {/* Wispy hooded spirit: dome head, trailing tattered hem */}
          <path
            d="M20 2 C 8 2, 4 14, 4 24 L 4 42 Q 7 38 10 43 Q 13 48 16 43 Q 19 38 22 44 Q 25 49 28 43 Q 31 38 36 42 L 36 24 C 36 14, 32 2, 20 2 Z"
            fill="rgba(215,225,238,0.42)"
          />
          {/* Faint skull face */}
          <ellipse cx="14.5" cy="20" rx="3.4" ry="4.4" fill="rgba(10,10,14,0.55)" />
          <ellipse cx="25.5" cy="20" rx="3.4" ry="4.4" fill="rgba(10,10,14,0.55)" />
          <path d="M20 26 L 17.5 31 L 22.5 31 Z" fill="rgba(10,10,14,0.4)" />
        </svg>
      </motion.div>
    );
  });
}

/** Themes that fire a one-shot flourish when the winner card lands / reveals. */
export const FLOURISH_THEMES = new Set(["steam", "light", "winter", "spring", "fall", "tiki", "summer", "fantasy", "dark"]);

/**
 * One-shot themed flourish over the winner card. `variant`:
 *  - "reveal": inside the reveal card's photo header
 *  - "deck": over the landed shuffle-deck card (fantasy + dark are skipped
 *    there — the dragon claw and skeleton hands already own that moment)
 * Cyberpunk keeps its bespoke neon pulse and has no reveal flourish.
 * Parent unmounts after ~4.2s.
 */
export function ThemeFlourish({ theme, variant = "reveal" }) {
  if (!FLOURISH_THEMES.has(theme)) return null;
  if (variant === "deck" && (theme === "fantasy" || theme === "dark")) return null;

  if (theme === "steam") {
    if (variant === "deck") {
      return (
        <div className="pointer-events-none absolute -top-28 left-[-30px] right-[-30px] z-40 h-36" data-testid="deck-flourish" data-flourish={theme} aria-hidden="true">
          <SteamBurst startBottom="-10%" travel={-120} className="absolute inset-0 overflow-visible" />
        </div>
      );
    }
    return <SteamBurst />;
  }

  const wrapCls = variant === "deck"
    ? "pointer-events-none absolute left-[-26px] right-[-26px] -top-10 bottom-0 z-40 overflow-hidden"
    : "pointer-events-none absolute inset-0 z-[5] overflow-hidden";
  const height = variant === "deck" ? 350 : 300;
  return (
    <div className={wrapCls} data-testid={variant === "deck" ? "deck-flourish" : "theme-flourish"} data-flourish={theme} aria-hidden="true">
      {theme === "light" ? (
        <LatteArt compact={variant === "deck"} />
      ) : theme === "dark" ? (
        <GhostRise />
      ) : theme === "tiki" ? (
        <Fireflies />
      ) : theme === "summer" ? (
        <SunSparkles />
      ) : theme === "fantasy" ? (
        <FireWall />
      ) : (
        <FallingBurst kind={theme} height={height} />
      )}
    </div>
  );
}
