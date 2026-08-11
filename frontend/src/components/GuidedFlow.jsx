import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useLang } from "../i18n/i18n";
import { pageVariants, buildGuidedTheme } from "./guided/theme";
import { StepInterest } from "./guided/StepInterest";
import { StepLocation } from "./guided/StepLocation";
import { StepChips } from "./guided/StepChips";
import { StepSeal } from "./guided/StepSeal";

// First-visit ritual: interest -> location -> chips -> tarot seal.
// This file only owns the flow STATE and chrome (progress bar, page turns);
// each step lives in ./guided/ as its own presentational component.
export default function GuidedFlow({ cuisineMap, groupMap = {}, onSeal, onSkip, theme, accent: accentProp }) {
  const { t } = useLang();
  const gt = buildGuidedTheme(theme, accentProp);

  const [step, setStep] = useState(0);
  const [mode, setMode] = useState(null);
  const [zip, setZip] = useState("");
  const [coords, setCoords] = useState(null);
  const [radius, setRadius] = useState(25);
  const [cuisines, setCuisines] = useState([]);
  const [sealed, setSealed] = useState(false);

  const total = 4;
  const playTurn = (vol = 0.5) => {
    try {
      if (localStorage.getItem("ff_muted") === "1") return;
      const a = new Audio("/turn-page.mp3");
      a.volume = vol;
      a.play().catch(() => {});
    } catch (e) { /* audio unavailable — non-critical */ }
  };
  const next = () => { playTurn(); setStep((s) => Math.min(s + 1, total - 1)); };
  const back = () => { playTurn(0.35); setStep((s) => Math.max(s - 1, 0)); };

  const pickInterest = (key) => { setMode(key); setCuisines([]); next(); };
  const locationReady = coords || /^\d{5}$/.test(zip.trim());
  const toggleCuisine = (c) =>
    setCuisines((p) => (p.includes(c) ? p.filter((x) => x !== c) : [...p, c]));

  const seal = () => {
    if (sealed) return;
    setSealed(true);
    playTurn(0.6);
    setTimeout(() => onSeal({ mode, zip: zip.trim(), coords, radius, cuisines }), 1100);
  };

  // Explore/Stay search further out (a state park is worth the drive) — mirror
  // the main page's radiusMax so the guide can't cap them at 50 mi.
  const radiusMax = mode === "explore" || mode === "stay" ? 150 : 50;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: sealed ? 1 : 0.4 }}
      className="fixed inset-0 z-[100] overflow-y-auto"
      data-testid="guided-flow"
      style={{ perspective: 1400, "--ff-accent": gt.accent, "--ff-accent-soft": `${gt.accent}1a` }}
    >
      <div
        className={`fixed inset-0 transition-all duration-700 ${step === 3 ? "bg-black/40 backdrop-blur-[2px]" : "bg-black/70 backdrop-blur-md"}`}
        onMouseDown={() => { const el = document.activeElement; if (el && el.tagName === "INPUT") el.blur(); }}
      />

      <div className="relative flex min-h-full items-center justify-center p-4">
      <div className="relative w-full max-w-md">
        {/* progress + back */}
        <div className="mb-4 flex items-center gap-3">
          {step > 0 && !sealed && (
            <button onClick={back} data-testid="guided-back" className={`flex items-center gap-1 font-sans text-sm transition-colors ${gt.backBtn}`}>
              <ArrowLeft className="h-4 w-4" /> {t("Back")}
            </button>
          )}
          <div className={`h-1 flex-1 overflow-hidden rounded-full ${gt.trackBg}`}>
            <motion.div className="h-full" style={{ backgroundColor: gt.accent }} animate={{ width: `${((step + 1) / total) * 100}%` }} transition={{ duration: 0.4 }} />
          </div>
          <span className="font-sans text-xs font-bold tracking-widest text-[#6B6B6B]">{step + 1}/{total}</span>
          {!sealed && (
            <button onClick={onSkip} data-testid="guided-skip"
              style={{ "--tw-ring-color": gt.accent }}
              className={`inline-flex items-center gap-1 rounded-full border px-4 py-1.5 font-sans text-xs font-bold transition-colors hover:border-[var(--ff-accent)] hover:bg-[var(--ff-accent)] hover:text-white ${gt.skipIdle}`}>
              {t("Skip intro")} <ArrowRight className="h-3.5 w-3.5" />
            </button>
          )}
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
            className={`relative overflow-hidden rounded-2xl p-7 ${step === 3 ? "border-0 bg-transparent shadow-none" : `border shadow-2xl backdrop-blur-3xl ${gt.surface}`}`}
          >
            {step === 0 && <StepInterest gt={gt} onPick={pickInterest} />}
            {step === 1 && (
              <StepLocation
                gt={gt}
                zip={zip} setZip={setZip}
                coords={coords} setCoords={setCoords}
                radius={radius} setRadius={setRadius}
                radiusMax={radiusMax}
                locationReady={locationReady}
                onNext={next}
              />
            )}
            {step === 2 && (
              <StepChips
                gt={gt}
                mode={mode}
                chips={cuisineMap[mode] || []}
                groups={groupMap[mode] || null}
                cuisines={cuisines}
                toggleCuisine={toggleCuisine}
                onNext={next}
              />
            )}
            {step === 3 && <StepSeal gt={gt} sealed={sealed} onSeal={seal} />}
          </motion.div>
        </AnimatePresence>
      </div>
      </div>
    </motion.div>
  );
}
