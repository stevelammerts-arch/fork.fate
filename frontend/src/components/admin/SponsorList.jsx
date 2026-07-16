import { Star, Eye, MousePointerClick, Trash2 } from "lucide-react";
import { Switch } from "../ui/switch";

function AnalyticsSummary({ sponsors }) {
  const imp = sponsors.reduce((a, s) => a + (s.impressions || 0), 0);
  const clk = sponsors.reduce((a, s) => a + (s.clicks || 0), 0);
  const ctr = imp > 0 ? ((clk / imp) * 100).toFixed(1) : "0.0";
  return (
    <div data-testid="sponsor-analytics-summary" className="mt-3 grid grid-cols-3 gap-2">
      <div className="rounded-xl border border-[#E2E4E7] bg-white px-3 py-2 text-center">
        <p className="font-serif text-2xl text-[#0E0E0E]" data-testid="total-impressions">{imp.toLocaleString()}</p>
        <p className="font-sans text-[11px] font-semibold uppercase tracking-wide text-[#6B7075]">Impressions</p>
      </div>
      <div className="rounded-xl border border-[#E2E4E7] bg-white px-3 py-2 text-center">
        <p className="font-serif text-2xl text-[#0E0E0E]" data-testid="total-clicks">{clk.toLocaleString()}</p>
        <p className="font-sans text-[11px] font-semibold uppercase tracking-wide text-[#6B7075]">Clicks</p>
      </div>
      <div className="rounded-xl border border-[#E2E4E7] bg-white px-3 py-2 text-center">
        <p className="font-serif text-2xl text-[#E01E26]" data-testid="total-ctr">{ctr}%</p>
        <p className="font-sans text-[11px] font-semibold uppercase tracking-wide text-[#6B7075]">CTR</p>
      </div>
    </div>
  );
}

export function SponsorList({ sponsors, toggleActive, remove }) {
  return (
    <section>
      <h2 className="font-serif text-xl text-[#0E0E0E]">Current sponsors ({sponsors.length})</h2>
      {sponsors.length > 0 && <AnalyticsSummary sponsors={sponsors} />}
      <div className="mt-4 space-y-3" data-testid="sponsor-list">
        {sponsors.length === 0 && (
          <div className="rounded-2xl border border-dashed border-[#D5D8DC] bg-white p-8 text-center font-sans text-sm text-[#6B7075]">
            No sponsors yet. Add your first paying customer on the left.
          </div>
        )}
        {sponsors.map((s) => (
          <div key={s.id} data-testid={`sponsor-row-${s.id}`} className="flex items-center gap-4 rounded-2xl border border-[#E2E4E7] bg-white p-3">
            <img src={s.image} alt="" className="h-14 w-14 shrink-0 rounded-xl object-cover" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="truncate font-serif text-lg text-[#0E0E0E]">{s.name}</span>
                {!s.active && <span className="rounded-full bg-[#EDEEF0] px-2 py-0.5 text-xs font-bold text-[#6B7075]">Paused</span>}
              </div>
              <p className="font-sans text-xs text-[#6B7075]">
                {s.category} · {s.cuisine} · {s.price}
                <span className="ml-2 inline-flex items-center gap-1"><Star className="h-3 w-3 fill-[#E01E26] text-[#E01E26]" />{Number(s.rating).toFixed(1)}</span>
              </p>
              <div className="mt-1 flex items-center gap-3 font-sans text-xs text-[#6B7075]" data-testid={`sponsor-stats-${s.id}`}>
                <span className="inline-flex items-center gap-1" title="Impressions"><Eye className="h-3.5 w-3.5" />{(s.impressions || 0).toLocaleString()}</span>
                <span className="inline-flex items-center gap-1" title="Clicks"><MousePointerClick className="h-3.5 w-3.5" />{(s.clicks || 0).toLocaleString()}</span>
                <span className="font-semibold text-[#E01E26]" title="Click-through rate">{(s.impressions || 0) > 0 ? (((s.clicks || 0) / s.impressions) * 100).toFixed(1) : "0.0"}% CTR</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <Switch checked={s.active} onCheckedChange={() => toggleActive(s)} data-testid={`sponsor-active-toggle-${s.id}`} />
                <span className="font-sans text-xs font-semibold text-[#6B7075]">{s.active ? "Live" : "Off"}</span>
              </div>
              <button onClick={() => remove(s)} data-testid={`sponsor-delete-${s.id}`} className="rounded-full p-2 text-[#6B7075] transition-colors hover:bg-[#FCF4F4] hover:text-[#E01E26]">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
