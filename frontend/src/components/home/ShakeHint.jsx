import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Vibrate } from "lucide-react";
import { useLang } from "../../i18n/i18n";

// Only nudge where shaking can actually work: motion-capable touch devices.
const canShake = () =>
  typeof window !== "undefined" &&
  "DeviceMotionEvent" in window &&
  ("ontouchstart" in window || navigator.maxTouchPoints > 0);

/** Tiny post-deal nudge so players discover shake-to-reshuffle.
 * Fades in a beat after each fate lands, wiggles, and slips away. */
export const ShakeHint = ({ trigger }) => {
  const { t } = useLang();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!trigger || !canShake()) return undefined;
    const inT = setTimeout(() => setShow(true), 1200);
    const outT = setTimeout(() => setShow(false), 6500);
    return () => { clearTimeout(inT); clearTimeout(outT); setShow(false); };
  }, [trigger]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 4 }}
          transition={{ duration: 0.45 }}
          className="pointer-events-none mt-3 flex justify-center"
          data-testid="shake-hint"
        >
          <span className="inline-flex items-center gap-1.5 rounded-full bg-black/60 px-3.5 py-1.5 font-sans text-[11px] font-bold text-white backdrop-blur">
            <Vibrate className="h-3.5 w-3.5" style={{ animation: "ffShakeHint 1.4s ease-in-out infinite" }} />
            {t("Shake your phone to reshuffle")}
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
