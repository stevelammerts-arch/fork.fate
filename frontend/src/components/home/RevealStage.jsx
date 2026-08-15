import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Dices, Store, Heart, Star, MapPin, ShoppingBag, Fuel, UtensilsCrossed, Skull, Sparkles, RotateCcw, Flag, Swords, Lock } from "lucide-react";
import GroupVote from "../GroupVote";
import BecomeSponsorDialog from "../BecomeSponsorDialog";
import { OrderDropdown } from "../OrderDropdown";
import { FateActionsDropdown } from "../FateActionsDropdown";
import { CouponReveal } from "./CouponReveal";
import { ChainCouponStrip } from "./ChainCouponStrip";
import { ReactionBar } from "./ReactionBar";
import { useVisibilityRescue } from "../../hooks/useVisibilityRescue";
import { ScratchCover, ThemeCardFrame } from "./ScratchCover";
import { FairyWand } from "./FairyWand";
import { HackTerminal } from "./HackTerminal";
import { CodeBreaker } from "./CodeBreaker";
import { CrankGear } from "./CrankGear";
import { TikiShaker } from "./TikiShaker";
import { SnowGlobe } from "./SnowGlobe";
import { LatteStir } from "./LatteStir";
import { DishDare } from "./DishDare";
import { VolcanoReveal } from "./VolcanoReveal";
import { TarotDraw } from "./TarotDraw";
import { CoffinKnock } from "./CoffinKnock";
import { SeanceCandles } from "./SeanceCandles";
import { OuijaBoard } from "./OuijaBoard";
import { DragonEye } from "./DragonEye";
import { TreasureChest } from "./TreasureChest";
import { LeafPile } from "./LeafPile";
import { CherryBloom } from "./CherryBloom";
import { MelonSmash } from "./MelonSmash";
import { ThemeFlourish, FLOURISH_THEMES, CardinalPerch } from "./ThemeFlourish";
import { Magic8Ball } from "./Magic8Ball";
import { WheelOfFate } from "./WheelOfFate";
import { useLang } from "../../i18n/i18n";
import { RESULT_SPRING, DETAIL_INITIAL, DETAIL_ANIMATE, DETAIL_TRANSITION, reaperLineFor, fairyLineFor, lightLineFor, supportsDelivery, cardImage } from "../../pages/homeConstants";
import { buildFateCard } from "../../pages/homeFateCard";
import { trackEvent } from "../../lib/analytics";

export default function RevealStage({ spinning, flash, deck, result, groupPicks, mode, light, theme, onReset, onReSpin, onReport, onPick, isFavorite, onToggleFavorite, onDare, dareAvailable, locked, rerollsLeft = 0, onSwipeReroll, surprise = null, onSurpriseDone, onDuel }) {
  const { t } = useLang();
  const [confirmingDare, setConfirmingDare] = useState(false);
  // Rescue: if the phone froze animation frames (live Dragon's Hoard bug),
  // force the reveal card visible shortly after each new card mounts.
  const revealRescueRef = useVisibilityRescue(700, result ? result.id : null);
  // Themed flourish: one-shot burst over the card while the reveal sound
  // plays (steam, snow, petals, leaves, fireflies, sparkles, fire wall) —
  // re-fires per revealed place, and after a rare ritual unveils.
  // (Hooks live above the early returns to keep hook order stable.)
  const RARE_COVERS = ["scratch", "8ball", "wheel", "wand", "hack", "code", "crank", "shaker", "volcano", "tarot", "coffin", "seance", "ouija", "eye", "chest", "leaves", "bloom", "melon", "globe", "latte"];
  const isCovered = RARE_COVERS.includes(surprise);
  const resultId = result ? result.id : null;
  const [steaming, setSteaming] = useState(false);
  useEffect(() => {
    if (!FLOURISH_THEMES.has(theme) || isCovered || resultId == null) return;
    setSteaming(true);
    // Cyber's matrix rain keeps falling for the life of the card; the reaper's
    // staggered ghosts + wail, the falling showers (winter/spring/fall) and
    // tiki (the gecko's long wander over the card) get longer windows; all
    // other flourishes clear after ~4.2s.
    if (theme === "cyber") return;
    const life = theme === "dark" ? 8800 : ["winter", "spring", "fall"].includes(theme) ? 8000 : theme === "tiki" ? 13000 : 4200;
    const timer = setTimeout(() => setSteaming(false), life);
    return () => clearTimeout(timer);
  }, [resultId, isCovered, theme]);
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
  // Once the dare is taken the pick is final — no alternatives, no re-shuffle.
  const alternatives = locked ? [] : deck.filter((d) => d.id !== card.id).slice(0, 3);
  // Rare fate: the winner arrives hidden — under themed scratch foil, inside a
  // Magic 8-ball to shake, or on a roulette wheel to flick.
  const covered = isCovered;
  // Swipe-to-reroll: drag the photo header left to tempt fate again (budgeted).
  const swipeEnabled = !locked && !covered && rerollsLeft > 0 && deck.length > 1 && !!onSwipeReroll;
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
        ref={revealRescueRef}
        initial={{ opacity: 0, scale: 0.96, rotate: -2 }}
        animate={{ opacity: 1, scale: 1, rotate: 0 }}
        exit={{ opacity: 0, scale: 0.98 }}
        transition={RESULT_SPRING}
        className="relative rounded-2xl"
        data-testid="spin-result-card"
      >
        <div className="overflow-hidden rounded-2xl">
        <motion.div
          className={`relative overflow-hidden rounded-2xl transition-[height] duration-300 ${covered ? "h-[26rem]" : "h-64"}`}
          data-testid="reveal-photo-header"
          drag={swipeEnabled ? "x" : false}
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.4}
          dragSnapToOrigin
          onDragEnd={(e, info) => { if (swipeEnabled && info.offset.x < -90) onSwipeReroll(); }}
        >
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
          {steaming && <ThemeFlourish theme={theme} variant="reveal" />}
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
            {swipeEnabled && (
              <span
                data-testid="swipe-reroll-hint"
                className="mt-2 inline-flex w-fit items-center gap-1 rounded-full bg-black/55 px-2.5 py-1 font-sans text-[10px] font-bold uppercase tracking-wide text-white/90"
              >
                ← {t("Swipe to tempt fate")} · {rerollsLeft} {t("left")}
              </span>
            )}
          </div>
          {surprise === "scratch" && (
            <>
              <div className="pointer-events-none absolute left-1/2 top-4 z-20 -translate-x-1/2 whitespace-nowrap rounded-full bg-black/70 px-4 py-1.5 font-sans text-xs font-bold uppercase tracking-[0.2em] text-[#E6B23A]" data-testid="rare-fate-badge">
                ✦ {t("Rare fate")} ✦
              </div>
              <ScratchCover
                onDone={onSurpriseDone}
                label={theme === "fairy" ? t("The fae hid your fate — scratch the ring") : t("Scratch to unveil your fate")}
                theme={theme}
                threshold={0.65}
                radius={30}
                testId="rare-fate-scratch-cover"
              />
            </>
          )}
          {surprise === "8ball" && (
            <Magic8Ball name={card.name} onDone={onSurpriseDone} />
          )}
          {surprise === "wand" && (
            <FairyWand onDone={onSurpriseDone} />
          )}
          {surprise === "hack" && (
            <HackTerminal name={card.name} onDone={onSurpriseDone} />
          )}
          {surprise === "code" && (
            <CodeBreaker onDone={onSurpriseDone} />
          )}
          {surprise === "crank" && (
            <CrankGear onDone={onSurpriseDone} />
          )}
          {surprise === "shaker" && (
            <TikiShaker onDone={onSurpriseDone} />
          )}
          {surprise === "volcano" && (
            <VolcanoReveal onDone={onSurpriseDone} />
          )}
          {surprise === "tarot" && (
            <TarotDraw onDone={onSurpriseDone} />
          )}
          {surprise === "coffin" && (
            <CoffinKnock onDone={onSurpriseDone} />
          )}
          {surprise === "seance" && (
            <SeanceCandles onDone={onSurpriseDone} />
          )}
          {surprise === "ouija" && (
            <OuijaBoard name={card.name} onDone={onSurpriseDone} />
          )}
          {surprise === "eye" && (
            <DragonEye onDone={onSurpriseDone} />
          )}
          {surprise === "chest" && (
            <TreasureChest onDone={onSurpriseDone} />
          )}
          {surprise === "leaves" && (
            <LeafPile onDone={onSurpriseDone} />
          )}
          {surprise === "bloom" && (
            <CherryBloom onDone={onSurpriseDone} />
          )}
          {surprise === "melon" && (
            <MelonSmash onDone={onSurpriseDone} />
          )}
          {surprise === "globe" && (
            <SnowGlobe onDone={onSurpriseDone} />
          )}
          {surprise === "latte" && (
            <LatteStir onDone={onSurpriseDone} />
          )}
          {surprise === "wheel" && (
            <WheelOfFate names={deck.map((d) => d.name)} winner={card.name} onDone={onSurpriseDone} />
          )}
          {covered && <ThemeCardFrame theme={theme} />}
        </motion.div>

        {result && !covered && (
          <motion.div
            initial={DETAIL_INITIAL}
            animate={DETAIL_ANIMATE}
            transition={DETAIL_TRANSITION}
            className="space-y-4 p-5"
          >
            <p className={`flex items-center gap-2 font-serif text-xl font-bold italic ${light ? "text-[#A31621]" : "text-[#E01E26]"}`} data-testid="reaper-line">
              {light ? (mode === "shops" ? <ShoppingBag className="h-4 w-4" /> : mode === "fuel" ? <Fuel className="h-4 w-4" /> : <UtensilsCrossed className="h-4 w-4" />) : theme === "fairy" ? <Sparkles className="h-4 w-4" /> : <Skull className="h-4 w-4" />} {light ? lightLineFor(card, mode) : theme === "fairy" ? fairyLineFor(card) : reaperLineFor(card)}
            </p>
            {/* Quick actions live beside the verdict so nothing needs a
                scroll on mobile: shuffle + dare stacked left, chose well /
                failed me stacked right. */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex flex-col items-start gap-2">
                {locked ? (
                  <span
                    data-testid="locked-badge"
                    className="inline-flex items-center gap-1.5 rounded-full bg-[#0E0E0E] px-3 py-1.5 font-sans text-xs font-bold text-[#F0A24E]"
                  >
                    <Lock className="h-3.5 w-3.5" /> {t("Locked in by fate")}
                  </span>
                ) : (
                  <button
                    onClick={onReSpin}
                    data-testid="respin-button"
                    className="inline-flex items-center gap-1.5 rounded-full bg-[#E01E26] px-3 py-1.5 font-sans text-xs font-bold text-white transition-colors hover:bg-[#B3141A]"
                  >
                    <Dices className="h-3.5 w-3.5" /> {t("Shuffle again")}
                  </button>
                )}
                {!locked && dareAvailable && (
                  <button
                    onClick={() => { if (confirmingDare) { setConfirmingDare(false); onDare?.(); } else setConfirmingDare(true); }}
                    onBlur={() => setConfirmingDare(false)}
                    data-testid="double-or-nothing-button"
                    title={t("One reroll — but you have to accept whatever comes up")}
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 font-sans text-xs font-bold transition-colors ${confirmingDare ? "bg-[#B26A12] text-white hover:bg-[#8A5210]" : "border-2 border-[#F0A24E] bg-[#FBF3E7] text-[#B26A12] hover:bg-[#F6E7CF]"}`}
                  >
                    <Swords className="h-3.5 w-3.5" />
                    {confirmingDare ? t("Tap again — no takebacks") : t("Double or Nothing")}
                  </button>
                )}
              </div>
              {/* verdict pills hug the right edge, opposite shuffle + dare */}
              <ReactionBar placeId={card.id} stacked />
            </div>
            {/* Dish Dare: fate picked WHERE — let it pick HOW you order */}
            {["food", "drinks", "desserts", "bars"].includes(mode) && <DishDare key={`dd-${card.id}`} />}
            {!card.open_now && (
              <p data-testid="closed-reroll-hint" className="rounded-xl bg-[#FCF4F4] px-3 py-2 font-sans text-xs font-bold text-[#E01E26]">
                {t("Closed right now — shuffle again for an open spot.")}
              </p>
            )}
            {card.sponsored && card.coupon && card.coupon.code && (
              <CouponReveal sponsorId={card.id} coupon={card.coupon} />
            )}
            <ChainCouponStrip category={card.category ?? mode} excludeId={card.sponsored ? card.id : undefined} />
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
              {supportsDelivery(card.category ?? mode) && (
                <OrderDropdown card={card} label={mode === "desserts" ? t("Order treats") : t("Order / Delivery")} />
              )}
              <FateActionsDropdown
                card={card}
                onShareText={shareFate}
                onShareImage={shareFateImage}
                onDuel={onDuel ? () => onDuel(card) : undefined}
              />
              <button
                onClick={onReset}
                data-testid="reset-spin-button"
                className="inline-flex items-center gap-2 rounded-full border border-[#E2E4E7] bg-white px-4 py-2 text-sm font-semibold text-[#0E0E0E] transition-colors hover:bg-[#EDEEF0]"
              >
                <RotateCcw className="h-4 w-4" /> {t("Clear")}
              </button>
            </div>
            {locked && (
              <p className="font-sans text-sm text-[#6B7075]" data-testid="locked-note">
                {t("You took the dare — this one's final. Hit Clear to start a whole new deal.")}
              </p>
            )}
            {(() => {
              const MERCH = {
                fantasy: { key: "dragon-scene", accent: "#E6B23A", label: "Dragon's Hoard" },
                dark: { key: "reaper-crypt", accent: "#E01E26", label: "Reaper" },
                cyber: { key: "cyber-scene", accent: "#22E0E0", label: "Neon Nights" },
                tiki: { key: "tiki-scene", accent: "#F0A24E", label: "Tiki Lounge" },
              };
              const m = MERCH[theme];
              const accent = m?.accent || "#E01E26";
              const darkText = ["#E6B23A", "#22E0E0", "#F0A24E"].includes(accent);
              return (
                <Link
                  to={m ? `/shop#${m.key}` : "/shop"}
                  data-testid="reveal-shop-cta"
                  onClick={() => trackEvent("merch_cta_click", { from: "reveal", theme })}
                  className="flex items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-bold shadow-md transition-transform hover:-translate-y-0.5"
                  style={{ backgroundColor: accent, color: darkText ? "#0B0B0C" : "#ffffff" }}
                >
                  <ShoppingBag className="h-4 w-4" /> {m ? t("Shop the {theme} tee").replace("{theme}", m.label) : t("Shop Fork·Fate merch")} →
                </Link>
              );
            })()}
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
                          src={cardImage(alt)}
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
                        {alt.sponsored && alt.coupon && alt.coupon.code && (
                          <CouponReveal sponsorId={alt.id} coupon={alt.coupon} variant="compact" />
                        )}
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
        </div>
        {/* winter cardinal perches on the card's TOP edge — rendered outside
            the overflow-hidden wrapper so he isn't clipped by the border */}
        {theme === "winter" && steaming && <CardinalPerch />}
      </motion.div>
    </AnimatePresence>
  );
}
