import React, { useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Globe2, MapPin, RefreshCcw, Flag, X } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine } from "recharts";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const WC = { withCredentials: true };

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

function TrendChart({ trend, markers }) {
  if (!trend || trend.length < 2) return null;
  const peak = Math.max(...trend.map((d) => d.views));
  const inWindow = new Map(trend.map((d) => [d.date, d.label]));
  const visible = (markers || []).filter((m) => inWindow.has(m.date));
  return (
    <div className="mt-4 rounded-2xl border border-[#E2E4E7] bg-white p-4" data-testid="visitor-trend-chart">
      <div className="flex items-baseline justify-between">
        <p className="text-xs font-bold uppercase tracking-wider text-[#6B7075]">Daily visitors</p>
        <p className="text-xs text-[#9AA0A6]">peak {peak} · last {trend.length} days</p>
      </div>
      <div className="mt-2 h-40">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={trend} margin={{ top: 14, right: 4, left: -22, bottom: 0 }}>
            <defs>
              <linearGradient id="ffTrendFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#E01E26" stopOpacity={0.28} />
                <stop offset="100%" stopColor="#E01E26" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#F0F1F3" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#9AA0A6" }} tickLine={false} axisLine={false} interval="preserveStartEnd" minTickGap={28} />
            <YAxis tick={{ fontSize: 10, fill: "#9AA0A6" }} tickLine={false} axisLine={false} allowDecimals={false} width={46} />
            <Tooltip
              contentStyle={{ borderRadius: 12, border: "1px solid #E2E4E7", fontSize: 12, fontFamily: "inherit" }}
              labelStyle={{ fontWeight: 700, color: "#0E0E0E" }}
              formatter={(v) => [`${v} view${v === 1 ? "" : "s"}`, null]}
            />
            {/* Event pins: launches / promo posts / ad runs — tie spikes to causes */}
            {visible.map((m) => (
              <ReferenceLine
                key={m.id}
                x={inWindow.get(m.date)}
                stroke="#0E0E0E"
                strokeDasharray="4 3"
                label={{ value: m.label, position: "top", fontSize: 10, fill: "#0E0E0E", fontWeight: 700 }}
              />
            ))}
            <Area type="monotone" dataKey="views" stroke="#E01E26" strokeWidth={2} fill="url(#ffTrendFill)" dot={false} activeDot={{ r: 4, fill: "#E01E26" }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/** Pin dated events (Play launch, promo posts, ad runs) onto the trend chart. */
function MarkerManager({ markers, onRefresh }) {
  const [date, setDate] = useState("");
  const [label, setLabel] = useState("");
  const [busy, setBusy] = useState(false);
  const add = async () => {
    if (!date || !label.trim() || busy) return;
    setBusy(true);
    try {
      await axios.post(`${API}/admin/trend-markers`, { date, label: label.trim() }, WC);
      setDate(""); setLabel("");
      onRefresh?.();
    } catch (e) {
      toast.error(e.response?.data?.detail || "Couldn't add the marker");
    }
    setBusy(false);
  };
  const remove = async (id) => {
    try {
      await axios.delete(`${API}/admin/trend-markers/${id}`, WC);
      onRefresh?.();
    } catch (e) {
      toast.error("Couldn't delete the marker");
    }
  };
  return (
    <div className="mt-3" data-testid="trend-marker-manager">
      <div className="flex flex-wrap items-center gap-2">
        <Flag className="h-3.5 w-3.5 text-[#9AA0A6]" />
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          data-testid="trend-marker-date"
          className="rounded-lg border border-[#E2E4E7] bg-white px-2 py-1 text-xs text-[#0E0E0E]"
        />
        <input
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder="Event label (e.g. Play launch)"
          maxLength={40}
          data-testid="trend-marker-label"
          className="w-44 rounded-lg border border-[#E2E4E7] bg-white px-2 py-1 text-xs text-[#0E0E0E] placeholder:text-[#9AA0A6]"
        />
        <button
          type="button"
          onClick={add}
          disabled={!date || !label.trim() || busy}
          data-testid="trend-marker-add"
          className="rounded-lg bg-[#0E0E0E] px-3 py-1 text-xs font-bold text-white transition-opacity disabled:opacity-40"
        >
          Pin event
        </button>
      </div>
      {(markers || []).length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {markers.map((m) => (
            <span key={m.id} data-testid={`trend-marker-chip-${m.id}`} className="inline-flex items-center gap-1 rounded-full border border-[#E2E4E7] bg-[#F7F7F8] px-2 py-0.5 text-[11px] text-[#0E0E0E]">
              <span className="font-bold">{m.label}</span>
              <span className="text-[#9AA0A6]">{m.date}</span>
              <button type="button" onClick={() => remove(m.id)} aria-label={`Delete marker ${m.label}`} data-testid={`trend-marker-delete-${m.id}`} className="ml-0.5 text-[#9AA0A6] transition-colors hover:text-[#E01E26]">
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/** "Where your visitors are": country + city view counts from the anonymous
 * pageview beacon (one view per visitor per 6h, IPs hashed, 180-day window). */
export function GeoPanel({ geo, geoDays, setGeoDays, loading, onRefresh }) {
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
      {/* 30-day (range-following) trend line — spot the spikes after each marketing push */}
      <TrendChart trend={geo?.trend} markers={geo?.markers} />
      <MarkerManager markers={geo?.markers} onRefresh={onRefresh} />
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
