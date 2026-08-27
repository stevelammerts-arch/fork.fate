// Quick-access tab strip at the very top of the home banner: Crawls,
// Passports, and a Trophies menu (Trophy Room links incl. Cuisine Bingo) —
// three tabs so the strip fits phones without scrolling.
// Crawls/Passports flip the home flow straight into that mode.
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Beer, Stamp, Medal, ChevronDown, Trophy, Globe2, Sparkles, BookOpen, LayoutGrid } from "lucide-react";
import { readPassports } from "../../lib/passports";
import { readRitualsSeen, readHeistsSeen } from "../../lib/rituals";
import { useLang } from "../../i18n/i18n";

const MENU = [
  { to: "/rituals", tid: "home-menu-trophies", icon: Sparkles, label: "Fates Witnessed" },
  { to: "/bingo", tid: "home-menu-bingo", icon: LayoutGrid, label: "Cuisine Bingo" },
  { to: "/leaderboard", tid: "home-menu-champions", icon: Trophy, label: "Champions" },
  { to: "/wall", tid: "home-menu-wall", icon: Globe2, label: "Passport Wall" },
  { to: "/journal", tid: "home-menu-journal", icon: BookOpen, label: "Fate Journal" },
];

const Badge = ({ n, testId }) =>
  n > 0 ? (
    <span
      data-testid={testId}
      className="ml-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-[#E01E26] px-1 font-sans text-[10px] font-bold leading-none text-white"
    >
      {n > 99 ? "99+" : n}
    </span>
  ) : null;

export const HomeTabs = ({ light, crawlMode, passportMode, onCrawls, onPassports }) => {
  const { t } = useLang();
  const [menuOpen, setMenuOpen] = useState(false);
  const wrapRef = useRef(null);
  const [counts] = useState(() => ({
    passports: readPassports().length,
    trophies: Object.keys(readRitualsSeen()).length + Object.keys(readHeistsSeen()).length,
  }));

  useEffect(() => {
    if (!menuOpen) return;
    const close = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setMenuOpen(false); };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [menuOpen]);

  const base = "inline-flex shrink-0 items-center gap-1.5 rounded-full border-2 px-3.5 py-1.5 font-sans text-xs font-bold transition-colors";
  const idle = light
    ? "border-[#E4E4E7] bg-white/80 text-[#3F3F46] hover:bg-[#F4F4F5]"
    : "border-white/25 bg-black/30 text-white hover:bg-white/10";
  const active = "border-[#E01E26] bg-[#E01E26] text-white shadow-[0_2px_10px_rgba(224,30,38,0.45)]";

  return (
    <nav
      data-testid="home-tabs"
      className="relative z-40 mx-auto flex w-full max-w-3xl items-center justify-center gap-2 px-4 pt-3"
      aria-label="Quick play modes"
    >
      <button
        type="button"
        data-testid="home-tab-crawls"
        aria-pressed={crawlMode}
        onClick={onCrawls}
        className={`${base} ${crawlMode ? active : idle}`}
      >
        <Beer className="h-3.5 w-3.5" /> {t("Crawls")}
      </button>
      <button
        type="button"
        data-testid="home-tab-passports"
        aria-pressed={passportMode}
        onClick={onPassports}
        className={`${base} ${passportMode ? active : idle}`}
      >
        <Stamp className="h-3.5 w-3.5" /> {t("Passports")}
        <Badge n={counts.passports} testId="home-tab-passports-badge" />
      </button>
      <div className="relative" ref={wrapRef}>
        <button
          type="button"
          data-testid="home-tab-trophies"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((v) => !v)}
          className={`${base} ${menuOpen ? active : idle}`}
        >
          <Medal className="h-3.5 w-3.5" /> {t("Trophies")}
          <Badge n={counts.trophies} testId="home-tab-trophies-badge" />
          <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${menuOpen ? "rotate-180" : ""}`} />
        </button>
        {menuOpen && (
          <div
            data-testid="home-trophies-menu"
            className={`absolute right-0 top-full z-50 mt-2 w-48 overflow-hidden rounded-2xl border-2 shadow-xl ${light ? "border-[#E4E4E7] bg-white" : "border-white/20 bg-[#141414]"}`}
          >
            {MENU.map(({ to, tid, icon: Icon, label }) => (
              <Link
                key={tid}
                to={to}
                data-testid={tid}
                className={`flex items-center gap-2.5 px-4 py-2.5 font-sans text-xs font-bold transition-colors ${light ? "text-[#3F3F46] hover:bg-[#F4F4F5]" : "text-white hover:bg-white/10"}`}
              >
                <Icon className="h-3.5 w-3.5 text-[#E01E26]" /> {t(label)}
              </Link>
            ))}
          </div>
        )}
      </div>
    </nav>
  );
};
