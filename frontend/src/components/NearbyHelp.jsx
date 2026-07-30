import { useState, useCallback } from "react";
import axios from "axios";
import {
  Heart, Stethoscope, Cross, Truck, Fuel, Pill, MapPin, Phone, ExternalLink, LifeBuoy, AlertTriangle, HandHeart, LocateFixed,
} from "lucide-react";
import {
  Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "./ui/sheet";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

/**
 * "Nearby Help" — bottom sheet listing the 3 nearest venues for six essential
 * emergency/urgent categories. Non-roulette safety flow. Data comes from
 * `GET /api/places/essentials` which wraps Google Places search.
 *
 * The trigger is a small pill in the header (see Home.jsx). Contents load
 * lazily when the sheet first opens.
 */
const CATEGORIES = [
  { id: "er",          label: "ER",          hint: "Emergency room / hospital", Icon: Cross,      accent: "#E01E26" },
  { id: "urgent_care", label: "Urgent Care", hint: "Walk-in clinic",            Icon: Stethoscope,accent: "#E01E26" },
  { id: "dentist",     label: "Dentist",     hint: "24-hr / emergency",         Icon: Heart,      accent: "#B26A12" },
  { id: "vet",         label: "Vet",         hint: "Animal hospital",           Icon: Truck,      accent: "#B26A12" },
  { id: "pharmacy",    label: "Pharmacy",    hint: "24-hr chemist",             Icon: Pill,       accent: "#0E7C4A" },
  { id: "food_bank",   label: "Food Bank & Pantry", hint: "Pantries, soup kitchens, meals", Icon: HandHeart, accent: "#0E7C4A" },
];

export default function NearbyHelp({ light = false, zip = "", lat = null, lng = null }) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(null);      // active category id
  const [data, setData] = useState({});                // { catId: rows[] }
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  // Sheet-local location — lets someone open the sheet without having typed a
  // ZIP in the main search yet (critical for someone opening the app in a
  // crisis moment). Falls back to the props from Home when empty.
  const [sheetZip, setSheetZip] = useState(zip || "");
  const [sheetCoords, setSheetCoords] = useState(
    (lat != null && lng != null) ? { lat, lng } : null
  );
  const [locating, setLocating] = useState(false);
  const [radiusMi, setRadiusMi] = useState(25);        // 5 | 10 | 25 | 50 miles

  const effectiveCoords = sheetCoords || ((lat != null && lng != null) ? { lat, lng } : null);
  const effectiveZip = (sheetZip || zip || "").trim();

  const useMyLocation = () => {
    if (!navigator.geolocation) { setError("Location isn't available on this device."); return; }
    setLocating(true); setError("");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setSheetCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setSheetZip("");
        setData({});          // clear cached rows — new location means new results
        setLocating(false);
      },
      (e) => {
        setLocating(false);
        setError(e.code === 1
          ? "Location permission denied — enter a ZIP below."
          : "Couldn't get your location — enter a ZIP below.");
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
    );
  };

  const onZipChange = (v) => {
    const digits = v.replace(/[^0-9]/g, "").slice(0, 5);
    setSheetZip(digits);
    if (digits.length === 5 || digits.length === 0) {
      // ZIP changed → clear cached rows and any previously-set coords
      setSheetCoords(null);
      setData({});
    }
  };

  const fetchCategory = useCallback(async (catId) => {
    if (data[catId]) return;                            // cached
    setLoading(true); setError("");
    try {
      const params = new URLSearchParams();
      if (effectiveCoords?.lat != null && effectiveCoords?.lng != null) {
        params.set("lat", effectiveCoords.lat); params.set("lng", effectiveCoords.lng);
      } else if (effectiveZip && effectiveZip.length === 5) {
        params.set("zip", effectiveZip);
      } else {
        setError("Enter a ZIP or tap Use my location above."); setLoading(false); return;
      }
      params.set("categories", catId);
      params.set("radius_mi", String(radiusMi));
      const { data: resp } = await axios.get(`${API}/places/essentials?${params.toString()}`);
      setData((prev) => ({ ...prev, [catId]: resp.categories?.[catId] || [] }));
    } catch (e) {
      setError(e.response?.data?.detail || "Could not load nearby help right now.");
    } finally {
      setLoading(false);
    }
  }, [effectiveZip, effectiveCoords, radiusMi, data]);

  const pickCategory = (catId) => {
    setSelected(catId);
    fetchCategory(catId);
  };

  const active = selected ? CATEGORIES.find((c) => c.id === selected) : null;
  const rows = selected ? (data[selected] || []) : [];

  return (
    <Sheet open={open} onOpenChange={(v) => { setOpen(v); if (v && !selected) setSelected(null); }}>
      <SheetTrigger asChild>
        <button
          type="button"
          data-testid="nearby-help-trigger"
          title="Need help? — ER, urgent care, dentist, vet, pharmacy, food bank"
          aria-label="Need help"
          className={`inline-flex items-center gap-1.5 rounded-full border bg-transparent px-3 py-1.5 text-xs font-bold transition-colors sm:gap-2 sm:px-4 sm:py-2.5 sm:text-sm ${
            light ? "border-[#E4E4E7] text-[#0E0E0E] hover:bg-[#F7F7F8]" : "border-white/20 text-white hover:bg-white/10"
          }`}
        >
          <LifeBuoy className="h-4 w-4 text-[#E01E26]" />
          <span>Need Help?</span>
        </button>
      </SheetTrigger>
      <SheetContent
        side="bottom"
        className="max-h-[85vh] overflow-y-auto rounded-t-3xl border-none bg-white p-0"
        data-testid="nearby-help-sheet"
      >
        <div className="mx-auto max-w-2xl px-5 pb-6 pt-4">
          <SheetHeader className="text-left">
            <div className="mb-1 mx-auto h-1.5 w-10 rounded-full bg-[#E2E4E7]" />
            <SheetTitle className="font-serif text-2xl text-[#0E0E0E]">Need help?</SheetTitle>
            <SheetDescription className="font-sans text-sm text-[#6B7075]">
              The 3 closest options for each urgent need. Sourced from Google Places.
            </SheetDescription>
          </SheetHeader>

          {/* Location controls — always accessible so anyone can open the
              sheet fresh without first typing a ZIP in the main search. */}
          <div className="mt-4 flex flex-wrap items-center gap-2" data-testid="nearby-help-location">
            <div className="relative flex-1 min-w-[130px]">
              <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8A8F95]" />
              <input
                type="tel"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={5}
                value={sheetZip}
                onChange={(e) => onZipChange(e.target.value)}
                placeholder="ZIP code"
                data-testid="nearby-help-zip-input"
                className="w-full rounded-full border border-[#E2E4E7] bg-white py-2.5 pl-9 pr-3 font-sans text-sm text-[#0E0E0E] outline-none focus:border-[#0E0E0E]"
              />
            </div>
            <button
              type="button"
              onClick={useMyLocation}
              disabled={locating}
              data-testid="nearby-help-use-location"
              className="inline-flex items-center gap-1.5 rounded-full border border-[#0E0E0E] bg-white px-3.5 py-2 font-sans text-xs font-bold text-[#0E0E0E] hover:bg-[#0E0E0E] hover:text-white disabled:opacity-60"
            >
              <LocateFixed className="h-3.5 w-3.5" />
              {locating ? "Locating…" : "Use my location"}
            </button>
          </div>
          {(effectiveCoords || (effectiveZip && effectiveZip.length === 5)) && (
            <p className="mt-1.5 font-sans text-[11px] text-[#6B7075]" data-testid="nearby-help-location-hint">
              {effectiveCoords ? "Using your current location" : `Searching near ${effectiveZip}`}
            </p>
          )}

          {/* Radius chips — control how far to search from the anchor point */}
          <div className="mt-3 flex flex-wrap items-center gap-1.5" data-testid="nearby-help-radius">
            <span className="mr-1 font-sans text-[10px] font-bold uppercase tracking-[0.14em] text-[#6B7075]">
              Within
            </span>
            {[5, 10, 25, 50].map((mi) => (
              <button
                key={mi}
                type="button"
                onClick={() => { setRadiusMi(mi); setData({}); }}
                data-testid={`nearby-help-radius-${mi}`}
                className={`rounded-full px-3 py-1 font-sans text-xs font-bold transition-colors ${
                  radiusMi === mi
                    ? "bg-[#0E0E0E] text-white"
                    : "border border-[#E2E4E7] bg-white text-[#6B7075] hover:border-[#0E0E0E] hover:text-[#0E0E0E]"
                }`}
              >
                {mi} mi
              </button>
            ))}
          </div>

          {!selected && (
            <div className="mt-5 grid grid-cols-2 gap-3" data-testid="nearby-help-grid">
              {CATEGORIES.map(({ id, label, hint, Icon, accent }) => (
                <button
                  key={id}
                  onClick={() => pickCategory(id)}
                  data-testid={`nearby-help-tile-${id}`}
                  className="group flex items-center gap-3 rounded-2xl border border-[#E2E4E7] bg-white p-4 text-left transition-[transform,box-shadow] hover:-translate-y-0.5 hover:shadow-[0_10px_24px_rgba(14,14,14,0.08)]"
                >
                  <span className="grid h-11 w-11 place-items-center rounded-full text-white" style={{ backgroundColor: accent }}>
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="flex flex-col">
                    <span className="font-serif text-lg leading-tight text-[#0E0E0E]">{label}</span>
                    <span className="font-sans text-xs text-[#6B7075]">{hint}</span>
                  </span>
                </button>
              ))}
            </div>
          )}

          {selected && (
            <div className="mt-4" data-testid={`nearby-help-results-${selected}`}>
              <div className="mb-3 flex items-center justify-between">
                <button
                  onClick={() => setSelected(null)}
                  className="font-sans text-xs font-bold uppercase tracking-[0.14em] text-[#6B7075] hover:text-[#0E0E0E]"
                  data-testid="nearby-help-back"
                >
                  ‹ All categories
                </button>
                <span className="inline-flex items-center gap-2 font-serif text-lg text-[#0E0E0E]">
                  {active?.Icon && <active.Icon className="h-5 w-5" style={{ color: active.accent }} />}
                  {active?.label}
                </span>
              </div>

              {loading && <p className="font-sans text-sm text-[#6B7075]" data-testid="nearby-help-loading">Finding the closest 3…</p>}
              {error && (
                <p className="rounded-xl bg-[#FCF4F4] px-3 py-2 font-sans text-sm text-[#E01E26]" data-testid="nearby-help-error">
                  {error}
                </p>
              )}
              {!loading && !error && rows.length === 0 && (
                <p className="font-sans text-sm text-[#6B7075]" data-testid="nearby-help-empty">
                  No results in your area. Try widening your ZIP search first.
                </p>
              )}

              <ul className="space-y-2.5">
                {rows.map((r, i) => (
                  <li
                    key={`${r.name}-${i}`}
                    className="rounded-2xl border border-[#E2E4E7] bg-white p-3.5"
                    data-testid={`nearby-help-row-${selected}-${i}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-serif text-base font-medium leading-snug text-[#0E0E0E]">{r.name}</p>
                        <p className="mt-0.5 truncate font-sans text-xs text-[#6B7075]">{r.address}</p>
                        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 font-sans text-xs text-[#6B7075]">
                          {r.distance != null && (
                            <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" /> {r.distance} mi</span>
                          )}
                          {r.open_now === true && <span className="font-bold text-[#0E7C4A]">Open now</span>}
                          {r.open_now === false && <span className="font-bold text-[#8A5210]">Hours unclear</span>}
                          {r.rating != null && <span>★ {r.rating}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="mt-2.5 flex flex-wrap gap-2">
                      {r.phone && (
                        <a
                          href={`tel:${r.phone.replace(/[^0-9+]/g, "")}`}
                          className="inline-flex items-center gap-1 rounded-full bg-[#0E0E0E] px-3 py-1.5 font-sans text-xs font-bold text-white hover:bg-[#2A2A2A]"
                          data-testid={`nearby-help-call-${selected}-${i}`}
                        >
                          <Phone className="h-3.5 w-3.5" /> Call
                        </a>
                      )}
                      {r.maps_url && (
                        <a
                          href={r.maps_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded-full border border-[#0E0E0E] px-3 py-1.5 font-sans text-xs font-bold text-[#0E0E0E] hover:bg-[#0E0E0E] hover:text-white"
                          data-testid={`nearby-help-directions-${selected}-${i}`}
                        >
                          <ExternalLink className="h-3.5 w-3.5" /> Directions
                        </a>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div
            className="mt-6 flex gap-2.5 rounded-2xl border border-[#F0A24E] bg-[#FFFCF3] p-3.5"
            data-testid="nearby-help-disclaimer"
          >
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[#B26A12]" />
            <p className="font-sans text-[11px] leading-snug text-[#8A5210]">
              Not a medical, dental, veterinary, or emergency service. Listings are for convenience only —
              always confirm hours, insurance and availability directly. <strong>In a life-threatening emergency, call 911.</strong>
            </p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
