import React from "react";
import { motion } from "framer-motion";
import {
  Star, MapPin, ExternalLink, ShoppingBag, Flag,
  Beer, Wine, Martini, Target, Music, Gamepad2, CircleDot, Tv, Trophy,
  IceCream, Candy, Croissant, Donut, Clock,
} from "lucide-react";

const CARD_HOVER = { y: -8 };
const CARD_SPRING = { type: "spring", stiffness: 300, damping: 22 };

const BAR_ICONS = {
  "Beer": Beer, "Irish Bar": Beer,
  "Wine": Wine,
  "Cocktails": Martini, "Liquor": Martini, "Spirits": Martini, "Whiskey": Martini,
  "Margaritas": Martini, "Tiki": Martini, "Bars": Martini,
  "Sports Bar": Tv,
  "Pool": CircleDot, "Bowling": CircleDot, "Pickle Ball": CircleDot,
  "Volleyball": Trophy,
  "Darts": Target,
  "Music": Music,
  "Games": Gamepad2,
};

const DESSERT_ICONS = {
  "Ice Cream": IceCream,
  "Candy Shops": Candy,
  "Bakery": Croissant,
  "Frozen Yogurt": Donut,
};

export function RestaurantCard({ r, onReport }) {
  const VibeIcon = r.category === "bars" ? (BAR_ICONS[r.cuisine] || Trophy)
    : r.category === "desserts" ? (DESSERT_ICONS[r.cuisine] || IceCream)
    : null;
  const isDessert = r.category === "desserts";
  const orderLabel = isDessert ? "Order treats" : "DoorDash";
  return (
    <motion.div
      whileHover={CARD_HOVER}
      transition={CARD_SPRING}
      data-testid={`restaurant-card-${r.id}`}
      className="group relative rounded-3xl overflow-hidden bg-white border border-[#E2E4E7] shadow-xl shadow-black/5 hover:shadow-2xl"
    >
      <div className="relative h-52 overflow-hidden">
        <a
          href={r.google_url}
          target="_blank"
          rel="noopener noreferrer"
          data-testid={`photo-link-${r.id}`}
          title={`View ${r.name} on Google`}
          onClick={(e) => e.stopPropagation()}
          className="block h-full w-full"
        >
          <img
            src={r.image}
            alt={r.name}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        </a>
        <div className="absolute top-3 left-3 flex gap-2">
          <span className="rounded-full bg-white/90 backdrop-blur px-3 py-1 text-xs font-bold tracking-wide text-[#0E0E0E]">
            {r.cuisine}
          </span>
          {r.sponsored && (
            <span data-testid={`sponsored-badge-${r.id}`} className="rounded-full bg-[#E01E26] px-3 py-1 text-xs font-bold tracking-wide text-white">
              Sponsored
            </span>
          )}
        </div>
        <span
          data-testid={`open-status-${r.id}`}
          className={`absolute top-3 right-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${r.open_now ? "bg-[#0E0E0E] text-white" : "bg-white/90 text-[#6B7075]"}`}
        >
          <Clock className="h-3 w-3" /> {r.open_now ? "Open now" : "Closed"}
        </span>
      </div>
      <div className="p-5 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-serif text-2xl font-medium leading-tight text-[#0E0E0E]">
            {r.name}
          </h3>
          <span className="font-sans text-sm font-bold text-[#E01E26] shrink-0">
            {r.price}
          </span>
        </div>
        <p className="font-sans text-sm text-[#6B7075] line-clamp-2">
          {r.description}
        </p>
        {VibeIcon && (
          <span
            data-testid={`activity-tag-${r.id}`}
            className="inline-flex items-center gap-1.5 rounded-full bg-[#0E0E0E] px-3 py-1 text-xs font-bold text-white"
          >
            <VibeIcon className="h-3.5 w-3.5 text-[#E01E26]" /> {r.cuisine}
          </span>
        )}
        <div className="flex items-center gap-4 pt-1 text-sm text-[#6B7075]">
          <span className="flex items-center gap-1 font-semibold text-[#0E0E0E]">
            <Star className="h-4 w-4 fill-[#E01E26] text-[#E01E26]" />
            {r.rating > 0 ? r.rating.toFixed(1) : "New"}
          </span>
          <span className="flex items-center gap-1">
            <MapPin className="h-4 w-4" />
            {r.distance} mi
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-3">
          {r.doordash_url && (
            <a
              href={r.doordash_url}
              target="_blank"
              rel="noopener noreferrer"
              data-testid={`doordash-${r.id}`}
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center justify-center gap-1.5 rounded-full bg-[#E01E26] px-3 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#B3141A]"
            >
              <ShoppingBag className="h-4 w-4" /> {orderLabel}
            </a>
          )}
          {r.google_url && (
            <a
              href={r.google_url}
              target="_blank"
              rel="noopener noreferrer"
              data-testid={`rate-on-google-${r.id}`}
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center justify-center gap-1.5 rounded-full bg-[#0E0E0E] px-3 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#2A2A2A]"
            >
              <Star className="h-4 w-4 fill-[#E01E26] text-[#E01E26]" /> Reviews
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>

        {onReport && (
          <button
            onClick={(e) => { e.stopPropagation(); onReport(r); }}
            data-testid={`report-closed-${r.id}`}
            className="mt-2 inline-flex items-center gap-1.5 font-sans text-xs font-semibold text-[#6B7075] underline-offset-2 transition-colors hover:text-[#E01E26] hover:underline"
          >
            <Flag className="h-3.5 w-3.5" /> No longer here? Suggest removal
          </button>
        )}
      </div>
    </motion.div>
  );
}

export default RestaurantCard;
