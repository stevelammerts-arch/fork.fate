import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Lock, Layers, CircleDot, Disc3, Wand2, Terminal, KeyRound, Cog, CupSoda, Mountain, Moon, Skull, Flame, Ghost, Eye, Gem, Leaf, Flower2, Citrus, Coffee, Snowflake, Rocket, Grab, Bone, Stamp, ChevronRight } from "lucide-react";
import { RITUALS, readRitualsSeen, HEISTS, readHeistsSeen } from "../lib/rituals";
import { readBingo } from "../lib/bingo";
import { useLang } from "../i18n/i18n";

const ICONS = {
  scratch: Layers, "8ball": CircleDot, wheel: Disc3, wand: Wand2, hack: Terminal,
  code: KeyRound, crank: Cog, shaker: CupSoda, volcano: Mountain, tarot: Moon,
  coffin: Skull, seance: Flame, ouija: Ghost, eye: Eye, chest: Gem,
  leaves: Leaf, bloom: Flower2, melon: Citrus, globe: Snowflake, latte: Coffee,
};

const HEIST_ICONS = { saucer: Rocket, dragon: Grab, grave: Bone };

export default function Rituals() {
  const { t } = useLang();
  const seen = readRitualsSeen();
  const heistsSeen = readHeistsSeen();
  const bingo = readBingo();
  const unlocked = RITUALS.filter((r) => seen[r.key]?.count).length;

  return (
    <div className="min-h-screen bg-[#0E0E0E] px-4 pb-16 pt-6 text-white" data-testid="rituals-page">
      <div className="mx-auto w-full max-w-md">
        <Link to="/" className="inline-flex items-center gap-2 font-sans text-sm font-bold text-white/70 transition-colors hover:text-white" data-testid="rituals-back-link">
          <ArrowLeft className="h-4 w-4" /> {t("Back to the table")}
        </Link>

        <h1 className="mt-4 font-serif text-4xl font-bold" data-testid="rituals-title">{t("Fates Witnessed")}</h1>
        <p className="mt-1 font-sans text-sm text-white/60">{t("Rare rituals your table has survived. Roughly one deal in ten turns rare.")}</p>

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

        {/* collection */}
        <div className="mt-5 grid grid-cols-2 gap-3">
          {RITUALS.map((r, idx) => {
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
                  {got && (
                    <span className="rounded-full px-2 py-0.5 font-sans text-[10px] font-bold" style={{ background: `${r.accent}22`, color: r.accent }} data-testid={`ritual-count-${r.key}`}>
                      ×{info.count}
                    </span>
                  )}
                </div>
                <p className={`mt-2.5 font-serif text-base font-bold leading-tight ${got ? "text-white" : "text-white/35"}`} data-testid={`ritual-name-${r.key}`}>
                  {got ? t(r.name) : "? ? ?"}
                </p>
                <p className="mt-0.5 font-sans text-[10px] font-bold uppercase tracking-[0.15em]" style={{ color: got ? r.accent : "rgba(255,255,255,0.3)" }}>
                  {t(r.realm)}
                </p>
                <p className={`mt-1.5 font-sans text-xs leading-snug ${got ? "text-white/60" : "text-white/25 italic"}`}>
                  {got ? t(r.desc) : t("Keep dealing — this fate hasn't shown itself yet.")}
                </p>
              </motion.div>
            );
          })}
        </div>

        {/* realm heists: rare medallion thefts, tracked like rituals */}
        <h2 className="mt-8 font-serif text-2xl font-bold" data-testid="heists-title">{t("Realm Heists")}</h2>
        <p className="mt-1 font-sans text-sm text-white/60">{t("Sometimes the realm itself steals the house medallion. Keep your eyes on the logo.")}</p>
        <div className="mt-4 grid grid-cols-2 gap-3" data-testid="heists-grid">
          {HEISTS.map((h, idx) => {
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
                  {got && (
                    <span className="rounded-full px-2 py-0.5 font-sans text-[10px] font-bold" style={{ background: `${h.accent}22`, color: h.accent }} data-testid={`heist-count-${h.key}`}>
                      ×{info.count}
                    </span>
                  )}
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
