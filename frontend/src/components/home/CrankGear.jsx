import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { SteamBurst } from "./SteamBurst";
import { useLang } from "../../i18n/i18n";

const TARGET = 720; // two full crank turns unlock the fate

// Low wooden "clack" per gear tooth (respects mute).
function makeClacker() {
  try {
    if (localStorage.getItem("ff_muted") === "1") return () => {};
    const Ctx = window.AudioContext || window.webkitAudioContext;
    const ctx = new Ctx();
    return () => {
      try {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = "triangle";
        o.frequency.value = 210;
        g.gain.setValueAtTime(0.05, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.07);
        o.connect(g).connect(ctx.destination);
        o.start();
        o.stop(ctx.currentTime + 0.08);
      } catch (e) { /* audio */ }
    };
  } catch (e) {
    return () => {};
  }
}

// 12-tooth brass gear with a crank handle, drawn once and rotated as a group.
function GearSvg({ angle }) {
  const teeth = Array.from({ length: 12 }, (_, i) => i * 30);
  return (
    <svg viewBox="-70 -70 140 140" className="h-52 w-52 select-none" style={{ transform: `rotate(${angle}deg)` }}>
      <defs>
        <radialGradient id="brassG" cx="40%" cy="35%" r="80%">
          <stop offset="0%" stopColor="#F0C878" />
          <stop offset="55%" stopColor="#D9A44E" />
          <stop offset="100%" stopColor="#8A5A2B" />
        </radialGradient>
      </defs>
      {teeth.map((t) => (
        <rect key={t} x="-7" y="-66" width="14" height="16" rx="3" fill="url(#brassG)" transform={`rotate(${t})`} />
      ))}
      <circle r="54" fill="url(#brassG)" stroke="#6B4A2A" strokeWidth="3" />
      <circle r="20" fill="#2A1B0E" stroke="#8A5A2B" strokeWidth="3" />
      {[0, 60, 120, 180, 240, 300].map((t) => (
        <circle key={t} cx={Math.cos((t * Math.PI) / 180) * 37} cy={Math.sin((t * Math.PI) / 180) * 37} r="4.5" fill="#6B4A2A" />
      ))}
      {/* Crank handle */}
      <g transform="rotate(-45)">
        <rect x="16" y="-5" width="46" height="10" rx="5" fill="#4A3520" stroke="#2A1B0E" strokeWidth="1.5" />
        <circle cx="62" cy="0" r="11" fill="#8A5A2B" stroke="#2A1B0E" strokeWidth="2" />
        <circle cx="62" cy="0" r="5" fill="#D9A44E" />
      </g>
    </svg>
  );
}

/** Steampunk rare ritual: crank the brass gear (drag it round, or tap to
 * ratchet) to build boiler pressure — at full pressure the card vents open
 * in a blast of steam. */
export function CrankGear({ onDone }) {
  const { t } = useLang();
  const [angle, setAngle] = useState(0);
  const [done, setDone] = useState(false);
  const doneRef = useRef(false);
  const endedRef = useRef(false);
  const angleRef = useRef(0);
  const dragRef = useRef({ dragging: false, last: 0 });
  const clackRef = useRef(null);
  const lastClackRef = useRef(0);
  const boxRef = useRef(null);

  const clackMaybe = (a) => {
    if (!clackRef.current) clackRef.current = makeClacker();
    if (a - lastClackRef.current >= 24) {
      lastClackRef.current = a;
      clackRef.current();
    }
  };

  const finish = () => {
    if (endedRef.current) return;
    endedRef.current = true;
    setDone(true);
    const hiss = new Audio("/reveal-steam.wav");
    hiss.volume = 0.9;
    if (localStorage.getItem("ff_muted") !== "1") hiss.play().catch(() => {});
    setTimeout(() => { if (!doneRef.current) { doneRef.current = true; onDone?.(); } }, 1800);
  };

  // Angle lives in a ref so completion is a plain side effect, not something
  // buried in a state updater (React drops side effects inside updaters).
  const advance = (delta) => {
    if (endedRef.current) return;
    const next = Math.min(angleRef.current + delta, TARGET + 40);
    angleRef.current = next;
    setAngle(next);
    clackMaybe(next);
    if (next >= TARGET) finish();
  };

  const pointerAngle = (e) => {
    const r = boxRef.current.getBoundingClientRect();
    return (Math.atan2(e.clientY - (r.top + r.height / 2), e.clientX - (r.left + r.width / 2)) * 180) / Math.PI;
  };
  const onDown = (e) => {
    dragRef.current = { dragging: true, last: pointerAngle(e) };
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };
  const onMove = (e) => {
    if (!dragRef.current.dragging) return;
    const a = pointerAngle(e);
    let d = a - dragRef.current.last;
    if (d > 180) d -= 360;
    if (d < -180) d += 360;
    dragRef.current.last = a;
    if (d > 0) advance(d); // cranks only turn forward
  };
  const onUp = () => { dragRef.current.dragging = false; };

  useEffect(() => () => { doneRef.current = true; }, []);

  const progress = Math.min(angle / TARGET, 1);

  return (
    <motion.div
      className="absolute inset-0 z-40 overflow-hidden rounded-2xl"
      style={{ background: "radial-gradient(circle at 50% 30%, #33220F 0%, #140C05 78%)" }}
      initial={{ opacity: 0 }}
      animate={{ opacity: done ? [1, 1, 0] : 1 }}
      transition={done ? { duration: 1.8, times: [0, 0.8, 1] } : { duration: 0.4 }}
      data-testid="crank-gear-cover"
    >
      <div className="pointer-events-none absolute left-1/2 top-3 z-20 -translate-x-1/2 whitespace-nowrap rounded-full bg-black/60 px-4 py-1 font-sans text-[11px] font-bold uppercase tracking-[0.2em] text-[#E6B23A]" data-testid="rare-fate-badge">
        ✦ {t("Rare fate")} ✦
      </div>

      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 pt-4">
        {/* Pressure gauge bar */}
        <div className="flex w-56 items-center gap-2">
          <span className="font-serif text-[11px] font-bold uppercase tracking-[0.2em] text-[#D9A44E]">{t("Pressure")}</span>
          <div className="h-3 flex-1 overflow-hidden rounded-full border border-[#8A5A2B] bg-black/50" data-testid="crank-pressure-bar">
            <div className="h-full rounded-full transition-[width] duration-100" style={{ width: `${progress * 100}%`, background: "linear-gradient(90deg,#8A5A2B,#D9A44E,#F0C878)" }} />
          </div>
        </div>

        <div
          ref={boxRef}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerLeave={onUp}
          onClick={() => advance(45)}
          className="cursor-grab touch-none active:cursor-grabbing"
          data-testid="crank-gear"
          role="button"
          aria-label={t("Crank the gear")}
        >
          <GearSvg angle={angle} />
        </div>

        {!done ? (
          <p className="font-serif text-lg italic text-[#EAD9B0]" data-testid="crank-gear-prompt">{t("Crank the gear to vent the fate")}</p>
        ) : (
          <p className="font-serif text-lg font-bold uppercase tracking-[0.2em] text-[#F0C878]" data-testid="crank-gear-done">{t("Pressure released!")}</p>
        )}
      </div>

      {/* Steam blast when the boiler lets go */}
      {done && <SteamBurst startBottom="30%" travel={-160} className="absolute inset-0 z-[45] overflow-visible" sound={false} />}
    </motion.div>
  );
}
