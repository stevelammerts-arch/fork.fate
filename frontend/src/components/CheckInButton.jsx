import React from "react";
import { toast } from "sonner";
import { MapPin } from "lucide-react";

// Social "check-in" for a fated spot: an "I'm here now" post that tags the
// venue and mentions the Fork·Fate page. Uses the native share sheet (so the
// user can post to Instagram/Facebook/X/etc.) with a clipboard fallback.
export default function CheckInButton({ card }) {
  if (!card) return null;
  const url = window.location.origin;
  const where = `${card.name}${card.distance ? ` (${card.distance} mi away)` : ""}`;
  const text =
    `\uD83D\uDCCD Checking in at ${where}! ` +
    `\u2620\uFE0F Fate sent me here \u2014 deal your own on Fork\u00B7Fate: ${url}`;

  const checkIn = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: `Checked in at ${card.name}`, text, url });
      } else {
        await navigator.clipboard.writeText(text);
        toast.success("Check-in copied \u2014 paste it into your story or post!");
      }
    } catch (e) {
      // user cancelled the share sheet — no-op
    }
  };

  return (
    <button
      onClick={checkIn}
      data-testid="check-in-button"
      className="inline-flex items-center gap-2 rounded-full bg-[#E01E26] px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-[#B3141A]"
    >
      <MapPin className="h-4 w-4" /> Check in here
    </button>
  );
}
