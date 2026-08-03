import React from "react";
import { HelpCircle } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger,
} from "./ui/dialog";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "./ui/accordion";
import { useLang } from "../i18n/i18n";

const EMAIL = "steve@fork-fate.com";

const FAQS = [
  {
    q: "What does a local sponsorship include?",
    a: "Your business gets pinned to the top of every matching shuffle with a Sponsored badge, your photo and a link — $19/month (first month free) or $190/year.",
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

/** Footer pill that opens a small FAQ covering both sponsorship tiers. */
export default function SponsorFaqDialog({ light }) {
  const { t } = useLang();
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          data-testid="sponsor-faq-button"
          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 font-sans text-[11px] font-bold transition-colors ${light ? "border-[#D9CDB6] text-[#6E6355] hover:bg-white/70 hover:text-[#2A2118]" : "border-white/20 text-[#B8BCC2] hover:bg-white/10 hover:text-white"}`}
        >
          <HelpCircle className="h-3.5 w-3.5" /> {t("Sponsor FAQ")}
        </button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto rounded-3xl border-[#E2E4E7] bg-white sm:max-w-md" data-testid="sponsor-faq-dialog" data-ff-dialog>
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl text-[#0E0E0E]">{t("Sponsorship FAQ")}</DialogTitle>
          <DialogDescription className="text-[#6B7075]">
            {t("Everything about featuring your business on Fork·Fate.")}
          </DialogDescription>
        </DialogHeader>
        <Accordion type="single" collapsible className="w-full">
          {FAQS.map((f, i) => (
            <AccordionItem key={f.q} value={`faq-${i}`}>
              <AccordionTrigger data-testid={`sponsor-faq-q-${i}`} className="text-left font-sans text-sm font-bold text-[#0E0E0E]">
                {t(f.q)}
              </AccordionTrigger>
              <AccordionContent className="font-sans text-sm leading-relaxed text-[#6B7075]">
                {t(f.a)}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
        <p className="text-center font-sans text-xs text-[#8A8F95]">
          {t("More questions?")}{" "}
          <a href={`mailto:${EMAIL}?subject=Fork%C2%B7Fate%20Sponsorship`} data-testid="sponsor-faq-email" className="font-bold text-[#E01E26] underline underline-offset-2 hover:text-[#0E0E0E]">
            {t("Email us")}
          </a>
        </p>
      </DialogContent>
    </Dialog>
  );
}
