// ZIP input + "use my location" + search-radius slider (main, non-panel modes).
import { Search, LocateFixed } from "lucide-react";
import { Input } from "../ui/input";
import { Slider } from "../ui/slider";
import { useLang } from "../../i18n/i18n";

export const LocationRadiusPanel = ({ hidden, zip, setZip, setCoords, coords, onEnter, useMyLocation, geoLoading, loading, spinning, radius, setRadius, radiusMax, labelColor }) => {
  const { t } = useLang();
  return (
    <div className={`space-y-2 ${hidden ? "hidden" : ""}`}>
      <p className="font-sans text-xs font-bold tracking-[0.2em] uppercase text-[#0E0E0E]" style={labelColor ? { color: labelColor } : undefined}>
        {t("Your ZIP code")} <span className="text-[#B8BCC2]">{t("(optional)")}</span>
      </p>
      <div className="flex items-center gap-2">
        <div className="flex flex-1 items-center gap-2 rounded-full border border-[#E2E4E7] bg-white/80 px-4 py-1.5 backdrop-blur-sm focus-within:border-[#E01E26]">
          <Search className="h-5 w-5 shrink-0 text-[#6B7075]" />
          <Input
            data-testid="zip-input"
            value={zip}
            onChange={(e) => { const v = e.target.value.replace(/[^\d]/g, "").slice(0, 5); setZip(v); setCoords(null); if (v.length === 5) e.target.blur(); }}
            onKeyDown={(e) => e.key === "Enter" && onEnter()}
            placeholder="e.g. 10001"
            inputMode="numeric"
            className="border-0 bg-transparent px-1 text-lg font-semibold text-[#0E0E0E] shadow-none focus-visible:ring-0"
          />
        </div>
        <button
          type="button"
          onClick={useMyLocation}
          disabled={geoLoading || loading || spinning}
          data-testid="use-my-location-button"
          className={`inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2.5 text-sm font-bold transition-colors disabled:opacity-70 ${(coords || geoLoading) ? "bg-[#E01E26] text-white hover:bg-[#B3141A]" : "border border-[#E2E4E7] bg-white text-[#0E0E0E] hover:bg-[#EDEEF0]"}`}
        >
          <LocateFixed className={`h-4 w-4 ${geoLoading ? "animate-pulse" : ""}`} />
          {geoLoading ? t("Locating…") : coords ? t("Using your location") : t("Use my location")}
        </button>
      </div>

      <div className="rounded-2xl border border-[#E2E4E7] bg-white/70 px-4 py-3 backdrop-blur-sm" data-testid="radius-control">
        <div className="mb-2 flex items-center justify-between">
          <p className="font-sans text-xs font-bold tracking-[0.2em] uppercase text-[#0E0E0E]">{t("Search radius")}</p>
          <span data-testid="radius-value" className="font-serif text-lg font-semibold text-[#E01E26]">
            {radius} <span className="text-sm text-[#6B7075]">mi</span>
          </span>
        </div>
        <Slider
          data-testid="radius-slider"
          value={[radius]}
          min={0}
          max={radiusMax}
          step={1}
          onValueChange={(v) => setRadius(v[0])}
          aria-label="Search radius in miles"
        />
        <div className="mt-1.5 flex justify-between font-sans text-[10px] font-bold uppercase tracking-wider text-[#B8BCC2]">
          <span>0 mi</span>
          <span>{radiusMax} mi</span>
        </div>
      </div>
    </div>
  );
};
