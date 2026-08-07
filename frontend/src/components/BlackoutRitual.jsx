import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Grid3X3 } from "lucide-react";
import { useLang } from "../i18n/i18n";

/** BLACKOUT: every square on the 5x5 Cuisine Bingo card is stamped. A rare
 * full-screen ritual — the golden stamp slams down over a wall of falling
 * squares, then invites the player to admire the card. Auto-dismisses. */
export default function BlackoutRitual({ open, onClose }) {
  const { t } = useLang();
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) return;
    const id = setTimeout(onClose, 6500);
    return () => clearTimeout(id);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[90] flex items-center justify-center overflow-hidden bg-black/85 backdrop-blur-sm"
          data-testid="blackout-ritual"
          onClick={onClose}
        >
          {/* a rain of golden bingo squares */}
          {Array.from({ length: 22 }, (_, i) => (
            <span
              key={`sq-${i}`}
              className="absolute rounded-[3px]"
              style={{
                left: `${(i * 37 + 11) % 100}%`,
                top: "-6%",
                width: 10 + (i % 4) * 5,
                height: 10 + (i % 4) * 5,
                background: i % 3 === 0 ? "#E6B23A" : i % 3 === 1 ? "#C08A2E" : "#F5D98B",
                opacity: 0.9,
                animation: `ffBlackoutSquare ${2.6 + (i % 5) * 0.5}s linear ${(i % 8) * 0.3}s infinite`,
              }}
            />
          ))}
          {/* the golden flash behind the stamp */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{ background: "radial-gradient(circle at 50% 45%, rgba(230,178,58,0.35), transparent 55%)", animation: "ffBlackoutFlash 1.2s ease-out both" }}
          />
          {/* the stamp itself */}
          <motion.div
            initial={{ scale: 3.2, rotate: -18, opacity: 0 }}
            animate={{ scale: 1, rotate: -8, opacity: 1 }}
            transition={{ type: "spring", stiffness: 320, damping: 16, delay: 0.15 }}
            className="relative mx-6 text-center"
          >
            <div className="rounded-2xl border-4 border-[#E6B23A] bg-[#120D02]/90 px-8 py-6 shadow-[0_0_60px_rgba(230,178,58,0.5)]">
              <p className="font-sans text-xs font-bold uppercase tracking-[0.35em] text-[#E6B23A]/80">{t("Cuisine Bingo")}</p>
              <p className="mt-1 font-serif text-5xl font-black tracking-wide text-[#E6B23A] sm:text-6xl" style={{ textShadow: "0 0 24px rgba(230,178,58,0.6)" }}>
                {t("BLACKOUT!")}
              </p>
              <p className="mt-2 font-sans text-sm text-[#E8DFC8]">{t("All 25 squares stamped. Fate bows to you.")}</p>
              <button
                onClick={(e) => { e.stopPropagation(); onClose(); navigate("/bingo"); }}
                data-testid="blackout-view-card"
                className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#E6B23A] px-5 py-2.5 text-sm font-bold text-[#120D02] transition-colors hover:bg-[#F5D98B]"
              >
                <Grid3X3 className="h-4 w-4" /> {t("Admire the card")}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
