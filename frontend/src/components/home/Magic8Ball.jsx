import { useMemo, useRef, useState } from "react";
import { motion, useAnimationControls } from "framer-motion";
import { useShake } from "../../hooks/useShake";
import { haptic } from "../../lib/pwa";

const FAIL_MESSAGES = [
  "ASK\nAGAIN\nLATER",
  "OUTLOOK\nHAZY",
  "GOOD LUCK\nNEXT TIME",
  "KEEP\nTRYING",
  "FATE\nRESISTS",
  "NOT\nTHIS TIME",
];
const FAKEOUTS = 2; // fail messages before the real reveal

const INK_BLOBS = [
  { size: 84, x: -10, y: -8, from: "#0A1024", dur: 5.2 },
  { size: 68, x: 14, y: 10, from: "#141E3E", dur: 4.1 },
  { size: 56, x: -5, y: 15, from: "#060B1C", dur: 6.0 },
];

/**
 * Magic 8-Ball rare reveal. Shake the phone (or rattle the ball with the
 * cursor) — the ball wiggles as you rattle it, then the classic purple
 * triangle floats up in the square window... with a taunting fail message.
 * A couple of fake-outs later, the ink dissipates and the fate photo
 * appears. Then onDone() unveils the full card.
 */
export function Magic8Ball({ photo, onDone }) {
  // idle -> shaking -> (message -> idle)*FAKEOUTS -> answer
  const [stage, setStage] = useState("idle");
  const [message, setMessage] = useState(null);
  const stageRef = useRef("idle");
  const attempts = useRef(0);
  const drag = useRef({ lastX: null, dir: 0, flips: 0, travel: 0, t: 0 });
  const wiggle = useAnimationControls();
  const fails = useMemo(
    () => [...FAIL_MESSAGES].sort(() => Math.random() - 0.5).slice(0, FAKEOUTS),
    [],
  );

  const setStageBoth = (s) => { stageRef.current = s; setStage(s); };

  const trigger = () => {
    if (stageRef.current !== "idle") return;
    const isFinal = attempts.current >= FAKEOUTS;
    setStageBoth("shaking");
    haptic(30);
    if (isFinal) {
      // Reverse-cymbal swell only under the true reveal.
      try {
        if (localStorage.getItem("ff_muted") !== "1") {
          const a = new Audio("/8ball-shake.mp3");
          a.volume = 0.9;
          a.play().catch(() => {});
        }
      } catch (e) { /* audio unavailable */ }
    }
    setTimeout(() => {
      if (isFinal) {
        setStageBoth("answer");
        haptic(15);
        setTimeout(() => onDone?.(), 2300);
      } else {
        setMessage(fails[attempts.current]);
        attempts.current += 1;
        setStageBoth("message");
        haptic(10);
        setTimeout(() => {
          setMessage(null);
          setStageBoth("idle");
        }, 2000);
      }
    }, 1100);
  };

  useShake(trigger, stage === "idle");

  // Desktop / no-sensor fallback: rattle with the pointer. The ball wiggles
  // with every direction flip; enough travel + flips counts as a shake.
  const onPointerMove = (e) => {
    if (e.buttons !== 1 || stageRef.current !== "idle") return;
    const d = drag.current;
    const now = Date.now();
    if (now - d.t > 1500) { d.flips = 0; d.travel = 0; }
    d.t = now;
    if (d.lastX !== null) {
      const dx = e.clientX - d.lastX;
      d.travel += Math.abs(dx);
      const dir = Math.sign(dx);
      if (dir && d.dir && dir !== d.dir) {
        d.flips += 1;
        // Immediate physical feedback: a quick jolt per rattle reversal.
        wiggle.start({ x: [0, dir * 9, 0], rotate: [0, dir * 5, 0], transition: { duration: 0.28 } });
        haptic(6);
      }
      if (dir) d.dir = dir;
      if (d.flips >= 3 && d.travel > 350) trigger();
    }
    d.lastX = e.clientX;
  };

  const hint = stage === "answer"
    ? "So it is written…"
    : stage === "shaking"
      ? "Fate stirs…"
      : stage === "message"
        ? "The ball taunts you. Shake it again…"
        : attempts.current > 0
          ? "Shake it again…"
          : "Shake your phone to reveal your fate";

  return (
    <div
      className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 rounded-2xl backdrop-blur-sm"
      data-testid="magic-8ball-overlay"
      onPointerMove={onPointerMove}
      style={{ touchAction: "none", background: "radial-gradient(circle at 50% 38%, rgba(75,29,142,0.16), rgba(0,0,0,0) 62%), rgba(9,7,12,0.96)" }}
    >
      <div className="pointer-events-none rounded-full border border-[#E6B23A]/30 bg-black/60 px-4 py-1.5 font-serif text-xs font-bold uppercase tracking-[0.2em] text-[#E6B23A]" data-testid="rare-fate-badge">
        ✦ Rare fate ✦
      </div>
      <motion.div animate={wiggle}>
        <motion.div
          className="relative grid h-52 w-52 cursor-grab place-items-center rounded-full select-none"
          data-testid="magic-8ball"
          style={{
            background: "radial-gradient(circle at 32% 28%, #3A4150 0%, #14181F 38%, #05070A 78%)",
            boxShadow: "0 18px 40px rgba(0,0,0,0.6), inset 0 -12px 28px rgba(0,0,0,0.7), inset 0 8px 16px rgba(255,255,255,0.08)",
          }}
          animate={
            stage === "shaking"
              ? { x: [0, -16, 14, -12, 10, -7, 4, 0], rotate: [0, -9, 8, -7, 5, -3, 2, 0] }
              : stage === "idle"
                ? { rotate: [0, -2, 2, -2, 0] }
                : { x: 0, rotate: 0 }
          }
          transition={
            stage === "shaking"
              ? { duration: 1.0, ease: "easeInOut" }
              : stage === "idle"
                ? { repeat: Infinity, duration: 3.2, ease: "easeInOut" }
                : { duration: 0.2 }
          }
        >
          {/* Square viewing window: photo beneath, ink + triangle above */}
          <div className="relative h-[108px] w-[108px] overflow-hidden rounded-2xl bg-[#060D1F] shadow-[inset_0_5px_14px_rgba(0,0,0,0.95),0_0_0_5px_#101318,0_0_0_7px_#2A2E36]">
            {photo && (
              <img
                src={photo}
                alt=""
                data-testid="magic-8ball-answer"
                className="absolute inset-0 h-full w-full object-cover"
                draggable={false}
              />
            )}
            {/* Ink base + swirling blobs — dissipate only at the true answer */}
            <motion.div
              className="absolute inset-0"
              style={{ background: "radial-gradient(circle at 45% 40%, #0C142C 0%, #060B1C 60%, #030614 100%)" }}
              animate={stage === "answer" ? { opacity: 0, scale: 1.6, filter: "blur(8px)" } : { opacity: 1 }}
              transition={stage === "answer" ? { duration: 1.5, delay: 0.25, ease: "easeOut" } : { duration: 0.2 }}
            />
            {INK_BLOBS.map((b, i) => (
              <motion.div
                key={i}
                className="absolute rounded-full"
                style={{
                  width: b.size, height: b.size,
                  left: `calc(50% - ${b.size / 2}px + ${b.x}px)`,
                  top: `calc(50% - ${b.size / 2}px + ${b.y}px)`,
                  background: `radial-gradient(circle at 40% 35%, ${b.from} 0%, #030614 68%, rgba(3,6,20,0) 100%)`,
                }}
                animate={
                  stage === "answer"
                    ? { opacity: 0, scale: 2.1, filter: "blur(10px)" }
                    : { x: [0, 6, -5, 3, 0], y: [0, -4, 5, -3, 0], scale: [1, 1.08, 0.96, 1.05, 1], opacity: 0.98, filter: "blur(1px)" }
                }
                transition={
                  stage === "answer"
                    ? { duration: 1.3, delay: i * 0.18, ease: "easeOut" }
                    : { repeat: Infinity, duration: b.dur, ease: "easeInOut" }
                }
              />
            ))}
            {/* Purple triangle fail message — classic 8-ball fake-out */}
            <motion.div
              className="absolute inset-0 grid place-items-center"
              initial={false}
              animate={stage === "message" ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
              transition={{ type: "spring", stiffness: 130, damping: 17 }}
              data-testid="magic-8ball-fail"
            >
              <div
                className="grid h-[88px] w-[92px] place-items-center"
                style={{ clipPath: "polygon(50% 100%, 0% 4%, 100% 4%)", background: "linear-gradient(200deg, #5B2AA8 0%, #3D1878 45%, #22093F 100%)", filter: "drop-shadow(0 0 10px rgba(91,42,168,0.5))" }}
              >
                <span className="-mt-5 max-w-[64px] whitespace-pre-line text-center font-serif text-[9px] font-bold leading-[1.35] tracking-wide text-[#E7DBFF]">
                  {message || ""}
                </span>
              </div>
            </motion.div>
            {/* The white 8 floats on the ink; hides during messages/answer */}
            <motion.span
              className="absolute left-1/2 top-1/2 grid h-11 w-11 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white font-serif text-2xl font-bold text-black"
              animate={stage === "idle" ? { opacity: 1, y: "-50%" } : { opacity: 0, y: "0%" }}
              transition={{ duration: stage === "idle" ? 0.3 : 0.5, ease: "easeInOut" }}
              style={{ x: "-50%" }}
            >
              8
            </motion.span>
          </div>
        </motion.div>
      </motion.div>
      <p className="pointer-events-none px-6 text-center font-serif text-sm font-semibold italic text-[#C7CACE]" data-testid="magic-8ball-hint">
        {hint}
      </p>
      {stage === "idle" && attempts.current === 0 && (
        <p className="pointer-events-none -mt-3 px-6 text-center font-serif text-[10px] italic text-white/50">
          (or rattle the ball with your cursor)
        </p>
      )}
    </div>
  );
}
