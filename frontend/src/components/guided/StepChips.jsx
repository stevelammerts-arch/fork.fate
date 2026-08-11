import React from "react";
import { Sparkles } from "lucide-react";
import { GuidedChips } from "./GuidedChips";
import { useLang } from "../../i18n/i18n";

// STEP 3 — narrow down with cuisine/sub-category chips
export function StepChips({ gt, mode, chips, groups, cuisines, toggleCuisine, onNext }) {
  const { t } = useLang();
  const chipProps = { selected: cuisines, toggle: toggleCuisine, accent: gt.accent, chipIdle: gt.chipIdle, t };
  return (
    <div data-testid="guided-step-chips">
      <p className="font-sans text-xs font-bold uppercase tracking-[0.2em]" style={{ color: gt.accent }}>{t("Step three")}</p>
      <h2 className={`mt-1 font-serif text-3xl font-bold ${gt.titleColor}`}>{t("Narrow the fates")}</h2>
      <p className={`mt-1 font-sans text-sm ${gt.subColor}`}>{t("Pick any that tempt you — or let fate surprise you.")}</p>
      <div className="mt-6 max-h-[42vh] space-y-5 overflow-y-auto pr-1">
        {groups ? (
          groups.map((g) => (
            <div key={g.label}>
              <p className={`mb-2 font-sans text-[11px] font-bold uppercase tracking-[0.18em] ${gt.groupLabel}`}>{t(g.label)}</p>
              <div className="flex flex-wrap gap-2.5">
                <GuidedChips items={g.items} limit={6} groupKey={g.label} {...chipProps} />
              </div>
            </div>
          ))
        ) : (
          <div className="flex flex-wrap gap-2.5">
            <GuidedChips items={chips} limit={9} groupKey={mode} {...chipProps} />
          </div>
        )}
      </div>
      <div className="mt-7 flex gap-3">
        <button onClick={onNext} data-testid="guided-surprise-me" className={`flex-1 rounded-full border px-5 py-3 text-sm font-bold transition-colors hover:brightness-95 ${gt.tileIdle} ${gt.tileText}`}>
          <Sparkles className="mr-1.5 inline h-4 w-4" style={{ color: gt.accent }} /> {t("Surprise me")}
        </button>
        <button onClick={onNext} disabled={!cuisines.length} data-testid="guided-chips-next" style={{ backgroundColor: gt.accent }} className="flex-1 rounded-full px-5 py-3 text-sm font-bold text-white transition-all hover:brightness-110 disabled:opacity-40">
          {t("Continue")} ({cuisines.length})
        </button>
      </div>
    </div>
  );
}
