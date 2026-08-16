import ModeSetup, { StepList } from "./ModeSetup";
import TypePicker from "./TypePicker";
import { useLang } from "../../i18n/i18n";

/** Group Mode setup panel: category grid, cuisine types and the shared
 * location/radius setup — deals 3 spots for the group to vote on. */
export function GroupPicker({
  modeTabs, mode, onPickCategory, modeLabel,
  cuisineLabel, cuisineList, cuisineGroups, selectedCuisines, onToggleCuisine,
  setup,
}) {
  const { t } = useLang();
  return (
    <div className="mt-2 w-full basis-full rounded-2xl border border-[#E01E26]/30 bg-[#FDF6F6]/60 p-4 backdrop-blur-md" data-testid="group-picker">
      <p className="font-serif text-xl font-bold text-[#0E0E0E]">{t("Group Mode")}</p>
      <StepList
        testId="group-steps"
        accent="#E01E26"
        steps={[
          t("Pick your category — Stay for camping, Explore for parks and trails, Food for meals."),
          t("Set where to search and how far."),
          t("Deal 3 spots at once, then let the group vote."),
        ]}
      />
      <p className="mb-1.5 mt-4 text-xs font-bold uppercase tracking-wider text-[#6B7075]">{t("Pick a category")}</p>
      <div className="grid grid-cols-4 gap-1 rounded-2xl border border-[#E2E4E7] bg-white/70 p-1 backdrop-blur-sm" data-testid="group-category-picker">
        {modeTabs.map(({ key, label, Icon }) => (
          <button
            key={key}
            type="button"
            data-testid={`group-category-${key}`}
            onClick={() => onPickCategory(key)}
            className={`flex min-h-[52px] flex-col items-center justify-center gap-1 rounded-xl px-1 py-2 text-[11px] font-bold leading-none transition-colors ${mode === key ? "bg-[#E01E26] text-white" : "text-[#3A3F45] hover:text-[#0E0E0E]"}`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>
      <p className="mt-2 font-sans text-sm text-[#3A3F45]" data-testid="group-selection-summary">
        {t("Dealing from")} <span className="font-bold text-[#E01E26]">{modeLabel}</span>
        {" · "}
        {selectedCuisines.length ? selectedCuisines.join(", ") : t("any type")}
      </p>
      <div className="mt-3">
        <TypePicker
          testId="group-type-picker"
          label={cuisineLabel}
          cuisines={cuisineList}
          cuisineGroups={cuisineGroups}
          selected={selectedCuisines}
          onToggle={onToggleCuisine}
          accent="#E01E26"
        />
      </div>
      <ModeSetup accent="#E01E26" testId="group-setup" {...setup} />
    </div>
  );
}
