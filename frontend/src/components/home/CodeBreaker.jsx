import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useLang } from "../../i18n/i18n";

// Short square-wave blip (respects mute). freq differs for ok / error.
function makeBlipper() {
  try {
    if (localStorage.getItem("ff_muted") === "1") return () => {};
    const Ctx = window.AudioContext || window.webkitAudioContext;
    const ctx = new Ctx();
    return (freq = 880, dur = 0.06) => {
      try {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = "square";
        o.frequency.value = freq;
        g.gain.setValueAtTime(0.03, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
        o.connect(g).connect(ctx.destination);
        o.start();
        o.stop(ctx.currentTime + dur + 0.01);
      } catch (e) { /* audio */ }
    };
  } catch (e) {
    return () => {};
  }
}

const PAD = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0];

/** Cyberscape rare ritual #2: a futuristic keypad lock. A 5-digit access
 * code glows at the top — punch it into the number pad to decrypt the fate.
 * Wrong digits flash ACCESS DENIED; completing the code unlocks the reveal. */
export function CodeBreaker({ onDone }) {
  const { t } = useLang();
  // Random 5-digit code, generated once per mount.
  const code = useMemo(() => Array.from({ length: 5 }, () => Math.floor(Math.random() * 10)), []);
  const [pos, setPos] = useState(0);          // next index to enter
  const [denied, setDenied] = useState(false); // wrong-key flash
  const [granted, setGranted] = useState(false);
  const doneRef = useRef(false);
  const blipRef = useRef(null);

  const press = (n) => {
    if (granted) return;
    if (!blipRef.current) blipRef.current = makeBlipper();
    const blip = blipRef.current;
    if (n === code[pos]) {
      blip(920 + pos * 110);
      const next = pos + 1;
      setPos(next);
      setDenied(false);
      if (next === code.length) {
        setGranted(true);
        blip(1400, 0.12);
        const zap = new Audio("/reveal-cyber.mp3?v=3");
        zap.volume = 0.85;
        if (localStorage.getItem("ff_muted") !== "1") zap.play().catch(() => {});
        setTimeout(() => { if (!doneRef.current) { doneRef.current = true; onDone?.(); } }, 1500);
      }
    } else {
      blip(180, 0.14);
      setDenied(true);
      setTimeout(() => setDenied(false), 500);
    }
  };

  useEffect(() => () => { doneRef.current = true; }, []);

  return (
    <motion.div
      className="absolute inset-0 z-40 overflow-hidden rounded-2xl"
      style={{ background: "radial-gradient(circle at 50% 20%, #06222B 0%, #030B12 75%)" }}
      initial={{ opacity: 0 }}
      animate={{ opacity: granted ? [1, 1, 0] : 1, x: denied ? [0, -7, 7, -4, 4, 0] : 0 }}
      transition={granted ? { duration: 1.5, times: [0, 0.75, 1] } : denied ? { duration: 0.35 } : { duration: 0.4 }}
      data-testid="code-breaker-cover"
    >
      {/* CRT scanlines */}
      <div className="pointer-events-none absolute inset-0 opacity-25" style={{ backgroundImage: "repeating-linear-gradient(0deg, rgba(34,211,238,0.16) 0px, rgba(34,211,238,0.16) 1px, transparent 1px, transparent 3px)" }} />

      <div className="pointer-events-none absolute left-1/2 top-3 z-20 -translate-x-1/2 whitespace-nowrap rounded-full bg-black/60 px-4 py-1 font-sans text-[11px] font-bold uppercase tracking-[0.2em] text-[#22D3EE]" data-testid="rare-fate-badge">
        ✦ {t("Rare fate")} ✦
      </div>

      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-4 pt-6">
        {/* Access code display */}
        <p className="font-mono text-[11px] font-bold uppercase tracking-[0.3em] text-[#7FE9FA]">{t("Access code")}</p>
        <div className="flex gap-2" data-testid="code-breaker-code">
          {code.map((d, i) => (
            <span
              key={i}
              className={`grid h-10 w-8 place-items-center rounded-md border font-mono text-xl font-bold transition-colors ${i < pos ? "border-[#3AE08A] bg-[#3AE08A]/15 text-[#3AE08A]" : "border-[#22D3EE]/60 bg-[#22D3EE]/5 text-[#BFF6FF]"}`}
              style={{ textShadow: i < pos ? "0 0 10px rgba(58,224,138,0.8)" : "0 0 10px rgba(34,211,238,0.7)" }}
              data-testid={`code-digit-${i}`}
            >
              {d}
            </span>
          ))}
        </div>

        <p className={`h-5 font-mono text-xs font-bold uppercase tracking-[0.25em] ${granted ? "text-[#3AE08A]" : denied ? "text-[#FF5470]" : "text-[#5F7C86]"}`} data-testid="code-breaker-status">
          {granted ? t("Access granted") : denied ? t("Access denied") : t("Enter the code to decrypt")}
        </p>

        {/* Number pad */}
        <div className="grid grid-cols-3 gap-2" data-testid="code-breaker-pad">
          {PAD.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => press(n)}
              data-testid={`code-key-${n}`}
              className={`h-11 w-16 rounded-lg border font-mono text-lg font-bold text-[#BFF6FF] transition-all active:scale-95 ${n === 0 ? "col-start-2" : ""} border-[#22D3EE]/40 bg-[#22D3EE]/5 hover:border-[#22D3EE] hover:bg-[#22D3EE]/15 hover:shadow-[0_0_14px_rgba(34,211,238,0.4)]`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
