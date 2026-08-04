import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
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
        : "bg-[#EDEEF0] text-[#3A3F45] border-transparent hover:bg-[#E2E4E7]"
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
  cuisineGroups,
  cuisineLabel = "Cuisine",
  selectedCuisines,
  toggleCuisine,
  labelColor,
}) {
  if (cuisineGroups) {
    return (
      <div className="space-y-3" data-testid="filters-panel">
        {cuisineGroups.map((g) => (
          <CollapsibleGroup
            key={g.label}
            label={g.label}
            items={g.items}
            selectedCuisines={selectedCuisines}
            toggleCuisine={toggleCuisine}
          />
        ))}
      </div>
    );
  }
  return (
    <div className="space-y-6" data-testid="filters-panel">
      <ChipSection
        label={cuisineLabel}
        items={cuisines}
        limit={COLLAPSE_LIMIT}
        labelColor={labelColor}
        selectedCuisines={selectedCuisines}
        toggleCuisine={toggleCuisine}
      />
    </div>
  );
}

/**
 * A sub-division rendered fully collapsed by default — users open only the
 * group they care about instead of scrolling one giant chip wall. A count
 * badge keeps their picks visible even while the group is closed.
 */
function CollapsibleGroup({ label, items, selectedCuisines, toggleCuisine }) {
  const { t } = useLang();
  const [open, setOpen] = useState(false);
  const selCount = items.filter((c) => selectedCuisines.includes(c)).length;
  const sorted = [...items].sort((a, b) => a.localeCompare(b));

  return (
    <div className="overflow-hidden rounded-2xl border border-[#E2E4E7] bg-white">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        data-testid={`cuisine-group-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-[#F7F8F9]"
      >
        {/* Header sits on a white card in every theme — always use dark ink,
            never the page-background labelColor tint (unreadable on white). */}
        <span className="font-sans text-xs font-bold uppercase tracking-[0.2em] text-[#0E0E0E]">
          {t(label)}
        </span>
        <span className="flex shrink-0 items-center gap-2">
          {selCount > 0 && (
            <span className="rounded-full bg-[#E01E26] px-2 py-0.5 font-sans text-[11px] font-bold text-white" data-testid={`cuisine-group-count-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}>
              {selCount}
            </span>
          )}
          <span className="font-sans text-[11px] text-[#9A9FA5]">{items.length}</span>
          <ChevronDown className={`h-4 w-4 text-[#6B7075] transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
        </span>
      </button>
      {open && (
        <div className="flex flex-wrap gap-3 px-4 pb-4 pt-1">
          {sorted.map((c) => (
            <Pill
              key={c}
              active={selectedCuisines.includes(c)}
              onClick={() => toggleCuisine(c)}
              testid={`cuisine-filter-${c.toLowerCase()}`}
            >
              {c}
            </Pill>
          ))}
        </div>
      )}
    </div>
  );
}

function ChipSection({ label, items, limit, labelColor, selectedCuisines, toggleCuisine }) {
  const { t } = useLang();
  const [expanded, setExpanded] = useState(false);

  // Collapse back to the short list whenever the chip set changes (category switch).
  useEffect(() => { setExpanded(false); }, [label]);

  const sorted = [...items].sort((a, b) => a.localeCompare(b));
  const needsCollapse = sorted.length > limit;

  let visible = sorted;
  if (needsCollapse && !expanded) {
    const head = sorted.slice(0, limit);
    // Keep any selected chips visible even when they fall past the cut-off.
    const selectedBeyond = sorted.slice(limit).filter((c) => selectedCuisines.includes(c));
    visible = [...head, ...selectedBeyond];
  }
  const hiddenCount = sorted.length - visible.length;

  return (
    <Group label={t(label)} labelColor={labelColor}>
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
          data-testid={`cuisine-toggle-more-${label.toLowerCase()}`}
          className="shrink-0 rounded-full border border-dashed border-[#C7CBD1] bg-transparent px-5 py-2.5 text-sm font-bold tracking-wide text-[#0E0E0E] transition-colors duration-200 hover:bg-[#EDEEF0]"
          style={labelColor ? { color: labelColor, borderColor: labelColor } : undefined}
        >
          {expanded ? t("Show less") : `+ ${hiddenCount} ${t("more")}`}
        </motion.button>
      )}
    </Group>
  );
}
