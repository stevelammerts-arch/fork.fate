// Fate Points balance + Save Progress. The Group/Crawl/Passport toggles moved
// to the browser-style header tabs, and the Trophy Room links now live in the
// header Trophies pill — this card keeps only the player's stash & backups.
import { useEffect, useState } from "react";
import { Coins } from "lucide-react";
import { SaveProgress } from "./SaveProgress";
import RewardsDialog from "./RewardsDialog";
import { readPoints } from "../../lib/points";
import { useLang } from "../../i18n/i18n";

export const MoreWaysToPlay = () => {
  const { t } = useLang();
  const [rewardsOpen, setRewardsOpen] = useState(false);
  const [points, setPoints] = useState(readPoints);
  useEffect(() => {
    const sync = () => setPoints(readPoints());
    window.addEventListener("ff:points", sync);
    return () => window.removeEventListener("ff:points", sync);
  }, []);
  return (
    <div className="mt-2 rounded-3xl border-2 border-[#E6B23A]/70 bg-[#FBEED3]/55 p-4 shadow-[0_2px_14px_rgba(230,178,58,0.28)] backdrop-blur-md" data-testid="modes-card">
      <p className="mb-3 font-sans text-xs font-bold uppercase tracking-[0.2em] text-[#8F6A18]">{t("Your stash")}</p>
      <div className="flex flex-wrap items-center gap-3">
        {/* FATE POINTS: rewards balance + sponsor redemption vault */}
        <button
          type="button"
          data-testid="fate-points-btn"
          onClick={() => setRewardsOpen(true)}
          className="inline-flex w-full items-center justify-center gap-2 whitespace-nowrap rounded-full border-2 border-[#E6B23A] bg-[#101013] px-4 py-2.5 text-sm font-bold text-[#E6B23A] transition-colors hover:bg-[#1E1B12]"
        >
          <Coins className="h-4 w-4" /> {t("Fate Points")}
          <span className="rounded-full bg-[#E6B23A] px-2 py-0.5 text-xs font-bold text-[#101013]" data-testid="fate-points-balance">
            {points.toLocaleString()}
          </span>
        </button>

        {/* back up trophies / witnessed fates so nothing is lost to a cache clear */}
        <div className="w-full">
          <SaveProgress />
        </div>
      </div>
      <RewardsDialog open={rewardsOpen} onClose={() => setRewardsOpen(false)} />
    </div>
  );
};
