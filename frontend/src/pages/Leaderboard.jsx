import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { motion } from "framer-motion";
import { Trophy, Zap, Skull, Crown, Loader2, ArrowRight, Users } from "lucide-react";
import { fmtTime, rankTitle } from "../components/CrawlLeaderboard";
import { useLang } from "../i18n/i18n";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const rankChip = (i) => {
  if (i === 0) return "bg-[#D4AF37] text-black";
  if (i === 1) return "bg-[#B8C0C6] text-black";
  if (i === 2) return "bg-[#C77B45] text-black";
  return "bg-[#232323] text-[#C7CBD1]";
};

export default function Leaderboard() {
  const { t } = useLang();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState("stops");

  useEffect(() => {
    let alive = true;
    axios.get(`${API}/crawls/leaderboard`)
      .then(({ data }) => { if (alive) setData(data); })
      .catch(() => { if (alive) setData({ global: { stops: [], fastest: [] } }); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  const rows = data?.global?.[sort] || [];

  const tab = (active) =>
    active ? "bg-[#E01E26] text-white" : "border border-[#3A3A3A] bg-[#1A1A1A] text-[#C7CBD1] hover:bg-white/10";

  return (
    <div className="min-h-screen bg-[#0B0B0B] text-white" data-testid="leaderboard-page">
      {/* Ambient red glow */}
      <div className="pointer-events-none fixed inset-0" style={{ background: "radial-gradient(circle at 50% -10%, rgba(224,30,38,0.22), rgba(224,30,38,0) 55%)" }} />

      <header className="relative z-10 border-b border-[#1E1E1E] bg-[#0E0E0E]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
          <Link to="/" className="flex items-center gap-2" data-testid="leaderboard-home-link">
            <img src="/logo-mark.png" alt="Fork·Fate" className="h-10 w-10 scale-110 object-contain" />
            <span className="font-serif text-2xl font-semibold">Fork·Fate</span>
          </Link>
          <Link
            to="/"
            data-testid="leaderboard-deal-cta"
            className="inline-flex items-center gap-1.5 rounded-full bg-[#E01E26] px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-[#FF2E38] sm:text-sm"
          >
            {t("Deal your fate")} <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-3xl px-4 pb-24 pt-10">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8 text-center"
        >
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#E01E26]/40 bg-[#E01E26]/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-[#E01E26]">
            <Crown className="h-3.5 w-3.5" /> {t("Hall of Fate")}
          </div>
          <h1 className="flame-text font-serif text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
            {t("Crawl Champions")}
          </h1>
          <p className="mx-auto mt-3 max-w-md text-sm text-[#A0A0A0] sm:text-base">
            {t("The bravest crews to ever conquer a Fork·Fate crawl. Think you can top them?")}
          </p>
        </motion.div>

        {/* Sort tabs */}
        <div className="mb-5 flex justify-center gap-2" data-testid="leaderboard-page-tabs">
          <button onClick={() => setSort("stops")} data-testid="leaderboard-page-sort-stops"
            className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold transition-colors ${tab(sort === "stops")}`}>
            <Trophy className="h-4 w-4" /> {t("Most Stops")}
          </button>
          <button onClick={() => setSort("fastest")} data-testid="leaderboard-page-sort-fastest"
            className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold transition-colors ${tab(sort === "fastest")}`}>
            <Zap className="h-4 w-4" /> {t("Fastest")}
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-20 text-[#8A8F95]">
            <Loader2 className="h-5 w-5 animate-spin text-[#E01E26]" /> {t("Summoning the champions…")}
          </div>
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-[#2A2A2A] py-16 text-center" data-testid="leaderboard-page-empty">
            <Skull className="h-10 w-10 text-[#E01E26]" />
            <p className="font-serif text-xl">{t("No champions yet.")}</p>
            <p className="max-w-xs text-sm text-[#A0A0A0]">{t("Be the first crew to conquer a crawl and claim the crown.")}</p>
            <Link to="/" className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-[#E01E26] px-5 py-3 text-sm font-bold text-white hover:bg-[#FF2E38]">
              {t("Start a crawl")} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <div className="space-y-2" data-testid="leaderboard-page-list">
            {rows.map((r, i) => (
              <motion.div
                key={`${r.team_name}-${i}`}
                data-testid={`leaderboard-page-row-${i}`}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04, duration: 0.35 }}
                className={`flex items-center gap-3 rounded-2xl border p-3.5 ${i < 3 ? "border-[#E01E26]/40 bg-gradient-to-r from-[#1A1010] to-[#141414]" : "border-[#232323] bg-[#141414]"}`}
              >
                <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-sm font-extrabold ${rankChip(i)}`}>
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1.5 truncate font-serif text-lg">
                    {i === 0 && <Crown className="h-4 w-4 shrink-0 text-[#D4AF37]" />}
                    {r.team_name}
                  </p>
                  <p className="flex items-center gap-1.5 truncate text-xs text-[#8A8F95]">
                    <Users className="h-3 w-3" /> {t(rankTitle(r.stops))}
                    {r.label ? <span className="text-[#6B7075]">· {r.label}</span> : null}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-base font-extrabold" style={{ color: sort === "stops" ? "#E01E26" : "#FFFFFF" }}>
                    {r.stops} {t("stops")}
                  </p>
                  <p className="text-xs font-semibold" style={{ color: sort === "fastest" ? "#E01E26" : "#8A8F95" }}>
                    {fmtTime(r.duration_seconds)}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
