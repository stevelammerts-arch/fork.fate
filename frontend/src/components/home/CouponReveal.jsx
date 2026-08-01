import { useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Ticket, Copy, Check } from "lucide-react";
import { ScratchCover } from "./ScratchCover";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

/**
 * Tap-to-reveal coupon component shown on sponsored fate cards.
 *
 * Renders in two states:
 *  1. Sealed (default) — a tappable red "Deal available" panel that teases the
 *     description but hides the code, creating a small unlock moment.
 *  2. Revealed — code becomes visible with a Copy button + terms/expiry.
 *
 * `variant="compact"` is used inside the alternates list (single-line badge).
 *
 * Props:
 *  - sponsorId (string): required — so we can attribute copy-code events.
 *  - coupon ({code, description, discount_type, discount_value, terms, expires_at}): required.
 *  - variant ("full" | "compact"): default "full" (winner card); "compact" for alternates.
 */
export function CouponReveal({ sponsorId, coupon, variant = "full" }) {
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);
  if (!coupon || !coupon.code) return null;

  const trackCopy = async () => {
    try { await axios.post(`${API}/sponsors/${sponsorId}/coupon-copy`, {}); }
    catch (e) { /* silent — analytics only */ }
  };

  const doCopy = async () => {
    try {
      await navigator.clipboard.writeText(coupon.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
      toast.success(`Code ${coupon.code} copied`);
      trackCopy();
    } catch (e) {
      toast.error("Couldn't copy — long-press the code to copy manually");
    }
  };

  const doReveal = () => {
    setRevealed(true);
    trackCopy(); // count the reveal as the intent moment even before Copy
  };

  const savingsLabel = () => {
    const v = coupon.discount_value;
    switch (coupon.discount_type) {
      case "percent": return v ? `${v}% off` : "Discount";
      case "fixed": return v ? `$${v} off` : "Discount";
      case "free_item": return "Free item";
      case "bogo": return "BOGO";
      default: return "Deal";
    }
  };

  if (variant === "compact") {
    return (
      <span
        data-testid={`coupon-badge-${sponsorId}`}
        className="mt-1 inline-flex items-center gap-1 rounded-full bg-[#FFF4CC] px-2 py-0.5 font-sans text-[10px] font-bold uppercase tracking-wide text-[#B26A12]"
      >
        <Ticket className="h-3 w-3" /> {savingsLabel()}
      </span>
    );
  }

  if (!revealed) {
    return (
      <div
        data-testid={`coupon-reveal-sealed-${sponsorId}`}
        className="relative overflow-hidden rounded-2xl"
        title="Scratch to reveal your code"
      >
        {/* The real coupon sits underneath; the gold foil above gets scratched off. */}
        <div className="rounded-2xl border-2 border-dashed border-[#F0A24E] bg-gradient-to-r from-[#FFF4CC] to-[#FFE1A6] px-4 py-4">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#B26A12] text-white">
              <Ticket className="h-5 w-5" />
            </span>
            <div className="flex flex-col">
              <span className="font-sans text-[10px] font-bold uppercase tracking-[0.18em] text-[#8A5210]">
                Deal unlocked by fate
              </span>
              <span className="font-serif text-base font-medium leading-snug text-[#0E0E0E]">
                {savingsLabel()} — {coupon.description}
              </span>
              <span className="mt-1 font-mono text-xl font-bold tracking-wider text-[#0E0E0E]">
                {coupon.code}
              </span>
            </div>
          </div>
        </div>
        <ScratchCover onDone={doReveal} label="Scratch to reveal your deal" />
      </div>
    );
  }

  return (
    <div
      data-testid={`coupon-reveal-open-${sponsorId}`}
      className="rounded-2xl border-2 border-[#B26A12] bg-gradient-to-r from-[#FFF4CC] to-[#FFE1A6] px-4 py-4"
    >
      <div className="flex flex-wrap items-center gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#B26A12] text-white">
          <Ticket className="h-5 w-5" />
        </span>
        <div className="flex flex-1 flex-col">
          <span className="font-sans text-[10px] font-bold uppercase tracking-[0.18em] text-[#8A5210]">
            {savingsLabel()} · {coupon.description}
          </span>
          <span
            data-testid={`coupon-code-${sponsorId}`}
            className="mt-1 select-all font-mono text-2xl font-bold tracking-wider text-[#0E0E0E]"
          >
            {coupon.code}
          </span>
        </div>
        <button
          type="button"
          onClick={doCopy}
          data-testid={`coupon-copy-${sponsorId}`}
          className="inline-flex items-center gap-1.5 rounded-full bg-[#0E0E0E] px-4 py-2 font-sans text-xs font-bold text-white transition-colors hover:bg-[#2A2A2A]"
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {copied ? "Copied" : "Copy code"}
        </button>
      </div>
      {(coupon.terms || coupon.expires_at) && (
        <p className="mt-2.5 font-sans text-[11px] text-[#8A5210]">
          {coupon.terms}
          {coupon.terms && coupon.expires_at ? " · " : ""}
          {coupon.expires_at ? `Expires ${coupon.expires_at}` : ""}
        </p>
      )}
    </div>
  );
}
