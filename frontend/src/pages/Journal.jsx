import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, BookOpen, Flame, Skull, Swords, Users } from "lucide-react";
import { readJournal, journalStats } from "../lib/journal";
import { useLang } from "../i18n/i18n";

const REALM_NAMES = {
  light: "Café", dark: "Reaper", fall: "Fall", winter: "Winter", spring: "Spring",
  summer: "Summer", cyber: "Cyberscape", steam: "Steampunk", tiki: "Tiki Lounge",
  fantasy: "Dragon's Hoard", fairy: "Fairy Glen",
};

function StatTile({ label, value, testid }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-3.5 text-center" data-testid={testid}>
      <p className="font-serif text-2xl font-bold text-white">{value}</p>
      <p className="mt-1 font-sans text-[10px] font-bold uppercase tracking-[0.15em] text-white/50">{label}</p>
    </div>
  );
}

export default function Journal() {
  const { t } = useLang();
  const entries = readJournal();
  const s = journalStats(entries);

  return (
    <div className="min-h-screen bg-[#0B0B0D] px-6 py-10 text-white md:px-12">
      <div className="mx-auto max-w-3xl">
        <Link to="/" data-testid="journal-back-link" className="inline-flex items-center gap-2 font-sans text-sm font-bold text-white/60 transition-colors hover:text-white">
          <ArrowLeft className="h-4 w-4" /> {t("Back to the table")}
        </Link>

        <div className="mt-6 flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#E01E26]/15">
            <BookOpen className="h-5 w-5 text-[#E01E26]" />
          </span>
          <div>
            <h1 className="font-serif text-3xl font-bold" data-testid="journal-title">{t("Fate Journal")}</h1>
            <p className="font-sans text-sm text-white/60">{t("Every table fate has dealt you — and how it went.")}</p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatTile label={t("Fates dealt")} value={s.total} testid="journal-stat-total" />
          <StatTile label={t("Chose well")} value={s.wellPct === null ? "—" : `${s.wellPct}%`} testid="journal-stat-well" />
          <StatTile label={t("Dares taken")} value={s.dares} testid="journal-stat-dares" />
          <StatTile label={t("Top cuisine")} value={s.topCuisine ? t(s.topCuisine) : "—"} testid="journal-stat-cuisine" />
        </div>

        {s.judged > 0 && (
          <p className="mt-4 text-center font-serif text-sm italic text-white/50" data-testid="journal-verdict-line">
            {t("You told fate it chose well")} {s.wellPct}% {t("of the time. The Reaper remembers.")}
          </p>
        )}

        {entries.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-dashed border-white/15 p-10 text-center" data-testid="journal-empty">
            <p className="font-serif text-lg text-white/70">{t("No fates yet.")}</p>
            <p className="mt-1 font-sans text-sm text-white/40">{t("Deal your first card and your story begins here.")}</p>
          </div>
        ) : (
          <div className="mt-6 space-y-2.5" data-testid="journal-list">
            {entries.map((e, idx) => (
              <motion.div
                key={`${e.id}-${e.date}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(idx, 12) * 0.03 }}
                className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3"
                data-testid={`journal-entry-${idx}`}
              >
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${e.verdict === "up" ? "bg-[#E01E26]/15" : e.verdict === "down" ? "bg-white/10" : "bg-white/5"}`}>
                  {e.verdict === "up" ? <Flame className="h-5 w-5 text-[#E01E26]" /> : e.verdict === "down" ? <Skull className="h-5 w-5 text-white/70" /> : <span className="font-serif text-white/25">?</span>}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-serif text-base font-bold leading-tight">{e.name}</p>
                  <p className="truncate font-sans text-xs text-white/45">
                    {[e.cuisine, e.price, e.distance != null ? `${e.distance} ${t("mi away")}` : null].filter(Boolean).join(" · ")}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <span className="rounded-full bg-white/10 px-2 py-0.5 font-sans text-[10px] font-bold text-white/60">
                    {t(REALM_NAMES[e.theme] || e.theme || "")}
                  </span>
                  <span className="flex items-center gap-1.5 font-sans text-[10px] text-white/35">
                    {e.dared && <Swords className="h-3 w-3 text-[#F0A24E]" />}
                    {e.group && <Users className="h-3 w-3 text-white/40" />}
                    {new Date(e.date).toLocaleDateString()}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
