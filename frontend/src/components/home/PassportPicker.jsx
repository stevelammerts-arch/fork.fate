import { Link } from "react-router-dom";
import { Stamp } from "lucide-react";
import ModeSetup, { StepList } from "./ModeSetup";
import TypePicker from "./TypePicker";
import { useLang } from "../../i18n/i18n";

/** Fate Passport setup panel: category grid, cuisine types, stop count,
 * existing passports and the shared location/radius setup. */
export function PassportPicker({
  modeTabs, passportCategories, mode, onPickCategory, modeLabel,
  cuisineLabel, cuisineList, cuisineGroups, selectedCuisines, onToggleCuisine,
  passportSize, setPassportSize, myPassports, setup,
}) {
  const { t } = useLang();
  return (
    <div className="mt-2 w-full basis-full rounded-2xl border border-[#2E7D32]/30 bg-[#F1F8F2] p-4" data-testid="passport-picker">
      <p className="font-serif text-xl font-bold text-[#0E0E0E]">{t("Fate Passport")}</p>
      <p className="mt-1 font-sans text-sm text-[#3A3F45]">
        {t("A crawl is one day — a passport is collected over time. Fate deals your stops, you stamp each one as you get there, and a finished passport earns a stamped award you can share.")}
      </p>
      <StepList
        testId="passport-steps"
        accent="#2E7D32"
        steps={[
          t("Pick any category — a brewery tour, a park run, a summer of diners."),
          t("Choose how many stops and where to search."),
          t("Deal it — then stamp each stop as you get there, over days or weeks."),
        ]}
      />
      <p className="mb-1.5 mt-4 text-xs font-bold uppercase tracking-wider text-[#6B7075]">{t("Pick a category")}</p>
      <div className="grid grid-cols-4 gap-1 rounded-2xl border border-[#E2E4E7] bg-white p-1" data-testid="passport-category-picker">
        {modeTabs.filter((m) => passportCategories.includes(m.key)).map(({ key, label, Icon }) => (
          <button
            key={key}
            type="button"
            data-testid={`passport-category-${key}`}
            onClick={() => onPickCategory(key)}
            className={`flex min-h-[52px] flex-col items-center justify-center gap-1 rounded-xl px-1 py-2 text-[11px] font-bold leading-none transition-colors ${mode === key ? "bg-[#2E7D32] text-white" : "text-[#3A3F45] hover:text-[#0E0E0E]"}`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>
      <p className="mt-2 font-sans text-sm text-[#3A3F45]" data-testid="passport-selection-summary">
        {t("Dealing from")} <span className="font-bold text-[#2E7D32]">{modeLabel}</span>
        {" · "}
        {selectedCuisines.length ? selectedCuisines.join(", ") : t("any type")}
      </p>

      <div className="mt-3">
        <TypePicker
          testId="passport-type-picker"
          label={cuisineLabel}
          cuisines={cuisineList}
          cuisineGroups={cuisineGroups}
          selected={selectedCuisines}
          onToggle={onToggleCuisine}
          accent="#2E7D32"
        />
      </div>

      <p className="mb-1.5 mt-4 text-xs font-bold uppercase tracking-wider text-[#6B7075]">{t("How many stops?")}</p>
      <div className="flex flex-wrap gap-2">
        {[3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
          <button
            key={n}
            type="button"
            data-testid={`passport-size-${n}`}
            onClick={() => setPassportSize(n)}
            className={`min-w-[44px] rounded-full border px-4 py-2 text-sm font-bold transition-colors ${passportSize === n ? "border-[#2E7D32] bg-[#2E7D32] text-white" : "border-[#E2E4E7] bg-white text-[#6B7075] hover:bg-[#EDEEF0]"}`}
          >
            {n}
          </button>
        ))}
      </div>
      {myPassports.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2" data-testid="my-passports">
          <span className="self-center text-xs font-bold uppercase tracking-wider text-[#6B7075]">{t("Your passports")}</span>
          {myPassports.map((p) => (
            <Link
              key={p.code}
              to={`/p/${p.code}`}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#2E7D32]/40 bg-white px-3 py-1.5 text-sm font-bold text-[#2E7D32] hover:bg-[#E8F3E9]"
            >
              <Stamp className="h-3.5 w-3.5" /> {p.code}
            </Link>
          ))}
        </div>
      )}

      <ModeSetup accent="#2E7D32" testId="passport-setup" showDestination {...setup} />
    </div>
  );
}
