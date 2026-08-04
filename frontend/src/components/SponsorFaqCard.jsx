import { useState } from "react";
import { ChevronDown } from "lucide-react";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "./ui/accordion";
import { useLang } from "../i18n/i18n";

const EMAIL = "steve@fork-fate.com";

const FAQS = [
  {
    q: "What does a local sponsorship include?",
    a: "Your business gets pinned to the top of every matching shuffle with a Sponsored badge, your photo and a link — $19/month (first month free) or $190/year. Founder perk: add your own coupon offer at no extra cost.",
  },
  {
    q: "How does the free local coupon work?",
    a: "While we're in our founder period, local sponsors can attach a coupon for free. It shows tap-to-reveal on your card when you win a spin, and also rides beside other matching reveals as a bonus offer.",
  },
  {
    q: "What is the chain coupon tier?",
    a: "Built for national and regional chains: your coupon appears in a dedicated strip beside the winning spot on every matching spin — you never take a slot in the local deck. $99/month or $990/year.",
  },
  {
    q: "How does billing work?",
    a: "Secure PayPal subscription — your spot goes live automatically once payment is confirmed, and you can cancel anytime from PayPal.",
  },
  {
    q: "Can I update my listing or coupon later?",
    a: "Yes — email us and we'll update your photo, offer or details, usually within a day.",
  },
  {
    q: "Where will my business appear?",
    a: "Local sponsors appear in their category's shuffle near their location. Chain coupons ride along on matching reveals everywhere Fork·Fate spins.",
  },
];

/**
 * Collapsible Sponsor FAQ card — same pattern as the main "Frequently asked
 * questions" card: serif title, More/Less toggle, inline accordion.
 */
export default function SponsorFaqCard() {
  const { t } = useLang();
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-6 rounded-3xl border border-[#E2E4E7] bg-white/95 p-6 shadow-sm backdrop-blur-sm md:p-8" data-testid="sponsor-faq-card">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        data-testid="sponsor-faq-toggle"
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 text-left"
      >
        <h2 className="font-serif text-2xl font-medium tracking-tight text-[#0E0E0E] sm:text-3xl">
          {t("Sponsor FAQ")}
        </h2>
        <span className="flex shrink-0 items-center gap-1 font-sans text-sm font-bold text-[#E01E26]">
          {open ? t("Less") : t("More")}
          <ChevronDown className={`h-5 w-5 transition-transform duration-300 ${open ? "rotate-180" : ""}`} />
        </span>
      </button>
      {open && (
        <>
          <Accordion type="single" collapsible className="mt-4 w-full animate-in fade-in slide-in-from-top-2 duration-300" data-testid="sponsor-faq-section">
            {FAQS.map((f, i) => (
              <AccordionItem key={f.q} value={`sfaq-${i}`} className="border-[#E2E4E7]" data-testid={`sponsor-faq-q-${i}`}>
                <AccordionTrigger className="text-left font-serif text-base text-[#0E0E0E] hover:no-underline">
                  {t(f.q)}
                </AccordionTrigger>
                <AccordionContent className="font-sans text-sm text-[#6B7075]">
                  {t(f.a)}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
          <p className="mt-4 font-sans text-xs text-[#8A8F95]">
            {t("More questions?")}{" "}
            <a href={`mailto:${EMAIL}?subject=Fork%C2%B7Fate%20Sponsorship`} data-testid="sponsor-faq-email" className="font-bold text-[#E01E26] underline underline-offset-2 hover:text-[#0E0E0E]">
              {t("Email us")}
            </a>
          </p>
        </>
      )}
    </div>
  );
}
