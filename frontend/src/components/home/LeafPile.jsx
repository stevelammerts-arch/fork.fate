import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useLang } from "../../i18n/i18n";

const SWEEPS = 4;
const LEAF_COLORS = ["#D97A2B", "#B5541C", "#C9A227", "#A33B12", "#E08A3C"];

// Crisp leaf rustle per sweep (respects mute).
function makeRustle() {
  try {
    if (localStorage.getItem("ff_muted") === "1") return () => {};
    const Ctx = window.AudioContext || window.webkitAudioContext;
    const ctx = new Ctx();
    return () => {
      try {
        const len = Math.floor(ctx.sampleRate * 0.35);
        const buf = ctx.createBuffer(1, len, ctx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < len; i++) {
          const t = i / len;
          data[i] = (Math.random() * 2 - 1) * Math.sin(Math.PI * t) * (0.5 + 0.5 * Math.random());
        }
        const src = ctx.createBufferSource();
        src.buffer = buf;
        const bp = ctx.createBiquadFilter();
        bp.type = "bandpass";
        bp.frequency.value = 3200;
        bp.Q.value = 0.6;
        const g = ctx.createGain();
        g.gain.value = 0.22;
        src.connect(bp).connect(g).connect(ctx.destination);
        src.start();
      } catch (e) { /* audio */ }
    };
  } catch (e) {
    return () => {};
  }
}

/** Fall rare ritual: a photorealistic pile of autumn leaves buries the fate.
 * Sweep it away — each tap scatters a burst of leaves until the pile is gone. */
export function LeafPile({ onDone }) {
  const { t } = useLang();
  const [sweeps, setSweeps] = useState(0);
  const [cleared, setCleared] = useState(false);
  const [done, setDone] = useState(false);
  const doneRef = useRef(false);
  const timersRef = useRef([]);
  const rustleRef = useRef(null);

  const later = (fn, ms) => { const id = setTimeout(fn, ms); timersRef.current.push(id); };

  const sweep = () => {
    if (cleared) return;
    if (!rustleRef.current) rustleRef.current = makeRustle();
    rustleRef.current();
    setSweeps((prev) => {
      const next = Math.min(prev + 1, SWEEPS);
      if (next >= SWEEPS && !cleared) {
        later(() => {
          setCleared(true);
          later(() => setDone(true), 1200);
          later(() => { if (!doneRef.current) { doneRef.current = true; onDone?.(); } }, 2800);
        }, 350);
      }
      return next;
    });
  };

  // Reset on (re)mount so StrictMode's simulated unmount can't poison the
  // guard; a real unmount still cancels timers and the pending onDone.
  useEffect(() => { doneRef.current = false; return () => { doneRef.current = true; timersRef.current.forEach(clearTimeout); }; }, []);

  return (
    <motion.div
      className="absolute inset-0 z-40 cursor-pointer overflow-hidden rounded-2xl"
      style={{ background: "radial-gradient(circle at 50% 30%, #4A2A12 0%, #1C0F05 78%)" }}
      initial={{ opacity: 0 }}
      animate={{ opacity: done ? [1, 1, 0] : 1 }}
      transition={done ? { duration: 1.6, times: [0, 0.7, 1] } : { duration: 0.4 }}
      onClick={sweep}
      data-testid="leafpile-cover"
    >
      <div className="pointer-events-none absolute left-1/2 top-3 z-20 -translate-x-1/2 whitespace-nowrap rounded-full bg-black/60 px-4 py-1 font-sans text-[11px] font-bold uppercase tracking-[0.2em] text-[#FFC08A]" data-testid="rare-fate-badge">
        ✦ {t("Rare fate")} ✦
      </div>

      <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-4">
        <motion.div
          className="relative w-full max-w-[20rem]"
          animate={sweeps > 0 && !cleared ? { x: [0, -6, 6, -3, 0] } : {}}
          transition={{ duration: 0.35 }}
          key={`shake-${sweeps}`}
          data-testid="leafpile-mound"
        >
          <img
            src="/season-fall-leafpile.png"
            alt=""
            className="w-full select-none object-contain transition-all duration-500"
            style={{
              filter: "drop-shadow(0 10px 18px rgba(0,0,0,0.55))",
              opacity: cleared ? 0 : 1 - sweeps * 0.16,
              transform: `scale(${1 - sweeps * 0.09}) translateY(${sweeps * 8}px)`,
            }}
            draggable={false}
          />
          {/* leaf burst per sweep */}
          {sweeps > 0 && !cleared && (
            <div className="pointer-events-none absolute inset-0" key={`burst-${sweeps}`}>
              {Array.from({ length: 10 }).map((_, i) => (
                <motion.span
                  key={i}
                  className="absolute left-1/2 top-1/2 h-3 w-4"
                  style={{ background: LEAF_COLORS[i % LEAF_COLORS.length], borderRadius: "72% 28% 68% 32%", boxShadow: "0 1px 3px rgba(0,0,0,0.3)" }}
                  initial={{ opacity: 1, x: 0, y: 0, rotate: 0 }}
                  animate={{
                    opacity: [1, 1, 0],
                    x: (i % 2 ? 1 : -1) * (30 + (i * 23) % 120),
                    y: [0, -(30 + (i * 17) % 60), 40 + (i * 13) % 50],
                    rotate: (i % 2 ? 1 : -1) * (140 + (i * 37) % 220),
                  }}
                  transition={{ duration: 0.9 + (i % 4) * 0.15, ease: "easeOut" }}
                />
              ))}
            </div>
          )}
        </motion.div>

        {!cleared ? (
          <div className="flex flex-col items-center gap-2">
            <p className="text-center font-serif text-lg font-bold text-[#FFC08A]" data-testid="leafpile-prompt">{t("Fate is buried — sweep the leaves away!")}</p>
            <div className="flex gap-2" data-testid="leafpile-dots">
              {Array.from({ length: SWEEPS }).map((_, i) => (
                <span key={i} className={`h-2.5 w-2.5 rounded-full transition-colors ${i < sweeps ? "bg-[#D97A2B]" : "bg-white/20"}`} />
              ))}
            </div>
          </div>
        ) : (
          <motion.p
            className="text-center font-serif text-xl font-bold text-[#FFD9A8]"
            style={{ textShadow: "0 0 16px rgba(224,138,60,0.8)" }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            data-testid="leafpile-done"
          >
            {t("The harvest has chosen...")}
          </motion.p>
        )}
      </div>
    </motion.div>
  );
}
