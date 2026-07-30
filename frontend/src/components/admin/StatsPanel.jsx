import { ShieldCheck, Gauge, Mail, TrendingUp } from "lucide-react";

function CostCard({ cost, emailing, sendSummaryEmail }) {
  const used = cost?.used ?? 0;
  const cap = cost?.cap ?? 160;
  const pct = cost?.pct ?? (cap ? Math.round((used / cap) * 100) : 0);
  const warn = pct >= 90;
  const caution = pct >= 70 && pct < 90;
  const barColor = warn ? "#E01E26" : caution ? "#E0A21E" : "#22A559";
  const statusLabel = warn ? "Near cap" : caution ? "Watch" : "Healthy";
  return (
    <div className="rounded-3xl border border-[#E2E4E7] bg-white p-6" data-testid="cost-card">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0E0E0E]">
            <ShieldCheck className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="font-serif text-xl text-[#0E0E0E]">Security &amp; cost</h2>
            <p className="font-sans text-xs text-[#6B7075]">Live Google Places usage vs the daily safety cap</p>
          </div>
        </div>
        <span
          data-testid="cost-status-pill"
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold"
          style={{ backgroundColor: `${barColor}1A`, color: barColor }}
        >
          <Gauge className="h-3.5 w-3.5" /> {statusLabel}
        </span>
      </div>

      <div className="mt-5">
        <div className="flex items-end justify-between">
          <p className="font-sans text-xs font-bold uppercase tracking-[0.18em] text-[#6B7075]">Today's searches</p>
          <p className="font-sans text-xs text-[#8A8F95]" data-testid="cost-remaining">{cost?.remaining ?? cap} left</p>
        </div>
        <p className="mt-1 font-serif text-3xl font-semibold text-[#0E0E0E]">
          <span data-testid="cost-used">{used.toLocaleString()}</span>
          <span className="text-lg text-[#8A8F95]"> / {cap.toLocaleString()}</span>
        </p>
        <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-[#EDEEF0]">
          <div
            data-testid="cost-progress-bar"
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${Math.min(100, pct)}%`, backgroundColor: barColor }}
          />
        </div>
        <p className="mt-1.5 font-sans text-xs text-[#8A8F95]" data-testid="cost-pct">{pct}% of daily cap used</p>
      </div>

      {cost?.history?.length > 1 && (
        <div className="mt-5 border-t border-[#EDEEF0] pt-4" data-testid="cost-history">
          <p className="mb-2 font-sans text-xs font-bold uppercase tracking-[0.18em] text-[#6B7075]">Recent days</p>
          <div className="space-y-1.5">
            {cost.history.map((h) => (
              <div key={h.date} className="flex items-center justify-between font-sans text-xs" data-testid={`cost-day-${h.date}`}>
                <span className="text-[#6B7075]">{h.date}</span>
                <span className="font-semibold text-[#0E0E0E]">{h.searches.toLocaleString()} searches</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[#EDEEF0] pt-4" data-testid="sponsor-summary-email">
        <div>
          <p className="font-sans text-xs font-bold uppercase tracking-[0.18em] text-[#6B7075]">Sponsor revenue summary</p>
          <p className="mt-0.5 font-sans text-xs text-[#8A8F95]">Auto-sent on the 1st monthly · send an up-to-the-minute digest now</p>
        </div>
        <button
          onClick={sendSummaryEmail}
          disabled={emailing}
          data-testid="send-summary-email-button"
          className="inline-flex shrink-0 items-center gap-2 rounded-full border border-[#0E0E0E] bg-[#0E0E0E] px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-[#2A2A2A] disabled:opacity-60"
        >
          <Mail className="h-4 w-4" /> {emailing ? "Sending…" : "Send summary now"}
        </button>
      </div>
    </div>
  );
}

export function StatsPanel({ stats, cost, weekly, emailing, sendSummaryEmail }) {
  const weeklyTotal = weekly?.total_impressions_7d ?? 0;
  const weeklyUnique = weekly?.unique_sponsors_7d ?? 0;
  const weeklyTop = weekly?.top ?? [];
  const weeklyMax = weeklyTop.length ? Math.max(...weeklyTop.map((t) => t.count)) : 0;
  return (
    <>
      {/* Revenue / subscriber overview */}
      <section className="md:col-span-2" data-testid="mrr-overview">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-2xl border border-[#E2E4E7] bg-[#0E0E0E] p-5 text-white" data-testid="stat-mrr">
            <p className="font-sans text-xs font-bold uppercase tracking-[0.18em] text-[#E01E26]">MRR</p>
            <p className="mt-1 font-serif text-3xl font-semibold" data-testid="stat-mrr-value">${(stats?.mrr ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
            <p className="mt-0.5 font-sans text-xs text-[#8A8F95]">${(stats?.arr ?? 0).toLocaleString()} / yr</p>
          </div>
          <div className="rounded-2xl border border-[#E2E4E7] bg-white p-5" data-testid="stat-subscribers">
            <p className="font-sans text-xs font-bold uppercase tracking-[0.18em] text-[#6B7075]">Paying subs</p>
            <p className="mt-1 font-serif text-3xl font-semibold text-[#0E0E0E]" data-testid="stat-subscribers-value">{stats?.paying_subscribers ?? 0}</p>
            <p className="mt-0.5 font-sans text-xs text-[#8A8F95]">${(stats?.price ?? 29).toFixed(0)}/mo each</p>
          </div>
          <div className="rounded-2xl border border-[#E2E4E7] bg-white p-5" data-testid="stat-active">
            <p className="font-sans text-xs font-bold uppercase tracking-[0.18em] text-[#6B7075]">Active spots</p>
            <p className="mt-1 font-serif text-3xl font-semibold text-[#0E0E0E]" data-testid="stat-active-value">{stats?.active_sponsors ?? 0}</p>
            <p className="mt-0.5 font-sans text-xs text-[#8A8F95]">of {stats?.total_sponsors ?? 0} total</p>
          </div>
          <div className="rounded-2xl border border-[#E2E4E7] bg-white p-5" data-testid="stat-engagement">
            <p className="font-sans text-xs font-bold uppercase tracking-[0.18em] text-[#6B7075]">Engagement</p>
            <p className="mt-1 font-serif text-3xl font-semibold text-[#0E0E0E]" data-testid="stat-engagement-value">{(stats?.total_clicks ?? 0).toLocaleString()}</p>
            <p className="mt-0.5 font-sans text-xs text-[#8A8F95]">clicks · {(stats?.total_impressions ?? 0).toLocaleString()} views</p>
          </div>
        </div>
      </section>

      {/* This-week impressions rollup — real ROI numbers to show sponsors */}
      <section className="md:col-span-2" data-testid="weekly-impressions-overview">
        <div className="rounded-3xl border border-[#E2E4E7] bg-white p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#E01E26]">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="font-serif text-xl text-[#0E0E0E]">Impressions this week</h2>
                <p className="font-sans text-xs text-[#6B7075]">Rolling 7-day sponsor views · use these numbers when pitching</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-serif text-3xl font-semibold text-[#0E0E0E]" data-testid="weekly-impressions-total">
                {weeklyTotal.toLocaleString()}
              </p>
              <p className="font-sans text-xs text-[#8A8F95]" data-testid="weekly-impressions-unique">
                across {weeklyUnique} sponsor{weeklyUnique === 1 ? "" : "s"}
              </p>
            </div>
          </div>

          {weeklyTop.length === 0 ? (
            <p className="mt-5 font-sans text-sm text-[#8A8F95]" data-testid="weekly-impressions-empty">
              No sponsor impressions logged in the last 7 days yet.
            </p>
          ) : (
            <div className="mt-5 border-t border-[#EDEEF0] pt-4" data-testid="weekly-impressions-top">
              <p className="mb-3 font-sans text-xs font-bold uppercase tracking-[0.18em] text-[#6B7075]">Top sponsors (7d)</p>
              <div className="space-y-2.5">
                {weeklyTop.map((t) => {
                  const pct = weeklyMax ? Math.max(4, Math.round((t.count / weeklyMax) * 100)) : 0;
                  return (
                    <div key={t.sponsor_id} data-testid={`weekly-sponsor-${t.sponsor_id}`}>
                      <div className="flex items-center justify-between font-sans text-xs">
                        <span className="truncate pr-3 text-[#0E0E0E]">{t.name}</span>
                        <span className="font-semibold text-[#0E0E0E]">{t.count.toLocaleString()}</span>
                      </div>
                      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-[#EDEEF0]">
                        <div
                          className="h-full rounded-full bg-[#E01E26] transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Security & cost — today's Google API usage vs the daily cap */}
      <section className="md:col-span-2" data-testid="cost-overview">
        <CostCard cost={cost} emailing={emailing} sendSummaryEmail={sendSummaryEmail} />
      </section>
    </>
  );
}
