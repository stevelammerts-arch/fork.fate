import { AnimatePresence, motion } from "framer-motion";
import { ShufflingDeck } from "../ShufflingDeck";
import { useVisibilityRescue } from "../../hooks/useVisibilityRescue";

/** Full-screen shuffle pop-up: dark-mode drifting mist + the riffling deck.
 * Extracted verbatim from Home.jsx (2026-02 split). */
export function ShuffleOverlay({ open, light, flash, flashHit, cards, theme, season, seasonItems, seasonAccent }) {
  // Rescue: if the phone froze animation frames, force the overlay visible.
  const rescueRef = useVisibilityRescue(700);
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="shuffle-popup"
          ref={rescueRef}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className={`fixed inset-0 z-[60] flex items-center justify-center px-6 backdrop-blur-sm ${light ? "bg-white/70" : "bg-black/50"}`}
          data-testid="shuffle-popup"
          style={{ pointerEvents: flashHit ? "none" : "auto" }}
        >
          {/* Ominous drifting red/black mist — dark mode only */}
          {!light && (
          <div className="pointer-events-none absolute inset-0 overflow-hidden" data-testid="shuffle-mist">
            <motion.div
              className="absolute left-[10%] top-1/4 h-72 w-72 rounded-full bg-[#E01E26] blur-[90px]"
              animate={{ x: [0, 70, 0], y: [0, -40, 0], opacity: [0.12, 0.34, 0.12] }}
              transition={{ duration: 6.5, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              className="absolute right-[8%] top-1/3 h-96 w-96 rounded-full bg-black blur-[100px]"
              animate={{ x: [0, -60, 0], y: [0, 50, 0], opacity: [0.35, 0.65, 0.35] }}
              transition={{ duration: 7.5, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              className="absolute bottom-[6%] left-1/3 h-80 w-80 rounded-full bg-[#7A0C10] blur-[90px]"
              animate={{ x: [0, 45, 0], y: [0, -25, 0], opacity: [0.15, 0.4, 0.15] }}
              transition={{ duration: 8.5, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>
          )}
          <motion.div
            initial={{ scale: 0.8, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 24 }}
            className="relative z-10 w-full max-w-sm p-8"
          >
            <ShufflingDeck cards={cards} flash={flash} landed={flashHit} light={light} theme={theme} season={season} seasonItems={seasonItems} seasonAccent={seasonAccent} />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
