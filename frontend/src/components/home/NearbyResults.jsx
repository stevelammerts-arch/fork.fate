// Nearby-spots section: Fate of the Day banner + sort control + result grid.
import { ArrowDownWideNarrow, Crown } from "lucide-react";
import { RestaurantCard } from "../RestaurantCard";
import { cardImage } from "../../pages/homeConstants";
import { useLang } from "../../i18n/i18n";

const metaLine = (x, t) =>
  [x.cuisine, x.price, x.distance != null ? `${x.distance} ${t("mi away")}` : null].filter(Boolean).join(" · ");

export const NearbyResults = ({ fateOfDay, spinning, onDealFateOfDay, sortBy, setSortBy, sortedResults, mode, onReport, isFavorite, onToggleFavorite }) => {
  const { t } = useLang();
  return (
    <section className="relative z-10 mx-auto max-w-6xl px-6 pb-24 pt-8 md:px-12">
      {fateOfDay && !spinning && (
        <div className="mb-8 flex items-center gap-4 rounded-2xl border-2 border-[#E6B23A] bg-gradient-to-r from-[#FDF6E7] to-white p-4" data-testid="fate-of-day-card">
          {cardImage(fateOfDay) && (
            <img src={cardImage(fateOfDay)} alt="" className="h-16 w-16 shrink-0 rounded-xl object-cover" />
          )}
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1.5 font-sans text-[10px] font-bold uppercase tracking-[0.2em] text-[#B98A22]">
              <Crown className="h-3.5 w-3.5" /> {t("Fate of the Day")}
            </p>
            <p className="truncate font-serif text-lg font-bold text-[#0E0E0E]">{fateOfDay.name}</p>
            <p className="truncate font-sans text-xs text-[#6B7075]">{metaLine(fateOfDay, t)}</p>
          </div>
          <button
            onClick={() => onDealFateOfDay(fateOfDay)}
            data-testid="fate-of-day-deal"
            className="shrink-0 rounded-full bg-[#B98A22] px-4 py-2 font-sans text-xs font-bold text-white transition-colors hover:bg-[#8F6A18]"
          >
            {t("Deal me this")}
          </button>
        </div>
      )}
      <div className="flex items-end justify-between border-b border-[#E2E4E7] pb-4">
        <h2 className="font-serif text-2xl font-medium tracking-tight text-[#0E0E0E] sm:text-3xl">
          {t("Nearby spots")}
        </h2>
        <label className="flex items-center gap-2 font-sans text-xs font-bold text-[#6B7075]">
          <ArrowDownWideNarrow className="h-4 w-4" />
          <select
            data-testid="sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="rounded-full border border-[#E2E4E7] bg-white px-3 py-1.5 font-bold text-[#0E0E0E] focus:outline-none"
          >
            <option value="default">{t("Featured")}</option>
            <option value="distance">{t("Closest")}</option>
            <option value="rating">{t("Top rated")}</option>
            <option value="price">{t("Cheapest")}</option>
          </select>
        </label>
      </div>
      <div className="mt-8 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3" data-testid="restaurant-grid">
        {sortedResults.slice(0, 6).map((r) => (
          <RestaurantCard key={r.id} r={r} mode={mode} onReport={onReport} isFavorite={isFavorite(r)} onToggleFavorite={onToggleFavorite} />
        ))}
      </div>
    </section>
  );
};
