import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Vibrate } from "lucide-react";
import { useLang } from "../../i18n/i18n";
import { requestMotionPermission, needsMotionPermission } from "../../hooks/useShake";

// Only nudge where shaking can actually work: motion-capable touch devices.
const canShake = () =>
  typeof window !== "undefined" &&
  "DeviceMotionEvent" in window &&
  ("ontouchstart" in window || navigator.maxTouchPoints > 0);

/** Tiny post-deal nudge so players discover shake-to-reshuffle.
 * Fades in a beat after each fate lands, wiggles, and slips away.
 * On iOS (where Apple gates motion behind an in-gesture prompt) the pill is
 * TAPPABLE — "Tap to enable shake" — because that tap is the only reliable
 * place the Motion permission sheet is allowed to appear. */
export const ShakeHint = ({ trigger }) => {
  const { t } = useLang();
  const [show, setShow] = useState(false);
  const [needsPerm, setNeedsPerm] = useState(() => needsMotionPermission());

  useEffect(() => {
    const sync = () => setNeedsPerm(needsMotionPermission());
    window.addEventListener("ff:motion-perm", sync);
    return () => window.removeEventListener("ff:motion-perm", sync);
  }, []);

  useEffect(() => {
    if (!trigger || !canShake()) return undefined;
    const inT = setTimeout(() => setShow(true), 1200);
    // The enable pill sticks around longer — it's actionable, not just a hint.
    const outT = setTimeout(() => setShow(false), needsMotionPermission() ? 12000 : 6500);
    return () => { clearTimeout(inT); clearTimeout(outT); setShow(false); };
  }, [trigger]);

  const enable = () => {
    // MUST run synchronously inside this tap — Apple only shows the Motion
    // sheet from a real user gesture.
    requestMotionPermission((r) => {
      if (r === "granted") {
        toast.success(t("Shake unlocked!"), { description: t("Shake your phone anytime to reshuffle your fate.") });
        setShow(false);
      } else if (r === "denied") {
        toast.info(t("Motion access is blocked"), {
          description: t("Open the aA menu in Safari → Website Settings → allow Motion & Orientation, then try again."),
          duration: 9000,
        });
      }
    });
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 4 }}
          transition={{ duration: 0.45 }}
          className={`mt-3 flex justify-center ${needsPerm ? "" : "pointer-events-none"}`}
          data-testid="shake-hint"
        >
          {needsPerm ? (
            <button
              type="button"
              onClick={enable}
              data-testid="shake-enable-button"
              className="inline-flex items-center gap-1.5 rounded-full border border-[#E6B23A]/60 bg-black/70 px-3.5 py-2 font-sans text-[11px] font-bold text-[#F5D67B] backdrop-blur transition-transform active:scale-95"
            >
              <Vibrate className="h-3.5 w-3.5" style={{ animation: "ffShakeHint 1.4s ease-in-out infinite" }} />
              {t("Tap to enable shake-to-reshuffle")}
            </button>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-black/60 px-3.5 py-1.5 font-sans text-[11px] font-bold text-white backdrop-blur">
              <Vibrate className="h-3.5 w-3.5" style={{ animation: "ffShakeHint 1.4s ease-in-out infinite" }} />
              {t("Shake your phone to reshuffle")}
            </span>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};
