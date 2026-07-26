import { Clock, Check, X } from "lucide-react";

export function SubmissionsQueue({ submissions, approveSubmission, rejectSubmission }) {
  return (
    <section className="md:col-span-2" data-testid="submissions-queue">
      <div className="flex items-center gap-2">
        <Clock className="h-5 w-5 text-[#E01E26]" />
        <h2 className="font-serif text-xl text-[#0E0E0E]">Pending submissions</h2>
        {submissions.length > 0 && (
          <span data-testid="pending-count-badge" className="rounded-full bg-[#E01E26] px-2.5 py-0.5 text-xs font-bold text-white">{submissions.length}</span>
        )}
      </div>
      <p className="mt-1 font-sans text-sm text-[#6B7075]">Community-added spots awaiting review. Approve to add them to the roulette pool, or reject to discard.</p>
      <div className="mt-4 space-y-3" data-testid="submissions-list">
        {submissions.length === 0 && (
          <div className="rounded-2xl border border-dashed border-[#D5D8DC] bg-white p-6 text-center font-sans text-sm text-[#6B7075]">
            No pending submissions — you're all caught up.
          </div>
        )}
        {submissions.map((r) => (
          <div key={r.id} data-testid={`submission-row-${r.id}`} className="flex items-center gap-4 rounded-2xl border border-[#E2E4E7] bg-white p-3">
            <img src={r.image} alt="" className="h-14 w-14 shrink-0 rounded-xl object-cover" />
            <div className="min-w-0 flex-1">
              <span className="truncate font-serif text-lg text-[#0E0E0E]">{r.name}</span>
              <p className="font-sans text-xs text-[#6B7075]">
                {r.category} · {r.cuisine} · {r.price}
                {r.address ? ` · ${r.address}` : ""}
              </p>
              {r.description && <p className="mt-0.5 truncate font-sans text-xs text-[#8A8F95]">{r.description}</p>}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => approveSubmission(r)}
                data-testid={`submission-approve-${r.id}`}
                className="inline-flex items-center gap-1.5 rounded-full bg-[#0E0E0E] px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-[#2A2A2A]"
              >
                <Check className="h-4 w-4" /> Approve
              </button>
              <button
                onClick={() => rejectSubmission(r)}
                data-testid={`submission-reject-${r.id}`}
                className="rounded-full p-2 text-[#6B7075] transition-colors hover:bg-[#FCF4F4] hover:text-[#E01E26]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
