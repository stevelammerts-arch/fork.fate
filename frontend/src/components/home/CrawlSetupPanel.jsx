import { motion } from "framer-motion";
import { Dices, LocateFixed, Sparkles, Pencil } from "lucide-react";
import { toast } from "sonner";
import { useRef, useState } from "react";
import { Slider } from "../ui/slider";
import { useLang } from "../../i18n/i18n";
import { CRAWL_TYPES, SPIN_TAP } from "../../pages/homeConstants";

/** Crawl setup: crawl-type picker, start / optional end point, radius, and
 * the Deal-a-Crawl button. Extracted verbatim from Home.jsx (2026-02 split),
 * following the PassportPicker/GroupPicker `setup` prop pattern.
 * `slice` renders one functional piece for the guided flip-book pages
 * (type / start / end / deal). */
export function CrawlSetupPanel({ crawlType, onPickType, light, setup, slice }) {
  const { t } = useLang();
  const {
    zip, setZip, coords, setCoords, onUseLocation, geoLoading,
    zipB, setZipB, coordsB, setCoordsB, onUseLocationB, geoLoadingB,
    radius, setRadius, radiusMax, spinning, loading, onDeal,
  } = setup;

  const suggesting = useRef(false);
  const [customOpen, setCustomOpen] = useState(false);
  const [customText, setCustomText] = useState("");
  // "Create your own": any idea becomes a crawl — searched as a raw explore
  // query so "Karaoke", "Sushi" or "Bookstores" all work.
  const submitCustom = () => {
    const label = customText.trim();
    if (!label) return;
    onPickType({ key: "custom", label, mode: "explore", cuisine: label, crawl: `${label} Crawl` });
    setCustomOpen(false);
    toast.success(`${label} Crawl ${t("is on the table — deal it!")}`);
  };
  // "Suggest a crawl": fate roulettes through the type pills and lands on one.
  const suggestCrawl = () => {
    if (suggesting.current || spinning || loading) return;
    suggesting.current = true;
    const spins = 9 + Math.floor(Math.random() * CRAWL_TYPES.length);
    const start = Math.floor(Math.random() * CRAWL_TYPES.length);
    const step = (n) => {
      const ct = CRAWL_TYPES[(start + n) % CRAWL_TYPES.length];
      onPickType(ct);
      if (n < spins) {
        setTimeout(() => step(n + 1), 55 + n * 16);
      } else {
        suggesting.current = false;
        toast.success(`${t("Fate suggests")}: ${ct.label}`);
      }
    };
    step(0);
  };

  const typePills = (
    <div className="flex flex-wrap gap-2">
      {CRAWL_TYPES.map((ct) => (
        <button
          key={ct.key}
          type="button"
          data-testid={`crawl-type-${ct.key}`}
          onClick={() => onPickType(ct)}
          className={`rounded-full border px-4 py-2 text-sm font-bold transition-colors ${crawlType === ct.key ? "border-[#E01E26] bg-[#E01E26] text-white" : "border-[#E2E4E7] bg-white text-[#6B7075] hover:bg-[#EDEEF0]"}`}
        >
          {ct.label}
        </button>
      ))}
      <button
        type="button"
        data-testid="crawl-suggest-pill"
        onClick={suggestCrawl}
        className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-[#E01E26]/60 bg-[#E01E26]/5 px-4 py-2 text-sm font-bold text-[#E01E26] transition-colors hover:bg-[#E01E26]/15"
      >
        <Sparkles className="h-3.5 w-3.5" /> {t("Suggest a crawl")}
      </button>
      {customOpen ? (
        <span className="inline-flex items-center gap-1 rounded-full border border-[#E01E26]/60 bg-white py-1 pl-3 pr-1">
          <input
            autoFocus
            value={customText}
            onChange={(e) => setCustomText(e.target.value.slice(0, 30))}
            onKeyDown={(e) => { if (e.key === "Enter") submitCustom(); if (e.key === "Escape") setCustomOpen(false); }}
            placeholder={t("e.g. Karaoke, Sushi…")}
            data-testid="crawl-custom-input"
            className="w-36 bg-transparent text-sm font-bold text-[#0E0E0E] outline-none placeholder-[#9AA0A6]"
          />
          <button type="button" onClick={submitCustom} data-testid="crawl-custom-go"
            className="rounded-full bg-[#E01E26] px-3 py-1 text-xs font-bold text-white hover:bg-[#B3141A]">{t("Go")}</button>
        </span>
      ) : (
        <button
          type="button"
          data-testid="crawl-custom-pill"
          onClick={() => setCustomOpen(true)}
          className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-bold transition-colors ${crawlType === "custom" ? "border-[#E01E26] bg-[#E01E26] text-white" : "border-dashed border-[#6B7075]/60 bg-white text-[#6B7075] hover:bg-[#EDEEF0]"}`}
        >
          <Pencil className="h-3.5 w-3.5" /> {crawlType === "custom" && customText.trim() ? customText.trim() : t("Create your own")}
        </button>
      )}
    </div>
  );

  const locA = (
    <>
      <p className="mb-1.5 mt-4 text-xs font-bold uppercase tracking-wider text-[#6B7075]">{t("Start / your area")}</p>
      <div className="flex flex-wrap items-center gap-2">
        <input
          value={coords ? "" : zip}
          onChange={(e) => { const v = e.target.value.replace(/[^\d]/g, "").slice(0, 5); setZip(v); setCoords(null); }}
          placeholder={coords ? t("Using your location") : t("ZIP code")}
          data-testid="crawl-zip-a"
          inputMode="numeric"
          className="w-32 rounded-full border border-[#E2E4E7] bg-white px-4 py-2.5 text-sm text-[#0E0E0E] outline-none placeholder-[#9AA0A6] focus:border-[#E01E26]"
        />
        <button
          type="button"
          onClick={onUseLocation}
          disabled={geoLoading}
          data-testid="crawl-use-location-a"
          className={`inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-bold transition-colors disabled:opacity-70 ${coords ? "bg-[#E01E26] text-white hover:bg-[#B3141A]" : "border border-[#E2E4E7] bg-white text-[#0E0E0E] hover:bg-[#EDEEF0]"}`}
        >
          <LocateFixed className="h-4 w-4" /> {geoLoading ? t("Locating…") : coords ? t("Using your location") : t("Use my location")}
        </button>
      </div>
    </>
  );

  const locB = (
    <>
      <p className="mb-1.5 mt-3 text-xs font-bold uppercase tracking-wider text-[#6B7075]">{t("End point")} <span className="text-[#9AA0A6]">{t("(optional — crawl toward here)")}</span></p>
      <div className="flex flex-wrap items-center gap-2">
        <input
          value={coordsB ? "" : zipB}
          onChange={(e) => { const v = e.target.value.replace(/[^\d]/g, "").slice(0, 5); setZipB(v); setCoordsB(null); }}
          placeholder={coordsB ? t("2nd location set") : t("ZIP code")}
          data-testid="crawl-zip-b"
          inputMode="numeric"
          className="w-32 rounded-full border border-[#E2E4E7] bg-white px-4 py-2.5 text-sm text-[#0E0E0E] outline-none placeholder-[#9AA0A6] focus:border-[#E01E26]"
        />
        <button
          type="button"
          onClick={onUseLocationB}
          disabled={geoLoadingB}
          data-testid="crawl-use-location-b"
          className={`inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-bold transition-colors disabled:opacity-70 ${coordsB ? "bg-[#E01E26] text-white hover:bg-[#B3141A]" : "border border-[#E2E4E7] bg-white text-[#0E0E0E] hover:bg-[#EDEEF0]"}`}
        >
          <LocateFixed className="h-4 w-4" /> {geoLoadingB ? t("Locating…") : coordsB ? t("2nd location set") : t("Use this location")}
        </button>
        {(coordsB || (zipB || "").length === 5) && (
          <button type="button" onClick={() => { setZipB(""); setCoordsB(null); }} data-testid="crawl-clear-b"
            className="text-xs font-semibold text-[#9AA0A6] underline underline-offset-2 hover:text-[#E01E26]">{t("clear")}</button>
        )}
      </div>
    </>
  );

  const radiusBox = (
    <div className="mt-4 rounded-xl border border-[#E2E4E7] bg-white/70 px-4 py-3 backdrop-blur-sm" data-testid="crawl-radius-control">
      <div className="mb-2 flex items-center justify-between">
        <p className="font-sans text-xs font-bold uppercase tracking-wider text-[#6B7075]">{t("Search radius")}</p>
        <span data-testid="crawl-radius-value" className="font-serif text-lg font-semibold text-[#E01E26]">
          {radius} <span className="text-sm text-[#6B7075]">mi</span>
        </span>
      </div>
      <Slider data-testid="crawl-radius-slider" value={[radius]} min={1} max={radiusMax} step={1} onValueChange={(v) => setRadius(v[0])} aria-label="Search radius in miles" />
      <div className="mt-1.5 flex justify-between font-sans text-[10px] font-bold uppercase tracking-wider text-[#B8BCC2]">
        <span>1 mi</span>
        <span>{radiusMax} mi</span>
      </div>
    </div>
  );

  const dealBtn = (
    <motion.button
      data-testid="crawl-deal-button"
      onClick={onDeal}
      disabled={spinning || loading}
      whileHover={{ scale: spinning || loading ? 1 : 1.03 }}
      whileTap={SPIN_TAP}
      className="mt-4 inline-flex items-center gap-3 rounded-full border-2 border-[#0E0E0E] bg-[#E01E26] px-10 py-4 font-sans text-lg font-bold text-white shadow-lg shadow-[#E01E26]/25 transition-colors hover:bg-[#B3141A] disabled:opacity-70"
    >
      <Dices className={`h-6 w-6 ${spinning || loading ? "animate-spin" : ""}`} />
      {loading ? t("Finding spots…") : spinning ? t("Shuffling…") : (light ? t("Plan a Crawl") : t("Deal a Crawl!"))}
    </motion.button>
  );

  if (slice === "type") return typePills;
  if (slice === "start") return (<>{locA}{radiusBox}</>);
  if (slice === "end") return locB;
  if (slice === "deal") return dealBtn;

  return (
    <div className="mt-2 w-full basis-full rounded-2xl border border-[#E01E26]/30 bg-[#FDF6F6]/60 p-4 backdrop-blur-md" data-testid="crawl-type-picker">
      <p className="mb-1.5 text-xs font-bold uppercase tracking-wider text-[#6B7075]">{t("Pick your crawl")}</p>
      {typePills}
      {locA}
      {locB}
      {radiusBox}
      {dealBtn}
    </div>
  );
}
