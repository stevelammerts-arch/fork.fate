import React from "react";
import { motion } from "framer-motion";

const PILL_TAP = { scale: 0.94 };

const Pill = ({ active, onClick, children, testid }) => (
  <motion.button
    whileTap={PILL_TAP}
    onClick={onClick}
    data-testid={testid}
    className={`shrink-0 rounded-full px-5 py-2.5 text-sm font-semibold tracking-wide transition-colors duration-200 border ${
      active
        ? "bg-[#E01E26] text-white border-[#E01E26]"
        : "bg-[#EDEEF0] text-[#6B7075] border-transparent hover:bg-[#E2E4E7]"
    }`}
  >
    {children}
  </motion.button>
);

const Group = ({ label, children }) => (
  <div className="space-y-3">
    <p className="font-sans text-xs font-bold tracking-[0.2em] uppercase text-[#0E0E0E]">
      {label}
    </p>
    <div className="flex flex-wrap gap-3">{children}</div>
  </div>
);

export default function Filters({
  cuisines,
  cuisineLabel = "Cuisine",
  selectedCuisines,
  toggleCuisine,
}) {
  return (
    <div className="space-y-6" data-testid="filters-panel">
      <Group label={cuisineLabel}>
        {[...cuisines].sort((a, b) => a.localeCompare(b)).map((c) => (
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
    </div>
  );
}
