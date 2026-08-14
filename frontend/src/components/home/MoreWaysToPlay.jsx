// "More ways to play": Group / Crawl / Passport toggles + collection links.
import { Link } from "react-router-dom";
import { Users, Beer, Stamp, Trophy, Globe2, Sparkles, BookOpen } from "lucide-react";
import { useLang } from "../../i18n/i18n";

const Knob = ({ on }) => (
  <span className={`ml-1 h-4 w-7 rounded-full p-0.5 transition-colors ${on ? "bg-white/40" : "bg-[#D5D8DC]"}`}>
    <span className={`block h-3 w-3 rounded-full bg-white transition-transform ${on ? "translate-x-3" : ""}`} />
  </span>
);

export const MoreWaysToPlay = ({ groupMode, crawlMode, passportMode, onToggleGroup, onToggleCrawl, onTogglePassport }) => {
  const { t } = useLang();
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

        {/* Champions + Passport Wall stay paired on one line */}
        <div className="flex items-center gap-2">
          <Link
            to="/leaderboard"
            data-testid="crawl-champions-link"
            className="inline-flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-full border-2 border-[#F0A24E] bg-white px-4 py-2.5 text-sm font-bold text-[#B26A12] transition-colors hover:bg-[#FBF3E7]"
          >
            <Trophy className="h-4 w-4" /> {t("Champions")}
          </Link>

          <Link
            to="/wall"
            data-testid="passport-wall-link"
            className="inline-flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-full border-2 border-[#2E7D32] bg-white px-4 py-2.5 text-sm font-bold text-[#2E7D32] transition-colors hover:bg-[#E8F3E9]"
          >
            <Globe2 className="h-4 w-4" /> {t("Passport Wall")}
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/rituals"
            data-testid="fates-witnessed-link"
            className="inline-flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-full border-2 border-[#7A4DB2] bg-white px-4 py-2.5 text-sm font-bold text-[#5E3596] transition-colors hover:bg-[#F3EDFA]"
          >
            <Sparkles className="h-4 w-4" /> {t("Fates Witnessed")}
          </Link>

          <Link
            to="/journal"
            data-testid="fate-journal-link"
            className="inline-flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-full border-2 border-[#B3141A] bg-white px-4 py-2.5 text-sm font-bold text-[#B3141A] transition-colors hover:bg-[#FCF4F4]"
          >
            <BookOpen className="h-4 w-4" /> {t("Fate Journal")}
          </Link>
        </div>

        <Link
          to="/bingo"
          data-testid="cuisine-bingo-link"
          className="inline-flex w-full items-center justify-center gap-2 whitespace-nowrap rounded-full border-2 border-[#B98A22] bg-white px-4 py-2.5 text-sm font-bold text-[#8F6A18] transition-colors hover:bg-[#FDF6E7]"
        >
          <Stamp className="h-4 w-4" /> {t("Cuisine Bingo")}
        </Link>
      </div>
    </div>
  );
};
