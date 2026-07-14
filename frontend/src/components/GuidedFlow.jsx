import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  Utensils, Wine, Beer, IceCream, ShoppingBag, Fuel, MapPin, LocateFixed, ArrowLeft, ArrowRight,
  Search, Sparkles, Skull, Check,
} from "lucide-react";
import { Input } from "./ui/input";
import { Slider } from "./ui/slider";
import { useLang } from "../i18n/i18n";

// Page-turn transition — the finished step curls away, the next turns in.
const pageVariants = {
  initial: { rotateY: 75, opacity: 0, x: 60 },
  animate: { rotateY: 0, opacity: 1, x: 0 },
  exit: { rotateY: -75, opacity: 0, x: -60 },
};

export default function GuidedFlow({ cuisineMap, onSeal, onSkip }) {
  const { t } = useLang();
  const INTERESTS = [
    { key: "food", label: t("Food"), sub: t("Restaurants & eats"), Icon: Utensils },
    { key: "drinks", label: t("Drinks"), sub: t("Coffee, boba, more"), Icon: Wine },
    { key: "bars", label: t("Bars"), sub: t("Cocktails & nightlife"), Icon: Beer },
    { key: "desserts", label: t("Desserts"), sub: t("Something sweet"), Icon: IceCream },
    { key: "shops", label: t("Shops"), sub: t("Antiques, thrift & more"), Icon: ShoppingBag },
    { key: "fuel", label: t("Fuel"), sub: t("Gas & EV charging"), Icon: Fuel },
  ];
  const [step, setStep] = useState(0);
  const [mode, setMode] = useState(null);
  const [zip, setZip] = useState("");
  const [coords, setCoords] = useState(null);
  const [geoLoading, setGeoLoading] = useState(false);
  const [radius, setRadius] = useState(25);
  const [cuisines, setCuisines] = useState([]);
  const [sealed, setSealed] = useState(false);
  const [showAllChips, setShowAllChips] = useState(false);
  const CHIP_PREVIEW = 9;

  const total = 4;
  const next = () => setStep((s) => Math.min(s + 1, total - 1));
  const back = () => setStep((s) => Math.max(s - 1, 0));

  const pickInterest = (key) => { setMode(key); setCuisines([]); next(); };

  const useMyLocation = () => {
    if (!navigator.geolocation) { toast.error(t("Location isn't supported on this device")); return; }
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setZip("");
        setGeoLoading(false);
        toast.success(t("Location set"));
      },
      () => { setGeoLoading(false); toast.error(t("Couldn't get your location — enter a ZIP instead")); },
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

  const chips = cuisineMap[mode] || [];

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
      <div
        className={`absolute inset-0 transition-all duration-700 ${step === 3 ? "bg-black/40 backdrop-blur-[2px]" : "bg-black/70 backdrop-blur-md"}`}
        onMouseDown={() => { const el = document.activeElement; if (el && el.tagName === "INPUT") el.blur(); }}
      />

      <div className="relative w-full max-w-md">
        {/* progress + back */}
        <div className="mb-4 flex items-center gap-3">
          {step > 0 && !sealed && (
            <button onClick={back} data-testid="guided-back" className="flex items-center gap-1 font-sans text-sm text-[#C0C0C0] transition-colors hover:text-white">
              <ArrowLeft className="h-4 w-4" /> {t("Back")}
            </button>
          )}
          <div className="h-1 flex-1 overflow-hidden rounded-full bg-[#2A2A2A]">
            <motion.div className="h-full bg-[#E01E26]" animate={{ width: `${((step + 1) / total) * 100}%` }} transition={{ duration: 0.4 }} />
          </div>
          <span className="font-sans text-xs font-bold tracking-widest text-[#6B6B6B]">{step + 1}/{total}</span>
          {!sealed && (
            <button onClick={onSkip} data-testid="guided-skip"
              className="inline-flex items-center gap-1 rounded-full border border-[#3A3A3A] bg-white/5 px-4 py-1.5 font-sans text-xs font-bold text-white transition-colors hover:border-[#E01E26] hover:bg-[#E01E26]">
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
            className={`relative overflow-hidden rounded-2xl p-7 ${step === 3 ? "border-0 bg-transparent shadow-none" : "border border-[#2A2A2A] bg-[#0E0E0E]/95 shadow-2xl backdrop-blur-3xl"}`}
          >
            {/* STEP 1 — interest */}
            {step === 0 && (
              <div data-testid="guided-step-interest">
                <p className="font-sans text-xs font-bold uppercase tracking-[0.2em] text-[#E01E26]">{t("Step one")}</p>
                <h2 className="mt-1 font-serif text-3xl font-bold text-white">{t("What calls to you?")}</h2>
                <p className="mt-1 font-sans text-sm text-[#A0A0A0]">{t("Choose your craving to begin the ritual.")}</p>
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
                <p className="font-sans text-xs font-bold uppercase tracking-[0.2em] text-[#E01E26]">{t("Step two")}</p>
                <h2 className="mt-1 font-serif text-3xl font-bold text-white">{t("Where shall fate look?")}</h2>
                <div className="mt-6 flex items-center gap-2 rounded-xl border border-[#2A2A2A] bg-[#161616] px-4 py-1.5 focus-within:border-[#E01E26]">
                  <Search className="h-5 w-5 shrink-0 text-[#6B6B6B]" />
                  <Input
                    data-testid="guided-zip-input"
                    value={zip}
                    onChange={(e) => { const v = e.target.value.replace(/[^\d]/g, "").slice(0, 5); setZip(v); setCoords(null); if (v.length === 5) e.target.blur(); }}
                    onKeyDown={(e) => { if (e.key === "Enter") e.target.blur(); }}
                    placeholder={t("Enter ZIP")}
                    inputMode="numeric"
                    enterKeyHint="go"
                    className="border-0 bg-transparent px-1 text-lg font-semibold text-white placeholder:text-[#4A4A4A] shadow-none focus-visible:ring-0"
                  />
                </div>
                <div className="my-3 text-center font-sans text-xs uppercase tracking-widest text-[#6B6B6B]">{t("or")}</div>
                <button
                  onClick={useMyLocation}
                  disabled={geoLoading}
                  data-testid="guided-use-location"
                  className={`flex w-full items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-bold transition-colors disabled:opacity-70 ${coords ? "bg-[#E01E26] text-white" : "border border-[#2A2A2A] bg-[#1C1C1C] text-white hover:bg-[#2A2A2A]"}`}
                >
                  <LocateFixed className={`h-4 w-4 ${geoLoading ? "animate-pulse" : ""}`} />
                  {geoLoading ? t("Locating…") : coords ? t("Location set") : t("Use my location")}
                </button>

                <div className="mt-6 rounded-xl border border-[#2A2A2A] bg-[#161616] px-4 py-3">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="font-sans text-xs font-bold uppercase tracking-[0.2em] text-[#C0C0C0]">{t("Search radius")}</p>
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
                  {t("Continue")}
                </button>
              </div>
            )}

            {/* STEP 3 — sub chips */}
            {step === 2 && (
              <div data-testid="guided-step-chips">
                <p className="font-sans text-xs font-bold uppercase tracking-[0.2em] text-[#E01E26]">{t("Step three")}</p>
                <h2 className="mt-1 font-serif text-3xl font-bold text-white">{t("Narrow the fates")}</h2>
                <p className="mt-1 font-sans text-sm text-[#A0A0A0]">{t("Pick any that tempt you — or let fate surprise you.")}</p>
                <div className="mt-6 flex max-h-[42vh] flex-wrap gap-2.5 overflow-y-auto pr-1">
                  {(showAllChips ? chips : chips.slice(0, CHIP_PREVIEW)).map((c) => {
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
                  {chips.length > CHIP_PREVIEW && (
                    <button
                      onClick={() => setShowAllChips((s) => !s)}
                      data-testid="guided-chips-more"
                      className="rounded-full border border-dashed border-[#E01E26]/60 bg-transparent px-4 py-2 text-sm font-semibold text-[#E01E26] transition-colors hover:bg-[#E01E26]/10"
                    >
                      {showAllChips ? t("Show less") : `+ ${chips.length - CHIP_PREVIEW} ${t("more")}`}
                    </button>
                  )}
                </div>
                <div className="mt-7 flex gap-3">
                  <button onClick={next} data-testid="guided-surprise-me" className="flex-1 rounded-full border border-[#2A2A2A] bg-[#1C1C1C] px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-[#2A2A2A]">
                    <Sparkles className="mr-1.5 inline h-4 w-4 text-[#E01E26]" /> {t("Surprise me")}
                  </button>
                  <button onClick={next} disabled={!cuisines.length} data-testid="guided-chips-next" className="flex-1 rounded-full bg-[#E01E26] px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-[#FF2E38] disabled:opacity-40">
                    {t("Continue")} ({cuisines.length})
                  </button>
                </div>
              </div>
            )}

            {/* STEP 4 — tarot seal */}
            {step === 3 && (
              <div className="text-center" data-testid="guided-step-seal">
                <p className="font-sans text-xs font-bold uppercase tracking-[0.2em] text-[#E01E26] drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">{t("The final step")}</p>
                <h2 className="mt-1 font-serif text-3xl font-bold text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)]">{t("The reaper offers your fate")}</h2>

                <div className="mx-auto mt-8 h-72 w-48" style={{ perspective: 1000 }}>
                  <motion.button
                    onClick={seal}
                    data-testid="guided-seal-button"
                    className="relative h-full w-full cursor-pointer rounded-2xl"
                    style={{ transformStyle: "preserve-3d" }}
                    animate={sealed ? { rotateY: 180, scale: 1.08, y: -10 } : { rotateY: 0, scale: 1, y: [0, -8, 0] }}
                    transition={sealed ? { type: "spring", stiffness: 60, damping: 15 } : { y: { repeat: Infinity, duration: 3, ease: "easeInOut" } }}
                    whileHover={sealed ? {} : { scale: 1.04 }}
                  >
                    {/* front — gothic tarot */}
                    <span className="absolute inset-0 overflow-hidden rounded-2xl border-2 border-[#C0C0C0]/50 bg-[radial-gradient(circle_at_50%_32%,#2a1519_0%,#0b0b0b_72%)] shadow-[0_0_40px_rgba(224,30,38,0.45)]" style={{ backfaceVisibility: "hidden" }}>
                      <span className="pointer-events-none absolute inset-[6px] rounded-xl border border-[#C0C0C0]/25" />
                      <span className="pointer-events-none absolute inset-[10px] rounded-lg border border-[#C0C0C0]/10" />
                      {/* corner flourishes */}
                      <span className="pointer-events-none absolute left-2 top-2 h-2.5 w-2.5 rotate-45 border-l border-t border-[#C0C0C0]/60" />
                      <span className="pointer-events-none absolute right-2 top-2 h-2.5 w-2.5 rotate-45 border-r border-t border-[#C0C0C0]/60" />
                      <span className="pointer-events-none absolute bottom-2 left-2 h-2.5 w-2.5 rotate-45 border-b border-l border-[#C0C0C0]/60" />
                      <span className="pointer-events-none absolute bottom-2 right-2 h-2.5 w-2.5 rotate-45 border-b border-r border-[#C0C0C0]/60" />
                      <span className="flex h-full flex-col items-center justify-center gap-2.5 px-4">
                        <span className="font-serif text-[10px] tracking-[0.35em] text-[#C0C0C0]/70">✦ FORK·FATE ✦</span>
                        <span className="h-px w-16 bg-gradient-to-r from-transparent via-[#C0C0C0]/50 to-transparent" />
                        <span className="relative">
                          <Skull className="h-16 w-16 text-[#E01E26] drop-shadow-[0_0_14px_rgba(224,30,38,0.85)]" />
                        </span>
                        <span className="h-px w-16 bg-gradient-to-r from-transparent via-[#C0C0C0]/50 to-transparent" />
                        <span className="font-serif text-base font-bold uppercase leading-tight tracking-[0.25em] text-[#C0C0C0]">{t("Seal your")}<br />{t("fate")}</span>
                        <span className="font-serif text-lg text-[#C0C0C0]/50">☩</span>
                      </span>
                    </span>
                    {/* back */}
                    <span className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-[#E01E26] bg-gradient-to-b from-[#2a0b0d] to-[#0b0b0b] shadow-[0_0_55px_rgba(224,30,38,0.85)]" style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}>
                      <Sparkles className="h-12 w-12 text-[#E01E26]" />
                      <span className="font-serif text-xl font-bold uppercase tracking-widest text-white">{t("Fate Sealed")}</span>
                    </span>
                  </motion.button>
                </div>

                <p className="mt-6 font-serif text-base italic text-[#C0C0C0] drop-shadow-[0_2px_8px_rgba(0,0,0,0.95)]">
                  {sealed ? t("The deck decides…") : t("Once chosen, your fate is sealed.")}
                </p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
