import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useLang } from "../../i18n/i18n";

// Total stirring needed: 3 full circles around the cup.
const STIR_TARGET = Math.PI * 6;
// Crema circle within /latte-cup.png (fractions of the rendered image box).
const CREMA = { cx: 0.473, cy: 0.452, d: 0.546 };

/** Cafe rare ritual: a realistic latte with the FF crest drawn in the cream.
 * Stir in circles (drag around the cup, or tap for little swirls) — the
 * crest dissolves into the crema and the fate is served with a bell. */
export function LatteStir({ onDone }) {
  const { t } = useLang();
  const cupRef = useRef(null);
  const lastAngle = useRef(null);
  const movedRef = useRef(0);
  const doneRef = useRef(false);
  const [stirred, setStirred] = useState(0); // accumulated radians
  const [brewed, setBrewed] = useState(false);

  const progress = Math.min(1, stirred / STIR_TARGET);

  const finish = () => {
    setBrewed(true);
    const bell = new Audio("/barista-bell.mp3");
    bell.volume = 0.8;
    if (localStorage.getItem("ff_muted") !== "1") bell.play().catch(() => {});
    setTimeout(() => { if (!doneRef.current) { doneRef.current = true; onDone?.(); } }, 2000);
  };

  const addStir = (delta) => {
    if (brewed) return;
    setStirred((s) => {
      const next = s + delta;
      if (s < STIR_TARGET && next >= STIR_TARGET) setTimeout(finish, 250);
      return next;
    });
  };

  const angleAt = (e) => {
    const r = cupRef.current.getBoundingClientRect();
    return Math.atan2(e.clientY - (r.y + r.height * CREMA.cy), e.clientX - (r.x + r.width * CREMA.cx));
  };

  const onPointerDown = (e) => {
    e.currentTarget.setPointerCapture?.(e.pointerId);
    lastAngle.current = angleAt(e);
    movedRef.current = 0;
  };
  const onPointerMove = (e) => {
    if (lastAngle.current == null) return;
    const a = angleAt(e);
    let d = a - lastAngle.current;
    if (d > Math.PI) d -= Math.PI * 2;
    if (d < -Math.PI) d += Math.PI * 2;
    lastAngle.current = a;
    movedRef.current += Math.abs(d);
    addStir(Math.abs(d));
  };
  const onPointerUp = () => {
    // A plain tap (no real dragging) still gives a small courtesy swirl.
    if (movedRef.current < 0.35) addStir(Math.PI * 0.5);
    lastAngle.current = null;
  };

  useEffect(() => { doneRef.current = false; return () => { doneRef.current = true; }; }, []);

  const spin = (stirred * 180) / Math.PI; // crest rotates with the stirring
  const dissolve = Math.pow(progress, 1.15);

  return (
    <motion.div
      className="absolute inset-0 z-40 overflow-hidden rounded-2xl"
      style={{ background: "radial-gradient(circle at 50% 22%, #6B4A2E 0%, #2C1A0E 76%)" }}
      initial={{ opacity: 0 }}
      animate={{ opacity: brewed ? [1, 1, 0] : 1 }}
      transition={brewed ? { duration: 2, times: [0, 0.8, 1] } : { duration: 0.4 }}
      data-testid="latte-cover"
    >
      <div className="pointer-events-none absolute left-1/2 top-3 z-20 -translate-x-1/2 whitespace-nowrap rounded-full bg-black/60 px-4 py-1 font-sans text-[11px] font-bold uppercase tracking-[0.2em] text-[#F0D9B8]" data-testid="rare-fate-badge">
        ✦ {t("Rare fate")} ✦
      </div>

      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 pt-4">
        <div
          ref={cupRef}
          className="relative cursor-pointer touch-none select-none"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          data-testid="latte-cup"
          role="button"
          aria-label={t("Stir the latte")}
        >
          <img src="/latte-cup.png" alt="" className="h-64 w-auto object-contain" style={{ filter: "drop-shadow(0 10px 18px rgba(0,0,0,0.5))" }} draggable={false} />
          {/* the FF crest drawn in cream microfoam — dissolves as you stir */}
          <div
            className="pointer-events-none absolute"
            style={{
              left: `${CREMA.cx * 100}%`, top: `${CREMA.cy * 100}%`,
              width: `${CREMA.d * 88}%`, aspectRatio: "1",
              transform: `translate(-50%, -50%) rotate(${spin}deg)`,
              backgroundColor: "#F4E4C6",
              WebkitMaskImage: "url(/latte-crest-mask.png)", maskImage: "url(/latte-crest-mask.png)",
              WebkitMaskSize: "contain", maskSize: "contain",
              WebkitMaskRepeat: "no-repeat", maskRepeat: "no-repeat",
              WebkitMaskPosition: "center", maskPosition: "center",
              opacity: 0.92 * (1 - dissolve),
              filter: `blur(${dissolve * 7}px)`,
            }}
            data-testid="latte-crest"
          />
          {/* swirl streaks that build up as the cream blends in */}
          <div
            className="pointer-events-none absolute rounded-full mix-blend-soft-light"
            style={{
              left: `${CREMA.cx * 100}%`, top: `${CREMA.cy * 100}%`,
              width: `${CREMA.d * 96}%`, aspectRatio: "1",
              transform: `translate(-50%, -50%) rotate(${spin * 0.7}deg)`,
              background: "conic-gradient(from 0deg, transparent 0deg, rgba(255,240,214,0.85) 40deg, transparent 90deg, rgba(120,70,30,0.7) 150deg, transparent 200deg, rgba(255,240,214,0.7) 260deg, transparent 320deg)",
              opacity: dissolve * 0.5,
              filter: "blur(3px)",
            }}
          />
        </div>

        {!brewed ? (
          <>
            <p className="font-serif text-lg italic text-[#F5E7CD]" data-testid="latte-prompt">{t("Stir the cream away…")}</p>
            <div className="flex gap-1.5" data-testid="latte-dots">
              {Array.from({ length: 5 }, (_, i) => (
                <span key={i} className={`h-2.5 w-2.5 rounded-full transition-colors ${progress * 5 > i ? "bg-[#E8B471]" : "bg-white/20"}`} />
              ))}
            </div>
          </>
        ) : (
          <p className="px-6 text-center font-serif text-lg font-bold uppercase tracking-[0.15em] text-[#F0D9B8]" data-testid="latte-done">{t("Your fate, freshly brewed!")}</p>
        )}
      </div>
    </motion.div>
  );
}
