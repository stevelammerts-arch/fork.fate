import React from "react";
import { Utensils, Wine, Beer, IceCream, ShoppingBag, Fuel, Mountain, Tent } from "lucide-react";
import { useLang } from "../../i18n/i18n";

// STEP 1 — pick an interest (food / drinks / bars / ...)
export function StepInterest({ gt, onPick }) {
  const { t } = useLang();
  const interests = [
    { key: "food", label: t("Food"), sub: t("Restaurants & eats"), Icon: Utensils },
    { key: "drinks", label: t("Drinks"), sub: t("Coffee, boba, more"), Icon: Wine },
    { key: "bars", label: t("Bars"), sub: t("Cocktails & nightlife"), Icon: Beer },
    { key: "desserts", label: t("Desserts"), sub: t("Something sweet"), Icon: IceCream },
    { key: "shops", label: t("Shops"), sub: t("Antiques, thrift & more"), Icon: ShoppingBag },
    { key: "fuel", label: t("Fuel & Go"), sub: t("Gas, EV & getting around"), Icon: Fuel },
    { key: "explore", label: t("Explore"), sub: t("Parks, trails & fun"), Icon: Mountain },
    { key: "stay", label: t("Stay"), sub: t("Camping & lodging"), Icon: Tent },
  ];
  return (
    <div data-testid="guided-step-interest">
      <p className="font-sans text-xs font-bold uppercase tracking-[0.2em]" style={{ color: gt.accent }}>{t("Step one")}</p>
      <h2 className={`mt-1 font-serif text-3xl font-bold ${gt.titleColor}`}>{t("What calls to you?")}</h2>
      <p className={`mt-1 font-sans text-sm ${gt.subColor}`}>{t("Choose your craving to begin the ritual.")}</p>
      <div className="mt-6 grid grid-cols-2 gap-3">
        {interests.map(({ key, label, sub, Icon }) => (
          <button
            key={key}
            onClick={() => onPick(key)}
            data-testid={`guided-interest-${key}`}
            className={`group flex flex-col items-center justify-center gap-2 rounded-xl border px-2 py-4 transition-colors duration-200 hover:border-[var(--ff-accent)] hover:bg-[var(--ff-accent-soft)] ${gt.tileIdle}`}
          >
            <Icon className={`h-8 w-8 transition-colors duration-200 group-hover:text-[var(--ff-accent)] ${gt.iconIdle}`} />
            <span className="text-center">
              <span className={`block font-serif text-lg font-semibold ${gt.tileText}`}>{label}</span>
              <span className="block font-sans text-[11px] text-[#6B6B6B]">{sub}</span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
