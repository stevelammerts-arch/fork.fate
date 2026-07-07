import React from "react";
import { toast } from "sonner";
import { Facebook, Twitter, Instagram, MessageCircle, Link2 } from "lucide-react";

export default function SocialShare({ card }) {
  const url = window.location.origin;
  const text = card
    ? `Fate picked ${card.name} (${card.cuisine} · ${card.price})${card.distance ? ` — ${card.distance} mi away` : ""} on Fork·Fate! Shuffle your own fate:`
    : `Let fate pick your next meal, drink or dessert — spin the deck on Fork·Fate!`;
  const full = `${text} ${url}`;

  const openShare = (shareUrl) =>
    window.open(shareUrl, "_blank", "noopener,noreferrer,width=600,height=520");

  const copyFor = async (platform) => {
    try {
      await navigator.clipboard.writeText(full);
      toast.success(`Copied! Paste it into ${platform}.`);
    } catch {
      toast.error("Couldn't copy — long-press to copy manually");
    }
  };

  const links = [
    {
      key: "facebook",
      label: "Facebook",
      Icon: Facebook,
      color: "#1877F2",
      onClick: () => openShare(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(text)}`),
    },
    {
      key: "x",
      label: "X",
      Icon: Twitter,
      color: "#0E0E0E",
      onClick: () => openShare(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`),
    },
    {
      key: "whatsapp",
      label: "WhatsApp",
      Icon: MessageCircle,
      color: "#25D366",
      onClick: () => openShare(`https://wa.me/?text=${encodeURIComponent(full)}`),
    },
    {
      key: "instagram",
      label: "Instagram",
      Icon: Instagram,
      color: "#E4405F",
      onClick: () => copyFor("Instagram"),
    },
    {
      key: "copy",
      label: "Copy link",
      Icon: Link2,
      color: "#6B7075",
      onClick: () => copyFor("anywhere"),
    },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2" data-testid="social-share">
      <span className="font-sans text-xs font-bold uppercase tracking-[0.15em] text-[#6B7075]">Share</span>
      {links.map(({ key, label, Icon, color, onClick }) => (
        <button
          key={key}
          onClick={onClick}
          data-testid={`share-${key}`}
          title={`Share on ${label}`}
          aria-label={`Share on ${label}`}
          className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-[#E2E4E7] bg-white transition-transform hover:scale-110 hover:border-transparent hover:text-white"
          style={{ "--hover": color }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = color)}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#ffffff")}
        >
          <Icon className="h-2.5 w-2.5" style={{ color: "inherit" }} />
        </button>
      ))}
    </div>
  );
}
