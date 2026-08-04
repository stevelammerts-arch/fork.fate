import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useLang } from "../../i18n/i18n";

const HITS = 3;

// Metallic clank per lock hit + a coin-shower jingle for the burst (respects mute).
function makeChestSounds() {
  try {
    if (localStorage.getItem("ff_muted") === "1") return { clank: () => {}, coins: () => {} };
    const Ctx = window.AudioContext || window.webkitAudioContext;
    const ctx = new Ctx();
    const clank = () => {
      try {
        const osc = ctx.createOscillator();
        osc.type = "square";
        osc.frequency.setValueAtTime(620, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(140, ctx.currentTime + 0.16);
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.22, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
        osc.connect(g).connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.22);
      } catch (e) { /* audio */ }
    };
    const coins = () => {
      try {
        for (let i = 0; i < 10; i++) {
          const osc = ctx.createOscillator();
          osc.type = "sine";
          const f = 1400 + ((i * 397) % 1200);
          const at = ctx.currentTime + i * 0.07;
          osc.frequency.setValueAtTime(f, at);
          const g = ctx.createGain();
          g.gain.setValueAtTime(0.0001, at);
          g.gain.exponentialRampToValueAtTime(0.12, at + 0.01);
          g.gain.exponentialRampToValueAtTime(0.001, at + 0.22);
          osc.connect(g).connect(ctx.destination);
          osc.start(at);
          osc.stop(at + 0.25);
        }
      } catch (e) { /* audio */ }
    };
    return { clank, coins };
  } catch (e) {
    return { clank: () => {}, coins: () => {} };
  }
}

/** Dragon's Hoard rare ritual: an iron-locked treasure chest. Smash the lock
 * three times — the lid bursts open and gold fountains out with the fate. */
export function TreasureChest({ onDone }) {
  const { t } = useLang();
  const [hits, setHits] = useState(0);
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState(false);
  const doneRef = useRef(false);
  const timersRef = useRef([]);
  const soundsRef = useRef(null);

  const later = (fn, ms) => { const id = setTimeout(fn, ms); timersRef.current.push(id); };

  const smash = () => {
    if (open) return;
    if (!soundsRef.current) soundsRef.current = makeChestSounds();
    soundsRef.current.clank();
    setHits((prev) => {
      const next = Math.min(prev + 1, HITS);
      if (next >= HITS && !open) {
        later(() => {
          setOpen(true);
          soundsRef.current.coins();
          later(() => setDone(true), 1400);
          later(() => { if (!doneRef.current) { doneRef.current = true; onDone?.(); } }, 3000);
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
      style={{ background: "radial-gradient(circle at 50% 35%, #33200C 0%, #120A03 78%)" }}
      initial={{ opacity: 0 }}
      animate={{ opacity: done ? [1, 1, 0] : 1 }}
      transition={done ? { duration: 1.6, times: [0, 0.7, 1] } : { duration: 0.4 }}
      onClick={smash}
      data-testid="chest-cover"
    >
      <div className="pointer-events-none absolute left-1/2 top-3 z-20 -translate-x-1/2 whitespace-nowrap rounded-full bg-black/60 px-4 py-1 font-sans text-[11px] font-bold uppercase tracking-[0.2em] text-[#F0C878]" data-testid="rare-fate-badge">
        ✦ {t("Rare fate")} ✦
      </div>

      <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-4">
        <motion.div
          className="relative w-full max-w-[19rem]"
          animate={hits > 0 && !open ? { x: [0, -7, 7, -4, 0], rotate: [0, -1.5, 1.5, 0] } : {}}
          transition={{ duration: 0.35 }}
          key={`shake-${hits}`}
          data-testid="chest-box"
        >
          {/* golden light bursting out once open */}
          <div
            className="pointer-events-none absolute inset-[-16%] transition-opacity duration-500"
            style={{ background: "radial-gradient(ellipse at 50% 40%, rgba(255,200,80,0.55) 0%, rgba(255,200,80,0) 70%)", filter: "blur(12px)", opacity: open ? 1 : 0 }}
          />
          <img
            src="/hoard-chest-closed.png"
            alt=""
            className="relative w-full select-none object-contain transition-opacity duration-400"
            style={{ opacity: open ? 0 : 1, filter: "drop-shadow(0 10px 18px rgba(0,0,0,0.6))" }}
            draggable={false}
          />
          <img
            src="/hoard-chest-open.png"
            alt=""
            className="absolute bottom-0 left-1/2 w-[86%] -translate-x-1/2 select-none object-contain transition-opacity duration-400"
            style={{ opacity: open ? 1 : 0, filter: "drop-shadow(0 0 26px rgba(255,200,80,0.45)) drop-shadow(0 10px 18px rgba(0,0,0,0.6))" }}
            draggable={false}
          />
          {/* coin fountain */}
          {open && (
            <div className="pointer-events-none absolute inset-0" data-testid="chest-coins">
              {Array.from({ length: 16 }).map((_, i) => (
                <motion.span
                  key={i}
                  className="absolute left-1/2 top-1/3 h-2.5 w-2.5 rounded-full"
                  style={{ background: "radial-gradient(circle at 35% 30%, #FFE9A8, #E6B23A 60%, #9C7318)", boxShadow: "0 0 6px rgba(255,220,120,0.8)" }}
                  initial={{ opacity: 0, x: 0, y: 0, scale: 0.6 }}
                  animate={{
                    opacity: [0, 1, 1, 0],
                    x: (i % 2 ? 1 : -1) * (12 + (i * 17) % 110),
                    y: [0, -(70 + (i * 23) % 70), 60],
                    scale: [0.6, 1, 0.9],
                    rotate: (i % 2 ? 1 : -1) * 200,
                  }}
                  transition={{ duration: 1.2 + (i % 4) * 0.15, delay: (i % 6) * 0.08, ease: "easeOut" }}
                />
              ))}
            </div>
          )}
        </motion.div>

        {!open ? (
          <div className="flex flex-col items-center gap-2">
            <p className="text-center font-serif text-lg font-bold text-[#F0C878]" data-testid="chest-prompt">{t("Break the lock!")}</p>
            <div className="flex gap-2" data-testid="chest-dots">
              {Array.from({ length: HITS }).map((_, i) => (
                <span key={i} className={`h-2.5 w-2.5 rounded-full transition-colors ${i < hits ? "bg-[#F0C878]" : "bg-white/20"}`} />
              ))}
            </div>
          </div>
        ) : (
          <motion.p
            className="text-center font-serif text-xl font-bold text-[#FFE9A8]"
            style={{ textShadow: "0 0 16px rgba(255,210,100,0.8)" }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
            data-testid="chest-done"
          >
            {t("The hoard yields your fate!")}
          </motion.p>
        )}
      </div>
    </motion.div>
  );
}
