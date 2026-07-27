import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { motion } from "framer-motion";
import { Crown } from "lucide-react";
import { useLang } from "../i18n/i18n";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Shows this week's #1 crew (by stops) as a gold pill linking to the Hall of Fate.
// Renders nothing when there's no reigning champion yet.
export default function ReigningChampBadge({ light = false }) {
  const { t } = useLang();
  const [champ, setChamp] = useState(null);

  useEffect(() => {
    let alive = true;
    axios.get(`${API}/crawls/leaderboard`)
      .then(({ data }) => { if (alive) setChamp(data?.week?.stops?.[0] || null); })
      .catch(() => { /* leaderboard optional */ });
    return () => { alive = false; };
  }, []);

  if (!champ) return null;

  return (
    <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <Link
        to="/leaderboard"
        data-testid="reigning-champ-badge"
        title={`This week's reigning champion: ${champ.team_name} (${champ.stops} stops)`}
        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold transition-colors sm:px-4 sm:py-2.5 ${light ? "border-[#E4C86A] bg-[#FBF3DF] text-[#7A5A12] hover:bg-[#F6E9C8]" : "border-[#D4AF37]/50 bg-[#D4AF37]/10 text-[#E4C86A] hover:bg-[#D4AF37]/20"}`}
      >
        <Crown className="h-4 w-4 text-[#D4AF37]" />
        <span className="hidden sm:inline">{t("Champ:")}</span>
        <span className="max-w-[120px] truncate">{champ.team_name}</span>
      </Link>
    </motion.div>
  );
}
