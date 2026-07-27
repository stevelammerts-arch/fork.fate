import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Share2, Download, X } from "lucide-react";

const EASE = [0.22, 1, 0.36, 1];

/**
 * The completion moment, as an actual book: the front cover swings open on the
 * spine, its inside face carrying the ID page, and the stamp page is revealed
 * underneath with the cover's shadow sliding off it.
 *
 * The award image is a full spread (left page + right page), so it's used twice:
 * its right half sits under the cover, and its left half is the cover's back
 * face — exactly how the two pages sit in a real passport.
 */
export default function PassportBookReveal({ open, awardUrl, code, holderName, onClose, onShare, onDownload, busy }) {
  const [opened, setOpened] = useState(false);

  useEffect(() => {
    if (!open) { setOpened(false); return; }
    const t = setTimeout(() => setOpened(true), 800);
    return () => clearTimeout(t);
  }, [open]);

  const half = (side) => ({
    backgroundImage: awardUrl ? `url(${awardUrl})` : undefined,
    backgroundSize: "200% 100%",
    backgroundPosition: `${side} center`,
    backgroundRepeat: "no-repeat",
  });

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

          {/* the book, tilted slightly away so you see it as an object */}
          <motion.div
            initial={{ scale: 0.82, opacity: 0 }}
            animate={{ scale: 1, opacity: 1, x: opened ? "0%" : "-25%" }}
            transition={{ type: "spring", stiffness: 130, damping: 17 }}
            className="relative w-full max-w-[520px]"
            style={{ aspectRatio: "1.4 / 1", perspective: 1500, perspectiveOrigin: "50% 50%" }}
          >
            <div className="absolute inset-0" style={{ transform: "rotateX(7deg)", transformStyle: "preserve-3d" }}>
              {/* page block: the stack of leaves the cover closes onto */}
              <div className="absolute left-1/2 top-0 h-full w-1/2 rounded-r-md bg-[#EFE6D2] shadow-[0_30px_60px_rgba(0,0,0,0.55)]" />
              <div className="absolute left-1/2 top-[2px] h-[calc(100%-4px)] w-1/2 translate-x-[3px] rounded-r-md bg-[#F6EEDC]" />

              {/* right page — revealed as the cover lifts */}
              <motion.div
                data-testid="passport-award-image"
                className="absolute left-1/2 top-0 h-full w-1/2 overflow-hidden rounded-r-md"
                style={half("right")}
                initial={{ opacity: 0 }}
                animate={{ opacity: opened ? 1 : 0 }}
                transition={{ duration: 0.35, delay: opened ? 0.45 : 0 }}
              >
                {/* the cover's shadow sliding off the page as it opens */}
                <motion.div
                  className="absolute inset-0"
                  initial={{ opacity: 0.85 }}
                  animate={{ opacity: opened ? 0 : 0.85 }}
                  transition={{ duration: 1.4, ease: EASE }}
                  style={{ background: "linear-gradient(90deg, rgba(20,12,4,0.75) 0%, rgba(20,12,4,0.25) 55%, rgba(20,12,4,0) 100%)" }}
                />
              </motion.div>

              {/* the front cover: leather outside, ID page inside */}
              <motion.div
                initial={{ rotateY: 0 }}
                animate={{ rotateY: opened ? -178 : 0 }}
                transition={{ duration: 1.6, ease: EASE }}
                className="absolute left-1/2 top-0 h-full w-1/2"
                style={{ transformOrigin: "left center", transformStyle: "preserve-3d" }}
              >
                {/* outside */}
                <div
                  className="absolute inset-0 grid place-items-center rounded-r-md border border-[#5A3A22] bg-gradient-to-br from-[#3E2718] to-[#1D1209] shadow-[0_25px_60px_rgba(0,0,0,0.6)]"
                  style={{ backfaceVisibility: "hidden" }}
                >
                  <div className="flex flex-col items-center gap-2 text-center">
                    <span className="font-sans text-[9px] font-bold uppercase tracking-[0.35em] text-[#C79A5B]">Fork · Fate</span>
                    <img
                      src="/logo-crest-gold.png"
                      alt=""
                      data-testid="passport-cover-crest"
                      className="h-20 w-20 drop-shadow-[0_2px_6px_rgba(0,0,0,0.6)]"
                    />
                    <span className="font-serif text-xl font-bold tracking-wide text-[#E7C79A]">PASSPORT</span>
                    <span className="font-sans text-[10px] font-bold uppercase tracking-[0.25em] text-[#8E6A44]">
                      {holderName || "Fate Traveller"}
                    </span>
                    <span className="rounded-full border border-[#8E6A44] px-2.5 py-0.5 font-sans text-[9px] font-bold tracking-[0.2em] text-[#C79A5B]">
                      NO. {code}
                    </span>
                  </div>
                  {/* leather sheen along the fore-edge */}
                  <div
                    className="pointer-events-none absolute inset-y-0 right-0 w-6 rounded-r-md"
                    style={{ background: "linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,240,210,0.14) 100%)" }}
                  />
                </div>

                {/* inside: the ID page, plus a gutter shade so it curves into the spine */}
                <div
                  className="absolute inset-0 overflow-hidden rounded-l-md"
                  style={{ ...half("left"), transform: "rotateY(180deg)", backfaceVisibility: "hidden" }}
                >
                  <div
                    className="pointer-events-none absolute inset-y-0 right-0 w-10"
                    style={{ background: "linear-gradient(270deg, rgba(40,26,10,0.35) 0%, rgba(40,26,10,0) 100%)" }}
                  />
                </div>
              </motion.div>

              {/* the spine, dark and always between the two halves */}
              <div
                className="pointer-events-none absolute inset-y-0 left-1/2 w-3 -translate-x-1/2"
                style={{ background: "linear-gradient(90deg, rgba(20,12,4,0.05), rgba(20,12,4,0.55), rgba(20,12,4,0.05))" }}
              />
            </div>
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
