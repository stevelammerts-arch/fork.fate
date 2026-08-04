import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useLang } from "../../i18n/i18n";

// Soft card-whoosh per pick (respects mute).
function whoosh() {
  try {
    if (localStorage.getItem("ff_muted") === "1") return;
    const Ctx = window.AudioContext || window.webkitAudioContext;
    const ctx = new Ctx();
    const len = Math.floor(ctx.sampleRate * 0.22);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * Math.sin((i / len) * Math.PI);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 900;
    const g = ctx.createGain();
    g.gain.value = 0.25;
    src.connect(lp).connect(g).connect(ctx.destination);
    src.start();
  } catch (e) { /* audio */ }
}

// Ornate card back: double border, moon and skull.
function CardBack() {
  return (
    <svg viewBox="0 0 80 120" className="h-full w-full">
      <rect x="2" y="2" width="76" height="116" rx="8" fill="#151020" stroke="#6D5B8E" strokeWidth="2.5" />
      <rect x="8" y="8" width="64" height="104" rx="5" fill="none" stroke="#463763" strokeWidth="1.5" />
      <circle cx="40" cy="44" r="16" fill="none" stroke="#6D5B8E" strokeWidth="2" />
      <path d="M46 36 a12 12 0 1 0 2 16 a9 9 0 1 1 -2 -16" fill="#B9A5E3" />
      <g transform="translate(40 84)">
        <circle r="9" fill="#B9A5E3" />
        <circle cx="-3.4" cy="-1" r="2.4" fill="#151020" />
        <circle cx="3.4" cy="-1" r="2.4" fill="#151020" />
        <rect x="-4" y="5" width="8" height="4" rx="1.5" fill="#B9A5E3" />
      </g>
    </svg>
  );
}

// The revealed arcana: THE FEAST — skull over crossed fork and scythe.
function CardFace() {
  return (
    <svg viewBox="0 0 80 120" className="h-full w-full">
      <rect x="2" y="2" width="76" height="116" rx="8" fill="#1D1428" stroke="#E01E26" strokeWidth="2.5" />
      <rect x="8" y="8" width="64" height="104" rx="5" fill="none" stroke="#8E2B4B" strokeWidth="1.5" />
      <text x="40" y="22" textAnchor="middle" fill="#EAD9B0" fontSize="9" fontFamily="serif" letterSpacing="2">XIII</text>
      <g transform="translate(40 56)">
        <circle r="14" fill="#EAD9B0" />
        <circle cx="-5" cy="-2" r="3.6" fill="#1D1428" />
        <circle cx="5" cy="-2" r="3.6" fill="#1D1428" />
        <path d="M-4 8 h8" stroke="#1D1428" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M-20 18 L20 -14 M-20 -14 q6 -8 16 -6 l-12 12 M20 18 l-8 -7" stroke="#EAD9B0" strokeWidth="3" strokeLinecap="round" fill="none" />
      </g>
      <text x="40" y="102" textAnchor="middle" fill="#E01E26" fontSize="10" fontFamily="serif" letterSpacing="1.5">THE FEAST</text>
    </svg>
  );
}

/** Reaper rare ritual: three tarot cards fan out face-down — draw one and it
 * flips to THE FEAST, revealing the fate. (Every card holds the same fate;
 * the Reaper always deals what he intends.) */
export function TarotDraw({ onDone }) {
  const { t } = useLang();
  const [picked, setPicked] = useState(null); // index of drawn card
  const [flipped, setFlipped] = useState(false);
  const doneRef = useRef(false);

  const draw = (i) => {
    if (picked != null) return;
    whoosh();
    setPicked(i);
    setTimeout(() => {
      setFlipped(true);
      const thunder = new Audio("/reveal-thunder-v4.mp3");
      thunder.volume = 0.85;
      if (localStorage.getItem("ff_muted") !== "1") thunder.play().catch(() => {});
      setTimeout(() => { if (!doneRef.current) { doneRef.current = true; onDone?.(); } }, 1900);
    }, 550);
  };

  // Reset on (re)mount so StrictMode's simulated unmount can't poison the
  // guard; a real unmount still cancels the pending onDone.
  useEffect(() => { doneRef.current = false; return () => { doneRef.current = true; }; }, []);

  return (
    <motion.div
      className="absolute inset-0 z-40 overflow-hidden rounded-2xl"
      style={{ background: "radial-gradient(circle at 50% 25%, #201736 0%, #0A0712 78%)" }}
      initial={{ opacity: 0 }}
      animate={{ opacity: flipped ? [1, 1, 0] : 1 }}
      transition={flipped ? { duration: 1.9, times: [0, 0.78, 1] } : { duration: 0.4 }}
      data-testid="tarot-cover"
    >
      <div className="pointer-events-none absolute left-1/2 top-3 z-20 -translate-x-1/2 whitespace-nowrap rounded-full bg-black/60 px-4 py-1 font-sans text-[11px] font-bold uppercase tracking-[0.2em] text-[#B9A5E3]" data-testid="rare-fate-badge">
        ✦ {t("Rare fate")} ✦
      </div>

      <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 pt-4">
        <div className="flex items-center justify-center" style={{ perspective: 900 }}>
          {[0, 1, 2].map((i) => {
            const isPicked = picked === i;
            const fanRot = (i - 1) * 12;
            return (
              <motion.button
                key={i}
                type="button"
                onClick={() => draw(i)}
                data-testid={`tarot-card-${i}`}
                aria-label={t("Draw a card")}
                className="relative -mx-3 h-40 w-[6.7rem] cursor-pointer"
                style={{ transformStyle: "preserve-3d", zIndex: isPicked ? 5 : 1 }}
                initial={{ rotate: fanRot, y: Math.abs(i - 1) * 10 }}
                animate={
                  picked == null
                    ? { rotate: fanRot, y: Math.abs(i - 1) * 10 }
                    : isPicked
                      ? { rotate: 0, y: -8, x: (1 - i) * 78, scale: 1.28, rotateY: flipped ? 180 : 0 }
                      : { opacity: 0, y: 40, rotate: fanRot }
                }
                transition={{ duration: 0.55, ease: "easeInOut" }}
                whileHover={picked == null ? { y: -8 } : undefined}
              >
                <div className="absolute inset-0" style={{ backfaceVisibility: "hidden" }}><CardBack /></div>
                <div className="absolute inset-0" style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }} data-testid={isPicked ? "tarot-card-face" : undefined}><CardFace /></div>
              </motion.button>
            );
          })}
        </div>
        <p className="font-serif text-lg italic text-[#CBB9EE]" data-testid="tarot-prompt">
          {flipped ? t("The Feast. Your table is set.") : picked != null ? t("The Reaper turns your card...") : t("Draw a card — the Reaper insists")}
        </p>
      </div>
    </motion.div>
  );
}
