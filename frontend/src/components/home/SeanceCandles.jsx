import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useLang } from "../../i18n/i18n";

const CANDLE_COUNT = 5;

// Soft breathy puff per snuffed candle (respects mute).
function puff() {
  try {
    if (localStorage.getItem("ff_muted") === "1") return;
    const Ctx = window.AudioContext || window.webkitAudioContext;
    const ctx = new Ctx();
    const len = Math.floor(ctx.sampleRate * 0.18);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len) * 0.8;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 1400;
    const g = ctx.createGain();
    g.gain.value = 0.22;
    src.connect(lp).connect(g).connect(ctx.destination);
    src.start();
  } catch (e) { /* audio */ }
}

/** Reaper rare ritual: a séance. Snuff the five candles one by one — when the
 * last flame dies, the spirits speak and the fate materializes. */
export function SeanceCandles({ onDone }) {
  const { t } = useLang();
  const [out, setOut] = useState(() => Array(CANDLE_COUNT).fill(false));
  const [dark, setDark] = useState(false);
  const doneRef = useRef(false);
  const snuffed = out.filter(Boolean).length;

  const snuff = (i) => {
    if (out[i] || dark) return;
    puff();
    setOut((prev) => {
      if (prev[i]) return prev;
      const next = prev.map((v, j) => (j === i ? true : v));
      if (next.every(Boolean)) {
        setTimeout(() => {
          setDark(true);
          const thunder = new Audio("/reveal-thunder-v4.mp3");
          thunder.volume = 0.9;
          if (localStorage.getItem("ff_muted") !== "1") thunder.play().catch(() => {});
          setTimeout(() => { if (!doneRef.current) { doneRef.current = true; onDone?.(); } }, 2000);
        }, 650);
      }
      return next;
    });
  };

  // Reset on (re)mount so StrictMode's simulated unmount can't poison the
  // guard; a real unmount still cancels the pending onDone.
  useEffect(() => { doneRef.current = false; return () => { doneRef.current = true; }; }, []);

  const heights = [64, 88, 74, 96, 60]; // uneven candle heights (realistic 3D render)

  return (
    <motion.div
      className="absolute inset-0 z-40 overflow-hidden rounded-2xl"
      style={{ background: "radial-gradient(circle at 50% 70%, #1C1424 0%, #080510 75%)" }}
      initial={{ opacity: 0 }}
      animate={{ opacity: dark ? [1, 1, 0] : 1 }}
      transition={dark ? { duration: 2, times: [0, 0.8, 1] } : { duration: 0.4 }}
      data-testid="seance-cover"
    >
      {/* room dims as candles die */}
      <div className="pointer-events-none absolute inset-0 bg-black transition-opacity duration-700" style={{ opacity: snuffed * 0.13 }} />

      <div className="pointer-events-none absolute left-1/2 top-3 z-20 -translate-x-1/2 whitespace-nowrap rounded-full bg-black/60 px-4 py-1 font-sans text-[11px] font-bold uppercase tracking-[0.2em] text-[#D9A44E]" data-testid="rare-fate-badge">
        ✦ {t("Rare fate")} ✦
      </div>

      {/* spirit glyph flash in the final darkness */}
      {dark && (
        <motion.div
          className="absolute inset-0 grid place-items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0.85] }}
          transition={{ delay: 0.5, duration: 1.2 }}
          data-testid="seance-glyph"
        >
          <span className="font-serif text-6xl text-[#B9A5E3]" style={{ textShadow: "0 0 30px rgba(185,165,227,0.9)" }}>☠</span>
        </motion.div>
      )}

      <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 pt-6">
        <div className="flex items-end gap-2" data-testid="seance-candles">
          {heights.map((h, i) => (
            <button
              key={i}
              type="button"
              onClick={() => snuff(i)}
              data-testid={`seance-candle-${i}`}
              aria-label={t("Snuff the candle")}
              className="relative flex cursor-pointer flex-col items-center"
              style={{ opacity: dark ? 0.25 : 1, transition: "opacity 0.6s" }}
            >
              {/* flame / smoke — sits on the wick at the top of the render */}
              <div className="relative -mb-1.5 h-9 w-6">
                {!out[i] ? (
                  <motion.div
                    className="absolute bottom-0 left-1/2 h-7 w-3.5 -translate-x-1/2 rounded-full"
                    style={{ background: "radial-gradient(circle at 50% 75%, #FFE9A8 0%, #FFB03A 55%, rgba(255,110,40,0) 100%)", filter: "blur(0.5px)" }}
                    animate={{ scaleY: [1, 1.25, 0.9, 1.15, 1], x: ["-50%", "-44%", "-56%", "-50%"] }}
                    transition={{ duration: 1.3 + i * 0.2, repeat: Infinity }}
                  />
                ) : (
                  <motion.div
                    className="absolute bottom-0 left-1/2 h-8 w-2 -translate-x-1/2 rounded-full bg-white/25"
                    style={{ filter: "blur(2px)" }}
                    initial={{ opacity: 0.7, y: 0 }}
                    animate={{ opacity: 0, y: -26, x: 6 }}
                    transition={{ duration: 1.4, ease: "easeOut" }}
                  />
                )}
              </div>
              {/* dripping wax candle on brass holder (AI-generated 3D render) */}
              <img
                src="/reaper-candle.png"
                alt=""
                className="w-auto select-none object-contain"
                style={{ height: h, filter: `drop-shadow(0 6px 10px rgba(0,0,0,0.6)) brightness(${out[i] ? 0.55 : 1})`, transition: "filter 0.6s" }}
                draggable={false}
              />
            </button>
          ))}
        </div>

        {!dark ? (
          <p className="font-serif text-lg italic text-[#D8CBEF]" data-testid="seance-prompt">
            {snuffed === 0 ? t("Snuff the candles, one by one...") : t("The dark grows hungry...")}
          </p>
        ) : (
          <p className="relative z-10 font-serif text-lg font-bold uppercase tracking-[0.15em] text-[#B9A5E3]" data-testid="seance-done">{t("The spirits have chosen...")}</p>
        )}
      </div>
    </motion.div>
  );
}
