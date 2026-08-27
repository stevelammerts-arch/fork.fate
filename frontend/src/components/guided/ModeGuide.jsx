import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Users, MapPin, Dices, Beer, Route, Map, Stamp, Compass, Trophy, UtensilsCrossed, ListOrdered } from "lucide-react";
import { useLang } from "../../i18n/i18n";
import { pageVariants, buildGuidedTheme } from "./theme";

// First visit to a mode tab: a 4-page flip book with the same chrome as the
// solo guided ritual (page turns, progress bar, parchment surface). Every
// page pairs the step's explanation with its LIVE controls — pick a
// category, set the location, size the run, then deal — exactly like solo.
const PAGES = {
  group: [
    { icon: Users, slice: "category", title: "Pick your category", body: "Food for meals, Stay for camping, Explore for parks — choose what the table craves." },
    { icon: UtensilsCrossed, slice: "types", title: "Narrow the types", body: "Tap any types to focus fate — or leave them all open for pure chance." },
    { icon: MapPin, slice: "where", title: "Set the table", body: "Drop a ZIP or use your location, and choose how far fate may wander." },
    { icon: Dices, slice: "deal", title: "Deal the fates", body: "Three spots are dealt at once — compare pulls, crown a winner, and go eat." },
  ],
  crawls: [
    { icon: Beer, slice: "type", title: "Pick your crawl", body: "Bar crawl, taco run, dessert quest and more — choose tonight's ritual." },
    { icon: MapPin, slice: "start", title: "Chart the start", body: "Set where the night begins and how far it may roam." },
    { icon: Route, slice: "end", title: "Aim the night", body: "Optional: add an end point and the crawl will drift toward it, stop by stop." },
    { icon: Map, slice: "deal", title: "Deal the crawl", body: "Fate orders the stops into a walkable route with a live map for your crew." },
  ],
  passports: [
    { icon: Stamp, slice: "quest", title: "Choose your quest", body: "Pick a category and types to conquer over the coming weeks." },
    { icon: ListOrdered, slice: "size", title: "Size your journey", body: "Choose how many stops your passport will hold." },
    { icon: Compass, slice: "where", title: "Set your hunting grounds", body: "Tell fate where to hunt — your area, a destination, and how far you'll travel." },
    { icon: Trophy, slice: "deal", title: "Stamp your way", body: "Deal it, then stamp each visit. Fill the passport and claim your trophy." },
  ],
};

export default function ModeGuide({ mode, theme, onDone, renderPanel }) {
  const { t } = useLang();
  const gt = buildGuidedTheme(theme);
  const pages = PAGES[mode] || [];
  const [step, setStep] = useState(0);
  const total = pages.length;

  const playTurn = (vol = 0.5) => {
    try {
      if (localStorage.getItem("ff_muted") === "1") return;
      const a = new Audio("/turn-page.mp3");
      a.volume = vol;
      a.play().catch(() => {});
    } catch (e) { /* non-critical */ }
  };
  const next = () => { playTurn(); setStep((s) => Math.min(s + 1, total - 1)); };
  const back = () => { playTurn(0.35); setStep((s) => Math.max(s - 1, 0)); };

  const { icon: Icon, title, body, slice } = pages[step];
  const lastPage = step === total - 1;
  // when the player fires the panel's own deal/spin CTA, glide the book away
  const autoClose = (e) => {
    const btn = e.target.closest("button");
    const tid = (btn && btn.getAttribute("data-testid")) || "";
    if (/deal|spin|cta/i.test(tid) || (btn && /deal|pick 3|shuffling|passport|crawl!/i.test(btn.innerText || ""))) {
      setTimeout(onDone, 500);
    }
  };
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
      className="fixed inset-0 z-[100] overflow-y-auto"
      data-testid="mode-guide"
      style={{ perspective: 1400, "--ff-accent": gt.accent }}
    >
      <div className="fixed inset-0 bg-black/70 backdrop-blur-md" />
      <div className="relative flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-md">
          <div className="mb-4 flex items-center gap-3">
            {step > 0 && (
              <button onClick={back} data-testid="mode-guide-back" className={`flex items-center gap-1 font-sans text-sm transition-colors ${gt.backBtn}`}>
                <ArrowLeft className="h-4 w-4" /> {t("Back")}
              </button>
            )}
            <div className={`h-1 flex-1 overflow-hidden rounded-full ${gt.trackBg}`}>
              <motion.div className="h-full" style={{ backgroundColor: gt.accent }} animate={{ width: `${((step + 1) / total) * 100}%` }} transition={{ duration: 0.4 }} />
            </div>
            <span className="font-sans text-xs font-bold tracking-widest text-[#6B6B6B]">{step + 1}/{total}</span>
            <button onClick={onDone} data-testid="mode-guide-skip"
              className={`inline-flex items-center gap-1 rounded-full border px-4 py-1.5 font-sans text-xs font-bold transition-colors hover:border-[var(--ff-accent)] hover:bg-[var(--ff-accent)] hover:text-white ${gt.skipIdle}`}>
              {t("Skip intro")} <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.45, ease: "easeInOut" }}
              style={{ transformOrigin: "left center" }}
              className={`relative max-h-[78vh] overflow-y-auto overflow-x-hidden rounded-2xl border p-6 shadow-2xl backdrop-blur-3xl ${gt.surface}`}
            >
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl" style={{ backgroundColor: `${gt.accent}1a` }}>
                  <Icon className="h-5 w-5" style={{ color: gt.accent }} />
                </span>
                <div>
                  <p className="font-sans text-[11px] font-bold uppercase tracking-[0.28em]" style={{ color: gt.accent }}>
                    {t("Step")} {step + 1}
                  </p>
                  <h3 className={`font-serif text-xl leading-tight ${gt.titleColor}`}>{t(title)}</h3>
                </div>
              </div>
              <p className={`mt-2 font-sans text-sm leading-relaxed ${gt.subColor}`}>{t(body)}</p>

              {/* the LIVE controls for this step */}
              <div className="mt-4" data-testid={`mode-guide-panel-${slice}`} onClickCapture={lastPage ? autoClose : undefined}>
                {renderPanel(slice)}
              </div>

              {lastPage ? (
                <button type="button" onClick={onDone} data-testid="mode-guide-done"
                  className={`mt-4 w-full rounded-full border px-6 py-2.5 font-sans text-xs font-bold transition-colors hover:border-[var(--ff-accent)] ${gt.skipIdle}`}>
                  {t("Close guide")}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={next}
                  data-testid="mode-guide-next"
                  className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full px-6 py-3 font-sans text-sm font-bold text-white transition-transform hover:-translate-y-0.5"
                  style={{ backgroundColor: gt.accent }}
                >
                  {t("Next")} <ArrowRight className="h-4 w-4" />
                </button>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
