import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useLang } from "../../i18n/i18n";

const TAPS_NEEDED = 3;

// Soft breathy "fwoo" per lit flame (respects mute).
function makeIgniter() {
  try {
    if (localStorage.getItem("ff_muted") === "1") return () => {};
    return () => {
      try {
        const a = new Audio("/golem-furnace-crackle.mp3");
        a.volume = 0.45;
        a.play().catch(() => {});
        setTimeout(() => { try { a.pause(); } catch (e) { /* ignore */ } }, 1200);
      } catch (e) { /* audio */ }
    };
  } catch (e) {
    return () => {};
  }
}

/** CSS-carved pumpkin: ridged orange body, curled stem, triangle eyes + nose
 * and a jagged grin. The face pieces stay pitch dark until flames are lit,
 * then glow candle-amber and flicker. `lit` = 0..3, blaze = fully lit. */
function PumpkinArt({ lit, blaze }) {
  const glow = lit > 0;
  const faceBg = blaze
    ? "radial-gradient(circle at 50% 60%, #FFF3C0 0%, #FFC742 45%, #FF8C1A 100%)"
    : glow
    ? `radial-gradient(circle at 50% 70%, rgba(255,200,80,${0.28 + lit * 0.22}), rgba(255,140,26,${0.14 + lit * 0.14}) 70%)`
    : "#170D05";
  const faceShadow = blaze
    ? "drop-shadow(0 0 14px rgba(255,180,60,0.95))"
    : glow
    ? `drop-shadow(0 0 ${4 + lit * 3}px rgba(255,170,50,${0.25 + lit * 0.2}))`
    : "none";
  return (
    <div className="relative h-56 w-64 select-none" data-testid="lantern-art">
      {/* candle glow bleeding out around the whole pumpkin once blazing */}
      <div className="pointer-events-none absolute inset-[-14%] transition-opacity duration-700" style={{ background: "radial-gradient(ellipse at 50% 62%, rgba(255,160,40,0.5) 0%, rgba(255,120,20,0) 68%)", filter: "blur(12px)", opacity: blaze ? 1 : 0 }} />
      {/* stem */}
      <div className="absolute left-1/2 top-[2%] h-[16%] w-[10%] -translate-x-1/2 rounded-t-lg" style={{ background: "linear-gradient(100deg, #5E7A2E, #3C531B)", transform: "translateX(-50%) rotate(-8deg)" }} />
      {/* body: three overlapping ridged lobes */}
      <div className="absolute left-[6%] top-[14%] h-[82%] w-[88%] rounded-[48%]" style={{ background: "radial-gradient(ellipse at 38% 30%, #FF9C33 0%, #E86F12 55%, #A34708 100%)", boxShadow: "inset -14px -10px 26px rgba(90,35,0,0.55), inset 12px 8px 22px rgba(255,190,110,0.35)" }} />
      <div className="absolute left-[20%] top-[11%] h-[86%] w-[60%] rounded-[48%]" style={{ background: "radial-gradient(ellipse at 42% 28%, #FFAE4A 0%, #F07A16 58%, #B24F09 100%)", boxShadow: "inset -10px -8px 20px rgba(90,35,0,0.45), inset 8px 6px 16px rgba(255,200,120,0.4)" }} />
      <div className="absolute left-[34%] top-[9%] h-[89%] w-[32%] rounded-[46%]" style={{ background: "radial-gradient(ellipse at 45% 26%, #FFB85C 0%, #F5851C 60%, #BD560B 100%)" }} />
      {/* face — clip-path cutouts */}
      <div className="absolute inset-0" style={{ filter: faceShadow }}>
        <div className="absolute left-[24%] top-[38%] h-[15%] w-[16%]" style={{ clipPath: "polygon(50% 0%, 100% 100%, 0% 100%)", background: faceBg, animation: blaze ? "ffLanternFlicker 0.22s steps(2,end) infinite" : lit > 0 ? "ffLanternFlicker 0.5s steps(2,end) infinite" : "none" }} />
        <div className="absolute right-[24%] top-[38%] h-[15%] w-[16%]" style={{ clipPath: "polygon(50% 0%, 100% 100%, 0% 100%)", background: faceBg, animation: blaze ? "ffLanternFlicker 0.26s steps(2,end) infinite" : lit > 1 ? "ffLanternFlicker 0.55s steps(2,end) infinite" : "none" }} />
        <div className="absolute left-[46%] top-[56%] h-[9%] w-[8%]" style={{ clipPath: "polygon(50% 0%, 100% 100%, 0% 100%)", background: faceBg }} />
        <div className="absolute left-[22%] top-[70%] h-[14%] w-[56%]" style={{ clipPath: "polygon(0% 30%, 12% 55%, 20% 20%, 32% 60%, 44% 18%, 56% 60%, 68% 20%, 80% 58%, 90% 28%, 100% 45%, 92% 100%, 8% 100%)", background: faceBg, animation: blaze ? "ffLanternFlicker 0.3s steps(2,end) infinite" : "none" }} />
      </div>
      {/* inner flame sprite once anything is lit */}
      {lit > 0 && (
        <img src={`/flame_alt_${Math.min(lit, 4)}.png`} alt="" className="pointer-events-none absolute left-1/2 top-[46%] -translate-x-1/2 opacity-80 mix-blend-screen" style={{ width: `${16 + lit * 8}%`, filter: "blur(1px)", animation: "ffLanternFlicker 0.35s steps(2,end) infinite" }} />
      )}
    </div>
  );
}

/** HALLOWEEN TAKEOVER exclusive ritual (October only): light the carved
 * pumpkin's three flames — on the third it blazes up and reveals the fate. */
export function JackOLantern({ onDone }) {
  const { t } = useLang();
  const [lit, setLit] = useState(0);
  const [blaze, setBlaze] = useState(false);
  const doneRef = useRef(false);
  const igniteRef = useRef(null);
  const [puffKey, setPuffKey] = useState(0);

  const light = () => {
    if (blaze) return;
    if (!igniteRef.current) igniteRef.current = makeIgniter();
    igniteRef.current();
    setPuffKey((k) => k + 1);
    const next = lit + 1;
    setLit(next);
    if (next >= TAPS_NEEDED) {
      setTimeout(() => {
        setBlaze(true);
        try {
          const a = new Audio("/golem-fire-blast.mp3");
          a.volume = 0.55;
          if (localStorage.getItem("ff_muted") !== "1") a.play().catch(() => {});
        } catch (e) { /* audio */ }
        setTimeout(() => { if (!doneRef.current) { doneRef.current = true; onDone?.(); } }, 2200);
      }, 450);
    }
  };

  useEffect(() => { doneRef.current = false; return () => { doneRef.current = true; }; }, []);

  return (
    <motion.div
      className="absolute inset-0 z-40 overflow-hidden rounded-2xl"
      style={{ background: "radial-gradient(circle at 50% 80%, #1C1006 0%, #070403 75%)" }}
      initial={{ opacity: 0 }}
      animate={{ opacity: blaze ? [1, 1, 0] : 1 }}
      transition={blaze ? { duration: 2.2, times: [0, 0.8, 1] } : { duration: 0.4 }}
      data-testid="lantern-cover"
    >
      <div className="pointer-events-none absolute left-1/2 top-3 z-20 -translate-x-1/2 whitespace-nowrap rounded-full bg-black/60 px-4 py-1 font-sans text-[11px] font-bold uppercase tracking-[0.2em] text-[#FF8C1A]" data-testid="rare-fate-badge">
        ✦ {t("Halloween exclusive")} ✦
      </div>

      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 pt-4">
        <motion.div
          key={puffKey}
          animate={blaze ? {} : { scale: [1, 1.04, 1] }}
          transition={{ duration: 0.25 }}
          onClick={light}
          className="relative cursor-pointer touch-none"
          data-testid="lantern-pumpkin"
          role="button"
          aria-label={t("Light the lantern")}
        >
          <PumpkinArt lit={lit} blaze={blaze} />
          {/* ember sparks spiraling up once blazing */}
          {blaze && [0, 1, 2, 3].map((i) => (
            <motion.div
              key={i}
              className="pointer-events-none absolute left-1/2 top-[40%] rounded-full"
              style={{ width: 6 + i * 3, height: 6 + i * 3, background: "radial-gradient(circle, rgba(255,200,90,0.95), rgba(255,140,30,0) 70%)", filter: "blur(1px)" }}
              initial={{ x: 0, y: 0, opacity: 0 }}
              animate={{ x: (i - 1.5) * 34, y: -110 - i * 22, opacity: [0, 1, 0] }}
              transition={{ delay: 0.5 + i * 0.2, duration: 1.5, ease: "easeOut" }}
            />
          ))}
        </motion.div>

        {!blaze ? (
          <>
            <p className="font-serif text-lg italic text-[#F5C98A]" data-testid="lantern-prompt">{t("Light the three flames...")}</p>
            <div className="flex gap-1.5" data-testid="lantern-dots">
              {Array.from({ length: TAPS_NEEDED }, (_, i) => (
                <span key={i} className={`h-2.5 w-2.5 rounded-full transition-colors ${i < lit ? "bg-[#FF8C1A]" : "bg-white/20"}`} />
              ))}
            </div>
          </>
        ) : (
          <p className="font-serif text-lg font-bold uppercase tracking-[0.15em] text-[#FF8C1A]" data-testid="lantern-done">{t("The lantern grins...")}</p>
        )}
      </div>
    </motion.div>
  );
}
