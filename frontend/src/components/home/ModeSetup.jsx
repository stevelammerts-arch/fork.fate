import React from "react";
import { Search, LocateFixed, Dices } from "lucide-react";
import { Input } from "../ui/input";
import { Slider } from "../ui/slider";
import { useLang } from "../../i18n/i18n";

/**
 * Everything a special mode (Passport / Crawl / Group) needs, inline in its own
 * panel: a short how-it-works guide, location, radius and its own Deal button.
 *
 * Before this existed the panels sat BELOW the main Deal button, so turning a
 * mode on meant scrolling up to Deal and further up again for ZIP/radius.
 */
/** The numbered how-it-works list for a mode panel — shown at the very top so
 *  nobody starts filling the form before they know the flow. */
export function StepList({ steps, accent = "#E01E26", testId = "mode-steps" }) {
  if (!steps?.length) return null;
  return (
    <ol className="mt-3 space-y-1.5 rounded-2xl border border-black/5 bg-white p-4" data-testid={testId}>
      {steps.map((s, i) => (
        <li key={i} className="flex gap-2.5 font-sans text-sm text-[#3A3F45]">
          <span
            className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full text-[11px] font-bold text-white"
            style={{ backgroundColor: accent }}
          >
            {i + 1}
          </span>
          <span>{s}</span>
        </li>
      ))}
    </ol>
  );
}

export default function ModeSetup({
  accent = "#E01E26",
  steps = [],
  showLocation = true,
  zip,
  setZip,
  setCoords,
  coords,
  onUseLocation,
  geoLoading,
  radius,
  setRadius,
  radiusMax = 100,
  cta,
  onCta,
  busy = false,
  showRadius = true,
  showCta = true,
  showDestination = false,
  destination = "",
  setDestination,
  testId = "mode-setup",
}) {
  const { t } = useLang();

  return (
    <div className="mt-4 rounded-2xl border border-black/5 bg-white p-4" data-testid={testId}>
      {steps.length > 0 && (
        <ol className="mb-4 space-y-1.5">
          {steps.map((s, i) => (
            <li key={i} className="flex gap-2.5 font-sans text-sm text-[#3A3F45]">
              <span
                className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full text-[11px] font-bold text-white"
                style={{ backgroundColor: accent }}
              >
                {i + 1}
              </span>
              <span>{s}</span>
            </li>
          ))}
        </ol>
      )}

      {showLocation && (
        <>
          <p className="mb-1.5 font-sans text-xs font-bold uppercase tracking-wider text-[#6B7075]">
            {t("Your ZIP code")} <span className="text-[#B8BCC2]">{t("(optional)")}</span>
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex min-w-[150px] flex-1 items-center gap-2 rounded-full border border-[#E2E4E7] bg-white px-4 py-1.5 focus-within:border-[#0E0E0E]">
              <Search className="h-4 w-4 shrink-0 text-[#6B7075]" />
              <Input
                data-testid={`${testId}-zip`}
                value={coords ? "" : zip}
                onChange={(e) => { const v = e.target.value.replace(/[^\d]/g, "").slice(0, 5); setZip(v); setCoords(null); if (v && setDestination) setDestination(""); if (v.length === 5) e.target.blur(); }}
                placeholder={coords ? t("Using your location") : "e.g. 10001"}
                inputMode="numeric"
                className="border-0 bg-transparent px-1 text-base font-semibold text-[#0E0E0E] shadow-none focus-visible:ring-0"
              />
            </div>
            <button
              type="button"
              onClick={onUseLocation}
              disabled={geoLoading || busy}
              data-testid={`${testId}-use-location`}
              style={coords || geoLoading ? { backgroundColor: accent } : undefined}
              className={`inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2.5 text-sm font-bold transition-colors disabled:opacity-70 ${
                coords || geoLoading ? "text-white" : "border border-[#E2E4E7] bg-white text-[#0E0E0E] hover:bg-[#EDEEF0]"
              }`}
            >
              <LocateFixed className={`h-4 w-4 ${geoLoading ? "animate-pulse" : ""}`} />
              {geoLoading ? t("Locating…") : coords ? t("Using your location") : t("Use my location")}
            </button>
          </div>
          {showDestination && (
            <>
              <p className="mb-1.5 mt-3 font-sans text-xs font-bold uppercase tracking-wider text-[#6B7075]">
                {t("Or destination")} <span className="text-[#B8BCC2]">{t("(optional)")}</span>
              </p>
              <div className="flex items-center gap-2 rounded-full border border-[#E2E4E7] bg-white px-4 py-1.5 focus-within:border-[#0E0E0E]">
                <Search className="h-4 w-4 shrink-0 text-[#6B7075]" />
                <Input
                  data-testid={`${testId}-destination`}
                  value={destination}
                  onChange={(e) => { setDestination(e.target.value); setCoords(null); if (e.target.value) setZip(""); }}
                  placeholder={t("e.g. Omaha, Nebraska or Yellowstone")}
                  className="border-0 bg-transparent px-1 text-base font-semibold text-[#0E0E0E] shadow-none focus-visible:ring-0"
                />
              </div>
              <p className="mt-1 font-sans text-[11px] text-[#8A8F95]">{t("Type a city, town, park, or landmark — anything Google Maps understands.")}</p>
            </>
          )}
        </>
      )}

      <div className={`${showRadius ? "" : "hidden "}mt-3 rounded-xl border border-[#E2E4E7] bg-white px-4 py-3`}>
        <div className="mb-2 flex items-center justify-between">
          <p className="font-sans text-xs font-bold uppercase tracking-wider text-[#6B7075]">{t("Search radius")}</p>
          <span data-testid={`${testId}-radius-value`} className="font-serif text-lg font-semibold" style={{ color: accent }}>
            {radius} <span className="text-sm text-[#6B7075]">mi</span>
          </span>
        </div>
        <Slider
          data-testid={`${testId}-radius-slider`}
          value={[radius]}
          min={1}
          max={radiusMax}
          step={1}
          onValueChange={(v) => setRadius(v[0])}
          aria-label="Search radius in miles"
        />
        <div className="mt-1.5 flex justify-between font-sans text-[10px] font-bold uppercase tracking-wider text-[#B8BCC2]">
          <span>1 mi</span>
          <span>{radiusMax} mi</span>
        </div>
      </div>

      <button
        type="button"
        onClick={onCta}
        disabled={busy}
        data-testid={`${testId}-cta`}
        style={{ backgroundColor: accent }}
        className={`${showCta ? "flex" : "hidden"} mt-4 w-full items-center justify-center gap-2.5 rounded-full px-6 py-4 font-sans text-base font-bold text-white transition-all hover:brightness-110 disabled:opacity-60`}
      >
        <Dices className={`h-5 w-5 ${busy ? "animate-spin" : ""}`} />
        {cta}
      </button>
    </div>
  );
}
