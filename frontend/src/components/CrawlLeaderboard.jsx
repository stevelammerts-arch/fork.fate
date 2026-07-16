import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Zap, Globe, Users, Crown, Loader2, PartyPopper, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { useLang } from "../i18n/i18n";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const fmtTime = (s) => {
  if (s == null) return "—";
  const m = Math.floor(s / 60);
  const sec = s % 60;
  if (m < 60) return `${m}m ${String(sec).padStart(2, "0")}s`;
  const h = Math.floor(m / 60);
  return `${h}h ${String(m % 60).padStart(2, "0")}m`;
};

const rankTitle = (stops) => {
  if (stops >= 6) return "Legendary Reaper";
  if (stops >= 5) return "Fate Conqueror";
  if (stops >= 4) return "Seasoned Wanderer";
  if (stops >= 3) return "Bold Adventurer";
  return "Brave Soul";
};

export { rankTitle, fmtTime };

export default function CrawlLeaderboard({ mode, label, stops = 0, durationSeconds = null, code = null, defaultTeam = "", light = false, ac, onRanked }) {
  const { t } = useLang();
  const [open, setOpen] = useState(false);
  const [team, setTeam] = useState(defaultTeam || "");
  const [posting, setPosting] = useState(false);
  const [posted, setPosted] = useState(false);
  const [rank, setRank] = useState(null);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [scope, setScope] = useState("global");
  const [sort, setSort] = useState("stops");

  useEffect(() => { setTeam(defaultTeam || ""); }, [defaultTeam]);

  const accent = light ? (ac?.card || "#A31621") : "#E01E26";
  const panel = light ? "border-[#E4D9C4] bg-white/70" : "border-[#2A2A2A] bg-[#141414]";
  const chip = (active) =>
    active
      ? "text-white"
      : light
        ? "border border-[#E4D9C4] bg-white text-[#5A5142] hover:bg-[#F1EADB]"
        : "border border-[#3A3A3A] bg-[#1A1A1A] text-[#C7CBD1] hover:bg-white/10";
  const inputCls = light
    ? "w-full rounded-xl border border-[#E4D9C4] bg-white px-4 py-3 text-sm text-[#2A2118] placeholder-[#A99C86] outline-none"
    : "w-full rounded-xl border border-[#2A2A2A] bg-[#1A1A1A] px-4 py-3 text-sm text-white placeholder-[#6B7075] outline-none";

  const loadBoard = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${API}/crawls/leaderboard`, { params: code ? { code } : {} });
      setData(data);
    } catch (e) {
      toast.error(t("Couldn't load the leaderboard — try again"));
    } finally {
      setLoading(false);
    }
  };

  const toggleOpen = () => {
    const next = !open;
    setOpen(next);
    if (next && !data) loadBoard();
  };

  const submit = async () => {
    if (posting) return;
    setPosting(true);
    try {
      const { data } = await axios.post(`${API}/crawls/complete`, {
        team_name: team.trim(),
        stops: Math.max(1, stops),
        mode,
        label,
        code: code || null,
        duration_seconds: durationSeconds || null,
      });
      setPosted(true);
      if (data && data.rank_stops) {
        setRank(data);
        if (onRanked) onRanked(data);
      }
      toast.success(t("You're on the board! 🏆"));
      if (code) setScope("crawl");
      await loadBoard();
    } catch (e) {
      toast.error(t("Couldn't post your run — try again"));
    } finally {
      setPosting(false);
    }
  };

  const board = data ? (data[scope] || data.global) : null;
  const rows = board ? (board[sort] || []) : [];

  const rankBg = (i) => {
    if (i === 0) return "bg-[#D4AF37] text-black";
    if (i === 1) return "bg-[#B8C0C6] text-black";
    if (i === 2) return "bg-[#C77B45] text-black";
    return light ? "bg-[#EDE2CF] text-[#5A5142]" : "bg-[#232323] text-[#C7CBD1]";
  };

  return (
    <div className="mt-1">
      <button
        onClick={toggleOpen}
        data-testid="crawl-leaderboard-toggle"
        className={`inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-bold ${light ? "border border-[#E4D9C4] text-[#2A2118] hover:bg-[#F1EADB]" : "border border-[#3A3A3A] text-white hover:bg-white/10"}`}
      >
        <Trophy className="h-4 w-4" style={{ color: accent }} /> {open ? t("Hide the Leaderboard") : t("See the Leaderboard")}
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className={`mt-3 rounded-2xl border p-4 ${panel}`} data-testid="crawl-leaderboard-panel">
              {!posted ? (
                <div className="mb-4 flex flex-col gap-2" data-testid="crawl-leaderboard-submit">
                  <p className={`text-sm font-bold ${light ? "text-[#2A2118]" : "text-white"}`}>
                    {t("Put your crew on the board")}
                  </p>
                  <p className={`text-xs ${light ? "text-[#8A7C68]" : "text-[#8A8F95]"}`}>
                    {t("Use a team name or nickname — no real names needed.")}
                  </p>
                  <input
                    value={team}
                    onChange={(e) => setTeam(e.target.value.slice(0, 40))}
                    placeholder={t("Team name (e.g. The Night Owls)")}
                    data-testid="crawl-leaderboard-team-input"
                    className={inputCls}
                  />
                  <p className={`text-xs font-semibold ${light ? "text-[#5A5142]" : "text-[#C7CBD1]"}`}>
                    {stops} {stops !== 1 ? t("stops") : t("stop")} {t("conquered")}
                    {durationSeconds != null ? ` · ${fmtTime(durationSeconds)}` : ""} · {t(rankTitle(stops))}
                  </p>
                  <button
                    onClick={submit}
                    disabled={posting}
                    data-testid="crawl-leaderboard-submit-button"
                    className="mt-1 inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-bold text-white disabled:opacity-50"
                    style={{ backgroundColor: accent }}
                  >
                    {posting ? <Loader2 className="h-4 w-4 animate-spin" /> : <PartyPopper className="h-4 w-4" />}
                    {t("Add my crew to the board")}
                  </button>
                </div>
              ) : (
                <div className="mb-3 flex flex-col gap-1.5 rounded-xl px-3 py-2.5" style={{ backgroundColor: `${accent}1A` }} data-testid="crawl-leaderboard-posted">
                  <div className="flex items-center gap-2 text-sm font-bold" style={{ color: accent }}>
                    <Crown className="h-4 w-4" /> {t("Your crew is on the board!")}
                  </div>
                  {rank && rank.rank_stops && (
                    <p className={`text-xs font-semibold ${light ? "text-[#5A5142]" : "text-[#C7CBD1]"}`} data-testid="crawl-leaderboard-rank">
                      {t("Ranked")}{" "}
                      <span className="font-extrabold" style={{ color: accent }}>#{rank.rank_stops}</span>{" "}
                      {t("globally by stops")}
                      {rank.rank_fastest ? (
                        <>
                          {" · "}
                          <span className="font-extrabold" style={{ color: accent }}>#{rank.rank_fastest}</span>{" "}
                          {t("fastest")}
                        </>
                      ) : null}
                      {" "}{t("of")} {rank.total} {t("crews")}. {t("Share it and dare your friends to beat you!")}
                    </p>
                  )}
                </div>
              )}

              {/* Scope + sort tabs */}
              <div className="flex flex-wrap items-center gap-2">
                <button onClick={() => setScope("global")} data-testid="leaderboard-scope-global"
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold ${chip(scope === "global")}`}
                  style={scope === "global" ? { backgroundColor: accent } : undefined}>
                  <Globe className="h-3.5 w-3.5" /> {t("Global")}
                </button>
                {code && (
                  <button onClick={() => setScope("crawl")} data-testid="leaderboard-scope-crawl"
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold ${chip(scope === "crawl")}`}
                    style={scope === "crawl" ? { backgroundColor: accent } : undefined}>
                    <Users className="h-3.5 w-3.5" /> {t("Your Crew")}
                  </button>
                )}
                <span className={`mx-1 h-4 w-px ${light ? "bg-[#E4D9C4]" : "bg-[#3A3A3A]"}`} />
                <button onClick={() => setSort("stops")} data-testid="leaderboard-sort-stops"
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold ${chip(sort === "stops")}`}
                  style={sort === "stops" ? { backgroundColor: accent } : undefined}>
                  <Trophy className="h-3.5 w-3.5" /> {t("Most Stops")}
                </button>
                <button onClick={() => setSort("fastest")} data-testid="leaderboard-sort-fastest"
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold ${chip(sort === "fastest")}`}
                  style={sort === "fastest" ? { backgroundColor: accent } : undefined}>
                  <Zap className="h-3.5 w-3.5" /> {t("Fastest")}
                </button>
              </div>

              {/* Board */}
              <div className="mt-3 space-y-1.5" data-testid="crawl-leaderboard-list">
                {loading ? (
                  <div className={`flex items-center justify-center gap-2 py-8 text-sm ${light ? "text-[#8A7C68]" : "text-[#8A8F95]"}`}>
                    <Loader2 className="h-4 w-4 animate-spin" /> {t("Loading…")}
                  </div>
                ) : rows.length === 0 ? (
                  <p className={`py-6 text-center text-sm ${light ? "text-[#8A7C68]" : "text-[#8A8F95]"}`} data-testid="leaderboard-empty">
                    {sort === "fastest" ? t("No timed runs yet — be the first!") : t("No crews here yet — claim the top spot!")}
                  </p>
                ) : (
                  rows.map((r, i) => (
                    <div key={`${r.team_name}-${i}`} data-testid={`leaderboard-row-${i}`}
                      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 ${light ? "bg-white/70" : "bg-[#1A1A1A]"}`}>
                      <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-extrabold ${rankBg(i)}`}>{i + 1}</span>
                      <div className="min-w-0 flex-1">
                        <p className={`truncate text-sm font-bold ${light ? "text-[#2A2118]" : "text-white"}`}>{r.team_name}</p>
                        <p className={`truncate text-[11px] ${light ? "text-[#8A7C68]" : "text-[#8A8F95]"}`}>{t(rankTitle(r.stops))}</p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-sm font-extrabold" style={{ color: sort === "stops" ? accent : (light ? "#2A2118" : "#FFFFFF") }}>
                          {r.stops} {t("stops")}
                        </p>
                        <p className="text-[11px] font-semibold" style={{ color: sort === "fastest" ? accent : (light ? "#8A7C68" : "#8A8F95") }}>
                          {fmtTime(r.duration_seconds)}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <Link
                to="/leaderboard"
                data-testid="crawl-leaderboard-fullboard-link"
                className={`mt-3 inline-flex w-full items-center justify-center gap-1.5 text-xs font-bold ${light ? "text-[#8A7C68] hover:text-[#2A2118]" : "text-[#8A8F95] hover:text-white"}`}
              >
                {t("See the full Hall of Fate")} <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
