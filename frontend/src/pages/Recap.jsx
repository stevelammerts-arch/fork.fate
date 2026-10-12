import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { ArrowLeft, Dices, UtensilsCrossed, ThumbsUp, Swords, Castle, Flame, MapPin, Sparkles, Share2, Trophy } from "lucide-react";
import { useLang } from "../i18n/i18n";
import { buildRecap } from "../lib/recap";
import { buildRecapShareImage, shareImage } from "../lib/shareCards";

// FATE RECAP — a "Wrapped"-style, tap-through story of the player's year (or
// month) in fates: totals, flavors, verdicts, realms, duels and streaks.

const BGS = [
  "linear-gradient(160deg,#1A1A1D 0%,#2B0A0E 55%,#4A0E14 100%)",
  "linear-gradient(160deg,#0E2A3F 0%,#123A56 60%,#2E77A6 100%)",
  "linear-gradient(160deg,#17100A 0%,#3A2810 60%,#6B4A1C 100%)",
  "linear-gradient(160deg,#070A16 0%,#160A28 60%,#2A1246 100%)",
  "linear-gradient(160deg,#0B1F14 0%,#14432A 60%,#1E5C38 100%)",
  "linear-gradient(160deg,#1C0808 0%,#571309 60%,#7E1B0E 100%)",
  "linear-gradient(160deg,#2A140A 0%,#3A1C0E 60%,#5C3216 100%)",
];

const Big = ({ children }) => (
  <p className="font-serif text-7xl font-semibold leading-none text-white sm:text-8xl" data-testid="recap-big-stat">{children}</p>
);
const Eyebrow = ({ children }) => (
  <p className="font-sans text-xs font-bold uppercase tracking-[0.3em] text-white/60">{children}</p>
);
const Caption = ({ children }) => (
  <p className="max-w-xs font-sans text-sm leading-relaxed text-white/80">{children}</p>
);

export default function Recap() {
  const { t } = useLang();
  const now = new Date();
  // Deep link support: /recap?period=YYYY-MM lands on that month (used by the
  // month-rollover share nudge), &share=1 jumps to the finale with the share
  // button pulsing — one tap to post last month's card.
  const [params] = useSearchParams();
  const periodParam = params.get("period");
  const autoShare = params.get("share") === "1";
  const [periodOverride, setPeriodOverride] = useState(() =>
    periodParam && /^\d{4}-\d{2}$/.test(periodParam)
      ? { year: Number(periodParam.slice(0, 4)), month: Number(periodParam.slice(5)) - 1 }
      : null
  );
  const [scope, setScope] = useState("year"); // "year" | "month"
  const [idx, setIdx] = useState(autoShare ? 99 : 0); // 99 clamps to the finale slide
  const stats = useMemo(
    () => buildRecap(periodOverride || { year: now.getFullYear(), month: scope === "month" ? now.getMonth() : null }),
    [scope, periodOverride] // eslint-disable-line react-hooks/exhaustive-deps
  );

  const slides = useMemo(() => {
    const s = [];
    s.push({
      id: "intro",
      icon: Sparkles,
      body: (
        <>
          <Eyebrow>{t("Fate Recap")}</Eyebrow>
          <p className="font-serif text-5xl font-semibold leading-tight text-white sm:text-6xl">{t("Your")} {stats.label} {t("in fates")}</p>
          <Caption>{t("Every deal, dare and duel — tallied. Tap through to see how fate treated you.")}</Caption>
        </>
      ),
    });
    s.push({
      id: "total",
      icon: Dices,
      body: (
        <>
          <Eyebrow>{t("Fates dealt")}</Eyebrow>
          <Big>{stats.total}</Big>
          <Caption>
            {stats.total === 0
              ? t("The table's been quiet. Shuffle a fate and this page comes alive.")
              : `${stats.uniquePlaces} ${t("different spots surrendered to the shuffle.")}`}
          </Caption>
        </>
      ),
    });
    if (stats.topCuisine) s.push({
      id: "cuisine",
      icon: UtensilsCrossed,
      body: (
        <>
          <Eyebrow>{t("Your fated flavor")}</Eyebrow>
          <p className="font-serif text-6xl font-semibold leading-tight text-white">{stats.topCuisine.key}</p>
          <Caption>{t("Fate sent you there")} {stats.topCuisine.count}x. {t("Coincidence? Fate doesn't do coincidence.")}</Caption>
        </>
      ),
    });
    if (stats.wellPct != null) s.push({
      id: "verdict",
      icon: ThumbsUp,
      body: (
        <>
          <Eyebrow>{t("The verdicts are in")}</Eyebrow>
          <Big>{stats.wellPct}%</Big>
          <Caption>{t("of your judged fates, you admitted fate chose well.")} ({stats.judged} {t("verdicts cast")})</Caption>
        </>
      ),
    });
    if (stats.dares > 0) s.push({
      id: "dares",
      icon: Flame,
      body: (
        <>
          <Eyebrow>{t("Double or Nothing")}</Eyebrow>
          <Big>{stats.dares}</Big>
          <Caption>{t("times you dared fate with no takebacks. Respect.")}</Caption>
        </>
      ),
    });
    if (stats.topRealm) s.push({
      id: "realm",
      icon: Castle,
      body: (
        <>
          <Eyebrow>{t("Home realm")}</Eyebrow>
          <p className="font-serif text-6xl font-semibold leading-tight text-white">{t(stats.topRealm.label)}</p>
          <Caption>{stats.topRealm.count} {t("fates dealt under its sky — more than anywhere else.")}</Caption>
        </>
      ),
    });
    if (stats.duels) s.push({
      id: "duels",
      icon: Swords,
      body: (
        <>
          <Eyebrow>{t("Duel record")}</Eyebrow>
          <Big>{stats.duels.wins}–{stats.duels.losses}</Big>
          <Caption>{stats.duels.wins >= stats.duels.losses ? t("Your picks bow to no one.") : t("Rivals got lucky. Fate remembers.")}</Caption>
        </>
      ),
    });
    if (stats.bestStreak > 1 || stats.checkins > 0) s.push({
      id: "streaks",
      icon: MapPin,
      body: (
        <>
          <Eyebrow>{t("Dedication")}</Eyebrow>
          <Big>{stats.bestStreak}</Big>
          <Caption>
            {t("day best login streak")}
            {stats.checkins > 0 && <> · {stats.checkins} {t("GPS check-ins at fated spots")}</>}
            {stats.checkinWeekStreak >= 2 && <> · {stats.checkinWeekStreak} {t("week check-in run going")}</>}
          </Caption>
        </>
      ),
    });
    if (stats.secretsFound > 0) s.push({
      id: "secrets",
      icon: Trophy,
      body: (
        <>
          <Eyebrow>{t("Hidden bonuses")}</Eyebrow>
          <Big>{stats.secretsFound}<span className="text-4xl text-white/50">/{stats.secretsTotal}</span></Big>
          <Caption>{t("realm secrets uncovered. The realms notice players who pay attention.")}</Caption>
        </>
      ),
    });
    s.push({ id: "finale", icon: Sparkles, finale: true });
    return s;
  }, [stats, t]);

  const clampedIdx = Math.min(idx, slides.length - 1);
  const slide = slides[clampedIdx];
  const next = () => setIdx((i) => Math.min(i + 1, slides.length - 1));
  const prev = () => setIdx((i) => Math.max(i - 1, 0));

  const [sharing, setSharing] = useState(false);
  const shareRecap = async () => {
    if (sharing) return;
    setSharing(true);
    try {
      // a proper Wrapped-style image card — not just text
      const blob = await buildRecapShareImage(stats);
      const bits = [`My ${stats.label} on Fork·Fate: ${stats.total} fates dealt`];
      if (stats.topCuisine) bits.push(`fated flavor: ${stats.topCuisine.key}`);
      if (stats.wellPct != null) bits.push(`${stats.wellPct}% chose-well rate`);
      const res = await shareImage(blob, `forkfate-recap-${stats.label.replace(/\s+/g, "-").toLowerCase()}.png`, `${bits.join(" · ")}. Shuffle your own fate at fork-fate.com!`);
      if (res === "downloaded") toast.success(t("Recap card saved — post it anywhere!"));
    } catch (e) {
      toast.error(t("Couldn't build the card — grab a screenshot instead!"));
    } finally {
      setSharing(false);
    }
  };

  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden" style={{ background: BGS[clampedIdx % BGS.length], transition: "background 0.6s ease" }} data-testid="recap-page">
      {/* top chrome: back, scope toggle, progress (cleared of the status bar
          on edge-to-edge Android 15+ / notched iPhones) */}
      <div className="relative z-20 px-4" style={{ paddingTop: "calc(1.25rem + env(safe-area-inset-top))" }}>
        <div className="mx-auto flex max-w-lg items-center justify-between">
          <Link to="/" data-testid="recap-back" className="inline-flex items-center gap-1.5 font-sans text-sm font-bold text-white/70 transition-colors hover:text-white">
            <ArrowLeft className="h-4 w-4" /> {t("Back")}
          </Link>
          <div className="flex rounded-full border border-white/25 bg-black/30 p-0.5 backdrop-blur">
            {["year", "month"].map((k) => (
              <button
                key={k}
                type="button"
                data-testid={`recap-scope-${k}`}
                onClick={() => { setPeriodOverride(null); setScope(k); setIdx(0); }}
                className={`rounded-full px-3.5 py-1 font-sans text-xs font-bold transition-colors ${!periodOverride && scope === k ? "bg-white text-[#0E0E0E]" : "text-white/70"}`}
              >
                {k === "year" ? t("This Year") : t("This Month")}
              </button>
            ))}
          </div>
        </div>
        <div className="mx-auto mt-4 flex max-w-lg gap-1" data-testid="recap-progress">
          {slides.map((sl, i) => (
            <span key={sl.id} className={`h-1 flex-1 rounded-full transition-colors duration-300 ${i <= clampedIdx ? "bg-white" : "bg-white/25"}`} />
          ))}
        </div>
      </div>

      {/* tap zones: left third = back, rest = forward */}
      <button type="button" aria-label="previous" data-testid="recap-tap-prev" onClick={prev} className="absolute inset-y-0 left-0 z-10 w-1/3" />
      <button type="button" aria-label="next" data-testid="recap-tap-next" onClick={next} className="absolute inset-y-0 right-0 z-10 w-2/3" />

      {/* content sits above the tap zones but lets taps fall through — only
          the finale CTAs re-enable pointer events */}
      <div className="pointer-events-none relative z-20 flex flex-1 items-center justify-center px-8 pb-20">
        <AnimatePresence mode="wait">
          <motion.div
            key={`${scope}-${slide.id}`}
            initial={{ opacity: 0, y: 26, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -18 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
            className="flex w-full max-w-lg flex-col items-start gap-5"
            data-testid={`recap-slide-${slide.id}`}
          >
            <span className="grid h-14 w-14 place-items-center rounded-2xl border border-white/20 bg-white/10 backdrop-blur">
              <slide.icon className="h-6 w-6 text-[#E6B23A]" />
            </span>
            {slide.finale ? (
              <>
                <Eyebrow>{t("That was your")} {stats.label}</Eyebrow>
                <p className="font-serif text-4xl font-semibold leading-tight text-white sm:text-5xl">{t("Fate isn't done with you yet.")}</p>
                <div className="grid w-full grid-cols-2 gap-2.5" data-testid="recap-summary-grid">
                  {[
                    [stats.total, t("fates dealt")],
                    [stats.topCuisine?.key || "—", t("top flavor")],
                    [stats.wellPct != null ? `${stats.wellPct}%` : "—", t("chose well")],
                    [stats.bestStreak || "—", t("best streak")],
                  ].map(([v, l]) => (
                    <div key={l} className="rounded-2xl border border-white/15 bg-black/25 px-4 py-3 backdrop-blur">
                      <p className="font-serif text-2xl font-semibold text-white">{v}</p>
                      <p className="font-sans text-[11px] font-bold uppercase tracking-wide text-white/55">{l}</p>
                    </div>
                  ))}
                </div>
                <div className="pointer-events-auto flex gap-2.5">
                  <button type="button" onClick={shareRecap} disabled={sharing} data-testid="recap-share-button" className={`inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 font-sans text-sm font-bold text-[#0E0E0E] transition-transform hover:-translate-y-0.5 disabled:opacity-60 ${autoShare ? "ff-share-pulse" : ""}`}>
                    <Share2 className="h-4 w-4" /> {sharing ? t("Building card…") : t("Share my recap")}
                  </button>
                  <Link to="/" data-testid="recap-deal-again" className="inline-flex items-center gap-2 rounded-full border border-white/30 px-5 py-2.5 font-sans text-sm font-bold text-white transition-colors hover:bg-white/10">
                    <Dices className="h-4 w-4" /> {t("Deal a fate")}
                  </Link>
                </div>
              </>
            ) : (
              slide.body
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {!slide.finale && (
        <p className="pointer-events-none absolute left-1/2 z-0 -translate-x-1/2 font-sans text-[11px] font-bold uppercase tracking-[0.25em] text-white/35" style={{ bottom: "calc(1.25rem + env(safe-area-inset-bottom))" }}>
          {t("Tap to continue")}
        </p>
      )}
    </div>
  );
}
