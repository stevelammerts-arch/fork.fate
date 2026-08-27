// Fireflies for the dark fall forest: a handful of glowing motes wander the
// night on layered CSS drift paths (Lissajous-style X/Y wrappers) with soft
// flicker. Tapping any firefly startles the whole swarm — they dart outward
// in random directions, dim, then slowly drift home and resume.
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { claimFireflyScatter, EARN } from "../../lib/points";

const COUNT = 7;

const FLIES = Array.from({ length: COUNT }).map((_, i) => ({
  left: 8 + ((i * 13.7) % 78), // %
  top: 16 + ((i * 9.3) % 52), // %
  size: 6 + (i % 3) * 2,
  durX: 7 + ((i * 2.63) % 6), // s
  durY: 5.5 + ((i * 1.91) % 5),
  delayX: -((i * 3.1) % 7),
  delayY: -((i * 2.3) % 5),
  flicker: 1.6 + ((i * 0.77) % 1.8),
}));

export function Fireflies() {
  const [scatterSeed, setScatterSeed] = useState(0);
  // fresh random dart vectors each scatter
  const offsets = useMemo(
    () =>
      FLIES.map(() => {
        const ang = Math.random() * Math.PI * 2;
        const dist = 24 + Math.random() * 22; // vmin
        return { x: Math.cos(ang) * dist, y: Math.sin(ang) * dist };
      }),
    [scatterSeed]
  );
  const scattered = scatterSeed > 0 && Date.now() - scatterSeed < 1400;

  const scatter = () => {
    if (scattered) return;
    try { navigator.vibrate && navigator.vibrate(12); } catch { /* ignore */ }
    // tiny once-a-night bonus for startling the swarm
    if (claimFireflyScatter() !== null) {
      toast.success(`+${EARN.firefly} Fate Points`, { description: "You scattered the fireflies", duration: 5000 });
    }
    setScatterSeed(Date.now());
    setTimeout(() => setScatterSeed((s) => (s ? -s : 0)), 1400); // negative = homing
  };
  const homing = scatterSeed < 0;

  return (
    <div className="pointer-events-none fixed inset-0 z-[55] select-none overflow-hidden" data-testid="fireflies-layer">
      {FLIES.map((f, i) => (
        <div
          key={i}
          className="absolute"
          style={{
            left: `${f.left}%`,
            top: `${f.top}%`,
            transform: scattered ? `translate(${offsets[i].x}vmin, ${offsets[i].y}vmin)` : "translate(0,0)",
            transition: scattered ? "transform 0.9s cubic-bezier(0.2,0.8,0.3,1)" : homing ? "transform 3.2s ease-in-out" : "none",
            opacity: scattered ? 0.35 : 1,
          }}
        >
          {/* X drift */}
          <div style={{ animation: `ffFlyX ${f.durX}s ease-in-out ${f.delayX}s infinite alternate` }}>
            {/* Y drift */}
            <div style={{ animation: `ffFlyY ${f.durY}s ease-in-out ${f.delayY}s infinite alternate` }}>
              <button
                type="button"
                aria-label="firefly"
                data-testid={`firefly-${i}`}
                onPointerDown={scatter}
                className="pointer-events-auto -m-4 block cursor-pointer border-0 bg-transparent p-4"
              >
                <span
                  className="block rounded-full"
                  style={{
                    width: f.size,
                    height: f.size,
                    background: "radial-gradient(circle, #F4FFC4 0%, #D8FF7A 55%, rgba(216,255,122,0) 75%)",
                    boxShadow: "0 0 10px 3px rgba(200,255,110,0.55), 0 0 22px 8px rgba(160,230,80,0.22)",
                    animation: `ffFireflyFlicker ${f.flicker}s ease-in-out ${f.delayY}s infinite`,
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
