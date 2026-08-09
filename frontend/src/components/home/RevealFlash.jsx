import { AnimatePresence, motion } from "framer-motion";

/** Reveal flash: quick white strobe + lingering theme-tinted glow behind the
 * reveal. Extracted verbatim from Home.jsx (2026-02 split). */
export function RevealFlash({ active, theme, light }) {
  return (
    <AnimatePresence>
      {active && (
        <motion.div
          key="reveal-flash"
          aria-hidden
          data-testid="reveal-flash"
          className="pointer-events-none fixed inset-0 z-[70]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* lingering glow — warm golden in light mode, blood-red in dark */}
          <motion.div
            className="absolute inset-0"
            style={{ background: theme === "cyber"
              ? "radial-gradient(circle at 50% 45%, rgba(34,224,224,0.5), rgba(199,125,255,0.28) 38%, rgba(0,0,0,0) 66%)"
              : theme === "fantasy"
              ? "radial-gradient(circle at 50% 45%, rgba(230,178,58,0.6), rgba(224,86,30,0.28) 38%, rgba(0,0,0,0) 66%)"
              : light
              ? "radial-gradient(circle at 50% 45%, rgba(255,193,80,0.45), rgba(255,255,255,0) 60%)"
              : "radial-gradient(circle at 50% 45%, rgba(224,30,38,0.55), rgba(0,0,0,0) 60%)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.9, 0.4, 0] }}
            transition={{ duration: 1.4, times: [0, 0.12, 0.55, 1], ease: "easeOut" }}
          />
          {/* quick white flash — strobes 3 times */}
          <motion.div
            className="absolute inset-0 bg-white"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0, 1, 0, 1, 0] }}
            transition={{ duration: 1.0, times: [0, 0.08, 0.2, 0.34, 0.46, 0.6, 0.75], ease: "easeOut" }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
