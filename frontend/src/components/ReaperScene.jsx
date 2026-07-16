import React, { useEffect } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

const REAPER_BATS = [
  { left: "12%", top: "26%", size: 30, dur: 9, delay: 0, flap: 0.32 },
  { left: "28%", top: "46%", size: 24, dur: 11, delay: -4, flap: 0.36 },
  { left: "44%", top: "24%", size: 36, dur: 8, delay: -2, flap: 0.28 },
  { left: "58%", top: "52%", size: 26, dur: 10, delay: -6, flap: 0.34 },
  { left: "70%", top: "30%", size: 32, dur: 12, delay: -1, flap: 0.3 },
  { left: "84%", top: "42%", size: 22, dur: 9.5, delay: -5, flap: 0.38 },
  { left: "20%", top: "62%", size: 28, dur: 13, delay: -8, flap: 0.33 },
];

// Dark-mode decorative background: drifting smoke, lightning, flapping bats,
// and a cursor-parallax reaper with a flickering lantern.
export function ReaperScene() {
  const tiltX = useMotionValue(0);
  const tiltY = useMotionValue(0);
  const rotX = useSpring(useTransform(tiltY, [-0.5, 0.5], [8, -8]), { stiffness: 60, damping: 18 });
  const rotY = useSpring(useTransform(tiltX, [-0.5, 0.5], [-12, 12]), { stiffness: 60, damping: 18 });
  const shiftX = useSpring(useTransform(tiltX, [-0.5, 0.5], [-18, 18]), { stiffness: 60, damping: 18 });
  const shiftY = useSpring(useTransform(tiltY, [-0.5, 0.5], [-12, 12]), { stiffness: 60, damping: 18 });
  const moonX = useSpring(useTransform(tiltX, [-0.5, 0.5], [16, -16]), { stiffness: 38, damping: 22 });
  const moonY = useSpring(useTransform(tiltY, [-0.5, 0.5], [11, -11]), { stiffness: 38, damping: 22 });
  useEffect(() => {
    const onMove = (e) => {
      tiltX.set(e.clientX / window.innerWidth - 0.5);
      tiltY.set(e.clientY / window.innerHeight - 0.5);
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, [tiltX, tiltY]);

  return (
    <>
      <div className="pointer-events-none fixed inset-0 z-0 select-none overflow-hidden" data-testid="reaper-ambiance">
        <div className="ff-night-sky" />
        <motion.div className="ff-moon" data-testid="reaper-moon" style={{ x: moonX, y: moonY }}>
          <img src="/reaper-moon.png" alt="" aria-hidden="true" className="ff-moon-img" />
          <div className="ff-moon-clouds">
            <div className="ff-moon-cloud ff-moon-cloud-1" />
            <div className="ff-moon-cloud ff-moon-cloud-2" />
          </div>
        </motion.div>
        <div className="ff-haze" />
        <img
          src="/reaper-cemetery.png"
          alt=""
          aria-hidden="true"
          data-testid="reaper-cemetery"
          className="absolute bottom-0 left-0 h-[64vh] w-full object-cover object-bottom opacity-[0.78]"
          style={{
            maskImage: "linear-gradient(to top, #000 42%, rgba(0,0,0,0.6) 70%, rgba(0,0,0,0) 100%)",
            WebkitMaskImage: "linear-gradient(to top, #000 42%, rgba(0,0,0,0.6) 70%, rgba(0,0,0,0) 100%)",
          }}
        />
        <div className="ff-smoke ff-smoke-1" />
        <div className="ff-smoke ff-smoke-2" />
        <div className="ff-smoke ff-smoke-3" />
        {REAPER_BATS.map((b, i) => (
          <div key={`bat-${i}`} className="ff-bat-fly" style={{ left: b.left, top: b.top, animationDuration: `${b.dur}s`, animationDelay: `${b.delay}s` }}>
            <img src="/reaper-bat.png" alt="" className="ff-bat" style={{ width: b.size, animationDuration: `${b.flap}s` }} />
          </div>
        ))}
      </div>
      <div className="pointer-events-none fixed left-1/2 top-[72%] md:top-[56%] z-0 -translate-x-1/2 -translate-y-1/2 select-none" style={{ perspective: "1200px" }}>
        <motion.div
          style={{ rotateX: rotX, rotateY: rotY, x: shiftX, y: shiftY, transformStyle: "preserve-3d" }}
        >
        <motion.div
          className="relative"
          style={{ transformOrigin: "50% 4%", transformStyle: "preserve-3d" }}
          animate={{ skewX: [0, 1.5, 0.4, 1.4, 0] }}
          transition={{ skewX: { duration: 5.5, repeat: Infinity, ease: "easeInOut", delay: 1.4 } }}
        >
        <motion.img
          src="/reaper.png"
          alt=""
          aria-hidden="true"
          data-testid="reaper-bg"
          className="h-[70vh] max-w-none md:h-[85vh]"
          style={{ filter: "drop-shadow(24px 34px 30px rgba(0,0,0,0.45))" }}
          initial={{ opacity: 0, y: 50, scale: 1.06 }}
          animate={{ opacity: 0.55, y: 0, scale: 1 }}
          transition={{
            opacity: { duration: 1.6, ease: "easeOut" },
            y: { duration: 1.6, ease: "easeOut" },
            scale: { duration: 1.6, ease: "easeOut" },
          }}
        />
        <motion.div
          aria-hidden="true"
          data-testid="reaper-lantern"
          className="absolute z-10 h-16 w-16 rounded-full"
          style={{
            left: "89.3%",
            top: "27.5%",
            marginLeft: "-32px",
            marginTop: "-32px",
            background: "radial-gradient(circle, rgba(255,225,110,0.95), rgba(255,196,60,0.45) 45%, rgba(255,196,60,0) 72%)",
            filter: "blur(8px)",
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.35, 0.95, 0.5, 1, 0.4, 0.8, 0.45] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut", delay: 1.4 }}
        />
        </motion.div>
        </motion.div>
      </div>
    </>
  );
}
