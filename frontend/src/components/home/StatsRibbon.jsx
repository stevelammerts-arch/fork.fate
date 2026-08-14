// Fates-dealt / crawls-survived / streak ribbon under the setup column.
import { Dices, Trophy, Flame } from "lucide-react";
import { useLang } from "../../i18n/i18n";

export const StatsRibbon = ({ fatesDealt, crawlsCompleted, streak, light, ambCfg }) => {
  const { t } = useLang();
  if (fatesDealt === null) return null;
  return (
    <div className="mt-4 inline-flex items-center gap-2 font-sans text-sm" data-testid="fates-dealt-counter" style={{ color: light ? "#6B7075" : (ambCfg ? ambCfg.sky : "rgba(255,255,255,0.72)") }}>
      <Dices className="h-4 w-4" style={{ color: ambCfg ? ambCfg.accent : "#E01E26" }} />
      <span><span className="font-bold" style={{ color: light ? "#0E0E0E" : (ambCfg ? ambCfg.sky : "#FFFFFF") }}>{fatesDealt.toLocaleString()}</span> {t("fates dealt")}</span>
      {crawlsCompleted !== null && crawlsCompleted > 0 && (
        <span className="ml-3 inline-flex items-center gap-1.5" data-testid="crawls-completed-counter">
          <Trophy className="h-4 w-4" style={{ color: ambCfg ? ambCfg.accent : "#E01E26" }} />
          <span><span className="font-bold" style={{ color: light ? "#0E0E0E" : (ambCfg ? ambCfg.sky : "#FFFFFF") }}>{crawlsCompleted.toLocaleString()}</span> {t("crawls survived")}</span>
        </span>
      )}
      {streak >= 2 && (
        <span className="ml-3 inline-flex items-center gap-1.5 rounded-full bg-[#FCF4F4] px-3 py-1 text-[#E01E26]" data-testid="streak-badge">
          <Flame className="h-4 w-4" /><span className="font-bold">{streak} {t("day streak")}</span>
        </span>
      )}
    </div>
  );
};
