import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Users, MapPin, Dices, Beer, Route, Map, Stamp, Compass, Trophy } from "lucide-react";
import { useLang } from "../../i18n/i18n";
import { pageVariants, buildGuidedTheme } from "./theme";

// First visit to a mode tab: a mini flip book (same chrome as the solo
// guided ritual — page turns, progress bar, parchment surface) walking
// through that window's Step 1/2/3, then landing on its setup panel.
const PAGES = {
  group: [
    { icon: Users, title: "Gather your crew", body: "Add everyone at the table — each hungry soul gets their own fate dealt." },
    { icon: MapPin, title: "Set the table", body: "Drop a ZIP or use your location, and choose how far fate may wander." },
    { icon: Dices, title: "Deal the fates", body: "Every member draws a card. Compare pulls, crown a winner, and go eat." },
  ],
  crawls: [
    { icon: Beer, title: "Pick your crawl", body: "Bar crawl, taco run, dessert quest and more — choose tonight's ritual." },
    { icon: Route, title: "Chart the route", body: "Set your start, an optional end point, and how far the night may roam." },
    { icon: Map, title: "Deal the crawl", body: "Fate orders the stops into a walkable route with a live map for your crew." },
  ],
  passports: [
    { icon: Stamp, title: "Choose your quest", body: "Pick a cuisine or category to conquer over the coming weeks." },
    { icon: Compass, title: "Set your hunting grounds", body: "Tell fate where to hunt — your area and how far you'll travel." },
    { icon: Trophy, title: "Stamp your way", body: "Each visit earns a stamp. Fill the passport and claim your trophy." },
  ],
};

export default function ModeGuide({ mode, theme, onDone }) {
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
  const next = () => { playTurn(); step < total - 1 ? setStep(step + 1) : onDone(); };
  const back = () => { playTurn(0.35); setStep((s) => Math.max(s - 1, 0)); };

  const { icon: Icon, title, body } = pages[step];
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
              className={`relative overflow-hidden rounded-2xl border p-7 shadow-2xl backdrop-blur-3xl ${gt.surface}`}
            >
              <p className="font-sans text-[11px] font-bold uppercase tracking-[0.28em]" style={{ color: gt.accent }}>
                {t("Step")} {step + 1}
              </p>
              <span className="mt-4 flex h-12 w-12 items-center justify-center rounded-2xl" style={{ backgroundColor: `${gt.accent}1a` }}>
                <Icon className="h-6 w-6" style={{ color: gt.accent }} />
              </span>
              <h3 className={`mt-4 font-serif text-2xl ${gt.titleColor}`}>{t(title)}</h3>
              <p className={`mt-2 font-sans text-sm leading-relaxed ${gt.subColor}`}>{t(body)}</p>
              <button
                type="button"
                onClick={next}
                data-testid={step === total - 1 ? "mode-guide-done" : "mode-guide-next"}
                className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full px-6 py-3 font-sans text-sm font-bold text-white transition-transform hover:-translate-y-0.5"
                style={{ backgroundColor: gt.accent }}
              >
                {step === total - 1 ? t("Begin") : t("Next")} <ArrowRight className="h-4 w-4" />
              </button>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
