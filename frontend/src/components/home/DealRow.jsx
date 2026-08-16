// The big Deal button + nearby-count + weather-bias chip.
// The moment the button is pressed the HEARTBEAT starts — lub-dub thump,
// soft sound and slight haptics — accelerating for as long as the deck
// shuffles, cutting the instant the card lands.
import { motion } from "framer-motion";
import { Dices } from "lucide-react";
import { useHeartbeat } from "../../hooks/useHeartbeat";
import { SPIN_TAP } from "../../pages/homeConstants";
import { useLang } from "../../i18n/i18n";

export const DealRow = ({ spin, spinning, loading, passportMode, groupMode, light, resultsCount, weather }) => {
  const { t } = useLang();
  const racing = spinning || loading;
  const period = useHeartbeat(racing);
  return (
    <div className="flex flex-wrap items-center gap-4">
      {/* the heartbeat lives on a wrapper so framer's hover/tap transforms
          on the button itself stay untouched */}
      <span className="inline-block" style={{ animation: racing ? `ffHeartbeat ${period}ms ease-in-out infinite` : "none" }} data-testid={racing ? "deal-heartbeat-race" : undefined}>
        <motion.button
          data-testid="spin-roulette-button"
          onClick={spin}
          disabled={spinning || loading}
          whileHover={{ scale: spinning || loading ? 1 : 1.03 }}
          whileTap={SPIN_TAP}
          className="inline-flex items-center gap-3 rounded-full border-2 border-[#0E0E0E] bg-[#E01E26] px-10 py-5 font-sans text-lg font-bold text-white shadow-lg shadow-[#E01E26]/25 transition-colors hover:bg-[#B3141A] disabled:opacity-70"
        >
          <Dices className={`h-6 w-6 ${spinning || loading ? "animate-spin" : ""}`} />
          {loading ? t("Finding spots…") : spinning ? t("Shuffling…") : passportMode ? t("Deal My Passport") : groupMode ? (light ? t("Pick 3 Spots") : t("Deal 3 Fates!")) : (light ? t("Shuffle the Deck") : t("Deal Your Fate!"))}
        </motion.button>
      </span>
      {resultsCount > 0 && (
        <span className="font-sans text-sm text-[#6B7075]">
          {resultsCount} {resultsCount !== 1 ? t("spots nearby") : t("spot nearby")}
        </span>
      )}
      {weather && (
        <span
          data-testid="weather-chip"
          className="inline-flex items-center gap-1.5 rounded-full border border-[#CFE0F5] bg-[#EEF5FE] px-3 py-1.5 font-sans text-xs font-bold text-[#245C97]"
        >
          {{ indoor: "🌧️", water: "🔥", snow: "❄️", outdoor: "☀️" }[weather.bias]}
          {t(weather.label)} {weather.temp_f}° ·{" "}
          {{ indoor: t("indoor picks"), water: t("water picks"), snow: t("snow picks"), outdoor: t("outdoor picks") }[weather.bias]}
        </span>
      )}
    </div>
  );
};
