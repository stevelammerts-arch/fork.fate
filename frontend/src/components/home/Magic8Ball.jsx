import { useRef, useState } from "react";
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
// Occasional fake-out: each shake has a chance to taunt instead of answer,
// but fate always speaks by the third shake.
const FAIL_CHANCE = 0.4;
const MAX_FAILS = 2;

const INK_BLOBS = [
  { size: 84, x: -10, y: -8, from: "#0A1024", dur: 5.2 },
  { size: 68, x: 14, y: 10, from: "#141E3E", dur: 4.1 },
  { size: 56, x: -5, y: 15, from: "#060B1C", dur: 6.0 },
];

/**
 * Magic 8-Ball rare reveal — like the real toy. Shake the phone (or rattle
 * the ball with the cursor): the ball wiggles, then the classic triangle die
 * floats up through the dark liquid in the square window. Occasionally it
 * surfaces a taunting fail message ("ASK AGAIN LATER") and you must shake
 * again; when fate is ready, the die rises bearing the winner's name.
 * Then onDone() unveils the full card.
 */
export function Magic8Ball({ name, onDone }) {
  // idle -> shaking -> (message -> idle)* -> answer
  const [stage, setStage] = useState("idle");
  const [message, setMessage] = useState(null);
  const stageRef = useRef("idle");
  const drag = useRef({ lastX: null, dir: 0, flips: 0, travel: 0, t: 0 });
  const wiggle = useAnimationControls();

  // Fail-attempt bookkeeping survives remounts (sessionStorage keyed by the
  // winner) so "fate always answers by the third shake" holds even if the
  // parent re-keys this component mid-ritual.
  const skey = `ff8b_${name}`;
  const readTries = () => {
    try { return JSON.parse(sessionStorage.getItem(skey)) || { n: 0, last: -1 }; }
    catch (e) { return { n: 0, last: -1 }; }
  };
  const writeTries = (v) => { try { sessionStorage.setItem(skey, JSON.stringify(v)); } catch (e) { /* ignore */ } };
  const clearTries = () => { try { sessionStorage.removeItem(skey); } catch (e) { /* ignore */ } };

  const setStageBoth = (s) => { stageRef.current = s; setStage(s); };

  const trigger = () => {
    if (stageRef.current !== "idle") return;
    // Decide this shake's outcome up front so the reveal audio only plays
    // under the true answer.
    const tries = readTries();
    const isFinal = tries.n >= MAX_FAILS || Math.random() >= FAIL_CHANCE;
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
        clearTries();
        setStageBoth("answer");
        haptic(15);
        // Let the name sink in, then the whole ball slides down and away,
        // handing off to the original reveal card beneath.
        setTimeout(() => {
          setStageBoth("exit");
          setTimeout(() => onDone?.(), 650);
        }, 2000);
      } else {
        let idx = Math.floor(Math.random() * FAIL_MESSAGES.length);
        if (idx === tries.last) idx = (idx + 1) % FAIL_MESSAGES.length;
        writeTries({ n: tries.n + 1, last: idx });
        setMessage(FAIL_MESSAGES[idx]);
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

  const hint = stage === "answer" || stage === "exit"
    ? "So it is written…"
    : stage === "shaking"
      ? "Fate stirs…"
      : stage === "message"
        ? "The ball taunts you. Shake it again…"
        : readTries().n > 0
          ? "Shake it again…"
          : "Shake your phone — or rattle the ball with your finger";

  // The die faces up: fails on the purple face, the true fate on gold.
  const dieUp = stage === "message" || stage === "answer" || stage === "exit";
  const isAnswer = stage === "answer" || stage === "exit";

  return (
    <motion.div
      className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 overflow-hidden rounded-2xl backdrop-blur-sm"
      data-testid="magic-8ball-overlay"
      data-state={stage}
      onPointerMove={onPointerMove}
      animate={stage === "exit" ? { opacity: 0 } : { opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeIn" }}
      style={{ touchAction: "none", background: "radial-gradient(circle at 50% 38%, rgba(75,29,142,0.16), rgba(0,0,0,0) 62%), rgba(9,7,12,0.96)" }}
    >
      <div className="pointer-events-none rounded-full border border-[#E6B23A]/30 bg-black/60 px-4 py-1.5 font-serif text-xs font-bold uppercase tracking-[0.2em] text-[#E6B23A]" data-testid="rare-fate-badge">
        ✦ Rare fate ✦
      </div>
      <motion.div
        animate={wiggle}
      >
        <motion.div
          animate={stage === "exit" ? { y: 340, opacity: 0 } : { y: 0, opacity: 1 }}
          transition={{ duration: 0.6, ease: [0.5, 0, 0.75, 0.6] }}
        >
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
          {/* Square viewing window: dark liquid with the die floating inside */}
          <div className="relative h-[108px] w-[108px] overflow-hidden rounded-2xl bg-[#060D1F] shadow-[inset_0_5px_14px_rgba(0,0,0,0.95),0_0_0_5px_#101318,0_0_0_7px_#2A2E36]">
            {/* Liquid base + swirling ink blobs — always alive, like the toy */}
            <div
              className="absolute inset-0"
              style={{ background: "radial-gradient(circle at 45% 40%, #0C142C 0%, #060B1C 60%, #030614 100%)" }}
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
                animate={{ x: [0, 6, -5, 3, 0], y: [0, -4, 5, -3, 0], scale: [1, 1.08, 0.96, 1.05, 1], opacity: 0.98, filter: "blur(1px)" }}
                transition={{ repeat: Infinity, duration: b.dur, ease: "easeInOut" }}
              />
            ))}
            {/* The triangle die floats up through the liquid — fail taunts and
                the true fate both surface here, like the real toy */}
            {dieUp && (
              <motion.div
                className="absolute inset-0 grid place-items-center"
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 130, damping: 17 }}
                data-testid={isAnswer ? "magic-8ball-answer" : "magic-8ball-fail"}
              >
              <div
                className="grid h-[92px] w-[96px] place-items-center"
                style={{
                  clipPath: "polygon(50% 100%, 0% 4%, 100% 4%)",
                  background: "linear-gradient(200deg, #5B2AA8 0%, #3D1878 45%, #22093F 100%)",
                  filter: isAnswer
                    ? "drop-shadow(0 0 12px rgba(230,178,58,0.55))"
                    : "drop-shadow(0 0 10px rgba(91,42,168,0.5))",
                }}
              >
                <span
                  className={`-mt-6 max-w-[66px] whitespace-pre-line break-words text-center font-serif font-bold leading-[1.3] tracking-wide ${isAnswer ? "text-[9px] text-[#F3D9A0]" : "text-[9px] text-[#E7DBFF]"}`}
                >
                  {isAnswer ? name : (message || "")}
                </span>
              </div>
              </motion.div>
            )}
            {/* The white 8 floats on the liquid; sinks while the die is up */}
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
      </motion.div>
      <p className="pointer-events-none px-6 text-center font-serif text-sm font-semibold italic text-[#C7CACE]" data-testid="magic-8ball-hint">
        {hint}
      </p>
      {stage === "idle" && readTries().n === 0 && (
        <p className="pointer-events-none -mt-3 px-6 text-center font-serif text-[10px] italic text-white/50">
          (or rattle the ball with your cursor)
        </p>
      )}
    </motion.div>
  );
}
