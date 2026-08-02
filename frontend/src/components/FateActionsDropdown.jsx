import { toast } from "sonner";
import {
  MoreHorizontal, ChevronDown, MapPin, Star, Share2, ImageDown, ExternalLink,
  Facebook, Twitter, Instagram, MessageCircle, Link2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "./ui/dropdown-menu";
import { useLang } from "../i18n/i18n";

// Reveal-card-only "More" menu. Collapses what used to be four separate pills
// (Check in / Reviews & ratings / Share your fate / Share as image) plus the
// social-share strip into a single dropdown, matching the OrderDropdown pattern.
// The Order dropdown stays a separate, primary action.
export function FateActionsDropdown({
  card,
  onShareText,
  onShareImage,
  className = "",
  triggerTestId = "fate-actions-trigger",
}) {
  const { t } = useLang();
  if (!card) return null;

  const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
  // Route social shares through /api/share which serves dynamic OG tags so
  // Facebook / iMessage / WhatsApp previews show the winning restaurant
  // (name, image, cuisine, distance) instead of the static Fork·Fate logo.
  const url = `${API}/share?${new URLSearchParams({
    id: card.id || "",
    name: card.name || "",
    cuisine: card.cuisine || "",
    price: card.price || "",
    distance: card.distance != null ? String(card.distance) : "",
    image: card.image || "",
  }).toString()}`;
  const shareText =
    `\u2620 The reaper has spoken: ${card.name} (${card.cuisine} \u00b7 ${card.price})` +
    `${card.distance ? ` — ${card.distance} mi away` : ""}! Deal your own fate on Fork\u00b7Fate:`;
  const full = `${shareText} ${url}`;

  const openWindow = (shareUrl) =>
    window.open(shareUrl, "_blank", "noopener,noreferrer,width=600,height=520");

  const copyFor = async (platform) => {
    try {
      await navigator.clipboard.writeText(full);
      toast.success(`Copied! Paste it into ${platform}.`);
    } catch {
      toast.error("Couldn't copy — long-press to copy manually");
    }
  };

  // "I'm here now" post that tags the venue and mentions Fork·Fate.
  const checkIn = async () => {
    const where = `${card.name}${card.distance ? ` (${card.distance} mi away)` : ""}`;
    const text =
      `\uD83D\uDCCD Checking in at ${where}! ` +
      `\u2620\uFE0F Fate sent me here \u2014 deal your own on Fork\u00B7Fate: ${url}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: `Checked in at ${card.name}`, text, url });
      } else {
        await navigator.clipboard.writeText(text);
        toast.success("Check-in copied \u2014 paste it into your story or post!");
      }
    } catch (e) {
      // share sheet cancelled — no-op
    }
  };

  const primary = [
    { key: "check-in", label: t("Check in here"), Icon: MapPin, onSelect: checkIn },
    card.google_url && {
      key: "reviews",
      label: t("Reviews & ratings"),
      Icon: Star,
      external: true,
      onSelect: () => window.open(card.google_url, "_blank", "noopener,noreferrer"),
    },
    { key: "share-text", label: t("Share as text"), Icon: Share2, onSelect: onShareText },
    { key: "share-image", label: t("Share as image"), Icon: ImageDown, onSelect: onShareImage },
  ].filter(Boolean);

  const socials = [
    {
      key: "facebook",
      label: "Facebook",
      Icon: Facebook,
      onSelect: () => openWindow(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(shareText)}`),
    },
    {
      key: "x",
      label: "X",
      Icon: Twitter,
      onSelect: () => openWindow(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(url)}`),
    },
    {
      key: "whatsapp",
      label: "WhatsApp",
      Icon: MessageCircle,
      onSelect: () => openWindow(`https://wa.me/?text=${encodeURIComponent(full)}`),
    },
    { key: "instagram", label: "Instagram", Icon: Instagram, onSelect: () => copyFor("Instagram") },
    { key: "copy", label: t("Copy link"), Icon: Link2, onSelect: () => copyFor("anywhere") },
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          data-testid={triggerTestId}
          onClick={(e) => e.stopPropagation()}
          className={className || "inline-flex items-center gap-2 rounded-full bg-[#0E0E0E] px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-[#2A2A2A]"}
        >
          <Share2 className="h-4 w-4" /> {t("Share your fate")}
          <ChevronDown className="h-3.5 w-3.5" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56" data-testid="fate-actions-content">
        {primary.map(({ key, label, Icon, onSelect, external }) => (
          <DropdownMenuItem
            key={key}
            data-testid={`fate-action-${key}`}
            onSelect={(e) => { e.preventDefault(); onSelect?.(); }}
            className="flex cursor-pointer items-center gap-2 font-semibold"
          >
            <Icon className="h-4 w-4" />
            {label}
            {external && <ExternalLink className="ml-auto h-3.5 w-3.5 opacity-60" />}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="font-sans text-[11px] font-bold uppercase tracking-[0.15em] text-[#6B7075]">
          {t("Share")}
        </DropdownMenuLabel>
        {socials.map(({ key, label, Icon, onSelect }) => (
          <DropdownMenuItem
            key={key}
            data-testid={`fate-action-share-${key}`}
            onSelect={(e) => { e.preventDefault(); onSelect(); }}
            className="flex cursor-pointer items-center gap-2 font-semibold"
          >
            <Icon className="h-4 w-4" />
            {label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default FateActionsDropdown;
