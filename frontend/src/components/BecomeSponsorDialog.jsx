import React, { useState } from "react";
import { Megaphone, ExternalLink, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "./ui/dialog";

const PAYPAL_ME = "https://www.paypal.com/paypalme/stevelammerts/29";
const EMAIL = "stevelammerts@gmail.com";
const MAILTO = `mailto:${EMAIL}?subject=Fork%C2%B7Fate%20Sponsorship%20%E2%80%94%20I%20paid&body=Hi%2C%20I%27ve%20paid%20for%20a%20Fork%C2%B7Fate%20sponsorship.%0A%0ABusiness%20name%3A%0ACategory%20(food%2Fdrinks%2Fbars%2Fdesserts)%3A%0ACuisine%2Ftype%3A%0AAddress%3A%0AWebsite%2FInstagram%3A%0A`;

export default function BecomeSponsorDialog() {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          data-testid="become-sponsor-button"
          className="inline-flex items-center gap-2 rounded-full bg-[#E01E26] px-5 py-2.5 font-sans text-sm font-bold text-white shadow-lg shadow-[#E01E26]/30 transition-colors hover:bg-[#B3141A]"
        >
          <Megaphone className="h-4 w-4" /> Become a sponsor
        </button>
      </DialogTrigger>
      <DialogContent className="rounded-3xl border-[#E2E4E7] bg-white sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl text-[#0E0E0E]">Sponsor your spot on Fork·Fate</DialogTitle>
          <DialogDescription className="text-[#6B7075]">
            Get pinned to the top of every matching shuffle with a Sponsored badge.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-1">
          {/* Price */}
          <div className="rounded-2xl border border-[#E2E4E7] bg-[#F5F6F7] p-4 text-center">
            <p className="font-serif text-3xl font-semibold text-[#0E0E0E]">$29<span className="text-lg text-[#6B7075]">/month</span></p>
            <p className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-[#E01E26]/10 px-3 py-1 font-sans text-xs font-bold text-[#E01E26]">
              <Check className="h-3.5 w-3.5" /> First month FREE
            </p>
          </div>

          {/* Pay button */}
          <a
            href={PAYPAL_ME}
            target="_blank"
            rel="noopener noreferrer"
            data-testid="paypal-pay-link"
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#0070BA] px-5 py-3 font-sans text-sm font-bold text-white transition-colors hover:bg-[#005a99]"
          >
            Pay $29 with PayPal <ExternalLink className="h-4 w-4" />
          </a>

          {/* QR */}
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-[#E2E4E7] p-4">
            <p className="font-sans text-xs font-bold uppercase tracking-[0.15em] text-[#6B7075]">Or scan to pay</p>
            <img src="/paypal-qr.jpg" alt="Scan to pay steven lammerts on PayPal" data-testid="paypal-qr" className="h-32 w-auto rounded-xl" />
            <p className="font-sans text-xs text-[#6B7075]">PayPal: @stevelammerts</p>
          </div>

          {/* After payment */}
          <div className="rounded-2xl bg-[#0E0E0E] p-4 text-white">
            <p className="font-sans text-sm font-bold">After you pay</p>
            <p className="mt-1 font-sans text-xs text-[#B8BCC2]">
              Email your business details and we'll get your spot listed within 24 hours — click{" "}
              <a
                href={MAILTO}
                data-testid="sponsor-email-link"
                className="font-bold text-[#E01E26] underline underline-offset-4 transition-colors hover:text-white"
              >
                here
              </a>.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
