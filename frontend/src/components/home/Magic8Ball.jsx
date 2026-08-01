import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { useShake } from "../../hooks/useShake";
import { haptic } from "../../lib/pwa";

/**
 * Magic 8-Ball rare reveal: the winner hides inside the ball behind swirling
 * ink. The user must SHAKE their phone (devicemotion, permission already
 * requested at deal tap) — or, on desktop, rattle the ball by dragging it
 * back and forth — to make the ink dissipate and unveil the fate photo in
 * the viewing window. Then onDone() unveils the full card.
 */
const INK_BLOBS = [
  { size: 64, x: -8, y: -6, from: "#0A1024", dur: 5.2 },
  { size: 52, x: 12, y: 8, from: "#141E3E", dur: 4.1 },
  { size: 44, x: -4, y: 12, from: "#060B1C", dur: 6.0 },
];

export function Magic8Ball({ name, photo, onDone }) {
  // idle -> shaking -> answer
  const [stage, setStage] = useState("idle");
  const stageRef = useRef("idle");
  const drag = useRef({ lastX: null, dir: 0, flips: 0, travel: 0, t: 0 });

  const trigger = () => {
    if (stageRef.current !== "idle") return;
    stageRef.current = "shaking";
    setStage("shaking");
    haptic(30);
    // Reverse-cymbal swell builds under the ink dissipating.
    try {
      if (localStorage.getItem("ff_muted") !== "1") {
        const a = new Audio("/8ball-shake.mp3");
        a.volume = 0.9;
        a.play().catch(() => {});
      }
    } catch (e) { /* audio unavailable */ }
    setTimeout(() => {
      stageRef.current = "answer";
      setStage("answer");
      haptic(15);
      setTimeout(() => onDone?.(), 2100);
    }, 1100);
  };

  useShake(trigger, stage === "idle");

  // Desktop / no-sensor fallback: rattle with the pointer. Enough horizontal
  // travel with a few direction flips inside ~1.5s counts as a shake.
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
      if (dir && d.dir && dir !== d.dir) d.flips += 1;
      if (dir) d.dir = dir;
      if (d.flips >= 3 && d.travel > 350) trigger();
    }
    d.lastX = e.clientX;
  };

  return (
    <div
      className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 rounded-2xl bg-[#0B0E14]/95 backdrop-blur-sm"
      data-testid="magic-8ball-overlay"
      onPointerMove={onPointerMove}
      style={{ touchAction: "none" }}
    >
      <div className="pointer-events-none rounded-full border border-[#E6B23A]/30 bg-black/60 px-4 py-1.5 font-serif text-xs font-bold uppercase tracking-[0.2em] text-[#E6B23A]" data-testid="rare-fate-badge">
        ✦ Rare fate ✦
      </div>
      <motion.div
        className="relative grid h-40 w-40 cursor-grab place-items-center rounded-full select-none"
        data-testid="magic-8ball"
        style={{
          background: "radial-gradient(circle at 32% 28%, #3A4150 0%, #14181F 38%, #05070A 78%)",
          boxShadow: "0 18px 40px rgba(0,0,0,0.6), inset 0 -10px 24px rgba(0,0,0,0.7), inset 0 6px 14px rgba(255,255,255,0.08)",
        }}
        animate={
          stage === "shaking"
            ? { x: [0, -14, 12, -10, 9, -6, 4, 0], rotate: [0, -8, 7, -6, 5, -3, 2, 0] }
            : stage === "idle"
              ? { rotate: [0, -2, 2, -2, 0] }
              : { x: 0, rotate: 0 }
        }
        transition={
          stage === "shaking"
            ? { duration: 1.0, ease: "easeInOut" }
            : { repeat: Infinity, duration: 3.2, ease: "easeInOut" }
        }
      >
        {/* Viewing window: the fate photo sits beneath swirling ink that
            dissipates once the ball is shaken. */}
        <div className="relative h-[74px] w-[74px] overflow-hidden rounded-full bg-[#060D1F] shadow-[inset_0_4px_12px_rgba(0,0,0,0.9)]">
          {photo && (
            <img
              src={photo}
              alt=""
              data-testid="magic-8ball-answer"
              className="absolute inset-0 h-full w-full rounded-full object-cover"
              draggable={false}
            />
          )}
          {!photo && stage === "answer" && (
            <div className="absolute inset-0 grid place-items-center" data-testid="magic-8ball-answer">
              <span className="max-w-[60px] text-center font-serif text-[9px] font-bold italic leading-tight text-white">
                {name || "Fate awaits"}
              </span>
            </div>
          )}
          {/* Smoky ink: a full-coverage base layer + swirling blobs on top */}
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{ background: "radial-gradient(circle at 45% 40%, #0C142C 0%, #060B1C 60%, #030614 100%)" }}
            animate={stage === "idle" ? { opacity: 1 } : { opacity: 0, scale: 1.6, filter: "blur(8px)" }}
            transition={stage === "idle" ? { duration: 0.2 } : { duration: 1.5, delay: 0.25, ease: "easeOut" }}
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
                stage === "idle"
                  ? { x: [0, 6, -5, 3, 0], y: [0, -4, 5, -3, 0], scale: [1, 1.08, 0.96, 1.05, 1], opacity: 0.98, filter: "blur(1px)" }
                  : { opacity: 0, scale: 2.1, filter: "blur(10px)" }
              }
              transition={
                stage === "idle"
                  ? { repeat: Infinity, duration: b.dur, ease: "easeInOut" }
                  : { duration: 1.3, delay: i * 0.18, ease: "easeOut" }
              }
            />
          ))}
          {/* The white 8 floats on the ink and sinks away on shake */}
          <motion.span
            className="absolute left-1/2 top-1/2 grid h-9 w-9 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white font-serif text-xl font-bold text-black"
            animate={stage === "idle" ? { opacity: 1, y: "-50%" } : { opacity: 0, y: "10%" }}
            transition={stage === "idle" ? { duration: 0.2 } : { duration: 0.7, ease: "easeIn" }}
            style={{ x: "-50%" }}
          >
            8
          </motion.span>
        </div>
      </motion.div>
      <p className="pointer-events-none px-6 text-center font-serif text-sm font-semibold italic text-[#C7CACE]" data-testid="magic-8ball-hint">
        {stage === "answer" ? "So it is written…" : stage === "shaking" ? "Fate stirs…" : "Shake your phone to reveal your fate"}
      </p>
      {stage === "idle" && (
        <p className="pointer-events-none -mt-2 px-6 text-center font-serif text-[10px] italic text-white/50">
          (or rattle the ball with your cursor)
        </p>
      )}
    </div>
  );
}
