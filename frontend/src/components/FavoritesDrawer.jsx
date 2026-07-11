import React, { useState } from "react";
import { Heart, Star, MapPin, X, ExternalLink, Dices } from "lucide-react";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger,
} from "./ui/sheet";
import { useTheme } from "../hooks/useTheme";

export default function FavoritesDrawer({ favorites, onRemove, onDeal, groupMode }) {
  const [open, setOpen] = useState(false);
  const { theme } = useTheme();
  const light = !["dark", "cyber", "steam", "tiki"].includes(theme);
  const count = favorites.length;

  const P = light
    ? {
        trigger: "border-[#E4E4E7] text-[#3F3F46] hover:bg-[#F4F4F5]",
        surface: "bg-[#FBF7EF] text-[#2A2118]",
        title: "text-[#2A2118]", muted: "text-[#8A7C68]",
        accent: "text-[#4F6F47]", accentFill: "fill-[#4F6F47] text-[#4F6F47]",
        primaryBtn: "bg-[#A8C99E] text-[#24391F] hover:bg-[#97BC8B]",
        badge: "bg-[#A8C99E] text-[#24391F]",
        item: "border-[#E7DCC7] bg-[#F3EDE1]",
        chipIcon: "text-[#8A7C68] hover:bg-[#EFE7D8] hover:text-[#2A2118]",
        chipIconRemove: "text-[#8A7C68] hover:bg-[#EFE7D8] hover:text-[#4F6F47]",
        emptyCircle: "bg-[#F1EADB] text-[#4F6F47]",
      }
    : {
        trigger: "border-white/25 text-white hover:bg-white/10",
        surface: "bg-[#0E0E0E] text-white",
        title: "text-white", muted: "text-[#8A8F95]",
        accent: "text-[#E01E26]", accentFill: "fill-[#E01E26] text-[#E01E26]",
        primaryBtn: "bg-[#E01E26] text-white hover:bg-[#B3141A]",
        badge: "bg-[#E01E26] text-white",
        item: "border-white/10 bg-white/5",
        chipIcon: "text-[#8A8F95] hover:bg-white/10 hover:text-white",
        chipIconRemove: "text-[#8A8F95] hover:bg-white/10 hover:text-[#E01E26]",
        emptyCircle: "bg-white/5 text-[#E01E26]",
      };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          data-testid="open-favorites-button"
          className={`relative inline-flex items-center gap-1.5 rounded-full border bg-transparent px-3 py-1.5 text-xs font-bold transition-colors sm:gap-2 sm:px-4 sm:py-2.5 sm:text-sm ${P.trigger}`}
        >
          <Heart className={`h-4 w-4 ${count ? P.accentFill : ""}`} />
          <span>Favorites</span>
          {count > 0 && (
            <span
              data-testid="favorites-count-badge"
              className={`grid h-5 min-w-5 place-items-center rounded-full px-1 text-xs font-bold ${P.badge}`}
            >
              {count}
            </span>
          )}
        </button>
      </SheetTrigger>
      <SheetContent side="right" className={`w-full overflow-y-auto sm:max-w-md ${P.surface}`} data-testid="favorites-drawer">
        <SheetHeader>
          <SheetTitle className={`flex items-center gap-2 font-serif text-2xl ${P.title}`}>
            <Heart className={`h-5 w-5 ${P.accentFill}`} /> Saved spots
          </SheetTitle>
          <SheetDescription className={P.muted}>
            Spots you've hearted, saved on this device.
          </SheetDescription>
        </SheetHeader>

        {count === 0 ? (
          <div className="mt-16 grid place-items-center text-center" data-testid="favorites-empty">
            <span className={`grid h-16 w-16 place-items-center rounded-full ${P.emptyCircle}`}>
              <Heart className="h-7 w-7" />
            </span>
            <p className={`mt-4 font-serif text-xl ${P.title}`}>No favorites yet</p>
            <p className={`mt-1 max-w-xs font-sans text-sm ${P.muted}`}>
              Tap the heart on any spot to save it here for next time.
            </p>
          </div>
        ) : (
          <div className="mt-6 space-y-3">
            {onDeal && (
              <button
                onClick={() => { onDeal(); setOpen(false); }}
                data-testid="deal-from-favorites-button"
                className={`mb-2 inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-bold transition-colors ${P.primaryBtn}`}
              >
                <Dices className="h-4 w-4" />
                {groupMode ? "Deal 3 from favorites" : "Deal from my favorites"}
              </button>
            )}
            {favorites.map((r) => (
              <div
                key={`${r.name}-${r.address}`}
                data-testid={`favorite-item-${r.id}`}
                className={`flex items-center gap-3 rounded-2xl border p-2 ${P.item}`}
              >
                <img src={r.image} alt={r.name} className="h-14 w-14 shrink-0 rounded-xl object-cover" />
                <div className="min-w-0 flex-1">
                  <p className={`truncate font-serif text-base font-medium leading-tight ${P.title}`}>{r.name}</p>
                  <p className={`mt-0.5 flex items-center gap-2 font-sans text-xs ${P.muted}`}>
                    <span>{r.cuisine} · {r.price}</span>
                    <span className="flex items-center gap-1">
                      <Star className={`h-3 w-3 ${P.accentFill}`} />
                      {r.rating > 0 ? Number(r.rating).toFixed(1) : "New"}
                    </span>
                    {r.distance != null && (
                      <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {r.distance} mi</span>
                    )}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  {r.google_url && (
                    <a
                      href={r.google_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      data-testid={`favorite-open-${r.id}`}
                      title="View on Google"
                      className={`grid h-8 w-8 place-items-center rounded-full transition-colors ${P.chipIcon}`}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                  <button
                    onClick={() => onRemove(r)}
                    data-testid={`favorite-remove-${r.id}`}
                    title="Remove"
                    className={`grid h-8 w-8 place-items-center rounded-full transition-colors ${P.chipIconRemove}`}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
            <p className={`flex items-center gap-2 pt-2 font-sans text-xs ${P.muted}`}>
              <Dices className={`h-3.5 w-3.5 ${P.accent}`} /> Saved on this device only.
            </p>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
