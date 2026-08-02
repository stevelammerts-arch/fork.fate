import React from "react";
import { Trash2 } from "lucide-react";

export function FeedbackList({ feedback, deleteFeedback }) {
  return (
    <section className="md:col-span-2" data-testid="feedback-section">
      <div className="flex items-center gap-3">
        <h2 className="font-serif text-xl text-[#0E0E0E]">In-app feedback</h2>
        <span data-testid="feedback-count-badge" className="rounded-full bg-[#E01E26] px-2.5 py-0.5 text-xs font-bold text-white">{feedback.length}</span>
      </div>
      <div className="mt-4 space-y-2" data-testid="feedback-list">
        {feedback.length === 0 && (
          <p className="rounded-lg border border-dashed border-[#D6D8DB] p-4 text-sm text-[#6B7075]">
            No feedback yet — the in-app "Suggest an improvement" button in the footer lands here.
          </p>
        )}
        {feedback.map((f) => (
          <div key={f.id} className="rounded-lg border border-[#E2E4E7] bg-white px-4 py-3 text-sm">
            <div className="flex items-start justify-between gap-3">
              <p className="whitespace-pre-wrap text-[#0E0E0E]">{f.message}</p>
              <button
                onClick={() => deleteFeedback(f)}
                data-testid={`feedback-delete-${f.id}`}
                className="shrink-0 rounded-full p-1.5 text-[#9AA0A6] transition-colors hover:bg-[#FDECEC] hover:text-[#E01E26]"
                title="Delete"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-1.5 text-xs text-[#6B7075]">
              {f.email ? <span className="font-semibold text-[#3A3F45]">{f.email}</span> : "anonymous"}
              {" · "}{f.page || "/"}
              {" · "}{(f.created_at || "").slice(0, 16).replace("T", " ")}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
