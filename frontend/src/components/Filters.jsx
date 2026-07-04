import React from "react";
import { motion } from "framer-motion";

const PRICES = ["$", "$$", "$$$"];
const PILL_TAP = { scale: 0.94 };
const DISTANCES = [
  { label: "Any", value: null },
  { label: "< 1 km", value: 1 },
  { label: "< 2 km", value: 2 },
  { label: "< 3 km", value: 3 },
];

const Pill = ({ active, onClick, children, testid }) => (
  <motion.button
    whileTap={PILL_TAP}
    onClick={onClick}
    data-testid={testid}
    className={`shrink-0 rounded-full px-5 py-2.5 text-sm font-semibold tracking-wide transition-colors duration-200 border ${
      active
        ? "bg-[#C84B31] text-white border-[#C84B31]"
        : "bg-[#EAE4D9] text-[#7A7571] border-transparent hover:bg-[#e0d8c8]"
    }`}
  >
    {children}
  </motion.button>
);

const Group = ({ label, children }) => (
  <div className="space-y-3">
    <p className="font-sans text-xs font-bold tracking-[0.2em] uppercase text-[#7A7571]">
      {label}
    </p>
    <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">{children}</div>
  </div>
);

export default function Filters({
  cuisines,
  selectedCuisines,
  toggleCuisine,
  selectedPrices,
  togglePrice,
  maxDistance,
  setMaxDistance,
}) {
  return (
    <div className="space-y-6" data-testid="filters-panel">
      <Group label="Cuisine">
        {cuisines.map((c) => (
          <Pill
            key={c}
            active={selectedCuisines.includes(c)}
            onClick={() => toggleCuisine(c)}
            testid={`cuisine-filter-${c.toLowerCase()}`}
          >
            {c}
          </Pill>
        ))}
      </Group>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Group label="Price">
          {PRICES.map((p) => (
            <Pill
              key={p}
              active={selectedPrices.includes(p)}
              onClick={() => togglePrice(p)}
              testid={`price-filter-${p.length}`}
            >
              {p}
            </Pill>
          ))}
        </Group>

        <Group label="Distance">
          {DISTANCES.map((d) => (
            <Pill
              key={d.label}
              active={maxDistance === d.value}
              onClick={() => setMaxDistance(d.value)}
              testid={`distance-filter-${d.label.replace(/[^a-z0-9]/gi, "").toLowerCase()}`}
            >
              {d.label}
            </Pill>
          ))}
        </Group>
      </div>
    </div>
  );
}
