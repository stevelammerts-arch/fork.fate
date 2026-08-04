import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useLang } from "../../i18n/i18n";

const HITS = 3;

// Hollow melon thump per hit + a juicy splat for the smash (respects mute).
function makeMelonSounds() {
  try {
    if (localStorage.getItem("ff_muted") === "1") return { thump: () => {}, splat: () => {} };
    const Ctx = window.AudioContext || window.webkitAudioContext;
    const ctx = new Ctx();
    const thump = () => {
      try {
        const osc = ctx.createOscillator();
        osc.type = "sine";
        osc.frequency.setValueAtTime(160, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(60, ctx.currentTime + 0.18);
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.4, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);
        osc.connect(g).connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.25);
      } catch (e) { /* audio */ }
    };
    const splat = () => {
      try {
        const len = Math.floor(ctx.sampleRate * 0.45);
        const buf = ctx.createBuffer(1, len, ctx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < len; i++) {
          const t = i / len;
          data[i] = (Math.random() * 2 - 1) * Math.pow(1 - t, 1.6);
        }
        const src = ctx.createBufferSource();
        src.buffer = buf;
        const lp = ctx.createBiquadFilter();
        lp.type = "lowpass";
        lp.frequency.value = 1400;
        const g = ctx.createGain();
        g.gain.value = 0.4;
        src.connect(lp).connect(g).connect(ctx.destination);
        src.start();
      } catch (e) { /* audio */ }
    };
    return { thump, splat };
  } catch (e) {
    return { thump: () => {}, splat: () => {} };
  }
}

/** Summer rare ritual: a photorealistic whole watermelon. Smash it three
 * times — it splits open in a juicy burst with flying seeds. */
export function MelonSmash({ onDone }) {
  const { t } = useLang();
  const [hits, setHits] = useState(0);
  const [split, setSplit] = useState(false);
  const [done, setDone] = useState(false);
  const doneRef = useRef(false);
  const timersRef = useRef([]);
  const soundsRef = useRef(null);

  const later = (fn, ms) => { const id = setTimeout(fn, ms); timersRef.current.push(id); };

  const smash = () => {
    if (split) return;
    if (!soundsRef.current) soundsRef.current = makeMelonSounds();
    soundsRef.current.thump();
    setHits((prev) => {
      const next = Math.min(prev + 1, HITS);
      if (next >= HITS && !split) {
        later(() => {
          setSplit(true);
          soundsRef.current.splat();
          later(() => setDone(true), 1400);
          later(() => { if (!doneRef.current) { doneRef.current = true; onDone?.(); } }, 3000);
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
      style={{ background: "radial-gradient(circle at 50% 30%, #1E5A63 0%, #0A2226 78%)" }}
      initial={{ opacity: 0 }}
      animate={{ opacity: done ? [1, 1, 0] : 1 }}
      transition={done ? { duration: 1.6, times: [0, 0.7, 1] } : { duration: 0.4 }}
      onClick={smash}
      data-testid="melon-cover"
    >
      <div className="pointer-events-none absolute left-1/2 top-3 z-20 -translate-x-1/2 whitespace-nowrap rounded-full bg-black/60 px-4 py-1 font-sans text-[11px] font-bold uppercase tracking-[0.2em] text-[#8FE3C0]" data-testid="rare-fate-badge">
        ✦ {t("Rare fate")} ✦
      </div>

      <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-4">
        <motion.div
          className="relative w-full max-w-[18rem]"
          animate={hits > 0 && !split ? { x: [0, -8, 8, -4, 0], rotate: [0, -2, 2, 0] } : {}}
          transition={{ duration: 0.3 }}
          key={`shake-${hits}`}
          data-testid="melon-fruit"
        >
          <img
            src="/season-summer-melon-whole.png"
            alt=""
            className="relative w-full select-none object-contain transition-opacity duration-300"
            style={{ opacity: split ? 0 : 1, filter: "drop-shadow(0 10px 18px rgba(0,0,0,0.5))" }}
            draggable={false}
          />
          <img
            src="/season-summer-melon-split.png"
            alt=""
            className="absolute bottom-0 left-1/2 w-[96%] -translate-x-1/2 select-none object-contain transition-opacity duration-300"
            style={{ opacity: split ? 1 : 0, filter: "drop-shadow(0 10px 18px rgba(0,0,0,0.5))" }}
            draggable={false}
          />
          {/* juice + seed burst */}
          {split && (
            <div className="pointer-events-none absolute inset-0" data-testid="melon-burst">
              {Array.from({ length: 16 }).map((_, i) => {
                const seed = i % 3 === 0;
                return (
                  <motion.span
                    key={i}
                    className="absolute left-1/2 top-1/2"
                    style={seed
                      ? { width: 6, height: 9, borderRadius: "60% 40% 60% 40%", background: "#20140C" }
                      : { width: 8 + (i * 7) % 8, height: 8 + (i * 5) % 8, borderRadius: "50%", background: i % 2 ? "#E23B4A" : "#F26D77", boxShadow: "0 0 6px rgba(226,59,74,0.6)" }}
                    initial={{ opacity: 0, x: 0, y: 0, scale: 0.7 }}
                    animate={{
                      opacity: [0, 1, 1, 0],
                      x: (i % 2 ? 1 : -1) * (16 + (i * 21) % 130),
                      y: [0, -(40 + (i * 19) % 90), 70 + (i * 11) % 40],
                      rotate: (i % 2 ? 1 : -1) * 260,
                      scale: [0.7, 1, 0.9],
                    }}
                    transition={{ duration: 1.1 + (i % 4) * 0.15, delay: (i % 5) * 0.05, ease: "easeOut" }}
                  />
                );
              })}
            </div>
          )}
        </motion.div>

        {!split ? (
          <div className="flex flex-col items-center gap-2">
            <p className="text-center font-serif text-lg font-bold text-[#B8F0D8]" data-testid="melon-prompt">{t("Smash the watermelon!")}</p>
            <div className="flex gap-2" data-testid="melon-dots">
              {Array.from({ length: HITS }).map((_, i) => (
                <span key={i} className={`h-2.5 w-2.5 rounded-full transition-colors ${i < hits ? "bg-[#E23B4A]" : "bg-white/20"}`} />
              ))}
            </div>
          </div>
        ) : (
          <motion.p
            className="text-center font-serif text-xl font-bold text-[#FFD9DD]"
            style={{ textShadow: "0 0 16px rgba(226,59,74,0.7)" }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
            data-testid="melon-done"
          >
            {t("A juicy fate splits open!")}
          </motion.p>
        )}
      </div>
    </motion.div>
  );
}
