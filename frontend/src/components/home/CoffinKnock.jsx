import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useLang } from "../../i18n/i18n";

const KNOCKS_NEEDED = 3;

// Deep hollow knock (respects mute).
function makeKnocker() {
  try {
    if (localStorage.getItem("ff_muted") === "1") return () => {};
    const Ctx = window.AudioContext || window.webkitAudioContext;
    const ctx = new Ctx();
    return () => {
      try {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = "sine";
        o.frequency.setValueAtTime(120, ctx.currentTime);
        o.frequency.exponentialRampToValueAtTime(55, ctx.currentTime + 0.12);
        g.gain.setValueAtTime(0.35, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.16);
        o.connect(g).connect(ctx.destination);
        o.start();
        o.stop(ctx.currentTime + 0.18);
      } catch (e) { /* audio */ }
    };
  } catch (e) {
    return () => {};
  }
}

// Wooden coffin, viewed straight on; the lid is a separate group so it can swing.
function CoffinSvg({ open }) {
  return (
    <svg viewBox="0 0 140 200" className="h-60 w-44 select-none" style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id="coffinWood" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#3A2113" />
          <stop offset="50%" stopColor="#5C3A1E" />
          <stop offset="100%" stopColor="#2A150A" />
        </linearGradient>
      </defs>
      {/* box interior (revealed when lid opens): soul-green glow */}
      <path d="M38 18 L102 18 L122 62 L108 192 L32 192 L18 62 Z" fill="#0B1F14" stroke="#151009" strokeWidth="3" />
      {open && <path d="M38 22 L102 22 L119 62 L106 188 L34 188 L21 62 Z" fill="rgba(88,224,138,0.35)" style={{ filter: "blur(3px)" }} />}
      {/* lid */}
      <motion.g
        style={{ transformOrigin: "20px 100px" }}
        animate={open ? { rotate: -68, x: -26, y: -8 } : { rotate: 0, x: 0, y: 0 }}
        transition={{ duration: 1.1, ease: "easeInOut" }}
      >
        <path d="M38 14 L102 14 L122 58 L108 188 L32 188 L18 58 Z" fill="url(#coffinWood)" stroke="#151009" strokeWidth="3" />
        <path d="M70 44 v64 M50 72 h40" stroke="#C8A96A" strokeWidth="6" strokeLinecap="round" />
        <path d="M26 60 L114 60 M30 130 L110 130" stroke="#151009" strokeWidth="2" opacity="0.5" />
      </motion.g>
    </svg>
  );
}

/** Reaper rare ritual: knock three times on the coffin. It creaks open and
 * the fate rises out in soul-light. */
export function CoffinKnock({ onDone }) {
  const { t } = useLang();
  const [knocks, setKnocks] = useState(0);
  const [open, setOpen] = useState(false);
  const doneRef = useRef(false);
  const knockRef = useRef(null);
  const [shakeKey, setShakeKey] = useState(0);

  const knock = () => {
    if (open) return;
    if (!knockRef.current) knockRef.current = makeKnocker();
    knockRef.current();
    setShakeKey((k) => k + 1);
    const next = knocks + 1;
    setKnocks(next);
    if (next >= KNOCKS_NEEDED) {
      setTimeout(() => {
        setOpen(true);
        const thunder = new Audio("/reveal-thunder-v4.mp3");
        thunder.volume = 0.85;
        if (localStorage.getItem("ff_muted") !== "1") thunder.play().catch(() => {});
        setTimeout(() => { if (!doneRef.current) { doneRef.current = true; onDone?.(); } }, 2200);
      }, 400);
    }
  };

  useEffect(() => () => { doneRef.current = true; }, []);

  return (
    <motion.div
      className="absolute inset-0 z-40 overflow-hidden rounded-2xl"
      style={{ background: "radial-gradient(circle at 50% 80%, #17131D 0%, #070509 75%)" }}
      initial={{ opacity: 0 }}
      animate={{ opacity: open ? [1, 1, 0] : 1 }}
      transition={open ? { duration: 2.2, times: [0, 0.8, 1] } : { duration: 0.4 }}
      data-testid="coffin-cover"
    >
      <div className="pointer-events-none absolute left-1/2 top-3 z-20 -translate-x-1/2 whitespace-nowrap rounded-full bg-black/60 px-4 py-1 font-sans text-[11px] font-bold uppercase tracking-[0.2em] text-[#8FE3A8]" data-testid="rare-fate-badge">
        ✦ {t("Rare fate")} ✦
      </div>

      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 pt-4">
        <motion.div
          key={shakeKey}
          animate={open ? {} : { x: [0, -5, 5, -3, 3, 0], rotate: [0, -1, 1, 0] }}
          transition={{ duration: 0.3 }}
          onClick={knock}
          className="relative cursor-pointer touch-none"
          data-testid="coffin-lid"
          role="button"
          aria-label={t("Knock on the coffin")}
        >
          <CoffinSvg open={open} />
          {/* soul wisps drifting out once open */}
          {open && [0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="pointer-events-none absolute left-1/2 top-[35%] rounded-full"
              style={{ width: 16 + i * 8, height: 16 + i * 8, background: "radial-gradient(circle, rgba(143,227,168,0.85), rgba(143,227,168,0) 70%)", filter: "blur(2px)" }}
              initial={{ x: 0, y: 0, opacity: 0 }}
              animate={{ x: (i - 1) * 44, y: -120 - i * 26, opacity: [0, 0.95, 0] }}
              transition={{ delay: 0.7 + i * 0.25, duration: 1.6, ease: "easeOut" }}
            />
          ))}
        </motion.div>

        {!open ? (
          <>
            <p className="font-serif text-lg italic text-[#D8CBEF]" data-testid="coffin-prompt">{t("Knock three times...")}</p>
            <div className="flex gap-1.5" data-testid="coffin-knock-dots">
              {Array.from({ length: KNOCKS_NEEDED }, (_, i) => (
                <span key={i} className={`h-2.5 w-2.5 rounded-full transition-colors ${i < knocks ? "bg-[#8FE3A8]" : "bg-white/20"}`} />
              ))}
            </div>
          </>
        ) : (
          <p className="font-serif text-lg font-bold uppercase tracking-[0.15em] text-[#8FE3A8]" data-testid="coffin-done">{t("The Reaper answers...")}</p>
        )}
      </div>
    </motion.div>
  );
}
