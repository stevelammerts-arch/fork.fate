import React, { useState, useEffect } from "react";
import { Check } from "lucide-react";

// One chip section — its own "+N more" so a 60-chip category stays scannable.
export function GuidedChips({ items, limit, groupKey, selected, toggle, accent, chipIdle, t }) {
  const [showAll, setShowAll] = useState(false);
  useEffect(() => { setShowAll(false); }, [groupKey]);

  const visible = showAll ? items : items.slice(0, limit);
  const hidden = items.length - visible.length;
  return (
    <>
      {visible.map((c) => {
        const on = selected.includes(c);
        return (
          <button
            key={c}
            onClick={() => toggle(c)}
            data-testid={`guided-chip-${c}`}
            style={on ? { backgroundColor: accent, borderColor: "transparent" } : undefined}
            className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors duration-200 ${on ? "text-white" : `hover:border-[var(--ff-accent)] ${chipIdle}`}`}
          >
            {on && <Check className="mr-1 inline h-3.5 w-3.5" />}{c}
          </button>
        );
      })}
      {items.length > limit && (
        <button
          onClick={() => setShowAll((s) => !s)}
          data-testid={`guided-chips-more-${groupKey}`}
          style={{ color: accent, borderColor: `${accent}99` }}
          className="rounded-full border border-dashed bg-transparent px-4 py-2 text-sm font-semibold transition-colors hover:bg-[var(--ff-accent-soft)]"
        >
          {showAll ? t("Show less") : `+ ${hidden} ${t("more")}`}
        </button>
      )}
    </>
  );
}
