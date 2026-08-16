// "More ways to play": Group / Crawl / Passport toggles + the Trophy Room
// accordion that gathers all the collection links in one place.
import { useState } from "react";
import { Link } from "react-router-dom";
import { Users, Beer, Stamp, Trophy, Globe2, Sparkles, BookOpen, Medal, ChevronDown } from "lucide-react";
import { useLang } from "../../i18n/i18n";

const Knob = ({ on }) => (
  <span className={`ml-1 h-4 w-7 rounded-full p-0.5 transition-colors ${on ? "bg-white/40" : "bg-[#D5D8DC]"}`}>
    <span className={`block h-3 w-3 rounded-full bg-white transition-transform ${on ? "translate-x-3" : ""}`} />
  </span>
);

export const MoreWaysToPlay = ({ groupMode, crawlMode, passportMode, onToggleGroup, onToggleCrawl, onTogglePassport }) => {
  const { t } = useLang();
  const [trophyOpen, setTrophyOpen] = useState(false);
  const rooms = [
    { to: "/leaderboard", tid: "crawl-champions-link", icon: Trophy, label: "Champions", border: "#F0A24E", color: "#B26A12", hover: "hover:bg-[#FBF3E7]" },
    { to: "/wall", tid: "passport-wall-link", icon: Globe2, label: "Passport Wall", border: "#2E7D32", color: "#2E7D32", hover: "hover:bg-[#E8F3E9]" },
    { to: "/rituals", tid: "fates-witnessed-link", icon: Sparkles, label: "Fates Witnessed", border: "#7A4DB2", color: "#5E3596", hover: "hover:bg-[#F3EDFA]" },
    { to: "/journal", tid: "fate-journal-link", icon: BookOpen, label: "Fate Journal", border: "#B3141A", color: "#B3141A", hover: "hover:bg-[#FCF4F4]" },
    { to: "/bingo", tid: "cuisine-bingo-link", icon: Stamp, label: "Cuisine Bingo", border: "#B98A22", color: "#8F6A18", hover: "hover:bg-[#FDF6E7]" },
  ];
  return (
    <div className="mt-2 rounded-3xl border border-[#E2E4E7] bg-white/95 p-4 shadow-sm backdrop-blur-sm" data-testid="modes-card">
      <p className="mb-3 font-sans text-xs font-bold uppercase tracking-[0.2em] text-[#E01E26]">{t("More ways to play")}</p>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          data-testid="group-mode-toggle"
          onClick={onToggleGroup}
          className={`inline-flex items-center gap-2.5 rounded-full border-2 px-4 py-2.5 text-sm font-bold transition-colors ${groupMode ? "border-[#E01E26] bg-[#E01E26] text-white" : "border-[#0E0E0E] bg-white text-[#0E0E0E] hover:bg-[#EDEEF0]"}`}
        >
          <Users className="h-4 w-4" />
          {t("Group mode")}
          <Knob on={groupMode} />
        </button>

        <button
          type="button"
          data-testid="crawl-mode-toggle"
          onClick={onToggleCrawl}
          className={`inline-flex items-center gap-2.5 rounded-full border-2 px-4 py-2.5 text-sm font-bold transition-colors ${crawlMode ? "border-[#E01E26] bg-[#E01E26] text-white" : "border-[#E01E26] bg-white text-[#E01E26] hover:bg-[#FCECEC]"}`}
        >
          <Beer className="h-4 w-4" />
          {t("Pub Crawls & more")}
          <Knob on={crawlMode} />
        </button>

        <button
          type="button"
          data-testid="passport-mode-toggle"
          onClick={onTogglePassport}
          className={`inline-flex items-center gap-2.5 rounded-full border-2 px-4 py-2.5 text-sm font-bold transition-colors ${passportMode ? "border-[#2E7D32] bg-[#2E7D32] text-white" : "border-[#2E7D32] bg-white text-[#2E7D32] hover:bg-[#E8F3E9]"}`}
        >
          <Stamp className="h-4 w-4" />
          {t("Fate Passport")}
          <Knob on={passportMode} />
        </button>

        {/* THE TROPHY ROOM: all collection & records links in one accordion */}
        <button
          type="button"
          data-testid="trophy-room-btn"
          onClick={() => setTrophyOpen((v) => !v)}
          aria-expanded={trophyOpen}
          className="inline-flex w-full items-center justify-center gap-2 whitespace-nowrap rounded-full border-2 border-[#B98A22] bg-white px-4 py-2.5 text-sm font-bold text-[#8F6A18] transition-colors hover:bg-[#FDF6E7]"
        >
          <Medal className="h-4 w-4" /> {t("Trophy Room")}
          <ChevronDown className={`h-4 w-4 transition-transform duration-300 ${trophyOpen ? "rotate-180" : ""}`} />
        </button>
        <div
          className="grid transition-[grid-template-rows] duration-300 ease-out"
          style={{ gridTemplateRows: trophyOpen ? "1fr" : "0fr" }}
          data-testid="trophy-room-accordion"
        >
          <div className="overflow-hidden">
            <div className="flex flex-col gap-2.5 pt-2.5">
              {rooms.map((r) => (
                <Link
                  key={r.tid}
                  to={r.to}
                  data-testid={r.tid}
                  className={`inline-flex w-full items-center justify-center gap-2 whitespace-nowrap rounded-full border-2 bg-white px-4 py-2.5 text-sm font-bold transition-colors ${r.hover}`}
                  style={{ borderColor: r.border, color: r.color }}
                >
                  <r.icon className="h-4 w-4" /> {t(r.label)}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
