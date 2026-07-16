import { Trash2, Mail } from "lucide-react";
import { toast } from "sonner";

export function BetaTesters({ betaTesters, optInLink, setOptInLink, emailAllTesters, deleteBeta }) {
  return (
    <section className="md:col-span-2" data-testid="beta-testers-section">
      <div className="flex items-center gap-2">
        <h2 className="font-serif text-xl text-[#0E0E0E]">Android beta testers</h2>
        <span data-testid="beta-count-badge" className={`rounded-full px-2.5 py-0.5 text-xs font-bold text-white ${betaTesters.length >= 12 ? "bg-[#1AA85B]" : "bg-[#E01E26]"}`}>
          {betaTesters.length}/12
        </span>
        {betaTesters.length > 0 && (
          <button
            data-testid="copy-beta-emails-btn"
            onClick={() => {
              navigator.clipboard?.writeText(betaTesters.map((x) => x.email).join(", "));
              toast.success("All tester emails copied");
            }}
            className="ml-auto rounded-full border border-[#E2E4E7] bg-white px-3 py-1 text-xs font-bold text-[#0E0E0E] hover:bg-[#F5F6F7]"
          >
            Copy all emails
          </button>
        )}
      </div>
      <p className="mt-1 text-xs text-[#6B7075]">
        Paste these Gmail addresses into Play Console → Closed testing → Testers. You need 12+ for 14 days.
      </p>
      {betaTesters.length > 0 && (
        <div className="mt-3 flex flex-col gap-2 rounded-2xl border border-[#E2E4E7] bg-[#FAFAFB] p-3 sm:flex-row sm:items-center">
          <input
            data-testid="optin-link-input"
            value={optInLink}
            onChange={(e) => { setOptInLink(e.target.value); try { localStorage.setItem("ff_optin_link", e.target.value); } catch (er) {} }}
            placeholder="Paste your Play opt-in link"
            className="min-w-0 flex-1 rounded-full border border-[#E2E4E7] bg-white px-3 py-1.5 text-xs text-[#0E0E0E] outline-none focus:ring-2 focus:ring-[#E01E26]/30"
          />
          <button
            data-testid="email-all-testers-btn"
            onClick={emailAllTesters}
            className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-full bg-[#E01E26] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#B3141A]"
          >
            <Mail className="h-3.5 w-3.5" /> Email all testers the invite
          </button>
        </div>
      )}
      <div className="mt-4 space-y-2" data-testid="beta-testers-list">
        {betaTesters.length === 0 && (
          <p className="rounded-2xl border border-dashed border-[#E2E4E7] bg-white px-4 py-6 text-center text-sm text-[#6B7075]">
            No sign-ups yet — share the app so visitors can join the beta.
          </p>
        )}
        {betaTesters.map((x) => (
          <div key={x.email} className="flex items-center justify-between rounded-2xl border border-[#E2E4E7] bg-white px-4 py-2.5">
            <span className="font-mono text-sm text-[#0E0E0E]">{x.email}</span>
            <div className="flex items-center gap-3">
              <span className="text-xs text-[#9AA0A6]">{(x.created_at || "").slice(0, 10)}</span>
              <button
                data-testid={`delete-beta-${x.email}`}
                onClick={() => deleteBeta(x.email)}
                aria-label="Remove tester"
                className="rounded-full p-1.5 text-[#B01015] transition-colors hover:bg-[#FCE9EA]"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
