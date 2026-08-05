import { useRef, useState } from "react";
import { UtensilsCrossed, Dices } from "lucide-react";
import { useLang } from "../../i18n/i18n";
import { haptic } from "../../lib/pwa";

// Fate picked WHERE you eat — the Dish Dare decides HOW you order.
const DARES = [
  "Order the spiciest thing on the menu.",
  "Let the server pick your meal.",
  "Order the house special — no questions asked.",
  "Pick the dish you can't pronounce.",
  "Order the cheapest thing… twice.",
  "Dessert first. Then decide the rest.",
  "Order the first thing your eyes land on.",
  "Copy whatever the next table ordered.",
  "Ask the kitchen to surprise you.",
  "Order something you've never tried before.",
  "Get the weirdest-sounding appetizer.",
  "Go vegetarian tonight — fate says so.",
  "Close your eyes and point at the menu.",
  "Order the last item on the menu.",
  "Add the hottest sauce they have to whatever arrives.",
  "Split the decision: everyone orders for the person on their left.",
];

/** Optional second spin after the restaurant lands: a quick slot-machine of
 * ordering dares. One dare per dealt card — no rerolls, that's the point. */
export function DishDare() {
  const { t } = useLang();
  const [rolling, setRolling] = useState(false);
  const [dare, setDare] = useState(null);
  const [flick, setFlick] = useState("");
  const timerRef = useRef(null);

  const roll = () => {
    if (rolling || dare) return;
    setRolling(true);
    haptic(15);
    const final = DARES[Math.floor(Math.random() * DARES.length)];
    let i = 0;
    let delay = 70;
    const step = () => {
      setFlick(DARES[Math.floor(Math.random() * DARES.length)]);
      i++;
      delay *= 1.22;
      if (delay < 340) {
        timerRef.current = setTimeout(step, delay);
      } else {
        setRolling(false);
        setDare(final);
        haptic(25);
      }
    };
    step();
  };

  return (
    <div data-testid="dish-dare">
      {!dare && !rolling && (
        <button
          onClick={roll}
          data-testid="dish-dare-button"
          title={t("Fate picked the place — let it pick how you order")}
          className="inline-flex items-center gap-1.5 rounded-full border-2 border-dashed border-[#B26A12] bg-white px-3 py-1.5 font-sans text-xs font-bold text-[#B26A12] transition-colors hover:bg-[#FBF3E7]"
        >
          <UtensilsCrossed className="h-3.5 w-3.5" /> {t("Dish Dare")}
        </button>
      )}
      {(rolling || dare) && (
        <div
          data-testid="dish-dare-result"
          className={`flex items-start gap-2 rounded-xl border px-3 py-2 font-sans text-sm ${rolling ? "border-[#E2E4E7] bg-[#F8F8F6] text-[#6B7075]" : "border-[#F0A24E] bg-[#FBF3E7] font-semibold text-[#8A5210]"}`}
        >
          <Dices className={`mt-0.5 h-4 w-4 shrink-0 ${rolling ? "animate-spin text-[#B8BCC2]" : "text-[#B26A12]"}`} />
          <span className={rolling ? "italic" : ""}>{rolling ? t(flick) : t(dare)}</span>
        </div>
      )}
    </div>
  );
}
