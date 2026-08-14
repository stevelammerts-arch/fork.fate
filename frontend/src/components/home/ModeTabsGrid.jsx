// The 8 category tabs (4x2 grid) + the cuisine chip picker below them.
import { ChevronDown } from "lucide-react";
import Filters from "../Filters";
import { useLang } from "../../i18n/i18n";

export const ModeTabsGrid = ({ hidden, tabs, mode, allMode, onTab }) => (
  <div className={`grid grid-cols-4 gap-1 rounded-2xl border border-[#E2E4E7] bg-[#EDEEF0] p-1 ${hidden ? "hidden" : ""}`} data-testid="mode-toggle">
    {tabs.map(({ key, label, Icon }) => (
      <button
        key={key}
        data-testid={`mode-${key}`}
        onClick={() => onTab(key)}
        className={`flex min-h-[52px] flex-col items-center justify-center gap-1 rounded-xl px-1 py-2 text-[11px] font-bold leading-none transition-colors ${mode === key && !allMode ? "bg-[#0E0E0E] text-white" : "text-[#3A3F45] hover:text-[#0E0E0E]"}`}
      >
        <Icon className="h-4 w-4" />
        {label}
      </button>
    ))}
  </div>
);

export const CuisineSection = ({ hidden, allMode, cuisineLabel, selectedCuisines, filtersOpen, setFiltersOpen, cuisineList, cuisineGroups, onToggleCuisine, labelColor }) => {
  const { t } = useLang();
  return (
    <div className={`mt-4 ${hidden ? "hidden" : ""}`}>
      {allMode ? (
        <div className="rounded-2xl border border-[#0E0E0E]/15 bg-[#0E0E0E] px-4 py-3" data-testid="any-mode-banner">
          <p className="font-sans text-xs font-bold uppercase tracking-wider text-[#F0A24E]">{t("Anything goes")}</p>
          <p className="mt-0.5 font-sans text-sm text-white">
            {t("No category — dealing from Food, Drinks, Bars & Desserts. Tap a tab to narrow it.")}
          </p>
        </div>
      ) : (
        <>
          <button
            type="button"
            data-testid="filters-toggle"
            onClick={() => setFiltersOpen((o) => !o)}
            className="flex w-full items-center justify-between gap-3 rounded-2xl border border-[#E2E4E7] bg-white px-4 py-3 text-left transition-colors hover:bg-[#F7F8F9]"
          >
            <span className="min-w-0">
              <span className="block font-sans text-xs font-bold uppercase tracking-wider text-[#6B7075]">
                {cuisineLabel}
              </span>
              <span className="mt-0.5 block truncate font-sans text-sm font-semibold text-[#0E0E0E]">
                {selectedCuisines.length ? selectedCuisines.join(", ") : t("Any type — tap to choose")}
              </span>
            </span>
            <ChevronDown className={`h-5 w-5 shrink-0 text-[#6B7075] transition-transform ${filtersOpen ? "rotate-180" : ""}`} />
          </button>
          {filtersOpen && (
            <Filters
              cuisines={cuisineList}
              cuisineGroups={cuisineGroups}
              cuisineLabel={cuisineLabel}
              selectedCuisines={selectedCuisines}
              toggleCuisine={(c) => { onToggleCuisine(c); setFiltersOpen(false); }}
              labelColor={labelColor}
            />
          )}
        </>
      )}
    </div>
  );
};
