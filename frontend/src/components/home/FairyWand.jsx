import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useLang } from "../../i18n/i18n";

// Deterministic sparkle burst: direction, distance, size, color, delay.
const SPARK_COLORS = ["#FFE9A0", "#8FF0B0", "#8FD3FF", "#F2A0E0", "#FFFFFF", "#FFD36B"];
const SPARKS = Array.from({ length: 26 }, (_, i) => {
  const a = (i / 26) * Math.PI * 2 + (i % 3) * 0.21;
  const d = 90 + ((i * 53) % 110);
  return {
    x: Math.cos(a) * d,
    y: Math.sin(a) * d - 30,
    s: 6 + ((i * 29) % 12),
    c: SPARK_COLORS[i % SPARK_COLORS.length],
    delay: (i % 7) * 0.05,
  };
});

function Star({ size, color }) {
  return (
    <svg viewBox="0 0 12 12" width={size} height={size} style={{ filter: `drop-shadow(0 0 4px ${color})` }}>
      <path d="M6 0 L7.4 4.6 L12 6 L7.4 7.4 L6 12 L4.6 7.4 L0 6 L4.6 4.6 Z" fill={color} />
    </svg>
  );
}

/** Fairy Gully rare ritual: a magic wand hides the fate — tap it, it flicks a
 * burst of sparkles, and the winning place is revealed. */
export function FairyWand({ onDone }) {
  const { t } = useLang();
  const [casting, setCasting] = useState(false);
  const doneRef = useRef(false);

  const cast = () => {
    if (casting) return;
    setCasting(true);
    const chime = new Audio("/reveal-fairy.wav");
    chime.volume = 0.75;
    chime.play().catch(() => {});
    setTimeout(() => {
      if (!doneRef.current) { doneRef.current = true; onDone?.(); }
    }, 2000);
  };
  useEffect(() => () => { doneRef.current = true; }, []);

  return (
    <motion.div
      className="absolute inset-0 z-40 grid place-items-center overflow-hidden rounded-2xl"
      style={{ background: "radial-gradient(circle at 50% 38%, #1E5C38 0%, #0C2417 72%)" }}
      initial={{ opacity: 0 }}
      animate={{ opacity: casting ? [1, 1, 0] : 1 }}
      transition={casting ? { duration: 2, times: [0, 0.8, 1] } : { duration: 0.4 }}
      data-testid="fairy-wand-cover"
    >
      <div className="pointer-events-none absolute left-1/2 top-4 z-20 -translate-x-1/2 whitespace-nowrap rounded-full bg-black/60 px-4 py-1.5 font-sans text-xs font-bold uppercase tracking-[0.2em] text-[#5EE0A8]" data-testid="rare-fate-badge">
        ✦ {t("Rare fate")} ✦
      </div>
      <div className="relative flex flex-col items-center gap-5">
        <button type="button" onClick={cast} className="relative outline-none" data-testid="fairy-wand" aria-label={t("Tap the wand")}>
          <motion.svg
            viewBox="0 0 120 120"
            className="h-36 w-36"
            style={{ transformOrigin: "22% 82%" }}
            animate={casting ? { rotate: [0, -38, 24, -12, 0] } : { rotate: [0, -5, 5, 0] }}
            transition={casting ? { duration: 0.9, ease: "easeInOut" } : { duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
          >
            {/* Wand shaft */}
            <line x1="26" y1="98" x2="86" y2="34" stroke="#8A5A2B" strokeWidth="7" strokeLinecap="round" />
            <line x1="26" y1="98" x2="86" y2="34" stroke="#C98F4E" strokeWidth="3" strokeLinecap="round" />
            {/* Star tip */}
            <g style={{ filter: "drop-shadow(0 0 8px #FFE9A0)" }}>
              <path d="M92 8 L96.5 22.5 L111 27 L96.5 31.5 L92 46 L87.5 31.5 L73 27 L87.5 22.5 Z" fill="#FFE9A0" />
              <circle cx="92" cy="27" r="4" fill="#FFFFFF" />
            </g>
          </motion.svg>
          {/* Idle twinkle so the wand invites the tap */}
          {!casting && (
            <motion.span className="absolute right-2 top-2" animate={{ opacity: [0.2, 1, 0.2], scale: [0.7, 1.15, 0.7] }} transition={{ duration: 1.6, repeat: Infinity }}>
              <Star size={14} color="#FFFFFF" />
            </motion.span>
          )}
        </button>
        {!casting && (
          <p className="font-serif text-lg italic text-[#CFF5DC]" data-testid="fairy-wand-prompt">{t("Tap the wand")}</p>
        )}
      </div>
      {/* Sparkle burst from the wand tip */}
      {casting && SPARKS.map((sp, i) => (
        <motion.span
          key={i}
          className="pointer-events-none absolute left-1/2 top-[42%]"
          initial={{ x: 20, y: -30, opacity: 0, scale: 0.3 }}
          animate={{ x: sp.x, y: sp.y, opacity: [0, 1, 0.9, 0], scale: [0.3, 1.15, 0.6], rotate: 200 }}
          transition={{ delay: 0.35 + sp.delay, duration: 1.35, ease: "easeOut" }}
        >
          <Star size={sp.s} color={sp.c} />
        </motion.span>
      ))}
    </motion.div>
  );
}
