import React from "react";
import { motion } from "framer-motion";
import { Star, MapPin, Trash2 } from "lucide-react";

export function RestaurantCard({ r, onDelete }) {
  return (
    <motion.div
      whileHover={{ y: -8 }}
      transition={{ type: "spring", stiffness: 300, damping: 22 }}
      data-testid={`restaurant-card-${r.id}`}
      className="group relative rounded-3xl overflow-hidden bg-white border border-[#EAE4D9] shadow-xl shadow-black/5 hover:shadow-2xl"
    >
      <div className="relative h-52 overflow-hidden">
        <img
          src={r.image}
          alt={r.name}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute top-3 left-3 rounded-full bg-white/90 backdrop-blur px-3 py-1 text-xs font-bold tracking-wide text-[#2C2A29]">
          {r.cuisine}
        </div>
        {onDelete && (
          <button
            onClick={() => onDelete(r)}
            data-testid={`delete-restaurant-${r.id}`}
            className="absolute top-3 right-3 rounded-full bg-white/90 backdrop-blur p-2 text-[#C84B31] opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
            aria-label="Delete restaurant"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>
      <div className="p-5 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-serif text-2xl font-medium leading-tight text-[#2C2A29]">
            {r.name}
          </h3>
          <span className="font-sans text-sm font-bold text-[#6B8E23] shrink-0">
            {r.price}
          </span>
        </div>
        <p className="font-sans text-sm text-[#7A7571] line-clamp-2">
          {r.description}
        </p>
        <div className="flex items-center gap-4 pt-1 text-sm text-[#7A7571]">
          <span className="flex items-center gap-1 font-semibold text-[#2C2A29]">
            <Star className="h-4 w-4 fill-[#C84B31] text-[#C84B31]" />
            {r.rating.toFixed(1)}
          </span>
          <span className="flex items-center gap-1">
            <MapPin className="h-4 w-4" />
            {r.distance} km
          </span>
        </div>
      </div>
    </motion.div>
  );
}

export default RestaurantCard;
