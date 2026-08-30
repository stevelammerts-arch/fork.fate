import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { foundSecret } from "../lib/secretTrophies";
import { tapSound } from "../lib/tapFx";

const rnd = (i, salt) => {
  const x = Math.sin(i * 131.3 + salt * 269.5) * 43758.5453;
  return x - Math.floor(x);
};

/**
 * Coffee Shop ambience: warm golden dust motes drifting slowly through
 * morning café light. Full-screen, pointer-events none, loops forever.
 */
export function CafeDustMotes() {
  return (
    <div className="ff-theme-scene pointer-events-none fixed inset-0 z-0 select-none" data-testid="cafe-dust-motes" aria-hidden="true">
      {Array.from({ length: 16 }, (_, i) => {
        const s = 2 + rnd(i, 1) * 3.5;
        const dur = 14 + rnd(i, 2) * 14;
        return (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              left: `${rnd(i, 3) * 100}%`,
              top: `${rnd(i, 4) * 100}%`,
              width: s,
              height: s,
              background: "rgba(214,170,96,0.55)",
              boxShadow: "0 0 6px 1px rgba(230,190,120,0.35)",
              filter: "blur(0.4px)",
            }}
            animate={{
              x: [0, (rnd(i, 5) - 0.5) * 120, (rnd(i, 6) - 0.5) * 90, 0],
              y: [0, -30 - rnd(i, 7) * 60, (rnd(i, 8) - 0.5) * 50, 0],
              opacity: [0, 0.85, 0.35, 0.8, 0],
            }}
            transition={{ duration: dur, delay: rnd(i, 9) * 6, repeat: Infinity, ease: "easeInOut" }}
          />
        );
      })}
    </div>
  );
}

/** Dust bunnies for the café: tiny fluff motes floating in the morning sun
 * through the window (firefly size + count). Tapping any one startles the
 * WHOLE drift — they bolt away with a soft rustle, then float back home. */
const BUNNIES = Array.from({ length: 7 }).map((_, i) => ({
  left: 8 + ((i * 13.9) % 80), // %
  top: 14 + ((i * 9.1) % 54), // % — adrift in the window light
  size: 5 + (i % 3) * 2,
  durX: 11 + ((i * 2.1) % 7),
  durY: 9 + ((i * 1.7) % 5),
  delayX: -((i * 3.3) % 9),
  delayY: -((i * 2.9) % 6),
  spin: 12 + (i % 4) * 4,
}));

export function DustBunnies() {
  const [seed, setSeed] = useState(0);
  // fresh random bolt vectors each scatter (dart away through the air)
  const offsets = useMemo(
    () =>
      BUNNIES.map(() => {
        const ang = Math.random() * Math.PI * 2;
        const dist = 16 + Math.random() * 18; // vmin
        return { x: Math.cos(ang) * dist, y: Math.sin(ang) * dist };
      }),
    [seed]
  );
  const scattered = seed > 0 && Date.now() - seed < 1400;
  const homing = seed < 0;
  const scatter = () => {
    if (scattered) return;
    try { navigator.vibrate && navigator.vibrate(10); } catch { /* ignore */ }
    foundSecret("dust-bunnies");
    tapSound("/leaf-rustle.mp3", 0.3);
    setSeed(Date.now());
    setTimeout(() => setSeed((s) => (s ? -s : 0)), 1400); // negative = homing
  };
  return (
    <div className="pointer-events-none fixed inset-0 z-[55] select-none overflow-hidden" data-testid="dust-bunnies-layer">
      {BUNNIES.map((b, i) => (
        <div
          key={i}
          className="absolute"
          style={{
            left: `${b.left}%`,
            top: `${b.top}%`,
            transform: scattered ? `translate(${offsets[i].x}vmin, ${offsets[i].y}vmin)` : "translate(0,0)",
            transition: scattered ? "transform 0.9s cubic-bezier(0.2,0.8,0.3,1)" : homing ? "transform 3.4s ease-in-out" : "none",
            opacity: scattered ? 0.3 : 1,
          }}
        >
          <div style={{ animation: `ffFlyX ${b.durX}s ease-in-out ${b.delayX}s infinite alternate` }}>
            <div style={{ animation: `ffFlyY ${b.durY}s ease-in-out ${b.delayY}s infinite alternate` }}>
              <button
                type="button"
                aria-label="dust bunny"
                data-egg="1"
                data-testid={i === 0 ? "dust-bunny" : undefined}
                onPointerDown={scatter}
                className="pointer-events-auto -m-4 block cursor-pointer border-0 bg-transparent p-4"
              >
                <span
                  className="block rounded-full"
                  style={{
                    width: b.size,
                    height: b.size * 0.85,
                    background: "radial-gradient(circle at 42% 40%, rgba(214,196,168,0.85), rgba(178,162,140,0.5) 52%, rgba(178,162,140,0) 78%)",
                    boxShadow: `${b.size * 0.4}px ${b.size * 0.12}px ${b.size * 0.6}px rgba(200,182,152,0.5), ${-b.size * 0.3}px ${b.size * 0.2}px ${b.size * 0.5}px rgba(200,182,152,0.4)`,
                    filter: "blur(0.6px)",
                    animation: `ffBunnyTumble ${b.spin}s linear infinite`,
                  }}
                />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/** A steaming cup of coffee resting in the painted café. The backdrop div
 * uses bg-cover bg-center, so this reproduces that exact mapping to pin the
 * cup to the artwork at any screen size (art is 1264x848). On wide screens
 * the cup sits on the big foreground table at the right (image px 1130,730,
 * drawn larger — it's close to camera); when the cover crop cuts that table
 * out (phones, narrow windows) it moves to the white counter at (755,507). */
export function CafeCounterCup() {
  const [box, setBox] = useState(null);
  useEffect(() => {
    const measure = () => {
      const vw = window.innerWidth, vh = window.innerHeight;
      const k = Math.max(vw / 1264, vh / 848);
      setBox({ vw, vh, k, offX: (vw - 1264 * k) / 2, offY: (vh - 848 * k) / 2 });
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);
  if (!box) return null;
  const { vw, vh, k, offX, offY } = box;
  const tableFits = offX + 1165 * k <= vw && offY + 735 * k <= vh;
  const spot = tableFits ? { x: 1130, y: 730, w: 64 } : { x: 755, y: 507, w: 34 };
  const cw = spot.w * k, ch = cw * (135 / 220);
  const left = offX + spot.x * k - cw / 2;
  const top = offY + spot.y * k - ch;
  return (
    <div className="pointer-events-none fixed inset-0 z-0 select-none" data-testid="cafe-counter-cup" aria-hidden="true">
      <div className="absolute" style={{ left, top, width: cw, height: ch }}>
        {/* wisps of steam curling up off the brim */}
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <span
            key={`stm-${i}`}
            className="absolute rounded-full"
            data-testid="cafe-cup-steam"
            style={{
              left: `${12 + i * 11}%`,
              bottom: `${84 + (i % 3) * 6}%`,
              width: cw * (0.2 + (i % 3) * 0.05),
              height: cw * (0.2 + (i % 3) * 0.05),
              background: "radial-gradient(circle, rgba(160,140,120,0.4), rgba(160,140,120,0) 70%)",
              filter: "blur(2px)",
              animation: `ffCupSteam ${(2.4 + (i % 4) * 0.6).toFixed(1)}s ease-in ${(i * 0.55).toFixed(2)}s infinite`,
            }}
          />
        ))}
        <img src="/cafe-cup-side.png" alt="" className="h-full w-full object-contain" style={{ opacity: 0.36, filter: "sepia(0.2) drop-shadow(0 2px 3px rgba(90,70,50,0.2))" }} />
      </div>
    </div>
  );
}
