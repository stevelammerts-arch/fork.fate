import ModeSetup from "./ModeSetup";
import TypePicker from "./TypePicker";
import { useLang } from "../../i18n/i18n";

/** Group Mode setup panel: category grid, cuisine types and the shared
 * location/radius setup — deals 3 spots for the group to vote on.
 * `slice` renders just one functional piece so the guided flip-book can host
 * the real controls page by page (category / types / where / deal). */
export function GroupPicker({
  modeTabs, mode, onPickCategory, modeLabel,
  cuisineLabel, cuisineList, cuisineGroups, selectedCuisines, onToggleCuisine,
  setup, slice,
}) {
  const { t } = useLang();
  const categoryGrid = (
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
  );
  const summary = (
    <p className="mt-2 font-sans text-sm text-[#3A3F45]" data-testid="group-selection-summary">
      {t("Dealing from")} <span className="font-bold text-[#E01E26]">{modeLabel}</span>
      {" · "}
      {selectedCuisines.length ? selectedCuisines.join(", ") : t("any type")}
    </p>
  );
  const typePicker = (
    <TypePicker
      testId="group-type-picker"
      label={cuisineLabel}
      cuisines={cuisineList}
      cuisineGroups={cuisineGroups}
      selected={selectedCuisines}
      onToggle={onToggleCuisine}
      accent="#E01E26"
    />
  );

  if (slice === "category") return categoryGrid;
  if (slice === "types") return (<>{summary}<div className="mt-3">{typePicker}</div></>);
  if (slice === "where") return <ModeSetup accent="#E01E26" testId="group-setup" {...setup} showCta={false} />;
  if (slice === "deal") return (<>{summary}<ModeSetup accent="#E01E26" testId="group-setup" {...setup} showLocation={false} showRadius={false} /></>);

  return (
    <div className="mt-2 w-full basis-full rounded-2xl border border-[#E01E26]/30 bg-[#FDF6F6]/60 p-4 backdrop-blur-md" data-testid="group-picker">
      <p className="font-serif text-xl font-bold text-[#0E0E0E]">{t("Group Mode")}</p>
      <p className="mb-1.5 mt-4 text-xs font-bold uppercase tracking-wider text-[#6B7075]">{t("Pick a category")}</p>
      {categoryGrid}
      {summary}
      <div className="mt-3">{typePicker}</div>
      <ModeSetup accent="#E01E26" testId="group-setup" {...setup} />
    </div>
  );
}
