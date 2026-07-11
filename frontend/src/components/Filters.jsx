import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useLang } from "../i18n/i18n";

const PILL_TAP = { scale: 0.94 };
const COLLAPSE_LIMIT = 12;

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

const Group = ({ label, labelColor, children }) => (
  <div className="space-y-3">
    <p className="font-sans text-xs font-bold tracking-[0.2em] uppercase text-[#0E0E0E]" style={labelColor ? { color: labelColor } : undefined}>
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
  labelColor,
}) {
  const { t } = useLang();
  const [expanded, setExpanded] = useState(false);

  // Collapse back to the short list whenever the category (chip set) changes.
  useEffect(() => { setExpanded(false); }, [cuisineLabel]);

  const sorted = [...cuisines].sort((a, b) => a.localeCompare(b));
  const needsCollapse = sorted.length > COLLAPSE_LIMIT;

  let visible = sorted;
  if (needsCollapse && !expanded) {
    const head = sorted.slice(0, COLLAPSE_LIMIT);
    // Keep any selected chips visible even when they fall past the cut-off.
    const selectedBeyond = sorted.slice(COLLAPSE_LIMIT).filter((c) => selectedCuisines.includes(c));
    visible = [...head, ...selectedBeyond];
  }
  const hiddenCount = sorted.length - visible.length;

  return (
    <div className="space-y-6" data-testid="filters-panel">
      <Group label={cuisineLabel} labelColor={labelColor}>
        {visible.map((c) => (
          <Pill
            key={c}
            active={selectedCuisines.includes(c)}
            onClick={() => toggleCuisine(c)}
            testid={`cuisine-filter-${c.toLowerCase()}`}
          >
            {c}
          </Pill>
        ))}
        {needsCollapse && (
          <motion.button
            whileTap={PILL_TAP}
            onClick={() => setExpanded((e) => !e)}
            data-testid="cuisine-toggle-more"
            className="shrink-0 rounded-full border border-dashed border-[#C7CBD1] bg-transparent px-5 py-2.5 text-sm font-bold tracking-wide text-[#0E0E0E] transition-colors duration-200 hover:bg-[#EDEEF0]"
            style={labelColor ? { color: labelColor, borderColor: labelColor } : undefined}
          >
            {expanded ? t("Show less") : `+ ${hiddenCount} ${t("more")}`}
          </motion.button>
        )}
      </Group>
    </div>
  );
}
