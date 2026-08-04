import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useLang } from "../../i18n/i18n";

const KNOCKS_NEEDED = 3;

// Deep hollow knock (respects mute).
function makeKnocker() {
  try {
    if (localStorage.getItem("ff_muted") === "1") return () => {};
    const Ctx = window.AudioContext || window.webkitAudioContext;
    const ctx = new Ctx();
    return () => {
      try {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = "sine";
        o.frequency.setValueAtTime(120, ctx.currentTime);
        o.frequency.exponentialRampToValueAtTime(55, ctx.currentTime + 0.12);
        g.gain.setValueAtTime(0.35, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.16);
        o.connect(g).connect(ctx.destination);
        o.start();
        o.stop(ctx.currentTime + 0.18);
      } catch (e) { /* audio */ }
    };
  } catch (e) {
    return () => {};
  }
}

// Realistic wooden coffin (AI-generated 3D renders): crossfades from the
// closed casket to the creaked-open one spilling soul-green light.
function CoffinArt({ open }) {
  return (
    <div className="relative h-60 w-48">
      {/* soul-green glow blooming behind the open coffin */}
      <div
        className="pointer-events-none absolute inset-[-12%] transition-opacity duration-700"
        style={{ background: "radial-gradient(ellipse at 50% 45%, rgba(88,224,138,0.45) 0%, rgba(88,224,138,0) 70%)", filter: "blur(10px)", opacity: open ? 1 : 0 }}
      />
      <img
        src="/reaper-coffin-closed.png"
        alt=""
        className="absolute inset-0 h-full w-full select-none object-contain transition-opacity duration-500"
        style={{ opacity: open ? 0 : 1, filter: "drop-shadow(0 10px 18px rgba(0,0,0,0.6))" }}
        draggable={false}
      />
      <img
        src="/reaper-coffin-open.png"
        alt=""
        className="absolute inset-0 h-full w-full select-none object-contain transition-opacity duration-500"
        style={{ opacity: open ? 1 : 0, filter: "drop-shadow(0 0 22px rgba(88,224,138,0.35)) drop-shadow(0 10px 18px rgba(0,0,0,0.6))" }}
        draggable={false}
      />
    </div>
  );
}

/** Reaper rare ritual: knock three times on the coffin. It creaks open and
 * the fate rises out in soul-light. */
export function CoffinKnock({ onDone }) {
  const { t } = useLang();
  const [knocks, setKnocks] = useState(0);
  const [open, setOpen] = useState(false);
  const doneRef = useRef(false);
  const knockRef = useRef(null);
  const [shakeKey, setShakeKey] = useState(0);

  const knock = () => {
    if (open) return;
    if (!knockRef.current) knockRef.current = makeKnocker();
    knockRef.current();
    setShakeKey((k) => k + 1);
    const next = knocks + 1;
    setKnocks(next);
    if (next >= KNOCKS_NEEDED) {
      setTimeout(() => {
        setOpen(true);
        const thunder = new Audio("/reveal-thunder-v4.mp3");
        thunder.volume = 0.85;
        if (localStorage.getItem("ff_muted") !== "1") thunder.play().catch(() => {});
        setTimeout(() => { if (!doneRef.current) { doneRef.current = true; onDone?.(); } }, 2200);
      }, 400);
    }
  };

  // Reset on (re)mount so StrictMode's simulated unmount can't poison the
  // guard; a real unmount still cancels the pending onDone.
  useEffect(() => { doneRef.current = false; return () => { doneRef.current = true; }; }, []);

  return (
    <motion.div
      className="absolute inset-0 z-40 overflow-hidden rounded-2xl"
      style={{ background: "radial-gradient(circle at 50% 80%, #17131D 0%, #070509 75%)" }}
      initial={{ opacity: 0 }}
      animate={{ opacity: open ? [1, 1, 0] : 1 }}
      transition={open ? { duration: 2.2, times: [0, 0.8, 1] } : { duration: 0.4 }}
      data-testid="coffin-cover"
    >
      <div className="pointer-events-none absolute left-1/2 top-3 z-20 -translate-x-1/2 whitespace-nowrap rounded-full bg-black/60 px-4 py-1 font-sans text-[11px] font-bold uppercase tracking-[0.2em] text-[#8FE3A8]" data-testid="rare-fate-badge">
        ✦ {t("Rare fate")} ✦
      </div>

      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 pt-4">
        <motion.div
          key={shakeKey}
          animate={open ? {} : { x: [0, -5, 5, -3, 3, 0], rotate: [0, -1, 1, 0] }}
          transition={{ duration: 0.3 }}
          onClick={knock}
          className="relative cursor-pointer touch-none"
          data-testid="coffin-lid"
          role="button"
          aria-label={t("Knock on the coffin")}
        >
          <CoffinArt open={open} />
          {/* soul wisps drifting out once open */}
          {open && [0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="pointer-events-none absolute left-1/2 top-[35%] rounded-full"
              style={{ width: 16 + i * 8, height: 16 + i * 8, background: "radial-gradient(circle, rgba(143,227,168,0.85), rgba(143,227,168,0) 70%)", filter: "blur(2px)" }}
              initial={{ x: 0, y: 0, opacity: 0 }}
              animate={{ x: (i - 1) * 44, y: -120 - i * 26, opacity: [0, 0.95, 0] }}
              transition={{ delay: 0.7 + i * 0.25, duration: 1.6, ease: "easeOut" }}
            />
          ))}
        </motion.div>

        {!open ? (
          <>
            <p className="font-serif text-lg italic text-[#D8CBEF]" data-testid="coffin-prompt">{t("Knock three times...")}</p>
            <div className="flex gap-1.5" data-testid="coffin-knock-dots">
              {Array.from({ length: KNOCKS_NEEDED }, (_, i) => (
                <span key={i} className={`h-2.5 w-2.5 rounded-full transition-colors ${i < knocks ? "bg-[#8FE3A8]" : "bg-white/20"}`} />
              ))}
            </div>
          </>
        ) : (
          <p className="font-serif text-lg font-bold uppercase tracking-[0.15em] text-[#8FE3A8]" data-testid="coffin-done">{t("The Reaper answers...")}</p>
        )}
      </div>
    </motion.div>
  );
}
