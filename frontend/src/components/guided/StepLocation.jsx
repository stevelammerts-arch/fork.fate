import React, { useState } from "react";
import { toast } from "sonner";
import { Search, LocateFixed } from "lucide-react";
import { Input } from "../ui/input";
import { Slider } from "../ui/slider";
import { useLang } from "../../i18n/i18n";

// STEP 2 — ZIP / geolocation + search radius
export function StepLocation({ gt, zip, setZip, coords, setCoords, radius, setRadius, radiusMax, locationReady, onNext }) {
  const { t } = useLang();
  const [geoLoading, setGeoLoading] = useState(false);

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

  return (
    <div data-testid="guided-step-location">
      <p className="font-sans text-xs font-bold uppercase tracking-[0.2em]" style={{ color: gt.accent }}>{t("Step two")}</p>
      <h2 className={`mt-1 font-serif text-3xl font-bold ${gt.titleColor}`}>{t("Where shall fate look?")}</h2>
      <div className={`mt-6 flex items-center gap-2 rounded-xl border px-4 py-1.5 focus-within:border-[var(--ff-accent)] ${gt.tileIdle}`}>
        <Search className="h-5 w-5 shrink-0 text-[#6B6B6B]" />
        <Input
          data-testid="guided-zip-input"
          value={zip}
          onChange={(e) => { const v = e.target.value.replace(/[^\d]/g, "").slice(0, 5); setZip(v); setCoords(null); if (v.length === 5) e.target.blur(); }}
          onKeyDown={(e) => { if (e.key === "Enter") e.target.blur(); }}
          placeholder={t("Enter ZIP")}
          inputMode="numeric"
          enterKeyHint="go"
          className={`border-0 bg-transparent px-1 text-lg font-semibold placeholder:text-[#8A8A8A] shadow-none focus-visible:ring-0 ${gt.tileText}`}
        />
      </div>
      <div className="my-3 text-center font-sans text-xs uppercase tracking-widest text-[#6B6B6B]">{t("or")}</div>
      <button
        onClick={useMyLocation}
        disabled={geoLoading}
        data-testid="guided-use-location"
        style={coords ? { backgroundColor: gt.accent } : undefined}
        className={`flex w-full items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-bold transition-colors disabled:opacity-70 ${coords ? "text-white" : `border ${gt.tileIdle} ${gt.tileText} hover:brightness-95`}`}
      >
        <LocateFixed className={`h-4 w-4 ${geoLoading ? "animate-pulse" : ""}`} />
        {geoLoading ? t("Locating…") : coords ? t("Location set") : t("Use my location")}
      </button>

      <div className={`mt-6 rounded-xl border px-4 py-3 ${gt.tileIdle}`}>
        <div className="mb-2 flex items-center justify-between">
          <p className={`font-sans text-xs font-bold uppercase tracking-[0.2em] ${gt.radiusLabel}`}>{t("Search radius")}</p>
          <span data-testid="guided-radius-value" className="font-serif text-lg font-semibold" style={{ color: gt.accent }}>{radius} <span className="text-sm text-[#6B6B6B]">mi</span></span>
        </div>
        <Slider data-testid="guided-radius-slider" value={[radius]} min={1} max={radiusMax} step={1} onValueChange={(v) => setRadius(v[0])} />
        <div className="mt-1.5 flex justify-between font-sans text-[10px] font-bold uppercase tracking-wider text-[#6B6B6B]"><span>1 mi</span><span>{radiusMax} mi</span></div>
      </div>

      <button
        onClick={onNext}
        disabled={!locationReady}
        data-testid="guided-location-next"
        style={{ backgroundColor: gt.accent }}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-bold text-white transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {t("Continue")}
      </button>
    </div>
  );
}
