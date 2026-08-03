import { useEffect, useState } from "react";
import axios from "axios";
import { Ticket, Sparkles } from "lucide-react";
import { CouponReveal } from "./CouponReveal";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

/**
 * Bonus sponsor-coupon strip.
 *
 * National-chain sponsors buy the `chain_coupon_only` tier — they never
 * occupy a slot in the fate deck. Local sponsors can also attach a coupon
 * (FREE founder perk) that rides here too. After a spin, this component
 * fetches at most 1 coupon relevant to the winner's category and renders
 * it as a subtle "Also nearby" offer beside the winner card.
 * `excludeId` skips the winner itself — its coupon already shows inline.
 *
 * Purpose: monetize the sponsor audience without diluting the local-first
 * fate mechanic. Users still see a hidden gem first; offers ride shotgun.
 */
export function ChainCouponStrip({ category, excludeId }) {
  const [row, setRow] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await axios.get(`${API}/coupons/chains-nearby`, {
          params: { category: category || "food", limit: 1, exclude: excludeId || "" },
        });
        const c = data?.coupons?.[0];
        if (!cancelled && c) setRow(c);
      } catch (_e) {
        // silent — bonus offers are best-effort, never gate the reveal
      }
    })();
    return () => { cancelled = true; };
  }, [category, excludeId]);

  if (!row || !row.coupon?.code) return null;

  return (
    <div
      data-testid="chain-coupon-strip"
      className="rounded-2xl border border-[#D4DBE2] bg-gradient-to-r from-[#F4F7FB] to-[#E9EEF5] p-3.5"
    >
      <div className="mb-2 flex items-center gap-1.5">
        <Sparkles className="h-3.5 w-3.5 text-[#4A5B6E]" />
        <span className="font-sans text-[10px] font-bold uppercase tracking-[0.16em] text-[#4A5B6E]">
          Bonus offer nearby · {row.name}
        </span>
      </div>
      <CouponReveal sponsorId={row.id} coupon={row.coupon} />
    </div>
  );
}
