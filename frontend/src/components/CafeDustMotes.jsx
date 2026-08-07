import { motion } from "framer-motion";

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
