import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useLang } from "../../i18n/i18n";

const COAXES = 3;
const PETALS = ["#F2A9C4", "#E87BA8", "#F7C9DC", "#FBE3EE"];

// Soft chime per coax + a gentle glissando when the branch blooms.
function makeBloomSounds() {
  try {
    if (localStorage.getItem("ff_muted") === "1") return { coax: () => {}, bloom: () => {} };
    const Ctx = window.AudioContext || window.webkitAudioContext;
    const ctx = new Ctx();
    const ping = (freq, at, vol = 0.12, dur = 0.5) => {
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, at);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, at);
      g.gain.exponentialRampToValueAtTime(vol, at + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, at + dur);
      osc.connect(g).connect(ctx.destination);
      osc.start(at);
      osc.stop(at + dur + 0.05);
    };
    return {
      coax: () => { try { ping(880 + Math.random() * 220, ctx.currentTime); } catch (e) { /* audio */ } },
      bloom: () => {
        try {
          [523, 659, 784, 1047, 1319].forEach((f, i) => ping(f, ctx.currentTime + i * 0.09, 0.14, 0.7));
        } catch (e) { /* audio */ }
      },
    };
  } catch (e) {
    return { coax: () => {}, bloom: () => {} };
  }
}

/** Spring rare ritual: a photorealistic cherry blossom branch with closed
 * buds. Coax it three times — it bursts into full bloom with a petal shower. */
export function CherryBloom({ onDone }) {
  const { t } = useLang();
  const [coaxes, setCoaxes] = useState(0);
  const [bloomed, setBloomed] = useState(false);
  const [done, setDone] = useState(false);
  const doneRef = useRef(false);
  const timersRef = useRef([]);
  const soundsRef = useRef(null);

  const later = (fn, ms) => { const id = setTimeout(fn, ms); timersRef.current.push(id); };

  const coax = () => {
    if (bloomed) return;
    if (!soundsRef.current) soundsRef.current = makeBloomSounds();
    soundsRef.current.coax();
    setCoaxes((prev) => {
      const next = Math.min(prev + 1, COAXES);
      if (next >= COAXES && !bloomed) {
        later(() => {
          setBloomed(true);
          soundsRef.current.bloom();
          later(() => setDone(true), 1500);
          later(() => { if (!doneRef.current) { doneRef.current = true; onDone?.(); } }, 3100);
        }, 380);
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
      style={{ background: "radial-gradient(circle at 50% 30%, #2E4A33 0%, #101E13 78%)" }}
      initial={{ opacity: 0 }}
      animate={{ opacity: done ? [1, 1, 0] : 1 }}
      transition={done ? { duration: 1.6, times: [0, 0.7, 1] } : { duration: 0.4 }}
      onClick={coax}
      data-testid="bloom-cover"
    >
      <div className="pointer-events-none absolute left-1/2 top-3 z-20 -translate-x-1/2 whitespace-nowrap rounded-full bg-black/60 px-4 py-1 font-sans text-[11px] font-bold uppercase tracking-[0.2em] text-[#F2A9C4]" data-testid="rare-fate-badge">
        ✦ {t("Rare fate")} ✦
      </div>

      <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-4">
        <motion.div
          className="relative h-56 w-44"
          animate={coaxes > 0 && !bloomed ? { rotate: [0, -2, 2, -1, 0] } : {}}
          transition={{ duration: 0.4 }}
          key={`shake-${coaxes}`}
          data-testid="bloom-branch"
        >
          {/* soft pink glow blooming behind the open branch */}
          <div
            className="pointer-events-none absolute inset-[-14%] transition-opacity duration-700"
            style={{ background: "radial-gradient(ellipse at 50% 45%, rgba(242,169,196,0.45) 0%, rgba(242,169,196,0) 70%)", filter: "blur(10px)", opacity: bloomed ? 1 : 0 }}
          />
          <img
            src="/season-spring-bud.png"
            alt=""
            className="absolute inset-0 h-full w-full select-none object-contain transition-opacity duration-700"
            style={{ opacity: bloomed ? 0 : 1, filter: `drop-shadow(0 8px 14px rgba(0,0,0,0.5)) brightness(${1 + coaxes * 0.1})` }}
            draggable={false}
          />
          <img
            src="/season-spring-bloom.png"
            alt=""
            className="absolute inset-0 h-full w-full select-none object-contain transition-opacity duration-700"
            style={{ opacity: bloomed ? 1 : 0, filter: "drop-shadow(0 0 22px rgba(242,169,196,0.4)) drop-shadow(0 8px 14px rgba(0,0,0,0.5))" }}
            draggable={false}
          />
          {/* petal shower once bloomed */}
          {bloomed && (
            <div className="pointer-events-none absolute inset-[-30%]">
              {Array.from({ length: 14 }).map((_, i) => (
                <motion.span
                  key={i}
                  className="absolute left-1/2 top-1/3 h-2.5 w-3.5"
                  style={{ background: PETALS[i % PETALS.length], borderRadius: "70% 30% 65% 35%", boxShadow: "0 1px 2px rgba(0,0,0,0.15)" }}
                  initial={{ opacity: 0, x: 0, y: 0, rotate: 0 }}
                  animate={{
                    opacity: [0, 1, 1, 0],
                    x: (i % 2 ? 1 : -1) * (18 + (i * 19) % 90),
                    y: [0, 30 + (i * 23) % 90, 130 + (i * 17) % 60],
                    rotate: (i % 2 ? 1 : -1) * (120 + (i * 31) % 240),
                  }}
                  transition={{ duration: 1.8 + (i % 5) * 0.25, delay: (i % 6) * 0.12, ease: "easeIn" }}
                />
              ))}
            </div>
          )}
        </motion.div>

        {!bloomed ? (
          <div className="flex flex-col items-center gap-2">
            <p className="text-center font-serif text-lg font-bold text-[#F7C9DC]" data-testid="bloom-prompt">{t("Coax the blossom open...")}</p>
            <div className="flex gap-2" data-testid="bloom-dots">
              {Array.from({ length: COAXES }).map((_, i) => (
                <span key={i} className={`h-2.5 w-2.5 rounded-full transition-colors ${i < coaxes ? "bg-[#E87BA8]" : "bg-white/20"}`} />
              ))}
            </div>
          </div>
        ) : (
          <motion.p
            className="text-center font-serif text-xl font-bold text-[#FBE3EE]"
            style={{ textShadow: "0 0 16px rgba(242,169,196,0.8)" }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
            data-testid="bloom-done"
          >
            {t("Fate blossoms!")}
          </motion.p>
        )}
      </div>
    </motion.div>
  );
}
