import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useShake } from "../../hooks/useShake";
import { haptic } from "../../lib/pwa";

/**
 * Magic 8-Ball rare reveal: the winner hides inside the ball. The user must
 * SHAKE their phone (devicemotion, permission already requested at deal tap)
 * — or, on desktop, rattle the ball by dragging it back and forth — to make
 * the answer float up in the classic blue triangle. Then onDone() unveils
 * the full card with the usual fanfare.
 */
export function Magic8Ball({ name, onDone }) {
  // idle -> shaking -> answer
  const [stage, setStage] = useState("idle");
  const stageRef = useRef("idle");
  const drag = useRef({ lastX: null, dir: 0, flips: 0, travel: 0, t: 0 });

  const trigger = () => {
    if (stageRef.current !== "idle") return;
    stageRef.current = "shaking";
    setStage("shaking");
    haptic(30);
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
        {/* Viewing window */}
        <div className="grid h-[74px] w-[74px] place-items-center overflow-hidden rounded-full bg-[#060D1F] shadow-[inset_0_4px_12px_rgba(0,0,0,0.9)]">
          <AnimatePresence mode="wait">
            {stage === "answer" ? (
              <motion.div
                key="answer"
                initial={{ y: 46, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ type: "spring", stiffness: 140, damping: 16 }}
                className="grid h-14 w-14 place-items-center"
                data-testid="magic-8ball-answer"
                style={{ clipPath: "polygon(50% 0%, 100% 100%, 0% 100%)", background: "linear-gradient(180deg,#1D4ED8,#172B7A)" }}
              >
                <span className="mt-4 max-w-[52px] text-center font-sans text-[8px] font-bold uppercase leading-tight text-white">
                  {name || "Fate awaits"}
                </span>
              </motion.div>
            ) : (
              <motion.span
                key="eight"
                exit={{ opacity: 0, y: 20 }}
                className="grid h-9 w-9 place-items-center rounded-full bg-white font-serif text-xl font-bold text-black"
              >
                8
              </motion.span>
            )}
          </AnimatePresence>
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
