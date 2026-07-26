import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Share2, Download, X } from "lucide-react";

/**
 * The completion moment: a closed Fork·Fate passport that swings open to reveal
 * the finished award page. Hinged on the left edge with a 3D cover flip.
 */
export default function PassportBookReveal({ open, awardUrl, code, holderName, onClose, onShare, onDownload, busy }) {
  const [opened, setOpened] = useState(false);

  useEffect(() => {
    if (!open) { setOpened(false); return; }
    const t = setTimeout(() => setOpened(true), 700);
    return () => clearTimeout(t);
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          data-testid="passport-book-reveal"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{ backgroundColor: "rgba(8,8,8,0.94)" }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-5 px-5 py-8"
        >
          <button
            onClick={onClose}
            data-testid="passport-book-close"
            className="absolute right-4 top-4 grid h-11 w-11 place-items-center rounded-full border border-white/25 text-white hover:bg-white/10"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>

          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="font-sans text-xs font-bold uppercase tracking-[0.3em] text-[#F0A24E]"
          >
            Passport complete
          </motion.p>

          <motion.div
            initial={{ scale: 0.86, opacity: 0, rotate: -2 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 140, damping: 16 }}
            className="relative w-full max-w-[330px]"
            style={{ aspectRatio: "4 / 5", perspective: 1400 }}
          >
            {/* the award page, revealed under the cover */}
            <motion.img
              src={awardUrl}
              alt="Your Fork·Fate passport award"
              data-testid="passport-award-image"
              initial={{ opacity: 0 }}
              animate={{ opacity: opened ? 1 : 0 }}
              transition={{ duration: 0.5, delay: opened ? 0.35 : 0 }}
              className="absolute inset-0 h-full w-full rounded-lg object-contain shadow-2xl"
            />

            {/* the cover, hinged on the spine */}
            <motion.div
              initial={{ rotateY: 0 }}
              animate={{ rotateY: opened ? -168 : 0 }}
              transition={{ duration: 1.25, ease: [0.22, 1, 0.36, 1] }}
              style={{ transformOrigin: "left center", transformStyle: "preserve-3d", backfaceVisibility: "hidden" }}
              className="absolute inset-0 grid place-items-center rounded-lg border border-[#5A3A22] bg-gradient-to-br from-[#3A2416] to-[#20140B] shadow-[0_25px_60px_rgba(0,0,0,0.6)]"
            >
              <div className="flex flex-col items-center gap-3 text-center">
                <span className="font-sans text-[10px] font-bold uppercase tracking-[0.35em] text-[#C79A5B]">Fork · Fate</span>
                {/* Gold-foil version of the app crest, embossed on the cover. */}
                <img
                  src="/logo-mark-512.png"
                  alt=""
                  data-testid="passport-cover-crest"
                  className="h-24 w-24 drop-shadow-[0_2px_6px_rgba(0,0,0,0.6)]"
                  style={{ filter: "grayscale(1) sepia(1) saturate(2.6) hue-rotate(-12deg) brightness(1.05) contrast(1.1)" }}
                />
                <span className="font-serif text-2xl font-bold tracking-wide text-[#E7C79A]">PASSPORT</span>
                <span className="font-sans text-[11px] font-bold uppercase tracking-[0.25em] text-[#8E6A44]">
                  {holderName || "Fate Traveller"}
                </span>
                <span className="rounded-full border border-[#8E6A44] px-3 py-1 font-sans text-[10px] font-bold tracking-[0.2em] text-[#C79A5B]">
                  NO. {code}
                </span>
              </div>
            </motion.div>
          </motion.div>

          <div className="flex flex-wrap items-center justify-center gap-2">
            <button
              onClick={onShare}
              disabled={busy}
              data-testid="passport-book-share"
              className="inline-flex items-center gap-2 rounded-full bg-[#B26A12] px-5 py-3 text-sm font-bold text-white hover:bg-[#8A5210] disabled:opacity-60"
            >
              <Share2 className="h-4 w-4" /> Share
            </button>
            <button
              onClick={onDownload}
              disabled={busy}
              data-testid="passport-book-download"
              className="inline-flex items-center gap-2 rounded-full border-2 border-[#C79A5B] px-5 py-3 text-sm font-bold text-[#E7C79A] hover:bg-white/10 disabled:opacity-60"
            >
              <Download className="h-4 w-4" /> Save
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
