import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useMotionValue, animate } from "framer-motion";
import { haptic } from "../../lib/pwa";

const RED = "#E01E26";
const BLACK = "#0E0E0E";
const WHITE = "#F5F0E6";
// Classic roulette cycle — adjacent segments always differ (n = 4, 6 or 8).
const COLORS = [BLACK, RED, WHITE, RED];

const rad = (deg) => ((deg - 90) * Math.PI) / 180;
const pt = (deg, r) => [100 + r * Math.cos(rad(deg)), 100 + r * Math.sin(rad(deg))];

function segPath(a0, a1, r) {
  const [x0, y0] = pt(a0, r);
  const [x1, y1] = pt(a1, r);
  return `M100,100 L${x0},${y0} A${r},${r} 0 0 1 ${x1},${y1} Z`;
}

/**
 * Wheel-of-Fate rare reveal: a black/red/white roulette wheel with the
 * Fork·Fate crest as its hub. Flick it (pointer drag around the center) —
 * it free-spins with decay and is quietly rigged to land the pointer on
 * the already-chosen winner. Then onDone() unveils the card.
 */
export function WheelOfFate({ names = [], winner, onDone, autoSpin = false }) {
  const [stage, setStage] = useState("idle"); // idle | spinning | done
  const rotation = useMotionValue(0);
  const wheelRef = useRef(null);
  const tickRef = useRef(null);
  const drag = useRef({ active: false, lastAngle: 0, lastT: 0, velocity: 0 });

  // Stop the tick if the overlay unmounts mid-spin.
  useEffect(() => () => { try { tickRef.current?.pause(); } catch (e) { /* ignore */ } }, []);

  // Preload the pre-trimmed 4.4s tick clip the moment the wheel appears, so
  // the sound starts the instant the wheel is flicked. (The old approach —
  // seeking into the full 12.8s clip on play — started seconds late on
  // phones because metadata + seek buffering beat the spin animation.)
  const tickAudioRef = useRef(null);
  useEffect(() => {
    try {
      const a = new Audio("/wheel-tick-end.mp3");
      a.preload = "auto";
      a.load();
      tickAudioRef.current = a;
    } catch (e) { /* audio unavailable */ }
  }, []);

  // Demo mode (/dev/rare): spin by itself shortly after mounting.
  const spinToRef = useRef(null);
  useEffect(() => {
    if (!autoSpin) return;
    const t = setTimeout(() => spinToRef.current?.(1), 1400);
    return () => clearTimeout(t);
  }, [autoSpin]);

  const stopTick = () => {
    const a = tickRef.current;
    if (!a) return;
    // Quick fade so the tick doesn't cut off harshly.
    const fade = setInterval(() => {
      try {
        a.volume = Math.max(0, a.volume - 0.15);
        if (a.volume <= 0) { a.pause(); clearInterval(fade); }
      } catch (e) { clearInterval(fade); }
    }, 60);
  };

  const { segs, winnerIdx, segAngle } = useMemo(() => {
    const others = [...new Set(names.filter((n) => n && n !== winner))];
    const count = others.length >= 7 ? 8 : others.length >= 5 ? 6 : 4;
    const picks = others.sort(() => Math.random() - 0.5).slice(0, count - 1);
    const idx = Math.floor(Math.random() * count);
    picks.splice(idx, 0, winner);
    return { segs: picks, winnerIdx: idx, segAngle: 360 / count };
  }, [names, winner]);

  const spinTo = (dir) => {
    if (stage !== "idle") return;
    setStage("spinning");
    haptic(15);
    try {
      if (localStorage.getItem("ff_muted") !== "1") {
        // Synthesized clip (scripts/gen_wheel_ticks.py): exactly the wheel's
        // 5.4s spin — tick times computed from the same easing curve, so every
        // tick lands on a segment crossing as the wheel decays to a stop.
        const a = tickAudioRef.current || new Audio("/wheel-tick-end.mp3?v=2");
        a.volume = 0.9;
        try { a.currentTime = 0; } catch (e2) { /* not seekable yet — plays from 0 anyway */ }
        a.play().catch(() => {});
        tickRef.current = a;
      }
    } catch (e) { /* audio unavailable */ }
    const winnerCenter = winnerIdx * segAngle + segAngle / 2;
    const cur = rotation.get();
    // Land so the winner's center sits under the top pointer: R ≡ -center (mod 360)
    const base = ((-winnerCenter % 360) + 360) % 360;
    const turns = 7 * 360; // free-wheeling: plenty of fast early revolutions
    const target = dir >= 0
      ? cur + turns + ((base - cur) % 360 + 360) % 360
      : cur - turns - ((cur - base) % 360 + 360) % 360;
    animate(rotation, target, {
      duration: 5.4,
      // Hot launch, long satisfying coast — matches the tick synthesis curve.
      ease: (t) => 1 - Math.pow(1 - t, 3.2),
      onComplete: () => {
        stopTick();
        setStage("done");
        haptic(25);
        setTimeout(() => onDone?.(), 1500);
      },
    });
  };
  spinToRef.current = spinTo;

  const angleAt = (e) => {
    const r = wheelRef.current.getBoundingClientRect();
    return (Math.atan2(e.clientY - (r.top + r.height / 2), e.clientX - (r.left + r.width / 2)) * 180) / Math.PI;
  };
  const onDown = (e) => {
    if (stage !== "idle") return;
    drag.current = { active: true, lastAngle: angleAt(e), lastT: Date.now(), velocity: 0 };
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };
  const onMove = (e) => {
    const d = drag.current;
    if (!d.active || stage !== "idle") return;
    const a = angleAt(e);
    let delta = a - d.lastAngle;
    if (delta > 180) delta -= 360;
    if (delta < -180) delta += 360;
    const now = Date.now();
    const dt = Math.max(now - d.lastT, 1);
    d.velocity = 0.7 * d.velocity + 0.3 * (delta / dt) * 1000; // deg/s smoothed
    d.lastAngle = a;
    d.lastT = now;
    rotation.set(rotation.get() + delta);
  };
  const onUp = () => {
    const d = drag.current;
    if (!d.active) return;
    d.active = false;
    if (Math.abs(d.velocity) > 90) spinTo(Math.sign(d.velocity));
  };

  return (
    <div
      className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-1.5 rounded-2xl backdrop-blur-sm"
      data-testid="wheel-of-fate-overlay"
      style={{ touchAction: "none", background: "radial-gradient(circle at 50% 38%, rgba(224,30,38,0.14), rgba(0,0,0,0) 62%), rgba(9,7,12,0.96)" }}
    >
      <div className="pointer-events-none rounded-full border border-[#E6B23A]/30 bg-black/60 px-3 py-1 font-serif text-[10px] font-bold uppercase tracking-[0.2em] text-[#E6B23A]" data-testid="rare-fate-badge">
        ✦ Rare fate ✦
      </div>
      <div className="relative" data-testid="wheel-of-fate">
        {/* Dagger pointer */}
        <svg className="absolute left-1/2 top-[-10px] z-10 -translate-x-1/2" width="22" height="26" viewBox="0 0 22 26" style={{ filter: "drop-shadow(0 2px 3px rgba(0,0,0,0.7))" }}>
          <circle cx="11" cy="4" r="3.4" fill="#3A3A3E" stroke="#6E6E74" strokeWidth="1" />
          <circle cx="11" cy="4" r="1.3" fill={RED} />
          <path d="M6.5 7 L15.5 7 L11 25 Z" fill="#C9CDD2" stroke="#4A4D52" strokeWidth="1" />
          <path d="M11 7 L11 23" stroke="#8A8F95" strokeWidth="0.8" />
        </svg>
        <motion.div
          ref={wheelRef}
          className="h-72 w-72 max-h-[60vw] max-w-[60vw] cursor-grab select-none rounded-full"
          style={{ rotate: rotation, boxShadow: "0 14px 34px rgba(0,0,0,0.65), inset 0 0 0 4px #17161A" }}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
        >
          <svg viewBox="0 0 200 200" className="h-full w-full">
            {segs.map((name, i) => {
              const fill = COLORS[i % COLORS.length];
              const mid = i * segAngle + segAngle / 2;
              return (
                <g key={`${name}-${i}`}>
                  <path d={segPath(i * segAngle, (i + 1) * segAngle, 98)} fill={fill} stroke="#17161A" strokeWidth="1.2" />
                  <g transform={`rotate(${mid} 100 100)`}>
                    <text x="100" y="24" textAnchor="middle" fontSize="9.5" fontWeight="700" fontStyle="italic" fill={fill === WHITE ? BLACK : WHITE} fontFamily="Georgia, 'Times New Roman', serif">
                      {name.length > 13 ? `${name.slice(0, 12)}…` : name}
                    </text>
                  </g>
                </g>
              );
            })}
            {/* Wrought-iron rim with rivets at each segment boundary */}
            <circle cx="100" cy="100" r="98" fill="none" stroke="#26252B" strokeWidth="5" />
            <circle cx="100" cy="100" r="94.5" fill="none" stroke="#4A4950" strokeWidth="0.8" />
            {segs.map((_, i) => {
              const [rx, ry] = pt(i * segAngle, 98);
              return <circle key={`rivet-${i}`} cx={rx} cy={ry} r="2.2" fill="#57565E" stroke="#17161A" strokeWidth="0.8" />;
            })}
          </svg>
          {/* Fork·Fate crest hub */}
          <img
            src="/logo-crest.png"
            alt=""
            className="pointer-events-none absolute left-1/2 top-1/2 h-20 w-20 -translate-x-1/2 -translate-y-1/2"
            style={{ filter: "drop-shadow(0 3px 6px rgba(0,0,0,0.7))" }}
          />
        </motion.div>
      </div>
      <p className="pointer-events-none px-6 text-center font-serif text-xs font-semibold italic text-[#C7CACE]" data-testid="wheel-hint">
        {stage === "done" ? "The wheel has spoken…" : stage === "spinning" ? "Round and round it goes…" : "Flick the wheel — fate awaits"}
      </p>
      {stage === "idle" && (
        <button
          type="button"
          onClick={() => spinTo(1)}
          data-testid="wheel-tap-spin"
          className="rounded-full border border-white/25 px-3 py-0.5 font-serif text-[10px] font-bold uppercase tracking-wide text-white/70 transition-colors hover:bg-white/10"
        >
          or tap to spin
        </button>
      )}
    </div>
  );
}
