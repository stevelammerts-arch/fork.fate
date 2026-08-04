import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useLang } from "../../i18n/i18n";

const TAPS_NEEDED = 4;

// Low rumble thump per tap (respects mute).
function makeRumbler() {
  try {
    if (localStorage.getItem("ff_muted") === "1") return () => {};
    const Ctx = window.AudioContext || window.webkitAudioContext;
    const ctx = new Ctx();
    return () => {
      try {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = "sine";
        o.frequency.setValueAtTime(70, ctx.currentTime);
        o.frequency.exponentialRampToValueAtTime(38, ctx.currentTime + 0.28);
        g.gain.setValueAtTime(0.14, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.3);
        o.connect(g).connect(ctx.destination);
        o.start();
        o.stop(ctx.currentTime + 0.32);
      } catch (e) { /* audio */ }
    };
  } catch (e) {
    return () => {};
  }
}

// Painterly island volcano (AI-generated asset); crater glow overlay and a
// brightness lift make it visibly "wake up" as `heat` (0..1) climbs.
function VolcanoArt({ heat }) {
  return (
    <div className="relative">
      <img
        src="/tiki-volcano.png"
        alt=""
        className="h-52 w-auto max-w-[20rem] select-none object-contain"
        style={{ filter: `brightness(${0.9 + heat * 0.3}) drop-shadow(0 8px 16px rgba(0,0,0,0.6))` }}
        draggable={false}
      />
      {/* crater heat glow — brightens as the volcano wakes */}
      <div
        className="pointer-events-none absolute left-1/2 top-[-4%] h-[34%] w-[46%] -translate-x-1/2 rounded-full transition-opacity duration-300"
        style={{ background: "radial-gradient(ellipse at 50% 60%, rgba(255,210,122,0.9) 0%, rgba(255,122,47,0.55) 45%, rgba(255,84,40,0) 75%)", filter: "blur(6px)", opacity: 0.15 + heat * 0.85 }}
      />
    </div>
  );
}

/** Tiki Lounge rare ritual #2: wake the island volcano. Each tap rumbles it
 * harder and heats the crater; on the final tap it ERUPTS — lava bombs,
 * smoke and a blast (user-uploaded explosion) — and the fate emerges. */
export function VolcanoReveal({ onDone }) {
  const { t } = useLang();
  const [taps, setTaps] = useState(0);
  const [erupting, setErupting] = useState(false);
  const doneRef = useRef(false);
  const rumbleRef = useRef(null);
  const [rumbleKey, setRumbleKey] = useState(0);

  const poke = () => {
    if (erupting) return;
    if (!rumbleRef.current) rumbleRef.current = makeRumbler();
    rumbleRef.current();
    setRumbleKey((k) => k + 1);
    const next = taps + 1;
    setTaps(next);
    if (next >= TAPS_NEEDED) {
      setTimeout(() => {
        setErupting(true);
        const boom = new Audio("/reveal-volcano.mp3");
        boom.volume = 0.9;
        if (localStorage.getItem("ff_muted") !== "1") boom.play().catch(() => {});
        setTimeout(() => { if (!doneRef.current) { doneRef.current = true; onDone?.(); } }, 2300);
      }, 300);
    }
  };

  // Reset on (re)mount so StrictMode's simulated unmount can't poison the
  // guard; a real unmount still cancels the pending onDone.
  useEffect(() => { doneRef.current = false; return () => { doneRef.current = true; }; }, []);

  const heat = Math.min(taps / TAPS_NEEDED, 1);
  const shakeAmp = 2 + taps * 2;

  // Lava bombs: deterministic fan of glowing rocks flung from the crater.
  const bombs = Array.from({ length: 11 }, (_, i) => ({
    x: (i - 5) * 34,
    y: -90 - ((i * 37) % 70),
    s: 8 + ((i * 13) % 10),
    d: 0.05 + (i % 4) * 0.08,
  }));

  return (
    <motion.div
      className="absolute inset-0 z-40 overflow-hidden rounded-2xl"
      style={{ background: "radial-gradient(circle at 50% 85%, #2A1108 0%, #0C0705 70%)" }}
      initial={{ opacity: 0 }}
      animate={{ opacity: erupting ? [1, 1, 0] : 1 }}
      transition={erupting ? { duration: 2.3, times: [0, 0.8, 1] } : { duration: 0.4 }}
      data-testid="volcano-cover"
    >
      <div className="pointer-events-none absolute left-1/2 top-3 z-20 -translate-x-1/2 whitespace-nowrap rounded-full bg-black/60 px-4 py-1 font-sans text-[11px] font-bold uppercase tracking-[0.2em] text-[#FF8A3C]" data-testid="rare-fate-badge">
        ✦ {t("Rare fate")} ✦
      </div>

      {/* eruption flash */}
      {erupting && (
        <motion.div className="pointer-events-none absolute inset-0 bg-[#FFB067]" initial={{ opacity: 0 }} animate={{ opacity: [0, 0.75, 0] }} transition={{ duration: 0.9 }} />
      )}

      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 pt-4">
        <motion.div
          key={rumbleKey}
          animate={erupting ? { y: [0, -6, 0], x: [0, -4, 4, -3, 3, 0] } : { x: [0, -shakeAmp, shakeAmp, -shakeAmp * 0.6, shakeAmp * 0.6, 0] }}
          transition={{ duration: erupting ? 0.6 : 0.4 }}
          onClick={poke}
          className="relative cursor-pointer touch-none"
          data-testid="volcano-mount"
          role="button"
          aria-label={t("Wake the volcano")}
        >
          <VolcanoArt heat={heat} />
          {/* lava bombs on eruption */}
          {erupting && bombs.map((b, i) => (
            <motion.div
              key={i}
              className="pointer-events-none absolute left-1/2 top-[4%] rounded-full"
              style={{ width: b.s, height: b.s, background: "radial-gradient(circle at 35% 30%, #FFD27A, #FF5428 70%)", boxShadow: "0 0 12px 3px rgba(255,110,40,0.8)" }}
              initial={{ x: 0, y: 0, opacity: 0 }}
              animate={{ x: b.x, y: [0, b.y, b.y + 130], opacity: [0, 1, 1, 0] }}
              transition={{ delay: b.d, duration: 1.5, ease: "easeOut" }}
            />
          ))}
          {/* smoke column */}
          {erupting && [0, 1, 2].map((i) => (
            <motion.div
              key={`s-${i}`}
              className="pointer-events-none absolute left-1/2 top-[-12%] -translate-x-1/2 rounded-full"
              style={{ width: 60 + i * 26, height: 60 + i * 26, background: "radial-gradient(circle, rgba(90,80,74,0.55), rgba(90,80,74,0) 70%)", filter: "blur(6px)" }}
              initial={{ y: 20, opacity: 0, scale: 0.5 }}
              animate={{ y: -110 - i * 34, opacity: [0, 0.8, 0], scale: 1.8 }}
              transition={{ delay: 0.15 + i * 0.18, duration: 1.9, ease: "easeOut" }}
            />
          ))}
        </motion.div>

        {!erupting ? (
          <>
            <p className="font-serif text-lg italic text-[#FFE9BF]" data-testid="volcano-prompt">{t("Tap to wake the volcano!")}</p>
            <div className="flex gap-1.5" data-testid="volcano-taps">
              {Array.from({ length: TAPS_NEEDED }, (_, i) => (
                <span key={i} className={`h-2.5 w-2.5 rounded-full transition-colors ${i < taps ? "bg-[#FF5428]" : "bg-white/20"}`} />
              ))}
            </div>
          </>
        ) : (
          <p className="font-serif text-lg font-bold uppercase tracking-[0.15em] text-[#FFD27A]" data-testid="volcano-done">{t("Eruption! Fate emerges!")}</p>
        )}
      </div>
    </motion.div>
  );
}
