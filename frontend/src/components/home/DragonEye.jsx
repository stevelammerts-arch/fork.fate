import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useLang } from "../../i18n/i18n";

const WAKES = 3;

// Deep rumble per tap on the sleeping dragon (respects mute).
function makeRumble() {
  try {
    if (localStorage.getItem("ff_muted") === "1") return () => {};
    const Ctx = window.AudioContext || window.webkitAudioContext;
    const ctx = new Ctx();
    return () => {
      try {
        const osc = ctx.createOscillator();
        osc.type = "sine";
        osc.frequency.setValueAtTime(55, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + 0.5);
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.5, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.55);
        osc.connect(g).connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.6);
      } catch (e) { /* audio */ }
    };
  } catch (e) {
    return () => {};
  }
}

/** Dragon's Hoard rare ritual: a sleeping dragon's eye fills the card.
 * Tap it three times — the lid twitches, then snaps open and the molten
 * eye fixes on your fate. */
export function DragonEye({ onDone }) {
  const { t } = useLang();
  const [wakes, setWakes] = useState(0);
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState(false);
  const doneRef = useRef(false);
  const timersRef = useRef([]);
  const rumbleRef = useRef(null);

  const later = (fn, ms) => { const id = setTimeout(fn, ms); timersRef.current.push(id); };

  const poke = () => {
    if (open) return;
    if (!rumbleRef.current) rumbleRef.current = makeRumble();
    rumbleRef.current();
    setWakes((prev) => {
      const next = Math.min(prev + 1, WAKES);
      if (next >= WAKES && !open) {
        later(() => {
          setOpen(true);
          const roar = new Audio("/reveal-dragon.mp3");
          roar.volume = 0.9;
          if (localStorage.getItem("ff_muted") !== "1") roar.play().catch(() => {});
          later(() => setDone(true), 1400);
          later(() => { if (!doneRef.current) { doneRef.current = true; onDone?.(); } }, 3000);
        }, 450);
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
      style={{ background: "radial-gradient(circle at 50% 40%, #3A1408 0%, #140602 78%)" }}
      initial={{ opacity: 0 }}
      animate={{ opacity: done ? [1, 1, 0] : 1 }}
      transition={done ? { duration: 1.6, times: [0, 0.7, 1] } : { duration: 0.4 }}
      onClick={poke}
      data-testid="dragon-eye-cover"
    >
      <div className="pointer-events-none absolute left-1/2 top-3 z-20 -translate-x-1/2 whitespace-nowrap rounded-full bg-black/60 px-4 py-1 font-sans text-[11px] font-bold uppercase tracking-[0.2em] text-[#E6B23A]" data-testid="rare-fate-badge">
        ✦ {t("Rare fate")} ✦
      </div>

      <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 px-4">
        {/* the eye: closed render crossfades to the open one */}
        <motion.div
          className="relative w-full max-w-[21rem]"
          animate={wakes > 0 && !open ? { x: [0, -5, 5, -3, 0] } : {}}
          transition={{ duration: 0.4 }}
          key={`shake-${wakes}`}
          data-testid="dragon-eye"
        >
          {/* molten glow bleeding out once awake */}
          <div
            className="pointer-events-none absolute inset-[-14%] transition-opacity duration-700"
            style={{ background: "radial-gradient(ellipse at 50% 50%, rgba(255,160,40,0.5) 0%, rgba(255,160,40,0) 70%)", filter: "blur(12px)", opacity: open ? 1 : 0 }}
          />
          <img
            src="/hoard-eye-closed.png"
            alt=""
            className="relative w-full select-none object-contain transition-opacity duration-700"
            style={{ opacity: open ? 0 : 1, filter: `drop-shadow(0 8px 16px rgba(0,0,0,0.6)) brightness(${1 + wakes * 0.12})` }}
            draggable={false}
          />
          <img
            src="/hoard-eye-open.png"
            alt=""
            className="absolute left-1/2 top-1/2 w-[88%] -translate-x-1/2 -translate-y-1/2 select-none object-contain transition-opacity duration-700"
            style={{ opacity: open ? 1 : 0, filter: "drop-shadow(0 0 26px rgba(255,170,50,0.45)) drop-shadow(0 8px 16px rgba(0,0,0,0.6))" }}
            draggable={false}
          />
        </motion.div>

        {/* rising embers once the dragon wakes */}
        {open && (
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            {Array.from({ length: 14 }).map((_, i) => (
              <motion.span
                key={i}
                className="absolute h-1.5 w-1.5 rounded-full"
                style={{ left: `${12 + (i * 76) % 78}%`, bottom: "18%", background: i % 3 ? "#FFB03A" : "#FF6E28", boxShadow: "0 0 8px rgba(255,150,40,0.9)" }}
                initial={{ opacity: 0, y: 0 }}
                animate={{ opacity: [0, 1, 0], y: -(90 + (i * 37) % 120), x: (i % 2 ? 1 : -1) * ((i * 13) % 34) }}
                transition={{ duration: 1.5 + (i % 5) * 0.2, delay: (i % 7) * 0.12 }}
              />
            ))}
          </div>
        )}

        {!open ? (
          <div className="flex flex-col items-center gap-2">
            <p className="text-center font-serif text-lg font-bold text-[#F0C878]" data-testid="dragon-eye-prompt">{t("The dragon sleeps... tap to wake it")}</p>
            <div className="flex gap-2" data-testid="dragon-eye-dots">
              {Array.from({ length: WAKES }).map((_, i) => (
                <span key={i} className={`h-2.5 w-2.5 rounded-full transition-colors ${i < wakes ? "bg-[#E6B23A]" : "bg-white/20"}`} />
              ))}
            </div>
          </div>
        ) : (
          <motion.p
            className="text-center font-serif text-xl font-bold text-[#FFD98A]"
            style={{ textShadow: "0 0 16px rgba(255,180,60,0.8)" }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
            data-testid="dragon-eye-done"
          >
            {t("The dragon SEES your fate...")}
          </motion.p>
        )}
      </div>
    </motion.div>
  );
}
