import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { ArrowLeft, Lock, Layers, CircleDot, Disc3, Wand2, Terminal, KeyRound, Cog, CupSoda, Mountain, Moon, Skull, Flame, Ghost, Eye, Gem, Leaf, Flower2, Citrus, Coffee, Snowflake, Rocket, Grab, Bone, Stamp, ChevronRight, Volleyball, Shell, Waves, Bird, CarFront, Watch, Target, Crown, Feather, Rainbow, Utensils, Bot, Anvil, Wrench, Siren, Truck, Nut, Medal, Share2, CalendarClock, Heart } from "lucide-react";
import { RITUALS, readRitualsSeen, HEISTS, readHeistsSeen, RARITY, rarityOf } from "../lib/rituals";
import { SEASONS, activeSeason, readSeasonalSeen } from "../lib/seasons";
import { buildCollectionShareImage, shareImage } from "../lib/shareCards";
import { readBingo } from "../lib/bingo";
import { readDealDays, readStreak } from "./homeConstants";
import { useLang } from "../i18n/i18n";

const ICONS = {
  scratch: Layers, "8ball": CircleDot, wheel: Disc3, wand: Wand2, hack: Terminal,
  code: KeyRound, crank: Cog, shaker: CupSoda, volcano: Mountain, tarot: Moon,
  coffin: Skull, seance: Flame, ouija: Ghost, eye: Eye, chest: Gem,
  leaves: Leaf, bloom: Flower2, melon: Citrus, globe: Snowflake, latte: Coffee,
  lantern: Flame,
  blackout: Stamp,
};

const HEIST_ICONS = {
  saucer: Rocket, dragon: Grab, grave: Bone, pixie: Wand2, breath: Flame,
  ball: Volleyball, crab: Shell, surf: Waves, spear: Target, spring: Watch,
  gears: Cog, snatch: Ghost, snowman: Snowflake, owl: Bird, petals: Flower2, wreck: CarFront,
  coffee: Coffee, plate: Utensils, unicorn: Rainbow, cardinal: Feather,
  pursuit: Siren, tow: Truck, stash: Nut,
  awakening: Bot, furnace: Anvil, workshop: Wrench,
};

/** Small colored pill naming how hard a fate is to witness. */
const RarityTag = ({ k, kind, t }) => {
  const r = RARITY[rarityOf(k, kind)];
  return (
    <span className="whitespace-nowrap rounded-full px-1.5 py-0.5 font-sans text-[9px] font-bold uppercase tracking-wider" style={{ background: `${r.color}1f`, color: r.color }} data-testid={`rarity-${k}`}>
      {t(r.label)}
    </span>
  );
};

/** The current month as a mini calendar — every day a deal landed burns. */
const StreakCalendar = ({ t }) => {
  const days = readDealDays();
  const streak = readStreak();
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const startDow = new Date(y, m, 1).getDay();
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const iso = (d) => `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  return (
    <div className="mt-3 rounded-2xl border border-white/10 bg-white/5 p-4" data-testid="streak-calendar">
      <div className="flex items-baseline justify-between">
        <span className="font-sans text-xs font-bold uppercase tracking-[0.2em] text-white/50">{t("Deal days")} · {now.toLocaleString(undefined, { month: "long" })}</span>
        {streak >= 2 && (
          <span className="inline-flex items-center gap-1 font-sans text-xs font-bold text-[#FF6B3D]" data-testid="streak-calendar-count">
            <Flame className="h-3.5 w-3.5" /> {streak} {t("day streak")}
          </span>
        )}
      </div>
      <div className="mt-3 grid grid-cols-7 gap-1.5">
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
          <span key={`dow-${i}`} className="text-center font-sans text-[9px] font-bold uppercase text-white/30">{d}</span>
        ))}
        {Array.from({ length: startDow }, (_, i) => <span key={`pad-${i}`} />)}
        {Array.from({ length: daysInMonth }, (_, i) => {
          const d = i + 1;
          const dealt = days.has(iso(d));
          const today = d === now.getDate();
          return (
            <span
              key={`day-${d}`}
              className="flex h-7 items-center justify-center rounded-lg font-sans text-[11px] font-bold"
              style={{
                background: dealt ? "linear-gradient(180deg, #FF6B3D33, #E01E2622)" : "rgba(255,255,255,0.04)",
                color: dealt ? "#FF9A6B" : "rgba(255,255,255,0.35)",
                boxShadow: dealt ? "inset 0 0 0 1px #FF6B3D55" : today ? "inset 0 0 0 1px rgba(255,255,255,0.3)" : "none",
              }}
              data-testid={dealt ? `deal-day-${d}` : undefined}
            >
              {dealt ? <Flame className="h-3.5 w-3.5" /> : d}
            </span>
          );
        })}
      </div>
      <p className="mt-2 font-sans text-[11px] text-white/40">{t("Deal once a day to keep the flames marching. One missed day per run is forgiven.")}</p>
    </div>
  );
};

export default function Rituals() {
  const { t } = useLang();
  const seen = readRitualsSeen();
  const heistsSeen = readHeistsSeen();
  const bingo = readBingo();
  const unlocked = RITUALS.filter((r) => seen[r.key]?.count).length;
  const seasonalSeen = readSeasonalSeen();
  const liveSeason = activeSeason();
  // collection filters: witnessed status + home realm
  const [statusF, setStatusF] = useState("all");   // all | found | missing
  const [realmF, setRealmF] = useState("all");     // all | <realm name>
  const realmList = [...new Set([...RITUALS.map((r) => r.realm), ...HEISTS.map((h) => h.realm)])];
  const matches = (realm, got) =>
    (realmF === "all" || realm === realmF) &&
    (statusF === "all" || (statusF === "found") === got);
  const ritualsShown = RITUALS.filter((r) => matches(r.realm, Boolean(seen[r.key]?.count)));
  const heistsShown = HEISTS.filter((h) => matches(h.realm, Boolean(heistsSeen[h.key]?.count)));

  const handleShare = async () => {
    const realms = [...new Set(HEISTS.map((h) => h.realm))];
    const sealNames = realms.map((realm) => ({
      name: realm,
      earned: HEISTS.filter((h) => h.realm === realm).every((h) => heistsSeen[h.key]?.count),
    }));
    const blob = await buildCollectionShareImage({
      rituals: unlocked, ritualsTotal: RITUALS.length,
      heists: HEISTS.filter((h) => heistsSeen[h.key]?.count).length, heistsTotal: HEISTS.length,
      seals: sealNames.filter((s) => s.earned).length, sealsTotal: sealNames.length,
      sealNames,
    });
    const res = await shareImage(blob, "forkfate-collection.png", t("My Fork·Fate collection — how many fates have you witnessed?"));
    if (res === "downloaded") toast(t("Card saved — share it anywhere."));
  };

  return (
    <div className="min-h-screen bg-[#0E0E0E] px-4 pb-16 pt-6 text-white" data-testid="rituals-page">
      <div className="mx-auto w-full max-w-md">
        <Link to="/" className="inline-flex items-center gap-2 font-sans text-sm font-bold text-white/70 transition-colors hover:text-white" data-testid="rituals-back-link">
          <ArrowLeft className="h-4 w-4" /> {t("Back to the table")}
        </Link>

        <h1 className="mt-4 font-serif text-4xl font-bold" data-testid="rituals-title">{t("Fates Witnessed")}</h1>
        <p className="mt-1 font-sans text-sm text-white/60">{t("Rare rituals your table has survived. Roughly one deal in ten turns rare.")}</p>

        {/* share the whole shelf */}
        <button
          onClick={handleShare}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-[#E6B23A]/40 bg-[#E6B23A]/10 py-3 font-sans text-sm font-bold text-[#E6B23A] transition-colors hover:bg-[#E6B23A]/20"
          data-testid="share-collection-btn"
        >
          <Share2 className="h-4 w-4" /> {t("Share my collection")}
        </button>

        {/* progress */}
        <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4" data-testid="rituals-progress">
          <div className="flex items-baseline justify-between">
            <span className="font-serif text-2xl font-bold text-[#E6B23A]">{unlocked} <span className="text-base text-white/50">/ {RITUALS.length}</span></span>
            <span className="font-sans text-xs font-bold uppercase tracking-[0.2em] text-white/50">{t("witnessed")}</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-[#E6B23A] to-[#F0C878]"
              initial={{ width: 0 }}
              animate={{ width: `${(unlocked / RITUALS.length) * 100}%` }}
              transition={{ duration: 0.9, ease: "easeOut" }}
            />
          </div>
        </div>

        {/* the streak calendar: every deal day burns */}
        <StreakCalendar t={t} />

        {/* filters: hunt by status or by home realm */}
        <div className="mt-5" data-testid="collection-filters">
          <div className="flex gap-1.5">
            {[["all", "All"], ["found", "Found"], ["missing", "Missing"]].map(([v, label]) => (
              <button
                key={v}
                onClick={() => setStatusF(v)}
                className="rounded-full border px-3.5 py-1.5 font-sans text-xs font-bold transition-colors"
                style={statusF === v ? { borderColor: "#E6B23A", background: "#E6B23A1f", color: "#E6B23A" } : { borderColor: "rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.5)" }}
                data-testid={`filter-status-${v}`}
              >
                {t(label)}
              </button>
            ))}
          </div>
          <div className="mt-2 flex gap-1.5 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
            <button
              onClick={() => setRealmF("all")}
              className="whitespace-nowrap rounded-full border px-3 py-1 font-sans text-[11px] font-bold transition-colors"
              style={realmF === "all" ? { borderColor: "#E6B23A", background: "#E6B23A1f", color: "#E6B23A" } : { borderColor: "rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.5)" }}
              data-testid="filter-realm-all"
            >
              {t("Every realm")}
            </button>
            {realmList.map((realm) => (
              <button
                key={realm}
                onClick={() => setRealmF(realm === realmF ? "all" : realm)}
                className="whitespace-nowrap rounded-full border px-3 py-1 font-sans text-[11px] font-bold transition-colors"
                style={realmF === realm ? { borderColor: "#E6B23A", background: "#E6B23A1f", color: "#E6B23A" } : { borderColor: "rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.5)" }}
                data-testid={`filter-realm-${realm.toLowerCase().replace(/[^a-z]+/g, "-")}`}
              >
                {t(realm)}
              </button>
            ))}
          </div>
        </div>

        {/* collection */}
        {ritualsShown.length === 0 && (
          <p className="mt-5 rounded-2xl border border-white/10 bg-white/[0.02] p-4 text-center font-sans text-xs text-white/40" data-testid="rituals-empty">{t("No rituals match this filter.")}</p>
        )}
        <div className="mt-5 grid grid-cols-2 gap-3">
          {ritualsShown.map((r, idx) => {
            const info = seen[r.key];
            const got = Boolean(info?.count);
            const Icon = ICONS[r.key] || Layers;
            return (
              <motion.div
                key={r.key}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.04 }}
                className={`relative overflow-hidden rounded-2xl border p-3.5 ${got ? "bg-white/5" : "border-white/10 bg-white/[0.02]"}`}
                style={got ? { borderColor: `${r.accent}66` } : undefined}
                data-testid={`ritual-card-${r.key}`}
              >
                {got && (
                  <div className="pointer-events-none absolute inset-0 opacity-20" style={{ background: `radial-gradient(circle at 20% 0%, ${r.accent} 0%, transparent 60%)` }} />
                )}
                <div className="flex items-start justify-between">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: got ? `${r.accent}22` : "rgba(255,255,255,0.05)" }}>
                    {got ? <Icon className="h-5 w-5" style={{ color: r.accent }} /> : <Lock className="h-4 w-4 text-white/30" />}
                  </span>
                  <div className="flex flex-col items-end gap-1">
                    <RarityTag k={r.key} kind="ritual" t={t} />
                    {r.limited && (
                      <span className="rounded-full px-2 py-0.5 font-sans text-[10px] font-bold" style={{ background: "#FF8C1A22", color: "#FF8C1A" }} data-testid={`ritual-limited-${r.key}`}>
                        {t("October only")}
                      </span>
                    )}
                    {got && (
                      <span className="rounded-full px-2 py-0.5 font-sans text-[10px] font-bold" style={{ background: `${r.accent}22`, color: r.accent }} data-testid={`ritual-count-${r.key}`}>
                        ×{info.count}
                      </span>
                    )}
                  </div>
                </div>
                <p className={`mt-2.5 font-serif text-base font-bold leading-tight ${got ? "text-white" : "text-white/35"}`} data-testid={`ritual-name-${r.key}`}>
                  {got ? t(r.name) : "? ? ?"}
                </p>
                <p className="mt-0.5 font-sans text-[10px] font-bold uppercase tracking-[0.15em]" style={{ color: got ? r.accent : "rgba(255,255,255,0.3)" }}>
                  {t(r.realm)}
                </p>
                <p className={`mt-1.5 font-sans text-xs leading-snug ${got ? "text-white/60" : "text-white/25 italic"}`}>
                  {got ? t(r.desc) : r.limited ? t("A limited ritual — it only appears while its season haunts the realms.") : t("Keep dealing — this fate hasn't shown itself yet.")}
                </p>
              </motion.div>
            );
          })}
        </div>

        {/* realm heists: rare medallion thefts, tracked like rituals */}
        <h2 className="mt-8 font-serif text-2xl font-bold" data-testid="heists-title">{t("Realm Heists")}</h2>
        <p className="mt-1 font-sans text-sm text-white/60">{t("Sometimes the realm itself steals the house medallion. Keep your eyes on the logo.")}</p>

        {/* the trophy shelf: witnessed heists gleam, the rest wait in shadow */}
        <div className="mt-4 rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.06] to-white/[0.02] p-4" data-testid="heist-trophy-shelf">
          <div className="flex items-baseline justify-between">
            <span className="font-sans text-xs font-bold uppercase tracking-[0.2em] text-white/50">{t("Trophy Shelf")}</span>
            <span className="font-serif text-lg font-bold text-[#E6B23A]" data-testid="trophy-count">
              {HEISTS.filter((h) => heistsSeen[h.key]?.count).length} <span className="text-sm text-white/50">/ {HEISTS.length}</span>
            </span>
          </div>
          {/* HEIST HUNTER: witness every last heist and the crown descends */}
          {(() => {
            const witnessed = HEISTS.filter((h) => heistsSeen[h.key]?.count).length;
            const allDone = witnessed === HEISTS.length;
            return (
              <div className="mt-3 flex flex-col items-center" data-testid="heist-hunter-crown">
                {allDone ? (
                  <motion.div
                    initial={{ opacity: 0, y: -24, scale: 0.6 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ type: "spring", stiffness: 220, damping: 14 }}
                    className="flex flex-col items-center"
                  >
                    <div className="flex h-16 w-16 items-center justify-center rounded-full" style={{ background: "radial-gradient(circle at 35% 30%, #E6B23A66, #E6B23A14 72%)", boxShadow: "0 0 26px #E6B23A80, inset 0 0 12px #E6B23A50", animation: "ffTrophyGlow 2.2s ease-in-out infinite" }}>
                      <Crown className="h-9 w-9 text-[#E6B23A]" style={{ filter: "drop-shadow(0 0 8px #E6B23A)" }} data-testid="heist-hunter-crown-icon" />
                    </div>
                    <p className="mt-1.5 font-serif text-base font-bold text-[#E6B23A]" style={{ textShadow: "0 0 12px rgba(230,178,58,0.5)" }}>{t("Heist Hunter")}</p>
                    <p className="font-sans text-[11px] text-white/50">{t("Every heist in every realm — witnessed.")}</p>
                  </motion.div>
                ) : (
                  <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5">
                    <Crown className="h-4 w-4 text-white/25" />
                    <span className="font-sans text-[11px] text-white/40">{t("Witness all")} {HEISTS.length} {t("to claim the Heist Hunter crown")} · {witnessed}/{HEISTS.length}</span>
                  </div>
                )}
              </div>
            );
          })()}
          {/* REALM SEALS: witness a realm's entire set and its golden seal ignites */}
          {(() => {
            const realms = [...new Set(HEISTS.map((h) => h.realm))];
            return (
              <div className="mt-4" data-testid="realm-badges">
                <p className="text-center font-sans text-[10px] font-bold uppercase tracking-[0.2em] text-white/35">{t("Realm Seals")}</p>
                <div className="mt-2 flex flex-wrap justify-center gap-2">
                  {realms.map((realm) => {
                    const set = HEISTS.filter((h) => h.realm === realm);
                    const got = set.filter((h) => heistsSeen[h.key]?.count).length;
                    const done = got === set.length;
                    const tid = `realm-badge-${realm.toLowerCase().replace(/[^a-z]+/g, "-")}`;
                    return done ? (
                      <motion.div
                        key={realm}
                        initial={{ opacity: 0, scale: 0.5, y: -8 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ type: "spring", stiffness: 240, damping: 15 }}
                        className="flex items-center gap-1.5 rounded-full border px-3 py-1.5"
                        style={{ borderColor: "#E6B23A88", background: "radial-gradient(circle at 30% 30%, #E6B23A33, #E6B23A0d)", boxShadow: "0 0 14px #E6B23A55", animation: "ffTrophyGlow 2.4s ease-in-out infinite" }}
                        data-testid={tid}
                      >
                        <Medal className="h-4 w-4 text-[#E6B23A]" style={{ filter: "drop-shadow(0 0 5px #E6B23A)" }} />
                        <span className="font-sans text-[11px] font-bold text-[#E6B23A]">{t(realm)}</span>
                      </motion.div>
                    ) : (
                      <div key={realm} className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5" data-testid={tid}>
                        <Medal className="h-4 w-4 text-white/20" />
                        <span className="font-sans text-[11px] text-white/40">{t(realm)} · {got}/{set.length}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}
          {Array.from({ length: Math.ceil(HEISTS.length / 8) }, (_, row) => row).map((row) => (
            <div key={`shelf-${row}`} className="mt-3">
              <div className="grid grid-cols-8 gap-1.5">
                {HEISTS.slice(row * 8, row * 8 + 8).map((h, i) => {
                  const got = Boolean(heistsSeen[h.key]?.count);
                  const Icon = HEIST_ICONS[h.key] || Lock;
                  return (
                    <div key={h.key} className="flex flex-col items-center" data-testid={`trophy-${h.key}`}>
                      <motion.div
                        initial={{ opacity: 0, scale: 0.5, y: 8 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ delay: (row * 8 + i) * 0.05, type: "spring", stiffness: 260, damping: 18 }}
                        className="flex h-10 w-10 items-center justify-center rounded-full"
                        style={got ? {
                          background: `radial-gradient(circle at 35% 30%, ${h.accent}55, ${h.accent}14 72%)`,
                          boxShadow: `0 0 14px ${h.accent}59, inset 0 0 8px ${h.accent}40`,
                          animation: "ffTrophyGlow 2.6s ease-in-out infinite",
                          animationDelay: `${(i % 4) * 0.55}s`,
                        } : { background: "rgba(255,255,255,0.04)" }}
                      >
                        {got
                          ? <Icon className="h-5 w-5" style={{ color: h.accent, filter: `drop-shadow(0 0 4px ${h.accent})` }} data-testid={`trophy-icon-${h.key}`} />
                          : <Lock className="h-3.5 w-3.5 text-white/20" />}
                      </motion.div>
                      {/* the pedestal it sits on */}
                      <div className="mt-1 h-1.5 w-8 rounded-[2px]" style={{ background: got ? `linear-gradient(180deg, ${h.accent}77, ${h.accent}1a)` : "linear-gradient(180deg, rgba(255,255,255,0.14), rgba(255,255,255,0.03))" }} />
                    </div>
                  );
                })}
              </div>
              {/* the shelf plank */}
              <div className="mt-1 h-[3px] rounded-full bg-gradient-to-r from-transparent via-[#E6B23A]/40 to-transparent" />
            </div>
          ))}
        </div>
        {/* SEASONAL EVENTS: limited-time fates only witnessable in their window */}
        <h2 className="mt-8 font-serif text-2xl font-bold" data-testid="seasons-title">{t("Seasonal Events")}</h2>
        <p className="mt-1 font-sans text-sm text-white/60">{t("Limited-time takeovers. Their fates can only be witnessed while the season is live — then they vanish for a year.")}</p>
        <div className="mt-4 space-y-3" data-testid="seasons-list">
          {SEASONS.map((s) => {
            const got = Boolean(seasonalSeen[s.fateKey]?.count);
            const live = liveSeason?.id === s.id;
            return (
              <div
                key={s.id}
                className={`relative overflow-hidden rounded-2xl border p-4 ${got ? "bg-white/5" : "border-white/10 bg-white/[0.02]"}`}
                style={got || live ? { borderColor: `${s.accent}66` } : undefined}
                data-testid={`season-card-${s.id}`}
              >
                {(got || live) && (
                  <div className="pointer-events-none absolute inset-0 opacity-15" style={{ background: `radial-gradient(circle at 15% 0%, ${s.accent} 0%, transparent 55%)` }} />
                )}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: got || live ? `${s.accent}22` : "rgba(255,255,255,0.05)" }}>
                      {got ? <Heart className="h-5 w-5" style={{ color: s.accent }} /> : live ? <CalendarClock className="h-5 w-5" style={{ color: s.accent }} /> : <Lock className="h-4 w-4 text-white/30" />}
                    </span>
                    <div>
                      <p className="font-serif text-base font-bold" style={{ color: got || live ? s.accent : "rgba(255,255,255,0.75)" }}>{t(s.fateName)}</p>
                      <p className="font-sans text-[11px] text-white/45">{t(s.name)}</p>
                    </div>
                  </div>
                  {live && (
                    <span className="rounded-full px-2 py-0.5 font-sans text-[10px] font-bold uppercase tracking-wider" style={{ background: `${s.accent}22`, color: s.accent, animation: "ffTrophyGlow 2.2s ease-in-out infinite" }} data-testid={`season-live-${s.id}`}>
                      {t("Live now")}
                    </span>
                  )}
                  {!live && <RarityTag k={s.fateKey} kind="season" t={t} />}
                </div>
                <p className="mt-2 font-sans text-xs leading-relaxed text-white/55">{t(s.desc)}</p>
              </div>
            );
          })}
        </div>

        {heistsShown.length === 0 && (
          <p className="mt-4 rounded-2xl border border-white/10 bg-white/[0.02] p-4 text-center font-sans text-xs text-white/40" data-testid="heists-empty">{t("No heists match this filter.")}</p>
        )}
        <div className="mt-4 grid grid-cols-2 gap-3" data-testid="heists-grid">
          {heistsShown.map((h, idx) => {
            const info = heistsSeen[h.key];
            const got = Boolean(info?.count);
            const Icon = HEIST_ICONS[h.key] || Lock;
            return (
              <motion.div
                key={h.key}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className={`relative overflow-hidden rounded-2xl border p-3.5 ${got ? "bg-white/5" : "border-white/10 bg-white/[0.02]"}`}
                style={got ? { borderColor: `${h.accent}66` } : undefined}
                data-testid={`heist-card-${h.key}`}
              >
                {got && (
                  <div className="pointer-events-none absolute inset-0 opacity-20" style={{ background: `radial-gradient(circle at 20% 0%, ${h.accent} 0%, transparent 60%)` }} />
                )}
                <div className="flex items-start justify-between">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: got ? `${h.accent}22` : "rgba(255,255,255,0.05)" }}>
                    {got ? <Icon className="h-5 w-5" style={{ color: h.accent }} /> : <Lock className="h-4 w-4 text-white/30" />}
                  </span>
                  <div className="flex flex-col items-end gap-1">
                    <RarityTag k={h.key} kind="heist" t={t} />
                    {got && (
                      <span className="rounded-full px-2 py-0.5 font-sans text-[10px] font-bold" style={{ background: `${h.accent}22`, color: h.accent }} data-testid={`heist-count-${h.key}`}>
                        ×{info.count}
                      </span>
                    )}
                  </div>
                </div>
                <p className={`mt-2.5 font-serif text-base font-bold leading-tight ${got ? "text-white" : "text-white/35"}`} data-testid={`heist-name-${h.key}`}>
                  {got ? t(h.name) : "? ? ?"}
                </p>
                <p className="mt-0.5 font-sans text-[10px] font-bold uppercase tracking-[0.15em]" style={{ color: got ? h.accent : "rgba(255,255,255,0.3)" }}>
                  {t(h.realm)}
                </p>
                <p className={`mt-1.5 font-sans text-xs leading-snug ${got ? "text-white/60" : "text-white/25 italic"}`}>
                  {got ? t(h.desc) : t("Linger in a realm — its thief strikes when you least expect it.")}
                </p>
              </motion.div>
            );
          })}
        </div>

        {/* cuisine bingo stamps live in the collection too */}
        <Link
          to="/bingo"
          data-testid="bingo-collection-card"
          className="mt-8 flex items-center justify-between rounded-2xl border border-[#E6B23A]/40 bg-white/5 p-4 transition-colors hover:bg-white/10"
        >
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E6B23A]/15">
              <Stamp className="h-5 w-5 text-[#E6B23A]" />
            </span>
            <div>
              <p className="font-serif text-lg font-bold text-white">{t("Cuisine Bingo")}</p>
              <p className="font-sans text-xs text-white/50">
                {bingo.stamps} {t("stamps earned")}{bingo.cards > 0 ? ` · ${bingo.cards} ${t("cards conquered")}` : ""}
              </p>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-white/40" />
        </Link>

        <p className="mt-6 text-center font-sans text-xs text-white/40">
          {t("Exclusive rituals only appear in their home realm. Switch realms to hunt them all.")}
        </p>
      </div>
    </div>
  );
}
