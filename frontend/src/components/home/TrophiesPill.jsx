// Trophies pill for the header: compact Medal pill opening the Trophy Room
// menu (collections, bingo, champions, wall, journal).
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Medal, ChevronDown, Trophy, Globe2, Sparkles, BookOpen, LayoutGrid } from "lucide-react";
import { useLang } from "../../i18n/i18n";

const MENU = [
  { to: "/rituals", tid: "home-menu-trophies", icon: Sparkles, label: "Fates Witnessed" },
  { to: "/bingo", tid: "home-menu-bingo", icon: LayoutGrid, label: "Cuisine Bingo" },
  { to: "/leaderboard", tid: "home-menu-champions", icon: Trophy, label: "Champions" },
  { to: "/wall", tid: "home-menu-wall", icon: Globe2, label: "Passport Wall" },
  { to: "/journal", tid: "home-menu-journal", icon: BookOpen, label: "Fate Journal" },
];

export const TrophiesPill = ({ light, ghost }) => {
  const { t } = useLang();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const close = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [open]);

  return (
    <div className="relative" ref={wrapRef}>
      <button
        type="button"
        data-testid="header-trophies-pill"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 font-sans text-xs font-bold transition-colors sm:text-sm ${ghost}`}
      >
        <Medal className="h-4 w-4 text-[#E6B23A]" /> {t("Trophies")}
        <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div
          data-testid="home-trophies-menu"
          className={`absolute left-0 top-full z-50 mt-2 w-48 overflow-hidden rounded-2xl border-2 shadow-xl sm:left-auto sm:right-0 ${light ? "border-[#E4E4E7] bg-white" : "border-white/20 bg-[#141414]"}`}
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
  );
};
