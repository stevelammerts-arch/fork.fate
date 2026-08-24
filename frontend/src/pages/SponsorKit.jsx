import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import {
  ArrowLeft, ArrowRight, Check, Clapperboard, Coins, Dices, Download, Loader2, Mail, Pin, Sparkles, Store, Ticket,
} from "lucide-react";
import BecomeSponsorDialog from "../components/BecomeSponsorDialog";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const EMAIL = "steve@fork-fate.com";

const BENEFITS = [
  {
    Icon: Pin,
    title: "Pinned to the top",
    body: "Your spot rides at the top of every matching shuffle with a Sponsored badge — first thing hungry players see before fate deals.",
  },
  {
    Icon: Ticket,
    title: "Coupons that ride along",
    body: "Your offer appears beside matching reveals as a tap-to-copy scratch-off — a bonus deal at the exact moment of decision.",
  },
  {
    Icon: Coins,
    title: "Points close the loop",
    body: "Players earn Fate Points every daily visit, heist and check-in — and redeem them as discounts at your register.",
  },
];

const LOCAL_PERKS = [
  "Pinned in every matching shuffle",
  "Sponsored badge on your card",
  "FREE coupon offer — founder perk",
  "Self-serve PayPal · live in minutes",
  "Cancel anytime",
];

const CHAIN_PERKS = [
  "Dedicated coupon strip on every matching reveal",
  "National reach — every city Fork·Fate spins in",
  "Tap-to-copy code with redemption analytics",
  "Ready-to-post social + print marketing cards",
  "Cancel anytime",
];

export default function SponsorKit() {
  const [open, setOpen] = useState(false);
  const [dlgTier, setDlgTier] = useState("local");
  const [fates, setFates] = useState(null);

  useEffect(() => {
    axios.get(`${API}/stats/fates`).then(({ data }) => setFates(data.count)).catch(() => {});
    window.scrollTo(0, 0);
  }, []);

  const join = (tier) => { setDlgTier(tier); setOpen(true); };

  // Browsers open mp4 links in a player tab instead of saving them (the
  // download attribute is ignored on media navigation, esp. in the PWA), so
  // fetch as a blob and hand the browser a real file to save.
  const [saving, setSaving] = useState("");
  const saveVideo = async (path, filename) => {
    setSaving(filename);
    try {
      const res = await fetch(path);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 30000);
    } catch {
      window.open(path, "_blank");
    } finally {
      setSaving("");
    }
  };

  const DownloadBtn = ({ path, filename, testId }) => (
    <button
      type="button"
      onClick={() => saveVideo(path, filename)}
      disabled={saving === filename}
      data-testid={testId}
      className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-white/20 px-3.5 py-2 font-sans text-xs font-bold text-white transition-colors hover:bg-white/10 disabled:opacity-60"
    >
      {saving === filename ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
      {saving === filename ? "Saving…" : "Download"}
    </button>
  );

  return (
    <div className="min-h-screen bg-[#0E0E0E] text-white" data-testid="sponsor-kit-page">
      {/* Header */}
      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-6">
        <Link to="/" data-testid="kit-back-home" className="inline-flex items-center gap-2 font-sans text-sm font-bold text-[#B8BCC2] transition-colors hover:text-white">
          <ArrowLeft className="h-4 w-4" /> Fork·Fate
        </Link>
        <a
          href={`mailto:${EMAIL}?subject=Fork%C2%B7Fate%20Sponsorship`}
          data-testid="kit-email-link"
          className="inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 font-sans text-xs font-bold text-white transition-colors hover:bg-white/10"
        >
          <Mail className="h-3.5 w-3.5" /> Talk to us
        </a>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-5xl px-6 pb-14 pt-8">
        <p className="inline-flex items-center gap-2 rounded-full border border-[#E01E26]/40 bg-[#E01E26]/10 px-4 py-1.5 font-sans text-xs font-bold uppercase tracking-widest text-[#FF6B70]">
          <Store className="h-3.5 w-3.5" /> Sponsor kit · Local spots &amp; franchises
        </p>
        <h1 className="mt-6 max-w-3xl font-serif text-4xl font-medium leading-tight sm:text-5xl lg:text-6xl">
          Be the table <span className="text-[#E01E26]">fate deals</span> next.
        </h1>
        <p className="mt-5 max-w-2xl font-sans text-base leading-relaxed text-[#B8BCC2] md:text-lg">
          Fork·Fate spins real nearby restaurants at the exact moment someone decides
          where to eat. Sponsors get pinned placement, coupons on winning reveals, and
          Fate Points that guests redeem at your register.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-4">
          <button
            onClick={() => join("local")}
            data-testid="kit-cta-hero"
            className="inline-flex items-center gap-2 rounded-full bg-[#E01E26] px-7 py-3.5 font-sans text-sm font-bold text-white shadow-lg shadow-[#E01E26]/30 transition-all hover:-translate-y-0.5 hover:bg-[#B3141A]"
          >
            Join as a sponsor <ArrowRight className="h-4 w-4" />
          </button>
          {fates !== null && (
            <span className="inline-flex items-center gap-2 font-sans text-sm text-[#B8BCC2]" data-testid="kit-fates-counter">
              <Dices className="h-4 w-4 text-[#E6B23A]" />
              <strong className="text-white">{fates.toLocaleString()}</strong> fates dealt and counting
            </span>
          )}
        </div>
      </section>

      {/* Videos */}
      <section className="border-t border-white/10 bg-white/[0.03]">
        <div className="mx-auto max-w-5xl px-6 py-14">
          <h2 className="flex items-center gap-2 font-serif text-lg font-medium text-[#E6B23A] md:text-lg">
            <Clapperboard className="h-5 w-5" /> See it in action
          </h2>
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <figure className="overflow-hidden rounded-3xl border border-white/10 bg-[#141414]">
              <video
                src="/promo/forkfate-promo-landscape.mp4"
                poster="/promo/poster-promo-landscape.jpg"
                controls
                playsInline
                preload="metadata"
                className="aspect-video w-full bg-black"
                data-testid="kit-video-promo"
              />
              <figcaption className="flex items-center justify-between gap-3 px-5 py-4">
                <div>
                  <p className="font-serif text-lg font-medium text-white">The full tour</p>
                  <p className="font-sans text-sm text-[#8A8F95]">Realms, rituals and the sponsor pitch · 100 sec</p>
                </div>
                <DownloadBtn path="/promo/forkfate-promo-landscape.mp4" filename="forkfate-promo-landscape.mp4" testId="kit-download-promo" />
              </figcaption>
            </figure>
            <figure className="overflow-hidden rounded-3xl border border-white/10 bg-[#141414]">
              <video
                src="/promo/forkfate-sizzle-16x9.mp4"
                poster="/promo/poster-sizzle-16x9.jpg"
                controls
                playsInline
                preload="metadata"
                className="aspect-video w-full bg-black"
                data-testid="kit-video-sizzle"
              />
              <figcaption className="flex items-center justify-between gap-3 px-5 py-4">
                <div>
                  <p className="font-serif text-lg font-medium text-white">The sizzle</p>
                  <p className="font-sans text-sm text-[#8A8F95]">The whole pitch in 23 seconds</p>
                </div>
                <DownloadBtn path="/promo/forkfate-sizzle-16x9.mp4" filename="forkfate-sizzle-16x9.mp4" testId="kit-download-sizzle" />
              </figcaption>
            </figure>
          </div>
          <p className="mt-5 font-sans text-sm text-[#8A8F95]">
            Need the vertical cut for social?{" "}
            <button
              type="button"
              onClick={() => saveVideo("/promo/forkfate-sizzle-9x16.mp4", "forkfate-sizzle-9x16.mp4")}
              disabled={saving === "forkfate-sizzle-9x16.mp4"}
              data-testid="kit-vertical-download"
              className="font-bold text-[#E6B23A] underline underline-offset-2 hover:text-white disabled:opacity-60"
            >
              {saving === "forkfate-sizzle-9x16.mp4" ? "Saving…" : "Grab the 9:16 sizzle"}
            </button>
          </p>
        </div>
      </section>

      {/* Why sponsor */}
      <section className="mx-auto max-w-5xl px-6 py-14">
        <h2 className="font-serif text-lg font-medium text-[#E6B23A] md:text-lg">Why spots sponsor Fork·Fate</h2>
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {BENEFITS.map(({ Icon, title, body }, i) => (
            <div key={title} className="rounded-3xl border border-white/10 bg-[#141414] p-6" data-testid={`kit-benefit-${i + 1}`}>
              <span className="grid h-11 w-11 place-items-center rounded-full bg-[#E01E26]/15">
                <Icon className="h-5 w-5 text-[#E01E26]" />
              </span>
              <h3 className="mt-4 font-serif text-xl font-medium text-white">{title}</h3>
              <p className="mt-2 font-sans text-sm leading-relaxed text-[#B8BCC2]">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="border-t border-white/10 bg-white/[0.03]">
        <div className="mx-auto max-w-5xl px-6 py-14">
          <h2 className="font-serif text-lg font-medium text-[#E6B23A] md:text-lg">Pick your tier — join in two taps</h2>
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            {/* Local */}
            <div className="flex flex-col rounded-3xl border border-[#E01E26]/40 bg-gradient-to-b from-[#1a0d0d] to-[#141414] p-8" data-testid="kit-pricing-local">
              <p className="flex items-center gap-2 font-sans text-xs font-bold uppercase tracking-widest text-[#FF6B70]">
                <Store className="h-3.5 w-3.5" /> Local spot
              </p>
              <p className="mt-3 font-serif text-5xl font-semibold">
                $19<span className="text-xl text-[#8A8F95]">/mo</span>
                <span className="ml-2 align-middle font-sans text-base text-[#8A8F95] line-through">$29</span>
              </p>
              <p className="mt-1 font-sans text-sm text-[#B8BCC2]">
                <strong className="text-[#FF6B70]">First month FREE</strong> · or <strong className="text-white">$190/yr</strong> — 2 months free
              </p>
              <ul className="mt-6 flex-1 space-y-3">
                {LOCAL_PERKS.map((p) => (
                  <li key={p} className="flex items-start gap-3 font-sans text-sm text-[#D6D9DD]">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#1DA35A]" /> {p}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => join("local")}
                data-testid="kit-join-local"
                className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#E01E26] px-6 py-3.5 font-sans text-sm font-bold text-white transition-colors hover:bg-[#B3141A]"
              >
                <Sparkles className="h-4 w-4" /> Join as a local spot
              </button>
            </div>
            {/* Franchise */}
            <div className="flex flex-col rounded-3xl border border-[#E6B23A]/40 bg-gradient-to-b from-[#1a1408] to-[#141414] p-8" data-testid="kit-pricing-chain">
              <p className="flex items-center gap-2 font-sans text-xs font-bold uppercase tracking-widest text-[#E6B23A]">
                <Ticket className="h-3.5 w-3.5" /> Franchise / chain
              </p>
              <p className="mt-3 font-serif text-5xl font-semibold">
                $99<span className="text-xl text-[#8A8F95]">/mo</span>
              </p>
              <p className="mt-1 font-sans text-sm text-[#B8BCC2]">
                or <strong className="text-white">$990/yr</strong> — 2 months free
              </p>
              <ul className="mt-6 flex-1 space-y-3">
                {CHAIN_PERKS.map((p) => (
                  <li key={p} className="flex items-start gap-3 font-sans text-sm text-[#D6D9DD]">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#1DA35A]" /> {p}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => join("chain_coupon_only")}
                data-testid="kit-join-chain"
                className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#E6B23A] px-6 py-3.5 font-sans text-sm font-bold text-black transition-colors hover:bg-[#C99A2C]"
              >
                <Sparkles className="h-4 w-4" /> Join as a franchise
              </button>
              <Link
                to="/sponsor/chains"
                data-testid="kit-chain-learn-more"
                className="mt-3 text-center font-sans text-xs font-bold text-[#E6B23A] underline underline-offset-2 hover:text-white"
              >
                See how chain coupons work →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer note */}
      <footer className="border-t border-white/10">
        <div className="mx-auto max-w-5xl px-6 py-10 text-center font-sans text-sm text-[#8A8F95]">
          Questions, pilots or a custom flight of markets?{" "}
          <a href={`mailto:${EMAIL}?subject=Fork%C2%B7Fate%20Sponsorship`} className="font-bold text-[#E6B23A] underline underline-offset-2 hover:text-white" data-testid="kit-footer-email">
            Email us
          </a>{" "}
          — we answer fast.
        </div>
      </footer>

      <BecomeSponsorDialog key={dlgTier} tier={dlgTier} open={open} onOpenChange={setOpen} hideTrigger />
    </div>
  );
}
