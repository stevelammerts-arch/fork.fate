import { useEffect } from "react";
import { motion } from "framer-motion";
import { SteamBurst } from "./SteamBurst";
import { ButterflySprite } from "../ThemeScenes";

// Deterministic pseudo-random per particle index so re-renders don't reshuffle.
const rnd = (i, salt) => {
  const x = Math.sin(i * 127.1 + salt * 311.7) * 43758.5453;
  return x - Math.floor(x);
};

// Falling-burst themes with a sting: frosty christmas whoosh for winter's
// snow, an oriental melody for spring's petals (user-uploaded clips).
const FALLING_STINGS = { winter: "/flourish-winter.mp3", spring: "/flourish-spring.mp3" };

/** Falling particles (snow / petals / leaves) drifting down with sway + spin. */
function FallingBurst({ kind, height }) {
  useEffect(() => {
    const src = FALLING_STINGS[kind];
    if (!src) return undefined;
    let sting = null;
    try {
      if (localStorage.getItem("ff_muted") !== "1") {
        sting = new Audio(src);
        sting.volume = 0.6;
      }
    } catch (e) { /* audio */ }
    let started = false;
    const tm = setTimeout(() => { started = true; sting?.play().catch(() => {}); }, 200);
    return () => { clearTimeout(tm); if (!started) sting?.pause(); };
  }, [kind]);
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
  // Happy tropical island sting rides the firefly flourish (user-uploaded clip).
  useEffect(() => {
    let sting = null;
    try {
      if (localStorage.getItem("ff_muted") !== "1") {
        sting = new Audio("/flourish-tiki.mp3");
        sting.volume = 0.55;
      }
    } catch (e) { /* audio */ }
    let started = false;
    const tm = setTimeout(() => { started = true; sting?.play().catch(() => {}); }, 200);
    return () => { clearTimeout(tm); if (!started) sting?.pause(); };
  }, []);
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

/** Reaper: departed souls — translucent HUMAN apparitions (head, shoulders,
 * hanging arms) whose lower body dissolves into vapor tendrils. Soft human
 * faces — mournful, not skulls. A faint wail plays as they drift up. */
/** Reaper: tattered spectral wraiths (AI-generated painterly renders) rise
 * and drift over the card while a deep soul-wail plays out. */
const GHOST_SPRITES = ["/reaper-ghost-1.png", "/reaper-ghost-2.png"];
function GhostRise() {
  // Cleanup only cancels a not-yet-started play — once wailing, the deep
  // triple-moan wail (10.8s, echo tail fading to silence) outlives the
  // flourish and rings out until hushed.
  useEffect(() => {
    const wail = new Audio("/soul-wail.wav");
    wail.volume = 0.8;
    let started = false;
    const tm = setTimeout(() => { started = true; wail.play().catch(() => {}); }, 350);
    return () => { clearTimeout(tm); if (!started) wail.pause(); };
  }, []);
  return Array.from({ length: 3 }, (_, i) => {
    const w = 74 + rnd(i, 1) * 34;
    const sway = 8 + rnd(i, 2) * 12;
    return (
      <motion.div
        key={i}
        className="absolute"
        // Each ghost owns a third of the window and rises on its own beat.
        style={{ left: `${5 + i * 31 + rnd(i, 3) * 6}%`, bottom: -28, width: w, filter: "blur(0.5px) drop-shadow(0 0 16px rgba(190,208,235,0.4))" }}
        initial={{ y: 60, opacity: 0, scaleY: 0.9 }}
        animate={{
          y: -240 - rnd(i, 4) * 70,
          x: [0, sway, -sway * 0.5, sway * 0.3],
          opacity: [0, 0.85, 0.7, 0.78, 0.6, 0],
          scaleY: [0.9, 1, 1.08],
          rotate: [0, rnd(i, 7) > 0.5 ? 2 : -2, 0],
        }}
        transition={{ delay: i * 1.6 + rnd(i, 5) * 0.4, duration: 4.2 + rnd(i, 6) * 0.8, ease: "easeOut" }}
      >
        <img
          src={GHOST_SPRITES[i % GHOST_SPRITES.length]}
          alt=""
          className="w-full select-none object-contain"
          draggable={false}
        />
      </motion.div>
    );
  });
}

/** Cyberpunk: purple Matrix-style digital rain — columns of 1s and 0s falling
 * from the top of the picture, each with a bright glowing lead character. */
function MatrixRain({ height }) {
  // Glitchy machinery sfx as the digital rain kicks in (user-uploaded clip).
  // Cleanup only cancels a not-yet-started play — once playing, the clip is
  // longer than the flourish itself and should finish naturally.
  useEffect(() => {
    const zap = new Audio("/flourish-cyber.mp3?v=3");
    zap.volume = 0.5;
    let started = false;
    const tm = setTimeout(() => { started = true; zap.play().catch(() => {}); }, 250);
    return () => { clearTimeout(tm); if (!started) zap.pause(); };
  }, []);
  const cols = Array.from({ length: 12 }, (_, i) => ({
    left: `${3 + rnd(i, 1) * 90}%`,
    delay: rnd(i, 2) * 1.5,
    dur: 1.9 + rnd(i, 3) * 1.7,
    size: 10 + Math.round(rnd(i, 4) * 5),
    chars: Array.from({ length: 10 + Math.round(rnd(i, 5) * 8) }, (_, j) => (rnd(i * 31 + j, 6) > 0.5 ? "1" : "0")),
  }));
  return cols.map((c, i) => (
    <motion.div
      key={i}
      className="absolute flex flex-col items-center font-mono font-bold"
      style={{
        left: c.left,
        top: 0,
        fontSize: c.size,
        lineHeight: 1.05,
        color: "#B24DE0",
        textShadow: "0 0 8px rgba(178,77,224,0.9)",
      }}
      initial={{ y: -(c.chars.length * c.size * 1.05) - 12, opacity: 0 }}
      animate={{ y: height + 24, opacity: [0, 1, 1, 0] }}
      transition={{ delay: c.delay, duration: c.dur, ease: "linear", times: [0, 0.12, 0.82, 1], repeat: Infinity, repeatDelay: 0.4 + rnd(i, 7) * 1.2 }}
    >
      {c.chars.map((ch, j) => (
        <span
          key={j}
          style={
            j === c.chars.length - 1
              ? { color: "#F3E8FF", textShadow: "0 0 10px #E3B3FF, 0 0 18px rgba(199,125,255,0.8)" }
              : j >= c.chars.length - 3
                ? { color: "#D9A6FF" }
                : undefined
          }
        >
          {ch}
        </span>
      ))}
    </motion.div>
  ));
}

/** Summer: striped beach balls bouncing down across the card. */
function BeachBalls({ height }) {
  return Array.from({ length: 5 }, (_, i) => {
    const s = 24 + rnd(i, 1) * 16;
    const floor = height - s - 8;
    return (
      <motion.div
        key={i}
        className="absolute rounded-full"
        style={{
          left: `${8 + rnd(i, 2) * 76}%`,
          top: 0,
          width: s,
          height: s,
          background: "conic-gradient(#E23B3B 0 60deg, #FFFFFF 60deg 120deg, #2C6FD1 120deg 180deg, #FFFFFF 180deg 240deg, #F2B01F 240deg 300deg, #FFFFFF 300deg 360deg)",
          boxShadow: "inset -4px -6px 10px rgba(0,0,0,0.25), 0 3px 8px rgba(0,0,0,0.3)",
        }}
        initial={{ y: -s - 12, opacity: 0, rotate: 0 }}
        animate={{
          y: [-s - 12, floor, floor * 0.55, floor, floor * 0.8, floor],
          opacity: [0, 1, 1, 1, 1, 0],
          rotate: 220 + rnd(i, 3) * 320,
        }}
        transition={{
          delay: rnd(i, 4) * 1.1,
          duration: 2.7 + rnd(i, 5) * 1.0,
          times: [0, 0.32, 0.52, 0.72, 0.86, 1],
          ease: ["easeIn", "easeOut", "easeIn", "easeOut", "easeIn"],
        }}
      />
    );
  });
}

/** Reaper: phantoms drifting OUTSIDE the photo window — a hooded one hugs
 * the card's right edge while a white sheet ghost rises from bottom-centre
 * and veers up-left, both spilling past the card boundary. Mounted by Home
 * next to the reveal shell (which has no overflow clipping). Self-timed to
 * the ~10.8s wail. */
export function GhostEscort() {
  return (
    <>
      <motion.div
        className="pointer-events-none absolute z-20"
        style={{ right: -26, top: 150, width: 88, filter: "blur(0.4px) drop-shadow(0 0 18px rgba(160,180,215,0.45))" }}
        initial={{ y: 150, opacity: 0 }}
        animate={{
          y: -290,
          x: [0, -14, 8, -10, 0],
          opacity: [0, 0.9, 0.75, 0.85, 0.6, 0],
          rotate: [0, -3, 2, -2, 0],
        }}
        transition={{ delay: 0.9, duration: 7.4, ease: "easeOut" }}
        aria-hidden="true"
        data-testid="ghost-escort"
      >
        <img src="/reaper-ghost-2.png" alt="" className="w-full select-none object-contain" draggable={false} />
      </motion.div>
      {/* white sheet ghost: bottom-centre of the VISIBLE card (the shell is
          ~1300px tall, so anchoring to its true bottom put the whole flight
          below/above the fold — anchor near the photo instead), climbing up
          and to the left past the card edge */}
      <motion.div
        className="pointer-events-none absolute z-20"
        style={{ left: "40%", top: 520, width: 94, filter: "blur(0.4px) drop-shadow(0 0 18px rgba(210,225,250,0.5))" }}
        initial={{ y: 60, opacity: 0 }}
        animate={{
          y: -660,
          x: [0, -30, -70, -120, -170],
          opacity: [0, 0.9, 0.78, 0.85, 0.55, 0],
          rotate: [0, -4, -2, -6, -3],
        }}
        transition={{ delay: 2.4, duration: 7.6, ease: "easeOut" }}
        aria-hidden="true"
        data-testid="ghost-escort-white"
      >
        <img src="/reaper-ghost-1.png" alt="" className="w-full select-none object-contain" draggable={false} />
      </motion.div>
    </>
  );
}

/** Themes that fire a one-shot flourish when the winner card lands / reveals. */
export const FLOURISH_THEMES = new Set(["steam", "light", "winter", "spring", "fall", "tiki", "summer", "fantasy", "dark", "cyber", "fairy"]);

/** Fairy Gully: a burst of butterflies with fluttering wings rises over the
 * card, escorted by glowing will-o'-wisps. */
const FAIRY_FLOURISH_COLORS = [
  ["#F2A0E0", "#C86BD8"], ["#8FD3FF", "#5B9EF0"], ["#FFD36B", "#F0A24E"],
  ["#8FF0B0", "#4ECF8A"], ["#FF9FA8", "#E86B7C"], ["#B7A0FF", "#8A6BE0"],
];
function ButterflyBurst() {
  // Fae giggle as the butterflies take wing (user-uploaded clip).
  useEffect(() => {
    const laugh = new Audio("/fairy-laugh.mp3");
    laugh.volume = 0.5;
    const tm = setTimeout(() => laugh.play().catch(() => {}), 1200);
    return () => { clearTimeout(tm); laugh.pause(); };
  }, []);
  return (
    <>
      {Array.from({ length: 8 }, (_, i) => {
        const [c1, c2] = FAIRY_FLOURISH_COLORS[i % FAIRY_FLOURISH_COLORS.length];
        const flap = 0.24 + rnd(i, 2) * 0.14;
        return (
          <motion.div
            key={`bf-${i}`}
            className="absolute"
            style={{ left: `${6 + rnd(i, 1) * 84}%`, bottom: -14 }}
            initial={{ y: 24, opacity: 0 }}
            animate={{
              y: -(170 + rnd(i, 3) * 150),
              x: [0, (rnd(i, 4) - 0.5) * 90, (rnd(i, 5) - 0.5) * 70],
              opacity: [0, 1, 0.9, 0],
              rotate: [0, rnd(i, 6) > 0.5 ? 16 : -16, 0],
            }}
            transition={{ delay: rnd(i, 7) * 1.3, duration: 3 + rnd(i, 8) * 1.6, ease: "easeOut" }}
          >
            <ButterflySprite size={11 + rnd(i, 9) * 11} c1={c1} c2={c2} flap={flap} />
          </motion.div>
        );
      })}
      {Array.from({ length: 5 }, (_, i) => (
        <motion.span
          key={`wsp-${i}`}
          className="absolute rounded-full"
          style={{
            left: `${12 + rnd(i, 11) * 74}%`, bottom: -10,
            width: 12 + rnd(i, 12) * 12, height: 12 + rnd(i, 12) * 12,
            background: "radial-gradient(circle, rgba(214,255,236,0.95), rgba(94,224,168,0.5) 42%, rgba(64,208,168,0) 72%)",
            filter: "blur(1px)",
          }}
          initial={{ y: 16, opacity: 0 }}
          animate={{ y: -(150 + rnd(i, 13) * 130), x: [0, (rnd(i, 14) - 0.5) * 50, (rnd(i, 15) - 0.5) * 36], opacity: [0, 0.9, 0.5, 0.8, 0] }}
          transition={{ delay: rnd(i, 16) * 1.5, duration: 3.4 + rnd(i, 17) * 1.4, ease: "easeOut" }}
        />
      ))}
    </>
  );
}

/**
 * One-shot themed flourish over the winner card. `variant`:
 *  - "reveal": inside the reveal card's photo header
 *  - "deck": over the landed shuffle-deck card (fantasy, dark and cyber are
 *    skipped there — dragon claw, skeleton hands and neon pulse own that
 *    moment). Parent unmounts after ~4.2s.
 */
export function ThemeFlourish({ theme, variant = "reveal" }) {
  if (!FLOURISH_THEMES.has(theme)) return null;
  if (variant === "deck" && (theme === "fantasy" || theme === "dark" || theme === "cyber" || theme === "fairy")) return null;

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
      ) : theme === "cyber" ? (
        <MatrixRain height={height} />
      ) : theme === "tiki" ? (
        <Fireflies />
      ) : theme === "summer" ? (
        <BeachBalls height={height} />
      ) : theme === "fantasy" ? (
        <FireWall />
      ) : theme === "fairy" ? (
        <ButterflyBurst />
      ) : (
        <FallingBurst kind={theme} height={height} />
      )}
    </div>
  );
}

