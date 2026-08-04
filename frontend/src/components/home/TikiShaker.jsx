import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useLang } from "../../i18n/i18n";

const SHAKES_NEEDED = 6;

// Maraca-style rattle per shake: a short burst of filtered noise (respects mute).
function makeRattler() {
  try {
    if (localStorage.getItem("ff_muted") === "1") return () => {};
    const Ctx = window.AudioContext || window.webkitAudioContext;
    const ctx = new Ctx();
    return () => {
      try {
        const len = Math.floor(ctx.sampleRate * 0.09);
        const buf = ctx.createBuffer(1, len, ctx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
        const src = ctx.createBufferSource();
        src.buffer = buf;
        const bp = ctx.createBiquadFilter();
        bp.type = "bandpass";
        bp.frequency.value = 3200;
        const g = ctx.createGain();
        g.gain.value = 0.16;
        src.connect(bp).connect(g).connect(ctx.destination);
        src.start();
      } catch (e) { /* audio */ }
    };
  } catch (e) {
    return () => {};
  }
}

// Realistic carved tiki cocktail mug (AI-generated 3D render); parent animates it.
function TikiMug() {
  return (
    <img
      src="/tiki-mug.png"
      alt=""
      className="h-56 w-auto select-none object-contain"
      style={{ filter: "drop-shadow(0 10px 18px rgba(0,0,0,0.55))" }}
      draggable={false}
    />
  );
}

/** Tiki Lounge rare ritual: shake the carved tiki cocktail. Each tap rattles
 * the mug harder; after enough shakes it tips over and the fate pours out
 * with the island drums. */
export function TikiShaker({ onDone }) {
  const { t } = useLang();
  const [shakes, setShakes] = useState(0);
  const [pouring, setPouring] = useState(false);
  const doneRef = useRef(false);
  const rattleRef = useRef(null);
  const [wobbleKey, setWobbleKey] = useState(0);

  const shake = () => {
    if (pouring) return;
    if (!rattleRef.current) rattleRef.current = makeRattler();
    rattleRef.current();
    setWobbleKey((k) => k + 1);
    const next = shakes + 1;
    setShakes(next);
    if (next >= SHAKES_NEEDED) {
      setTimeout(() => {
        setPouring(true);
        const drums = new Audio("/reveal-drums-boom.wav");
        drums.volume = 0.9;
        if (localStorage.getItem("ff_muted") !== "1") drums.play().catch(() => {});
        setTimeout(() => { if (!doneRef.current) { doneRef.current = true; onDone?.(); } }, 2000);
      }, 350);
    }
  };

  useEffect(() => () => { doneRef.current = true; }, []);

  const intensity = 4 + shakes * 2.5; // wobble grows with every shake

  return (
    <motion.div
      className="absolute inset-0 z-40 overflow-hidden rounded-2xl"
      style={{ background: "radial-gradient(circle at 50% 25%, #0E4A44 0%, #06231F 78%)" }}
      initial={{ opacity: 0 }}
      animate={{ opacity: pouring ? [1, 1, 0] : 1 }}
      transition={pouring ? { duration: 2, times: [0, 0.8, 1] } : { duration: 0.4 }}
      data-testid="tiki-shaker-cover"
    >
      <div className="pointer-events-none absolute left-1/2 top-3 z-20 -translate-x-1/2 whitespace-nowrap rounded-full bg-black/60 px-4 py-1 font-sans text-[11px] font-bold uppercase tracking-[0.2em] text-[#FFD27A]" data-testid="rare-fate-badge">
        ✦ {t("Rare fate")} ✦
      </div>

      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 pt-4">
        <motion.div
          key={wobbleKey}
          animate={pouring ? { rotate: 112, x: 46, y: -14 } : { rotate: [0, -intensity, intensity, -intensity * 0.6, intensity * 0.6, 0] }}
          transition={pouring ? { duration: 0.6, ease: "easeIn" } : { duration: 0.45 }}
          style={{ transformOrigin: "50% 80%" }}
          onClick={shake}
          className="cursor-pointer touch-none"
          data-testid="tiki-shaker-mug"
          role="button"
          aria-label={t("Shake the tiki mug")}
        >
          <TikiMug />
        </motion.div>

        {/* Pour: tropical stream + splash once the mug tips */}
        {pouring && (
          <>
            <motion.div
              className="pointer-events-none absolute left-1/2 top-[46%] w-3 rounded-full"
              style={{ background: "linear-gradient(180deg,#FF8A3C,#FF5470)", transformOrigin: "top center" }}
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "34%", opacity: [0, 1, 1, 0.5] }}
              transition={{ duration: 0.9, ease: "easeIn" }}
              data-testid="tiki-pour-stream"
            />
            {[0, 1, 2, 3, 4].map((i) => (
              <motion.div
                key={i}
                className="pointer-events-none absolute rounded-full"
                style={{ left: `${44 + i * 4}%`, bottom: "16%", width: 10 + (i % 3) * 5, height: 10 + (i % 3) * 5, background: i % 2 ? "#FF8A3C" : "#FF5470" }}
                initial={{ opacity: 0, y: 0, scale: 0.4 }}
                animate={{ opacity: [0, 0.9, 0], y: -34 - i * 9, x: (i - 2) * 16, scale: 1.15 }}
                transition={{ delay: 0.55 + i * 0.07, duration: 0.75, ease: "easeOut" }}
              />
            ))}
          </>
        )}

        {!pouring ? (
          <>
            <p className="font-serif text-lg italic text-[#FFE9BF]" data-testid="tiki-shaker-prompt">{t("Shake the tiki mug!")}</p>
            <div className="flex gap-1.5" data-testid="tiki-shake-dots">
              {Array.from({ length: SHAKES_NEEDED }, (_, i) => (
                <span key={i} className={`h-2.5 w-2.5 rounded-full transition-colors ${i < shakes ? "bg-[#FF8A3C]" : "bg-white/20"}`} />
              ))}
            </div>
          </>
        ) : (
          <p className="font-serif text-lg font-bold uppercase tracking-[0.15em] text-[#FFD27A]" data-testid="tiki-shaker-done">{t("The fate pours out!")}</p>
        )}
      </div>
    </motion.div>
  );
}
