import React from "react";

export function MerchInterest({ data }) {
  const { signups = [], count = 0, by_design = {} } = data || {};
  const emails = signups.map((s) => s.email).join(", ");
  return (
    <section className="md:col-span-2" data-testid="merch-interest-section">
      <div className="flex items-center gap-3">
        <h2 className="font-serif text-xl text-[#0E0E0E]">Merch interest (pre-launch)</h2>
        <span data-testid="merch-count-badge" className="rounded-full bg-[#E01E26] px-2.5 py-0.5 text-xs font-bold text-white">{count}</span>
        {count > 0 && (
          <button
            data-testid="copy-merch-emails-btn"
            onClick={() => navigator.clipboard?.writeText(emails)}
            className="ml-auto rounded-full border border-[#D6D8DB] px-3 py-1 text-xs font-bold text-[#0E0E0E] hover:bg-black/5"
          >
            Copy all emails
          </button>
        )}
      </div>
      {Object.keys(by_design).length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5" data-testid="merch-by-design">
          {Object.entries(by_design).sort((a, b) => b[1] - a[1]).map(([d, c]) => (
            <span key={d} className="rounded-full border border-[#E2E4E7] bg-white px-2.5 py-1 text-xs text-[#3A3F45]">{d} · <b>{c}</b></span>
          ))}
        </div>
      )}
      <div className="mt-4 space-y-2" data-testid="merch-interest-list">
        {signups.length === 0 && (
          <p className="rounded-lg border border-dashed border-[#D6D8DB] p-4 text-sm text-[#6B7075]">
            No signups yet — share the Shop so fans can join the drop list.
          </p>
        )}
        {signups.map((s, i) => (
          <div key={`${s.email}-${i}`} className="flex items-center justify-between gap-3 rounded-lg border border-[#E2E4E7] bg-white px-3 py-2 text-sm">
            <span className="truncate font-medium text-[#0E0E0E]">{s.email}</span>
            <span className="shrink-0 text-xs text-[#6B7075]">{s.design}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
