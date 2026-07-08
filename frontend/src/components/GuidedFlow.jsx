import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  Utensils, Wine, Beer, IceCream, MapPin, LocateFixed, ArrowLeft,
  Search, Sparkles, Skull, Check,
} from "lucide-react";
import { Input } from "./ui/input";
import { Slider } from "./ui/slider";

const INTERESTS = [
  { key: "food", label: "Food", sub: "Restaurants & eats", Icon: Utensils },
  { key: "drinks", label: "Drinks", sub: "Coffee, boba, more", Icon: Wine },
  { key: "bars", label: "Bars", sub: "Cocktails & nightlife", Icon: Beer },
  { key: "desserts", label: "Desserts", sub: "Something sweet", Icon: IceCream },
];

// Page-turn transition — the finished step curls away, the next turns in.
const pageVariants = {
  initial: { rotateY: 75, opacity: 0, x: 60 },
  animate: { rotateY: 0, opacity: 1, x: 0 },
  exit: { rotateY: -75, opacity: 0, x: -60 },
};

export default function GuidedFlow({ cuisineMap, onSeal, onSkip }) {
  const [step, setStep] = useState(0);
  const [mode, setMode] = useState(null);
  const [zip, setZip] = useState("");
  const [coords, setCoords] = useState(null);
  const [geoLoading, setGeoLoading] = useState(false);
  const [radius, setRadius] = useState(25);
  const [cuisines, setCuisines] = useState([]);
  const [sealed, setSealed] = useState(false);

  const total = 4;
  const next = () => setStep((s) => Math.min(s + 1, total - 1));
  const back = () => setStep((s) => Math.max(s - 1, 0));

  const pickInterest = (key) => { setMode(key); setCuisines([]); next(); };

  const useMyLocation = () => {
    if (!navigator.geolocation) { toast.error("Location isn't supported on this device"); return; }
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setZip("");
        setGeoLoading(false);
        toast.success("Location set");
      },
      () => { setGeoLoading(false); toast.error("Couldn't get your location — enter a ZIP instead"); },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
    );
  };

  const locationReady = coords || /^\d{5}$/.test(zip.trim());
  const toggleCuisine = (c) =>
    setCuisines((p) => (p.includes(c) ? p.filter((x) => x !== c) : [...p, c]));

  const seal = () => {
    if (sealed) return;
    setSealed(true);
    setTimeout(() => onSeal({ mode, zip: zip.trim(), coords, radius, cuisines }), 1100);
  };

  const chips = (cuisineMap[mode] || []).slice(0, 12);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: sealed ? 1 : 0.4 }}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center p-4"
      data-testid="guided-flow"
      style={{ perspective: 1400 }}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />

      <div className="relative w-full max-w-md">
        {/* progress + back */}
        <div className="mb-4 flex items-center gap-3">
          {step > 0 && !sealed && (
            <button onClick={back} data-testid="guided-back" className="flex items-center gap-1 font-sans text-sm text-[#C0C0C0] transition-colors hover:text-white">
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
          )}
          <div className="h-1 flex-1 overflow-hidden rounded-full bg-[#2A2A2A]">
            <motion.div className="h-full bg-[#E01E26]" animate={{ width: `${((step + 1) / total) * 100}%` }} transition={{ duration: 0.4 }} />
          </div>
          <span className="font-sans text-xs font-bold tracking-widest text-[#6B6B6B]">{step + 1}/{total}</span>
          {!sealed && (
            <button onClick={onSkip} data-testid="guided-skip" className="font-sans text-xs font-semibold text-[#6B6B6B] transition-colors hover:text-white">Skip</button>
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
            className="relative overflow-hidden rounded-2xl border border-[#2A2A2A] bg-[#0E0E0E]/95 p-7 shadow-2xl backdrop-blur-3xl"
          >
            {/* STEP 1 — interest */}
            {step === 0 && (
              <div data-testid="guided-step-interest">
                <p className="font-sans text-xs font-bold uppercase tracking-[0.2em] text-[#E01E26]">Step one</p>
                <h2 className="mt-1 font-serif text-3xl font-bold text-white">What calls to you?</h2>
                <p className="mt-1 font-sans text-sm text-[#A0A0A0]">Choose your craving to begin the ritual.</p>
                <div className="mt-6 grid grid-cols-2 gap-4">
                  {INTERESTS.map(({ key, label, sub, Icon }) => (
                    <button
                      key={key}
                      onClick={() => pickInterest(key)}
                      data-testid={`guided-interest-${key}`}
                      className="group flex aspect-square flex-col items-center justify-center gap-3 rounded-xl border border-[#2A2A2A] bg-[#161616] transition-colors duration-200 hover:border-[#E01E26] hover:bg-[#E01E26]/10"
                    >
                      <Icon className="h-9 w-9 text-[#C0C0C0] transition-colors duration-200 group-hover:text-[#E01E26]" />
                      <span className="text-center">
                        <span className="block font-serif text-lg font-semibold text-white">{label}</span>
                        <span className="block font-sans text-[11px] text-[#6B6B6B]">{sub}</span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 2 — location + radius */}
            {step === 1 && (
              <div data-testid="guided-step-location">
                <p className="font-sans text-xs font-bold uppercase tracking-[0.2em] text-[#E01E26]">Step two</p>
                <h2 className="mt-1 font-serif text-3xl font-bold text-white">Where shall fate look?</h2>
                <div className="mt-6 flex items-center gap-2 rounded-xl border border-[#2A2A2A] bg-[#161616] px-4 py-1.5 focus-within:border-[#E01E26]">
                  <Search className="h-5 w-5 shrink-0 text-[#6B6B6B]" />
                  <Input
                    data-testid="guided-zip-input"
                    value={zip}
                    onChange={(e) => { setZip(e.target.value.replace(/[^\d]/g, "").slice(0, 5)); setCoords(null); }}
                    placeholder="Enter ZIP"
                    inputMode="numeric"
                    className="border-0 bg-transparent px-1 text-lg font-semibold text-white placeholder:text-[#4A4A4A] shadow-none focus-visible:ring-0"
                  />
                </div>
                <div className="my-3 text-center font-sans text-xs uppercase tracking-widest text-[#6B6B6B]">or</div>
                <button
                  onClick={useMyLocation}
                  disabled={geoLoading}
                  data-testid="guided-use-location"
                  className={`flex w-full items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-bold transition-colors disabled:opacity-70 ${coords ? "bg-[#E01E26] text-white" : "border border-[#2A2A2A] bg-[#1C1C1C] text-white hover:bg-[#2A2A2A]"}`}
                >
                  <LocateFixed className={`h-4 w-4 ${geoLoading ? "animate-pulse" : ""}`} />
                  {geoLoading ? "Locating…" : coords ? "Location set" : "Use my location"}
                </button>

                <div className="mt-6 rounded-xl border border-[#2A2A2A] bg-[#161616] px-4 py-3">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="font-sans text-xs font-bold uppercase tracking-[0.2em] text-[#C0C0C0]">Search radius</p>
                    <span data-testid="guided-radius-value" className="font-serif text-lg font-semibold text-[#E01E26]">{radius} <span className="text-sm text-[#6B6B6B]">mi</span></span>
                  </div>
                  <Slider data-testid="guided-radius-slider" value={[radius]} min={1} max={50} step={1} onValueChange={(v) => setRadius(v[0])} />
                  <div className="mt-1.5 flex justify-between font-sans text-[10px] font-bold uppercase tracking-wider text-[#4A4A4A]"><span>1 mi</span><span>50 mi</span></div>
                </div>

                <button
                  onClick={next}
                  disabled={!locationReady}
                  data-testid="guided-location-next"
                  className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-[#E01E26] px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-[#FF2E38] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Continue
                </button>
              </div>
            )}

            {/* STEP 3 — sub chips */}
            {step === 2 && (
              <div data-testid="guided-step-chips">
                <p className="font-sans text-xs font-bold uppercase tracking-[0.2em] text-[#E01E26]">Step three</p>
                <h2 className="mt-1 font-serif text-3xl font-bold text-white">Narrow the fates</h2>
                <p className="mt-1 font-sans text-sm text-[#A0A0A0]">Pick any that tempt you — or let fate surprise you.</p>
                <div className="mt-6 flex flex-wrap gap-2.5">
                  {chips.map((c) => {
                    const on = cuisines.includes(c);
                    return (
                      <button
                        key={c}
                        onClick={() => toggleCuisine(c)}
                        data-testid={`guided-chip-${c}`}
                        className={`rounded-full px-4 py-2 text-sm font-medium transition-colors duration-200 ${on ? "border border-transparent bg-[#E01E26] text-white" : "border border-[#2A2A2A] bg-[#1C1C1C] text-[#A0A0A0] hover:border-[#E01E26]/60"}`}
                      >
                        {on && <Check className="mr-1 inline h-3.5 w-3.5" />}{c}
                      </button>
                    );
                  })}
                </div>
                <div className="mt-7 flex gap-3">
                  <button onClick={next} data-testid="guided-surprise-me" className="flex-1 rounded-full border border-[#2A2A2A] bg-[#1C1C1C] px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-[#2A2A2A]">
                    <Sparkles className="mr-1.5 inline h-4 w-4 text-[#E01E26]" /> Surprise me
                  </button>
                  <button onClick={next} disabled={!cuisines.length} data-testid="guided-chips-next" className="flex-1 rounded-full bg-[#E01E26] px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-[#FF2E38] disabled:opacity-40">
                    Continue ({cuisines.length})
                  </button>
                </div>
              </div>
            )}

            {/* STEP 4 — tarot seal */}
            {step === 3 && (
              <div className="text-center" data-testid="guided-step-seal">
                <p className="font-sans text-xs font-bold uppercase tracking-[0.2em] text-[#E01E26]">The final step</p>
                <h2 className="mt-1 font-serif text-3xl font-bold text-white">Seal your fate</h2>

                <div className="mx-auto mt-6 h-72 w-48" style={{ perspective: 1000 }}>
                  <motion.button
                    onClick={seal}
                    data-testid="guided-seal-button"
                    className="relative h-full w-full cursor-pointer rounded-2xl"
                    style={{ transformStyle: "preserve-3d" }}
                    animate={sealed ? { rotateY: 180, scale: 1.08 } : { rotateY: 0, scale: 1 }}
                    transition={{ type: "spring", stiffness: 60, damping: 15 }}
                    whileHover={sealed ? {} : { scale: 1.04 }}
                  >
                    {/* front */}
                    <span className="absolute inset-0 flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-[#C0C0C0]/40 bg-gradient-to-b from-[#1a1a1a] to-[#0b0b0b] shadow-[0_0_30px_rgba(224,30,38,0.35)]" style={{ backfaceVisibility: "hidden" }}>
                      <span className="pointer-events-none absolute inset-2 rounded-xl border border-[#C0C0C0]/20" />
                      <Skull className="h-16 w-16 text-[#E01E26] drop-shadow-[0_0_10px_rgba(224,30,38,0.7)]" />
                      <span className="px-4 font-serif text-lg font-bold uppercase tracking-widest text-[#C0C0C0]">Seal your fate</span>
                    </span>
                    {/* back */}
                    <span className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-[#E01E26] bg-gradient-to-b from-[#2a0b0d] to-[#0b0b0b] shadow-[0_0_50px_rgba(224,30,38,0.8)]" style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}>
                      <Sparkles className="h-12 w-12 text-[#E01E26]" />
                      <span className="font-serif text-xl font-bold uppercase tracking-widest text-white">Fate Sealed</span>
                    </span>
                  </motion.button>
                </div>

                <p className="mt-6 font-serif text-base italic text-[#A0A0A0]">
                  {sealed ? "The deck decides…" : "Once chosen, your fate is sealed."}
                </p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
