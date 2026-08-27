// Browser-style tab bar (design A): Solo Fate / Group Fates / Crawls /
// Passports each get their own "window" — the active tab fuses into the
// header below, the rest sit dimmed on the strip. Lives at the very top of
// the sticky header so navigation is always in reach.
import { useState } from "react";
import { Dices, Users, Beer, Stamp } from "lucide-react";
import { readPassports } from "../../lib/passports";
import { useLang } from "../../i18n/i18n";

export const HomeTabs = ({ light, active, onSelect }) => {
  const { t } = useLang();
  const [passports] = useState(() => readPassports().length);
  const TABS = [
    { id: "solo", icon: Dices, label: "Solo Fates" },
    { id: "group", icon: Users, label: "Groups" },
    { id: "crawls", icon: Beer, label: "Crawls" },
    { id: "passports", icon: Stamp, label: "Passports", badge: passports },
  ];
  const strip = light ? "bg-[#E7DEC9]/90" : "bg-black/50";
  const idle = light ? "text-[#7A6E5C] hover:bg-white/40" : "text-[#8A8F95] hover:bg-white/10";
  // active tab bg matches the header surface so it reads as one connected sheet
  const on = light ? "bg-white/85 text-[#B3141A] shadow-[0_-2px_8px_rgba(0,0,0,0.08)]" : "bg-[#0E0E0E] text-[#FF6B70]";

  return (
    <nav
      data-testid="home-tabs"
      aria-label="Play modes"
      className={`flex items-end gap-1 overflow-x-auto px-2 pt-2 sm:px-4 [scrollbar-width:none] ${strip}`}
    >
      {TABS.map(({ id, icon: Icon, label, badge }) => (
        <button
          key={id}
          type="button"
          data-testid={`home-tab-${id}`}
          aria-selected={active === id}
          role="tab"
          onClick={() => onSelect(id)}
          className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-t-xl px-3 pb-2 pt-2 font-sans text-xs font-bold transition-colors sm:px-4 sm:text-[13px] ${active === id ? on : idle}`}
        >
          <Icon className="h-3.5 w-3.5" /> {t(label)}
          {badge > 0 && (
            <span
              data-testid={`home-tab-${id}-badge`}
              className="ml-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-[#E01E26] px-1 font-sans text-[10px] font-bold leading-none text-white"
            >
              {badge > 99 ? "99+" : badge}
            </span>
          )}
        </button>
      ))}
    </nav>
  );
};
