import { useState } from "react";
import { ChevronDown } from "lucide-react";
import Filters from "../Filters";

/**
 * The type/cuisine chips, inline and collapsible, so Passport and Group setup are
 * self-contained — users were having to scroll back up to the main chip list and
 * then hunt for the panel again.
 */
export default function TypePicker({ label, cuisines, cuisineGroups, selected, onToggle, accent = "#0E0E0E", testId }) {
  const [open, setOpen] = useState(false);

  return (
    <div data-testid={testId}>
      <button
        type="button"
        data-testid={`${testId}-toggle`}
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-3 rounded-2xl border border-[#E2E4E7] bg-white px-4 py-3 text-left transition-colors hover:bg-[#F7F8F9]"
      >
        <span className="min-w-0">
          <span className="block font-sans text-xs font-bold uppercase tracking-wider text-[#6B7075]">{label}</span>
          <span className="mt-0.5 block truncate font-sans text-sm font-semibold" style={{ color: selected.length ? accent : "#0E0E0E" }}>
            {selected.length ? selected.join(", ") : "Any type — tap to choose"}
          </span>
        </span>
        <ChevronDown className={`h-5 w-5 shrink-0 text-[#6B7075] transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="mt-3 max-h-[46vh] overflow-y-auto rounded-2xl border border-[#E2E4E7] bg-white p-4">
          <Filters
            cuisines={cuisines}
            cuisineGroups={cuisineGroups}
            cuisineLabel={label}
            selectedCuisines={selected}
            toggleCuisine={onToggle}
          />
          {selected.length > 0 && (
            <button
              type="button"
              data-testid={`${testId}-done`}
              onClick={() => setOpen(false)}
              className="mt-4 w-full rounded-full px-4 py-2.5 text-sm font-bold text-white"
              style={{ backgroundColor: accent }}
            >
              Done — {selected.length} picked
            </button>
          )}
        </div>
      )}
    </div>
  );
}
