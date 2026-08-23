// FATE REWARDS: the points vault — balance, ways to earn, demo sponsor
// offers, and minted cashier coupons. Opened from the Fate Points pill.
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { X, Coins, CalendarCheck, Sparkles, Drama, Ticket, Copy, ChevronLeft } from "lucide-react";
import { EARN, SPONSOR_OFFERS, readPoints, readCoupons, redeemOffer } from "../../lib/points";
import { useLang } from "../../i18n/i18n";

const fmtDate = (iso) => new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });

/** Full-screen cashier coupon: big code, sponsor, expiry. */
const CouponView = ({ coupon, onBack, t }) => (
  <div className="text-center" data-testid="rewards-coupon-view">
    <button type="button" onClick={onBack} data-testid="rewards-coupon-back"
      className="inline-flex items-center gap-1 rounded-full px-2 py-1 font-sans text-xs font-bold text-white/60 hover:text-white">
      <ChevronLeft className="h-4 w-4" /> {t("Back to rewards")}
    </button>
    <div className="mt-3 rounded-2xl border-2 border-dashed p-5" style={{ borderColor: coupon.accent }}>
      <p className="font-sans text-xs font-bold uppercase tracking-[0.2em] text-white/50">{t("Show this to the cashier")}</p>
      <p className="mt-2 font-serif text-2xl font-semibold text-white">{coupon.sponsor}</p>
      <p className="mt-1 font-sans text-sm text-white/80">{coupon.offer}</p>
      <p className="mt-4 select-all font-mono text-3xl font-bold tracking-widest" style={{ color: coupon.accent }} data-testid="rewards-coupon-code">
        {coupon.code}
      </p>
      <p className="mt-3 font-sans text-xs text-white/50">{t("Valid through")} {fmtDate(coupon.expires)} · {t("one use per visit")}</p>
      <button type="button" data-testid="rewards-coupon-copy"
        onClick={async () => {
          try { await navigator.clipboard.writeText(coupon.code); toast.success(`${coupon.code} ${t("copied")}`); }
          catch (e) { toast.error(t("Couldn't copy — long-press the code instead")); }
        }}
        className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 font-sans text-xs font-bold text-[#101013] hover:bg-white/85">
        <Copy className="h-3.5 w-3.5" /> {t("Copy code")}
      </button>
    </div>
  </div>
);

export default function RewardsDialog({ open, onClose }) {
  const { t } = useLang();
  const [balance, setBalance] = useState(readPoints);
  const [coupons, setCoupons] = useState(readCoupons);
  const [viewing, setViewing] = useState(null); // coupon being shown full-screen
  const [confirmId, setConfirmId] = useState(null); // two-tap redeem guard

  useEffect(() => {
    const sync = () => { setBalance(readPoints()); setCoupons(readCoupons()); };
    window.addEventListener("ff:points", sync);
    return () => window.removeEventListener("ff:points", sync);
  }, []);
  useEffect(() => { if (open) { setBalance(readPoints()); setCoupons(readCoupons()); setViewing(null); setConfirmId(null); } }, [open]);

  if (!open) return null;

  const doRedeem = (offer) => {
    if (confirmId !== offer.id) { setConfirmId(offer.id); return; }
    setConfirmId(null);
    const coupon = redeemOffer(offer);
    if (!coupon) { toast.error(t("Not enough Fate Points yet — keep playing!")); return; }
    setViewing(coupon);
    toast.success(`${t("Coupon minted!")} −${offer.cost} pts`);
  };

  const earnRows = [
    { icon: CalendarCheck, label: t("Daily login"), pts: `+${EARN.daily}`, note: t("streak bonus up to") + ` +${EARN.streakCap}` },
    { icon: Sparkles, label: t("Rare fate revealed"), pts: `+${EARN.ritual}`, note: t("any ritual reveal") },
    { icon: Drama, label: t("Heist witnessed"), pts: `+${EARN.heist}`, note: t("catch a realm heist live") },
  ];

  return createPortal(
    <div data-testid="rewards-dialog" className="fixed inset-0 z-[130] overflow-y-auto">
      <div className="fixed inset-0 bg-black/85 backdrop-blur-md" onClick={onClose} />
      <div className="relative flex min-h-full items-center justify-center p-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="w-full max-w-lg rounded-3xl border border-white/15 bg-[#101013]/95 p-6 shadow-2xl sm:p-8"
        >
          <button type="button" onClick={onClose} data-testid="rewards-close"
            className="absolute right-4 top-4 rounded-full p-1.5 text-white/50 hover:bg-white/10 hover:text-white">
            <X className="h-5 w-5" />
          </button>

          {viewing ? (
            <CouponView coupon={viewing} onBack={() => setViewing(null)} t={t} />
          ) : (
            <>
              <div className="flex items-center gap-3">
                <span className="grid h-12 w-12 place-items-center rounded-full bg-[#E6B23A]/15 text-[#E6B23A]">
                  <Coins className="h-6 w-6" />
                </span>
                <div>
                  <h2 className="font-serif text-2xl font-semibold text-white">{t("Fate Points")}</h2>
                  <p className="font-sans text-sm text-white/60">
                    <span className="font-bold text-[#E6B23A]" data-testid="rewards-balance">{balance.toLocaleString()}</span> {t("points to spend")}
                  </p>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-3 gap-2">
                {earnRows.map((e) => (
                  <div key={e.label} className="rounded-2xl border border-white/10 bg-white/5 p-3 text-center">
                    <e.icon className="mx-auto h-4 w-4 text-white/60" />
                    <p className="mt-1.5 font-sans text-sm font-bold text-[#E6B23A]">{e.pts}</p>
                    <p className="font-sans text-[11px] font-bold leading-tight text-white/85">{e.label}</p>
                    <p className="mt-0.5 font-sans text-[10px] leading-tight text-white/45">{e.note}</p>
                  </div>
                ))}
              </div>

              <p className="mt-6 font-sans text-xs font-bold uppercase tracking-[0.2em] text-white/50">{t("Redeem at sponsors")}</p>
              <div className="mt-2.5 flex flex-col gap-2.5">
                {SPONSOR_OFFERS.map((o) => {
                  const afford = balance >= o.cost;
                  const confirming = confirmId === o.id;
                  return (
                    <div key={o.id} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                      <span className="h-9 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: o.accent }} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-sans text-sm font-bold text-white">{o.sponsor}</p>
                        <p className="truncate font-sans text-xs text-white/60">{o.offer}</p>
                      </div>
                      <button type="button" data-testid={`rewards-redeem-${o.id}`}
                        onClick={() => doRedeem(o)} disabled={!afford}
                        className={`shrink-0 rounded-full px-3.5 py-1.5 font-sans text-xs font-bold transition-colors ${
                          !afford ? "cursor-not-allowed bg-white/10 text-white/35"
                          : confirming ? "bg-[#E01E26] text-white"
                          : "bg-[#E6B23A] text-[#101013] hover:bg-[#F0C55C]"}`}
                      >
                        {confirming ? t("Confirm?") : `${o.cost} pts`}
                      </button>
                    </div>
                  );
                })}
              </div>

              {coupons.length > 0 && (
                <>
                  <p className="mt-6 font-sans text-xs font-bold uppercase tracking-[0.2em] text-white/50">{t("My coupons")}</p>
                  <div className="mt-2.5 flex flex-col gap-2" data-testid="rewards-coupon-list">
                    {coupons.slice(0, 6).map((c) => (
                      <button key={c.id} type="button" onClick={() => !c.expired && setViewing(c)}
                        className={`flex items-center gap-2.5 rounded-2xl border border-white/10 px-4 py-2.5 text-left ${c.expired ? "opacity-40" : "bg-white/5 hover:bg-white/10"}`}>
                        <Ticket className="h-4 w-4 shrink-0" style={{ color: c.accent }} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-sans text-xs font-bold text-white">{c.sponsor} — {c.offer}</p>
                          <p className="font-mono text-[11px] tracking-wider text-white/55">{c.code} · {c.expired ? t("expired") : `${t("until")} ${fmtDate(c.expires)}`}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </>
              )}

              <p className="mt-6 text-center font-sans text-[11px] text-white/40">
                {t("Demo sponsors shown — real local partners are coming soon.")}
              </p>
            </>
          )}
        </motion.div>
      </div>
    </div>,
    document.body
  );
}
