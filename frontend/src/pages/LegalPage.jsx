import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Skull } from "lucide-react";

const CONTACT = "stevelammerts@gmail.com";
const EFFECTIVE = "June 10, 2026";

const TERMS = [
  {
    h: "1. Acceptance of Terms",
    p: [
      "By accessing or using Fork\u00b7Fate (the \u201cService\u201d), you agree to be bound by these Terms of Service. If you do not agree, please do not use the Service.",
    ],
  },
  {
    h: "2. What Fork\u00b7Fate Is",
    p: [
      "Fork\u00b7Fate is an entertainment tool that randomly suggests nearby restaurants, bars, dessert shops and drink spots based on the filters you choose. Suggestions are for informational and entertainment purposes only.",
      "The Service does not endorse, operate, or guarantee any establishment it suggests. Our algorithm merely queries available options \u2014 the decision to visit any suggested establishment is entirely yours.",
    ],
  },
  {
    h: "3. No Liability for Establishments",
    p: [
      "Fork\u00b7Fate is not responsible or liable for any experience, injury, loss, illness, dispute, cost, or trouble you encounter in, at, or with any establishment suggested by the Service. You assume all risk associated with visiting any location.",
      "Business information (hours, pricing, ratings, availability) is provided by third parties such as Google and may be inaccurate or out of date. Always confirm details directly with the establishment.",
    ],
  },
  {
    h: "4. Sponsorships & Billing",
    p: [
      "Businesses may purchase sponsored placement for $29/month, with the first month free. Subscriptions are billed automatically through PayPal until cancelled.",
      "You may cancel a sponsorship at any time through your PayPal account; cancellation stops future billing but does not refund the current period. Sponsored placement is clearly labeled as \u201cSponsored.\u201d",
    ],
  },
  {
    h: "5. User Submissions",
    p: [
      "You may submit local spots or report issues. Submissions are reviewed before appearing and may be edited or removed at our discretion. Do not submit false, unlawful, or infringing content.",
    ],
  },
  {
    h: "6. Intellectual Property",
    p: [
      "All content, design, code, artwork, and branding of Fork\u00b7Fate are \u00a9 Fork\u00b7Fate and protected by copyright and other laws. \u201cFork\u00b7Fate\u201d and its logo are trademarks of their owner. You may not copy, reproduce, or reuse them without permission.",
    ],
  },
  {
    h: "7. Disclaimer of Warranties",
    p: [
      "The Service is provided \u201cas is\u201d and \u201cas available\u201d without warranties of any kind, express or implied, including fitness for a particular purpose, accuracy, or availability.",
    ],
  },
  {
    h: "8. Limitation of Liability",
    p: [
      "To the fullest extent permitted by law, Fork\u00b7Fate and its owners shall not be liable for any indirect, incidental, or consequential damages arising from your use of the Service.",
    ],
  },
  {
    h: "9. Changes to These Terms",
    p: [
      "We may update these Terms from time to time. Continued use of the Service after changes take effect constitutes acceptance of the revised Terms.",
    ],
  },
  {
    h: "10. Contact",
    p: [`Questions about these Terms? Email us at ${CONTACT}.`],
  },
];

const PRIVACY = [
  {
    h: "1. Overview",
    p: [
      "Fork\u00b7Fate is built to be privacy-friendly. There are no accounts, no logins, and no sign-up required to use the Service.",
    ],
  },
  {
    h: "2. Location & ZIP Code",
    p: [
      "If you enter a ZIP code or tap \u201cUse my location,\u201d we send that location to Google Places to find nearby spots. We do not store your precise device location or link it to your identity.",
    ],
  },
  {
    h: "3. Your Selfie (Crawl Badge)",
    p: [
      "If you add a selfie to a completion badge, the image is composited into the badge entirely on your device. Your photo is never uploaded to or stored on our servers.",
    ],
  },
  {
    h: "4. Information We Do Collect",
    p: [
      "\u2022 Aggregate, non-personal counters (e.g. total \u201cfates dealt\u201d and \u201ccrawls survived\u201d).",
      "\u2022 Your IP address, used transiently for abuse and rate-limit protection.",
      "\u2022 Community submissions and reports you choose to send.",
      "\u2022 If you become a sponsor: your business details and contact email, plus a subscription ID. Payment card data is handled entirely by PayPal \u2014 we never see or store it.",
      "\u2022 If you join the Android beta: the email address you submit, used solely to add you as a tester on Google Play. You can ask us to remove it at any time.",
    ],
  },
  {
    h: "5. Local Storage",
    p: [
      "We store small preferences in your browser (such as sound on/off, your daily streak, and app version) to improve your experience. These stay on your device.",
    ],
  },
  {
    h: "6. Third-Party Services",
    p: [
      "We use Google Places (business data) and PayPal (sponsor billing). Your interactions with those services are governed by their respective privacy policies.",
    ],
  },
  {
    h: "7. Children",
    p: [
      "Fork\u00b7Fate is not directed to children under 13 and does not knowingly collect information from them.",
    ],
  },
  {
    h: "8. Changes",
    p: [
      "We may update this Privacy Policy. Material changes will be reflected by updating the effective date above.",
    ],
  },
  {
    h: "9. Contact",
    p: [`Privacy questions? Email us at ${CONTACT}.`],
  },
];

export default function LegalPage({ type = "terms" }) {
  useEffect(() => { window.scrollTo(0, 0); }, []);
  const isTerms = type === "terms";
  const title = isTerms ? "Terms of Service" : "Privacy Policy";
  const sections = isTerms ? TERMS : PRIVACY;

  return (
    <div className="min-h-screen bg-[#0E0E0E] text-white" data-testid={`legal-page-${type}`}>
      <div className="mx-auto max-w-3xl px-6 py-12 md:py-16">
        <Link
          to="/"
          data-testid="legal-back-link"
          className="inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-white/10"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Fork·Fate
        </Link>

        <div className="mt-8 flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-full bg-[#E01E26]/15 ring-1 ring-[#E01E26]/40">
            <Skull className="h-6 w-6 text-[#E01E26]" />
          </span>
          <div>
            <h1 className="font-serif text-3xl font-semibold md:text-4xl">{title}</h1>
            <p className="mt-1 text-xs text-[#8A8F95]">Effective {EFFECTIVE}</p>
          </div>
        </div>

        <div className="mt-8 space-y-7">
          {sections.map((s) => (
            <section key={s.h} className="space-y-2">
              <h2 className="font-serif text-lg font-semibold text-white">{s.h}</h2>
              {s.p.map((para, i) => (
                <p key={i} className="text-sm leading-relaxed text-[#B8BCC2]">{para}</p>
              ))}
            </section>
          ))}
        </div>

        <p className="mt-12 border-t border-white/10 pt-6 text-xs text-[#6B7075]">
          © {new Date().getFullYear()} Fork·Fate. All rights reserved.
        </p>
      </div>
    </div>
  );
}
