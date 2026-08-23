// Hero kicker + headline + subcopy, worded per category tab.
import { motion } from "framer-motion";
import { useLang } from "../../i18n/i18n";
import { HERO_INITIAL, HERO_ANIMATE, HERO_TRANSITION } from "../../pages/homeConstants";

export const HeroCopy = ({ mode, allMode, ambCfg, theme }) => {
  const { t } = useLang();
  return (
    <motion.div initial={HERO_INITIAL} animate={HERO_ANIMATE} transition={HERO_TRANSITION} className="max-w-2xl">
      <p className="font-sans text-sm font-extrabold tracking-[0.25em] uppercase text-[#E01E26]" style={theme === "fairy" ? { color: "#FFD36B", textShadow: "0 1px 10px rgba(4,20,12,0.75)" } : theme === "fall" ? { color: "#FFB35C", textShadow: "0 1px 10px rgba(10,6,2,0.8)" } : undefined}>
        {allMode ? t("Can't decide on anything?") : mode === "food" ? t("Can't decide where to eat?") : mode === "drinks" ? t("Can't decide what to sip?") : mode === "bars" ? t("Can't decide where to drink?") : mode === "desserts" ? t("Craving something sweet?") : mode === "shops" ? t("Feeling like a treasure hunt?") : mode === "explore" ? t("Can't decide what to do?") : mode === "stay" ? t("Need somewhere to stay?") : t("Need to fill up or get moving?")}
      </p>
      <h1 className="mt-3 font-serif text-4xl font-medium leading-none tracking-tighter text-[#0E0E0E] sm:text-5xl lg:text-6xl" style={ambCfg ? { color: ambCfg.sky, textShadow: theme === "cyber" ? "0 0 12px rgba(199,125,255,0.6)" : undefined } : theme === "fall" ? { color: "#F7ECD8", textShadow: "0 2px 5px rgba(8,5,2,0.95), 0 4px 22px rgba(8,5,2,0.85)" } : undefined}>
        {mode === "food" ? t("Let fate pick tonight's table.") : mode === "drinks" ? t("Let fate pick your next sip.") : mode === "bars" ? t("Let fate pick tonight's bar.") : mode === "desserts" ? t("Let fate pick your sweet treat.") : mode === "shops" ? t("Let fate pick your next find.") : mode === "explore" ? t("Let fate pick your next adventure.") : mode === "stay" ? t("Let fate pick tonight's basecamp.") : t("Let fate pick your pit stop.")}
      </h1>
      <p className="mt-4 font-sans text-base font-semibold leading-relaxed text-[#0E0E0E]" style={ambCfg ? { color: ambCfg.sky, opacity: 0.92 } : theme === "fall" ? { color: "#F0E2C6", opacity: 1, textShadow: "0 1px 4px rgba(8,5,2,0.95), 0 3px 14px rgba(8,5,2,0.8)" } : undefined}>
        {mode === "food"
          ? t("Set the mood with a few filters and hit Deal. We'll shuffle great local restaurants — up to 50 miles out — and land on your next meal.")
          : mode === "drinks"
          ? t("Coffee, boba tea or a smoothie? Set your filters and hit Deal — we'll shuffle nearby drink spots and pick one for you.")
          : mode === "bars"
          ? t("Beer, whiskey, margaritas or a Tiki bar? Set your filters and hit Deal — we'll shuffle nearby bars and pick tonight's spot.")
          : mode === "desserts"
          ? t("Ice cream, bakery, candy or froyo? Set your filters and hit Deal — we'll shuffle nearby dessert spots and pick your treat.")
          : mode === "shops"
          ? t("Antiques, thrift, vintage or a hobby shop? Set your filters and hit Deal — we'll shuffle nearby shops and pick your next find.")
          : mode === "explore"
          ? t("A state park, a hiking trail, a waterfall — or mini golf if it's raining? Set your filters and hit Deal, and we'll shuffle what's out there and pick your next adventure.")
          : mode === "stay"
          ? t("A campground, an RV site, a cabin or a cosy inn? Set your filters and hit Deal — we'll shuffle nearby places to stay and pick tonight's basecamp.")
          : t("Gas, a charger, a scooter or the next bus? Set your filters and hit Deal — we'll shuffle nearby stops and pick your pit stop.")}
      </p>
    </motion.div>
  );
};
