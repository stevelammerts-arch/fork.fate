import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import {
  Ticket, Dices, MapPin, Sparkles, ArrowRight, ArrowLeft, Check, Store, Mail,
} from "lucide-react";
import BecomeSponsorDialog from "../components/BecomeSponsorDialog";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const EMAIL = "steve@fork-fate.com";

const STEPS = [
  {
    Icon: Dices,
    title: "A hungry customer spins",
    body: "Fork·Fate deals a random nearby spot — thousands of \"fates\" every month, right at the moment people decide where to eat.",
  },
  {
    Icon: Ticket,
    title: "Your coupon rides along",
    body: "Beside every matching reveal, your offer appears as the bonus coupon strip — a tap-to-copy code with your brand front and center.",
  },
  {
    Icon: MapPin,
    title: "They redeem at your nearest location",
    body: "No slot competition, no auction. Your national offer shows wherever Fork·Fate spins in your category.",
  },
];

const PERKS = [
  "Bonus coupon placement on matching reveal cards",
  "Tap-to-copy code with redemption analytics",
  "National reach — every city Fork·Fate spins in",
  "Never buried in the deck: dedicated coupon strip",
  "Ready-to-post social + print marketing cards included",
  "Cancel anytime, self-serve via PayPal",
];

export default function SponsorChains() {
  const [open, setOpen] = useState(false);
  const [fates, setFates] = useState(null);

  useEffect(() => {
    axios.get(`${API}/stats/fates`).then(({ data }) => setFates(data.count)).catch(() => {});
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-[#0E0E0E] text-white" data-testid="chain-pitch-page">
      {/* Header */}
      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-6">
        <Link to="/" data-testid="chain-back-home" className="inline-flex items-center gap-2 font-sans text-sm font-bold text-[#B8BCC2] transition-colors hover:text-white">
          <ArrowLeft className="h-4 w-4" /> Fork·Fate
        </Link>
        <a
          href={`mailto:${EMAIL}?subject=Fork%C2%B7Fate%20Chain%20Sponsorship`}
          data-testid="chain-email-link"
          className="inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 font-sans text-xs font-bold text-white transition-colors hover:bg-white/10"
        >
          <Mail className="h-3.5 w-3.5" /> Talk to us
        </a>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-5xl px-6 pb-16 pt-10">
        <p className="inline-flex items-center gap-2 rounded-full border border-[#E6B23A]/40 bg-[#E6B23A]/10 px-4 py-1.5 font-sans text-xs font-bold uppercase tracking-widest text-[#E6B23A]">
          <Store className="h-3.5 w-3.5" /> For national &amp; regional chains
        </p>
        <h1 className="mt-6 max-w-3xl font-serif text-4xl font-medium leading-tight sm:text-5xl lg:text-6xl">
          Your coupon, on every plate <span className="text-[#E01E26]">fate deals</span>.
        </h1>
        <p className="mt-5 max-w-2xl font-sans text-base leading-relaxed text-[#B8BCC2] md:text-lg">
          Fork·Fate's roulette stays local-first — chains never take a slot in the deck.
          Instead, your offer gets its own dedicated coupon strip beside the winner on
          every matching spin. Users get a bonus deal; you get the moment of decision.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-4">
          <button
            onClick={() => setOpen(true)}
            data-testid="chain-cta-hero"
            className="inline-flex items-center gap-2 rounded-full bg-[#E01E26] px-7 py-3.5 font-sans text-sm font-bold text-white shadow-lg shadow-[#E01E26]/30 transition-all hover:-translate-y-0.5 hover:bg-[#B3141A]"
          >
            Start your chain sponsorship <ArrowRight className="h-4 w-4" />
          </button>
          {fates !== null && (
            <span className="inline-flex items-center gap-2 font-sans text-sm text-[#B8BCC2]" data-testid="chain-fates-counter">
              <Dices className="h-4 w-4 text-[#E6B23A]" />
              <strong className="text-white">{fates.toLocaleString()}</strong> fates dealt and counting
            </span>
          )}
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-white/10 bg-white/[0.03]">
        <div className="mx-auto max-w-5xl px-6 py-16">
          <h2 className="font-serif text-lg font-medium text-[#E6B23A] md:text-lg">How chain placement works</h2>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {STEPS.map(({ Icon, title, body }, i) => (
              <div key={title} className="rounded-3xl border border-white/10 bg-[#141414] p-6" data-testid={`chain-step-${i + 1}`}>
                <span className="grid h-11 w-11 place-items-center rounded-full bg-[#E01E26]/15">
                  <Icon className="h-5 w-5 text-[#E01E26]" />
                </span>
                <h3 className="mt-4 font-serif text-xl font-medium text-white">{title}</h3>
                <p className="mt-2 font-sans text-sm leading-relaxed text-[#B8BCC2]">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing + perks */}
      <section className="mx-auto max-w-5xl px-6 py-16">
        <div className="grid gap-8 md:grid-cols-2 md:items-center">
          <div>
            <h2 className="font-serif text-lg font-medium text-[#E6B23A] md:text-lg">One flat price. No auctions.</h2>
            <ul className="mt-6 space-y-3">
              {PERKS.map((p) => (
                <li key={p} className="flex items-start gap-3 font-sans text-sm text-[#D6D9DD]">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#1DA35A]" /> {p}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-3xl border border-[#E6B23A]/40 bg-gradient-to-b from-[#1a1408] to-[#141414] p-8" data-testid="chain-pricing-card">
            <p className="font-sans text-xs font-bold uppercase tracking-widest text-[#E6B23A]">Chain sponsorship</p>
            <p className="mt-3 font-serif text-5xl font-semibold">
              $99<span className="text-xl text-[#8A8F95]">/mo</span>
            </p>
            <p className="mt-1 font-sans text-sm text-[#B8BCC2]">
              or <strong className="text-white">$990/yr</strong> — 2 months free
            </p>
            <button
              onClick={() => setOpen(true)}
              data-testid="chain-cta-pricing"
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#E01E26] px-6 py-3.5 font-sans text-sm font-bold text-white transition-colors hover:bg-[#B3141A]"
            >
              <Sparkles className="h-4 w-4" /> Launch your coupon
            </button>
            <p className="mt-3 text-center font-sans text-xs text-[#8A8F95]">
              Self-serve PayPal checkout · live within minutes · cancel anytime
            </p>
          </div>
        </div>
      </section>

      {/* Footer note */}
      <footer className="border-t border-white/10">
        <div className="mx-auto max-w-5xl px-6 py-10 text-center font-sans text-sm text-[#8A8F95]">
          Prefer a custom flight of markets or a pilot?{" "}
          <a href={`mailto:${EMAIL}?subject=Fork%C2%B7Fate%20Chain%20Pilot`} className="font-bold text-[#E6B23A] underline underline-offset-2 hover:text-white" data-testid="chain-footer-email">
            Email us
          </a>{" "}
          — we answer fast.
        </div>
      </footer>

      <BecomeSponsorDialog tier="chain_coupon_only" open={open} onOpenChange={setOpen} hideTrigger />
    </div>
  );
}
