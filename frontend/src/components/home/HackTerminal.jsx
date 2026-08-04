import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useLang } from "../../i18n/i18n";

const GLYPHS = "!<>-_\\/[]{}—=+*^?#$%&@01";
const randGlyph = () => GLYPHS[Math.floor(Math.random() * GLYPHS.length)];

// Short square-wave blip for each typed character (respects mute).
function makeBlipper() {
  try {
    if (localStorage.getItem("ff_muted") === "1") return () => {};
    const Ctx = window.AudioContext || window.webkitAudioContext;
    const ctx = new Ctx();
    return (freq = 880) => {
      try {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = "square";
        o.frequency.value = freq;
        g.gain.setValueAtTime(0.025, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.05);
        o.connect(g).connect(ctx.destination);
        o.start();
        o.stop(ctx.currentTime + 0.06);
      } catch (e) { /* audio */ }
    };
  } catch (e) {
    return () => {};
  }
}

/** Cyberscape rare ritual: a CRT hacking terminal. Tap to jack in — the
 * terminal types a breach log, then decrypts the winning spot's name
 * character by character before handing back to the normal reveal. */
export function HackTerminal({ name, onDone }) {
  const { t } = useLang();
  const [hacking, setHacking] = useState(false);
  const [lines, setLines] = useState([]);       // completed log lines
  const [typing, setTyping] = useState("");     // line currently being typed
  const [decrypted, setDecrypted] = useState(null); // scrambling winner name
  const [acquired, setAcquired] = useState(false);
  const doneRef = useRef(false);
  const timersRef = useRef([]);

  const later = (fn, ms) => { const id = setTimeout(fn, ms); timersRef.current.push(id); return id; };

  const jackIn = () => {
    if (hacking) return;
    setHacking(true);
    const blip = makeBlipper();
    const LOG = [t("> breaching fate.net ..."), t("> access granted"), t("> decrypting target ...")];
    let li = 0;

    const typeLine = () => {
      const line = LOG[li];
      let ci = 0;
      const tick = () => {
        ci += 1;
        setTyping(line.slice(0, ci));
        if (ci % 2 === 0) blip(700 + (ci % 5) * 90);
        if (ci < line.length) later(tick, 34);
        else {
          setLines((prev) => [...prev, line]);
          setTyping("");
          li += 1;
          if (li < LOG.length) later(typeLine, 300);
          else later(decrypt, 350);
        }
      };
      tick();
    };

    const decrypt = () => {
      const target = name || "????";
      const total = 28; // scramble frames
      let frame = 0;
      const step = () => {
        frame += 1;
        const solved = Math.floor((frame / total) * target.length);
        let out = "";
        for (let i = 0; i < target.length; i++) {
          out += i < solved ? target[i] : (target[i] === " " ? " " : randGlyph());
        }
        setDecrypted(out);
        if (frame % 3 === 0) blip(1100);
        if (frame < total) later(step, 55);
        else {
          setDecrypted(target);
          setAcquired(true);
          const zap = new Audio("/reveal-cyber.mp3?v=3");
          zap.volume = 0.85;
          if (localStorage.getItem("ff_muted") !== "1") zap.play().catch(() => {});
          later(() => { if (!doneRef.current) { doneRef.current = true; onDone?.(); } }, 1400);
        }
      };
      step();
    };

    typeLine();
  };

  // Reset on (re)mount so StrictMode's simulated unmount can't poison the
  // guard; a real unmount still cancels timers and the pending onDone.
  useEffect(() => { doneRef.current = false; return () => { doneRef.current = true; timersRef.current.forEach(clearTimeout); }; }, []);

  return (
    <motion.div
      className="absolute inset-0 z-40 overflow-hidden rounded-2xl"
      style={{ background: "radial-gradient(circle at 50% 30%, #17102A 0%, #07040F 78%)" }}
      initial={{ opacity: 0 }}
      animate={{ opacity: acquired ? [1, 1, 0] : 1 }}
      transition={acquired ? { duration: 1.4, times: [0, 0.75, 1] } : { duration: 0.4 }}
      data-testid="hack-terminal-cover"
    >
      {/* CRT scanlines + flicker */}
      <div className="pointer-events-none absolute inset-0 opacity-30" style={{ backgroundImage: "repeating-linear-gradient(0deg, rgba(178,77,224,0.14) 0px, rgba(178,77,224,0.14) 1px, transparent 1px, transparent 3px)" }} />
      <motion.div className="pointer-events-none absolute inset-0 bg-[#B24DE0]" animate={{ opacity: [0, 0.05, 0, 0.03, 0] }} transition={{ duration: 2.2, repeat: Infinity }} />

      <div className="pointer-events-none absolute left-1/2 top-4 z-20 -translate-x-1/2 whitespace-nowrap rounded-full bg-black/60 px-4 py-1.5 font-sans text-xs font-bold uppercase tracking-[0.2em] text-[#B24DE0]" data-testid="rare-fate-badge">
        ✦ {t("Rare fate")} ✦
      </div>

      {!hacking ? (
        <div className="absolute inset-0 grid place-items-center">
          <div className="flex flex-col items-center gap-5">
            <button
              type="button"
              onClick={jackIn}
              data-testid="hack-terminal-jack-in"
              aria-label={t("Jack in")}
              className="rounded-md border-2 border-[#B24DE0] bg-[#B24DE0]/10 px-8 py-4 font-mono text-lg font-bold tracking-[0.25em] text-[#E3B7FF] shadow-[0_0_24px_rgba(178,77,224,0.45)] transition-colors hover:bg-[#B24DE0]/25"
            >
              {t("JACK IN")}
              <motion.span animate={{ opacity: [1, 0, 1] }} transition={{ duration: 0.9, repeat: Infinity }}>_</motion.span>
            </button>
            <p className="font-mono text-sm text-[#8FE38F]" data-testid="hack-terminal-prompt">
              {t("> intrusion detected — a fate is encrypted here")}
            </p>
          </div>
        </div>
      ) : (
        <div className="absolute inset-0 flex flex-col justify-center px-6 font-mono text-[15px] leading-7 sm:px-10" data-testid="hack-terminal-log">
          {lines.map((l, i) => (
            <p key={i} className="text-[#8FE38F]">{l}</p>
          ))}
          {typing && (
            <p className="text-[#8FE38F]">{typing}<span className="animate-pulse">▌</span></p>
          )}
          {decrypted && (
            <p className="mt-3 break-words text-xl font-bold text-[#E3B7FF]" style={{ textShadow: "0 0 12px rgba(178,77,224,0.8)" }} data-testid="hack-terminal-name">
              {decrypted}
            </p>
          )}
          {acquired && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-2 text-sm font-bold uppercase tracking-[0.3em] text-[#B24DE0]" data-testid="hack-terminal-acquired">
              {t("> target acquired")}
            </motion.p>
          )}
        </div>
      )}
    </motion.div>
  );
}
