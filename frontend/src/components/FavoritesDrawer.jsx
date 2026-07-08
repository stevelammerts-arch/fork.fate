import React, { useState } from "react";
import { Heart, Star, MapPin, X, ExternalLink, Dices } from "lucide-react";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger,
} from "./ui/sheet";

export default function FavoritesDrawer({ favorites, onRemove }) {
  const [open, setOpen] = useState(false);
  const count = favorites.length;
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          data-testid="open-favorites-button"
          className="relative inline-flex items-center gap-2 rounded-full border border-white/25 bg-transparent px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-white/10"
        >
          <Heart className={`h-4 w-4 ${count ? "fill-[#E01E26] text-[#E01E26]" : ""}`} />
          <span className="hidden sm:inline">Favorites</span>
          {count > 0 && (
            <span
              data-testid="favorites-count-badge"
              className="grid h-5 min-w-5 place-items-center rounded-full bg-[#E01E26] px-1 text-xs font-bold text-white"
            >
              {count}
            </span>
          )}
        </button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full overflow-y-auto bg-[#0E0E0E] text-white sm:max-w-md" data-testid="favorites-drawer">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 font-serif text-2xl text-white">
            <Heart className="h-5 w-5 fill-[#E01E26] text-[#E01E26]" /> Saved spots
          </SheetTitle>
          <SheetDescription className="text-[#8A8F95]">
            Spots you've hearted, saved on this device.
          </SheetDescription>
        </SheetHeader>

        {count === 0 ? (
          <div className="mt-16 grid place-items-center text-center" data-testid="favorites-empty">
            <span className="grid h-16 w-16 place-items-center rounded-full bg-white/5 text-[#E01E26]">
              <Heart className="h-7 w-7" />
            </span>
            <p className="mt-4 font-serif text-xl text-white">No favorites yet</p>
            <p className="mt-1 max-w-xs font-sans text-sm text-[#8A8F95]">
              Tap the heart on any spot to save it here for next time.
            </p>
          </div>
        ) : (
          <div className="mt-6 space-y-3">
            {favorites.map((r) => (
              <div
                key={`${r.name}-${r.address}`}
                data-testid={`favorite-item-${r.id}`}
                className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-2"
              >
                <img src={r.image} alt={r.name} className="h-14 w-14 shrink-0 rounded-xl object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-serif text-base font-medium leading-tight text-white">{r.name}</p>
                  <p className="mt-0.5 flex items-center gap-2 font-sans text-xs text-[#8A8F95]">
                    <span>{r.cuisine} · {r.price}</span>
                    <span className="flex items-center gap-1">
                      <Star className="h-3 w-3 fill-[#E01E26] text-[#E01E26]" />
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
                      className="grid h-8 w-8 place-items-center rounded-full text-[#8A8F95] transition-colors hover:bg-white/10 hover:text-white"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                  <button
                    onClick={() => onRemove(r)}
                    data-testid={`favorite-remove-${r.id}`}
                    title="Remove"
                    className="grid h-8 w-8 place-items-center rounded-full text-[#8A8F95] transition-colors hover:bg-white/10 hover:text-[#E01E26]"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
            <p className="flex items-center gap-2 pt-2 font-sans text-xs text-[#8A8F95]">
              <Dices className="h-3.5 w-3.5 text-[#E01E26]" /> Saved on this device only.
            </p>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
