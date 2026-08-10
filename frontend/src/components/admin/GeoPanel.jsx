import React from "react";
import { Globe2, MapPin, RefreshCcw } from "lucide-react";

const RANGES = [
  { days: 7, label: "7d" },
  { days: 30, label: "30d" },
  { days: 90, label: "90d" },
  { days: 0, label: "All" },
];

function BarRow({ name, sub, count, max, testid }) {
  const pct = max ? Math.max(4, Math.round((count / max) * 100)) : 0;
  return (
    <div className="flex items-center gap-3" data-testid={testid}>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <p className="truncate text-sm font-semibold text-[#0E0E0E]">
            {name}
            {sub && <span className="ml-1.5 text-xs font-normal text-[#9AA0A6]">{sub}</span>}
          </p>
          <span className="shrink-0 text-sm font-bold text-[#E01E26]">{count}</span>
        </div>
        <div className="mt-1 h-1.5 rounded-full bg-[#F0F1F3]">
          <div className="h-1.5 rounded-full bg-[#E01E26]" style={{ width: `${pct}%` }} />
        </div>
      </div>
    </div>
  );
}

/** "Where your visitors are": country + city view counts from the anonymous
 * pageview beacon (one view per visitor per 6h, IPs hashed, 180-day window). */
export function GeoPanel({ geo, geoDays, setGeoDays, loading }) {
  const countries = geo?.countries || [];
  const cities = geo?.cities || [];
  const maxCountry = countries[0]?.count || 0;
  const maxCity = cities[0]?.count || 0;
  return (
    <section className="md:col-span-2" data-testid="geo-section">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="flex items-center gap-2 font-serif text-xl text-[#0E0E0E]">
          <Globe2 className="h-5 w-5 text-[#E01E26]" /> Where your visitors are
        </h2>
        <span data-testid="geo-total-badge" className="rounded-full bg-[#E01E26] px-2.5 py-0.5 text-xs font-bold text-white">
          {geo ? `${geo.total} views` : "…"}
        </span>
        <div className="ml-auto flex items-center gap-1.5">
          {RANGES.map((r) => (
            <button
              key={r.days}
              onClick={() => setGeoDays(r.days)}
              data-testid={`geo-range-${r.label.toLowerCase()}`}
              className={`rounded-full px-3 py-1 text-xs font-bold transition-colors ${geoDays === r.days ? "bg-[#0E0E0E] text-white" : "bg-[#F0F1F3] text-[#6B7075] hover:bg-[#E2E4E7]"}`}
            >
              {r.label}
            </button>
          ))}
          {loading && <RefreshCcw className="h-3.5 w-3.5 animate-spin text-[#9AA0A6]" />}
        </div>
      </div>
      <p className="mt-1 text-xs text-[#9AA0A6]">
        Counted in-app (one view per visitor per 6h, IPs hashed — never stored). Collecting from FF_BUILD 409 onward; GA4 keeps the full history.
      </p>
      {geo && geo.total === 0 ? (
        <p className="mt-4 rounded-lg border border-dashed border-[#D6D8DB] p-4 text-sm text-[#6B7075]" data-testid="geo-empty">
          No views recorded in this window yet — the beacon starts counting as visitors open the app.
        </p>
      ) : (
        <div className="mt-4 grid gap-6 sm:grid-cols-2">
          <div data-testid="geo-countries">
            <p className="mb-2.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#6B7075]">
              <Globe2 className="h-3.5 w-3.5" /> By country
            </p>
            <div className="space-y-3">
              {countries.map((c, i) => (
                <BarRow key={c.name} name={c.name} count={c.count} max={maxCountry} testid={`geo-country-${i}`} />
              ))}
            </div>
          </div>
          <div data-testid="geo-cities">
            <p className="mb-2.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#6B7075]">
              <MapPin className="h-3.5 w-3.5" /> By city
            </p>
            {cities.length === 0 ? (
              <p className="text-sm text-[#9AA0A6]">No city-level data yet.</p>
            ) : (
              <div className="space-y-3">
                {cities.map((c, i) => (
                  <BarRow key={`${c.name}-${c.region}`} name={c.name} sub={c.region || c.country} count={c.count} max={maxCity} testid={`geo-city-${i}`} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
