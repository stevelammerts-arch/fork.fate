import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import { Dices, Store, Heart, Star, MapPin, ShoppingBag, Fuel, UtensilsCrossed, Skull, ExternalLink, Share2, ImageDown, RotateCcw, Flag } from "lucide-react";
import GroupVote from "../GroupVote";
import CheckInButton from "../CheckInButton";
import SocialShare from "../SocialShare";
import BecomeSponsorDialog from "../BecomeSponsorDialog";
import { useLang } from "../../i18n/i18n";
import { RESULT_SPRING, DETAIL_INITIAL, DETAIL_ANIMATE, DETAIL_TRANSITION, reaperLineFor, lightLineFor } from "../../pages/homeConstants";
import { buildFateCard } from "../../pages/homeFateCard";
import { trackEvent } from "../../lib/analytics";

export default function RevealStage({ spinning, flash, deck, result, groupPicks, mode, light, theme, onReset, onReSpin, onReport, onPick, isFavorite, onToggleFavorite }) {
  const { t } = useLang();
  if (!result && groupPicks && groupPicks.length > 0) {
    return <GroupVote picks={groupPicks} onReSpin={onReSpin} onWinner={onPick} />;
  }
  if (!result) {
    return (
      <div className="grid h-full min-h-[400px] place-items-center text-center">
        <div className="space-y-3">
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[#0E0E0E] text-[#E01E26]">
            <Dices className="h-7 w-7" />
          </span>
          <p className="font-serif text-2xl text-[#0E0E0E]">{t("Your table awaits")}</p>
          <p className="mx-auto max-w-xs font-sans text-sm text-[#6B7075]">
            {mode === "food"
              ? t("Set your filters and hit Deal — fate decides where you're eating.")
              : mode === "drinks"
              ? t("Set your filters and hit Deal — fate decides what you're sipping.")
              : mode === "bars"
              ? t("Set your filters and hit Deal — fate decides where you're drinking.")
              : mode === "desserts"
              ? t("Set your filters and hit Deal — fate decides your sweet treat.")
              : mode === "shops"
              ? t("Set your filters and hit Deal — fate decides your next find.")
              : t("Set your filters and hit Deal — fate decides your pit stop.")}
          </p>
        </div>
      </div>
    );
  }

  const card = result;
  const alternatives = deck.filter((d) => d.id !== card.id).slice(0, 3);
  const shareFate = async () => {
    const text = `Fate picked ${card.name} (${card.cuisine} · ${card.price})${card.distance ? ` — ${card.distance} mi away` : ""}. Shuffle your own fate on Fork·Fate!`;
    const url = window.location.origin;
    trackEvent("share_fate", { method: "text", category: mode, theme });
    try {
      if (navigator.share) {
        await navigator.share({ title: "Fork·Fate", text, url });
      } else {
        await navigator.clipboard.writeText(`${text} ${url}`);
        toast.success(t("Copied to clipboard — share your fate!"));
      }
    } catch (e) {
      // Share sheet cancelled or unavailable — non-critical
      console.debug("Share dismissed:", e);
    }
  };
  const shareFateImage = async () => {
    trackEvent("share_fate", { method: "image", category: mode, theme });
    try {
      const blob = await buildFateCard(card, theme);
      if (!blob) throw new Error("no blob");
      const file = new File([blob], `forkfate-${(card.name || "pick").replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.png`, { type: "image/png" });
      const text = `Fate picked ${card.name}! Shuffle your own on Fork·Fate.`;
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: "Fork·Fate", text });
      } else {
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = file.name;
        link.click();
        URL.revokeObjectURL(link.href);
        toast.success(t("Fate card saved — share it anywhere!"));
      }
    } catch (e) {
      console.debug("Image share dismissed:", e);
    }
  };
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={`res-${card.id}`}
        initial={{ opacity: 0, scale: 0.96, rotate: -2 }}
        animate={{ opacity: 1, scale: 1, rotate: 0 }}
        exit={{ opacity: 0, scale: 0.98 }}
        transition={RESULT_SPRING}
        className="overflow-hidden rounded-2xl"
        data-testid="spin-result-card"
      >
        <div className="relative h-64 overflow-hidden rounded-2xl">
          <a
            href={card.google_url}
            target="_blank"
            rel="noopener noreferrer"
            data-testid="result-photo-link"
            title={`View ${card.name} on Google`}
            className="block h-full w-full"
          >
            <img src={card.photo_url || card.image} alt={card.name} className="h-full w-full object-cover transition-transform duration-500 hover:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
          </a>
          {onToggleFavorite && (
            <button
              onClick={(e) => { e.stopPropagation(); e.preventDefault(); onToggleFavorite(card); }}
              data-testid="result-favorite-toggle"
              title={isFavorite?.(card) ? t("Remove from favorites") : t("Save to favorites")}
              aria-pressed={isFavorite?.(card)}
              className="absolute right-3 top-3 grid h-11 w-11 place-items-center rounded-full bg-white/90 backdrop-blur transition-transform hover:scale-110 active:scale-95"
            >
              <Heart className={`h-5 w-5 transition-colors ${isFavorite?.(card) ? "fill-[#E01E26] text-[#E01E26]" : "text-[#6B7075]"}`} />
            </button>
          )}
          {card.sponsored && (
            <div
              className="pointer-events-none absolute left-3 top-3 z-10 flex items-center gap-1.5 rounded-full bg-[#E01E26] px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-white shadow-lg shadow-black/30"
              data-testid="sponsored-ribbon"
            >
              <Store className="h-3 w-3" /> {t("Sponsored")}
            </div>
          )}
          <div className="pointer-events-none absolute bottom-4 left-4 right-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-[#0E0E0E]">
                {card.cuisine} · {card.price}
              </span>
            </div>
            <h3 className="mt-2 font-serif text-4xl font-medium leading-none text-white drop-shadow">
              {card.name}
            </h3>
          </div>
        </div>

        {result && (
          <motion.div
            initial={DETAIL_INITIAL}
            animate={DETAIL_ANIMATE}
            transition={DETAIL_TRANSITION}
            className="space-y-4 p-5"
          >
            <p className={`flex items-center gap-2 font-serif text-xl font-bold italic ${light ? "text-[#A31621]" : "text-[#E01E26]"}`} data-testid="reaper-line">
              {light ? (mode === "shops" ? <ShoppingBag className="h-4 w-4" /> : mode === "fuel" ? <Fuel className="h-4 w-4" /> : <UtensilsCrossed className="h-4 w-4" />) : <Skull className="h-4 w-4" />} {light ? lightLineFor(card, mode) : reaperLineFor(card)}
            </p>
            {!card.open_now && (
              <p data-testid="closed-reroll-hint" className="rounded-xl bg-[#FCF4F4] px-3 py-2 font-sans text-xs font-bold text-[#E01E26]">
                {t("Closed right now — shuffle again for an open spot.")}
              </p>
            )}
            <div className="flex items-center gap-5 text-sm text-[#0E0E0E]">
              <span className="flex items-center gap-1.5 font-semibold">
                <Star className="h-4 w-4 fill-[#E01E26] text-[#E01E26]" />
                {card.rating > 0 ? card.rating.toFixed(1) : t("New")}
              </span>
              <span className="flex items-center gap-1.5 text-[#6B7075]">
                <MapPin className="h-4 w-4" /> {card.distance} {t("mi away")}
              </span>
            </div>
            {card.address && (
              <p className="font-sans text-sm leading-relaxed text-[#6B7075]">
                {card.address}
              </p>
            )}
            <div className="flex flex-wrap gap-3">
              {card.doordash_url && mode !== "shops" && mode !== "fuel" && (
                <a
                  href={card.doordash_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-testid="doordash-button"
                  className="inline-flex items-center gap-2 rounded-full bg-[#E01E26] px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-[#B3141A]"
                >
                  <ShoppingBag className="h-4 w-4" /> {t("Order on DoorDash")}
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}
              {card.order_url && mode !== "shops" && mode !== "fuel" && (
                <a
                  href={card.order_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-testid="order-online-button"
                  className="inline-flex items-center gap-2 rounded-full border border-[#E2E4E7] bg-white px-4 py-2 text-sm font-semibold text-[#0E0E0E] transition-colors hover:bg-[#EDEEF0]"
                >
                  <ShoppingBag className="h-4 w-4" /> {t("Order online")}
                </a>
              )}
              {card.google_url && (
                <a
                  href={card.google_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-testid="rate-on-google-button"
                  className="inline-flex items-center gap-2 rounded-full bg-[#0E0E0E] px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-[#2A2A2A]"
                >
                  <Star className="h-4 w-4 fill-[#E01E26] text-[#E01E26]" /> {t("Reviews & ratings")}
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}
              <CheckInButton card={card} />
              <button
                onClick={onReSpin}
                data-testid="respin-button"
                className="inline-flex items-center gap-2 rounded-full bg-[#E01E26] px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-[#B3141A]"
              >
                <Dices className="h-4 w-4" /> {t("Shuffle again")}
              </button>
              <button
                onClick={shareFate}
                data-testid="share-fate-button"
                className="inline-flex items-center gap-2 rounded-full border border-[#E2E4E7] bg-white px-4 py-2 text-sm font-semibold text-[#0E0E0E] transition-colors hover:bg-[#EDEEF0]"
              >
                <Share2 className="h-4 w-4" /> {t("Share your fate")}
              </button>
              <button
                onClick={shareFateImage}
                data-testid="share-fate-image-button"
                className="inline-flex items-center gap-2 rounded-full bg-[#0E0E0E] px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-[#2A2A2A]"
              >
                <ImageDown className="h-4 w-4" /> {t("Share as image")}
              </button>
              <button
                onClick={onReset}
                data-testid="reset-spin-button"
                className="inline-flex items-center gap-2 rounded-full border border-[#E2E4E7] bg-white px-4 py-2 text-sm font-semibold text-[#0E0E0E] transition-colors hover:bg-[#EDEEF0]"
              >
                <RotateCcw className="h-4 w-4" /> {t("Clear")}
              </button>
            </div>
            <div className="border-t border-[#E2E4E7] pt-3">
              <SocialShare card={card} />
            </div>
            <button
              onClick={() => onReport?.(card)}
              data-testid="report-closed-button"
              className="inline-flex items-center gap-1.5 pt-1 font-sans text-xs font-semibold text-[#6B7075] underline-offset-2 transition-colors hover:text-[#E01E26] hover:underline"
            >
              <Flag className="h-3.5 w-3.5" /> No longer here? Suggest removal
            </button>

            {alternatives.length > 0 && (
              <div className="border-t border-[#E2E4E7] pt-4" data-testid="alternatives-section">
                <p className="font-sans text-sm font-bold uppercase tracking-[0.18em] text-[#0E0E0E]">
                  {alternatives.length} more to consider
                </p>
                <p className="mt-0.5 font-sans text-xs text-[#6B7075]">
                  Not feeling it? Tap one to re-roll your fate.
                </p>
                <div className="mt-3 space-y-2.5">
                  {alternatives.map((alt) => (
                    <button
                      key={alt.id}
                      onClick={() => onPick?.(alt)}
                      data-testid={`alternative-${alt.id}`}
                      className="group flex w-full items-center gap-3.5 rounded-2xl border border-[#E2E4E7] bg-white p-3 text-left transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-0.5 hover:border-[#E01E26] hover:shadow-[0_8px_24px_rgba(224,30,38,0.14)]"
                    >
                      <span className="relative shrink-0">
                        <img
                          src={alt.image}
                          alt={alt.name}
                          className="h-[72px] w-[72px] rounded-xl object-cover transition-transform duration-200 group-hover:scale-[1.04]"
                        />
                        {alt.sponsored && (
                          <span
                            data-testid={`alternative-sponsored-${alt.id}`}
                            className="absolute -left-1 -top-1 inline-flex items-center gap-1 rounded-full bg-[#E01E26] px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow-md"
                          >
                            <Store className="h-2.5 w-2.5" /> {t("Sponsored")}
                          </span>
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-serif text-lg font-medium leading-tight text-[#0E0E0E]">
                          {alt.name}
                        </span>
                        <span className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 font-sans text-sm text-[#6B7075]">
                          <span>{alt.cuisine} · {alt.price}</span>
                          <span className="flex items-center gap-1">
                            <Star className="h-3.5 w-3.5 fill-[#E01E26] text-[#E01E26]" />
                            {alt.rating > 0 ? alt.rating.toFixed(1) : "New"}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5" /> {alt.distance} mi
                          </span>
                        </span>
                        <span className="mt-1.5 inline-flex items-center gap-1 font-sans text-xs font-bold uppercase tracking-wide text-[#B8BCC2] transition-colors group-hover:text-[#E01E26]">
                          <Dices className="h-3.5 w-3.5" /> Pick this
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {!card.sponsored && (
              <div className="border-t border-[#E2E4E7] pt-4">
                <BecomeSponsorDialog variant="card" />
              </div>
            )}
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
