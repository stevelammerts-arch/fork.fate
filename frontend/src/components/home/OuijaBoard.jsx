import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useLang } from "../../i18n/i18n";

const ROW1 = "ABCDEFGHIJKLM".split("");
const ROW2 = "NOPQRSTUVWXYZ".split("");
const ROW3 = "1234567890".split("");
const MAX_SPELLED = 12; // long names get truncated with an ellipsis
const MOVE_MS = 520;
const PAUSE_MS = 150;

// Soft felt-on-wood slide per planchette move (respects mute).
function makeSlider() {
  try {
    if (localStorage.getItem("ff_muted") === "1") return () => {};
    const Ctx = window.AudioContext || window.webkitAudioContext;
    const ctx = new Ctx();
    return () => {
      try {
        const len = Math.floor(ctx.sampleRate * 0.22);
        const buf = ctx.createBuffer(1, len, ctx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < len; i++) {
          const t = i / len;
          data[i] = (Math.random() * 2 - 1) * Math.sin(Math.PI * t) * 0.6;
        }
        const src = ctx.createBufferSource();
        src.buffer = buf;
        const lp = ctx.createBiquadFilter();
        lp.type = "lowpass";
        lp.frequency.value = 900;
        const g = ctx.createGain();
        g.gain.value = 0.14;
        src.connect(lp).connect(g).connect(ctx.destination);
        src.start();
      } catch (e) { /* audio */ }
    };
  } catch (e) {
    return () => {};
  }
}

/** Reaper rare ritual: a ouija board. Tap the board and the planchette drags
 * itself from letter to letter, spelling out the winning spot before sliding
 * to GOOD BYE. */
export function OuijaBoard({ name, onDone }) {
  const { t } = useLang();
  const [running, setRunning] = useState(false);
  const [spelled, setSpelled] = useState("");
  const [active, setActive] = useState(null); // glyph currently under the lens
  const [farewell, setFarewell] = useState(false);
  const doneRef = useRef(false);
  const timersRef = useRef([]);
  const boardRef = useRef(null);
  const glyphRefs = useRef({});
  const byeRef = useRef(null);
  const slideRef = useRef(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });

  const later = (fn, ms) => { const id = setTimeout(fn, ms); timersRef.current.push(id); return id; };

  // Planchette lens sits ~34% from its top; park it centered over a target.
  const aimAt = (el) => {
    const board = boardRef.current;
    if (!el || !board) return;
    const b = board.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    setPos({ x: r.left + r.width / 2 - b.left - 34, y: r.top + r.height / 2 - b.top - 24 });
  };

  const begin = () => {
    if (running) return;
    setRunning(true);
    if (!slideRef.current) slideRef.current = makeSlider();
    const target = (name || "FATE").toUpperCase();
    let idx = 0;
    let used = 0; // alphanumeric glyphs visited so far

    const step = () => {
      if (idx >= target.length || used >= MAX_SPELLED) {
        if (idx < target.length) setSpelled((s) => s + "…");
        return later(farewellMove, 500);
      }
      const ch = target[idx];
      idx += 1;
      const el = glyphRefs.current[ch];
      if (!el) {
        // spaces / punctuation: append silently, no planchette move
        setSpelled((s) => s + ch);
        return later(step, 60);
      }
      used += 1;
      aimAt(el);
      setActive(ch);
      slideRef.current();
      later(() => {
        setSpelled((s) => s + ch);
        later(step, PAUSE_MS);
      }, MOVE_MS);
    };

    const farewellMove = () => {
      aimAt(byeRef.current);
      setActive("BYE");
      slideRef.current();
      later(() => {
        setFarewell(true);
        const thunder = new Audio("/reveal-thunder-v4.mp3");
        thunder.volume = 0.85;
        if (localStorage.getItem("ff_muted") !== "1") thunder.play().catch(() => {});
        later(() => { if (!doneRef.current) { doneRef.current = true; onDone?.(); } }, 1800);
      }, 700);
    };

    step();
  };

  // Reset on (re)mount so StrictMode's simulated unmount can't poison the
  // guard; a real unmount still cancels timers and the pending onDone.
  useEffect(() => { doneRef.current = false; return () => { doneRef.current = true; timersRef.current.forEach(clearTimeout); }; }, []);

  const glyphCls = (ch) =>
    `font-serif text-[15px] leading-none transition-all duration-200 ${active === ch ? "scale-150 text-[#FFE9A0]" : "text-[#C8A96A]"}`;
  const glyphStyle = (ch) => (active === ch ? { textShadow: "0 0 10px rgba(255,233,160,0.9)" } : undefined);

  return (
    <motion.div
      className="absolute inset-0 z-40 cursor-pointer overflow-hidden rounded-2xl"
      style={{ background: "radial-gradient(circle at 50% 30%, #2A1C10 0%, #120B05 78%)" }}
      initial={{ opacity: 0 }}
      animate={{ opacity: farewell ? [1, 1, 0] : 1 }}
      transition={farewell ? { duration: 1.8, times: [0, 0.7, 1] } : { duration: 0.4 }}
      onClick={begin}
      data-testid="ouija-cover"
    >
      {/* wood grain lines */}
      <div className="pointer-events-none absolute inset-0 opacity-20" style={{ backgroundImage: "repeating-linear-gradient(92deg, rgba(0,0,0,0.5) 0px, rgba(0,0,0,0.5) 1px, transparent 1px, transparent 9px)" }} />

      <div className="pointer-events-none absolute left-1/2 top-3 z-20 -translate-x-1/2 whitespace-nowrap rounded-full bg-black/60 px-4 py-1 font-sans text-[11px] font-bold uppercase tracking-[0.2em] text-[#C8A96A]" data-testid="rare-fate-badge">
        ✦ {t("Rare fate")} ✦
      </div>

      <div ref={boardRef} className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-4 pt-6">
        {/* YES / NO */}
        <div className="flex w-full max-w-[19rem] justify-between px-2">
          <span ref={(el) => { glyphRefs.current.YES = el; }} className="font-serif text-sm italic tracking-[0.2em] text-[#C8A96A]">{t("YES")}</span>
          <span className="font-serif text-lg text-[#C8A96A]">☾ ✶ ☀</span>
          <span ref={(el) => { glyphRefs.current.NO = el; }} className="font-serif text-sm italic tracking-[0.2em] text-[#C8A96A]">{t("NO")}</span>
        </div>
        {/* letter arcs */}
        <div className="flex w-full max-w-[19rem] justify-between" data-testid="ouija-letters">
          {ROW1.map((ch) => (
            <span key={ch} ref={(el) => { glyphRefs.current[ch] = el; }} className={glyphCls(ch)} style={glyphStyle(ch)}>{ch}</span>
          ))}
        </div>
        <div className="flex w-full max-w-[19rem] justify-between">
          {ROW2.map((ch) => (
            <span key={ch} ref={(el) => { glyphRefs.current[ch] = el; }} className={glyphCls(ch)} style={glyphStyle(ch)}>{ch}</span>
          ))}
        </div>
        <div className="flex w-full max-w-[15rem] justify-between">
          {ROW3.map((ch) => (
            <span key={ch} ref={(el) => { glyphRefs.current[ch] = el; }} className={glyphCls(ch)} style={glyphStyle(ch)}>{ch}</span>
          ))}
        </div>
        {/* GOOD BYE */}
        <span ref={byeRef} className={`font-serif text-base italic tracking-[0.35em] transition-all duration-200 ${active === "BYE" ? "scale-125 text-[#FFE9A0]" : "text-[#C8A96A]"}`} style={active === "BYE" ? { textShadow: "0 0 10px rgba(255,233,160,0.9)" } : undefined}>
          {t("GOOD BYE")}
        </span>

        {/* spelled-out fate */}
        <p className="min-h-[1.75rem] max-w-full break-words px-2 text-center font-serif text-lg font-bold text-[#FFE9A0]" style={{ textShadow: "0 0 12px rgba(255,233,160,0.5)" }} data-testid="ouija-spelled">
          {spelled}
        </p>

        {!running && (
          <p className="font-serif text-lg italic text-[#E8D9B8]" data-testid="ouija-prompt">{t("Touch the board — the spirits will spell it out")}</p>
        )}

        {/* planchette */}
        <motion.img
          src="/reaper-planchette.png"
          alt=""
          className="pointer-events-none absolute left-0 top-0 z-10 w-[68px] select-none opacity-95"
          style={{ filter: "drop-shadow(0 8px 12px rgba(0,0,0,0.7))" }}
          draggable={false}
          initial={false}
          animate={running ? { x: pos.x, y: pos.y, rotate: 0 } : { x: pos.x, y: pos.y, rotate: [-3, 3, -3] }}
          transition={running ? { type: "spring", stiffness: 90, damping: 16 } : { duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
          onLoad={() => {
            // park idle planchette near the board's center before the ritual starts
            const board = boardRef.current;
            if (board && !running) setPos({ x: board.clientWidth / 2 - 34, y: board.clientHeight * 0.58 });
          }}
          data-testid="ouija-planchette"
        />
      </div>
    </motion.div>
  );
}
