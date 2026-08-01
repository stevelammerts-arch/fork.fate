import { useEffect, useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { Flame, Skull } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const MIN_VOTES_TO_SHOW = 5;

/**
 * One-tap community verdict on a revealed spot: "Fate chose well" (up) vs
 * "Fate failed me" (down). One vote per place per visitor (localStorage +
 * server-side IP dedupe). The community % only shows once a spot has 5+ votes
 * so early spots aren't branded by a single grumpy diner.
 */
export function ReactionBar({ placeId }) {
  const [counts, setCounts] = useState(null);
  const [myVote, setMyVote] = useState(() => {
    try { return localStorage.getItem(`ff_rxn_${placeId}`); } catch (e) { return null; }
  });

  useEffect(() => {
    let live = true;
    setCounts(null);
    try { setMyVote(localStorage.getItem(`ff_rxn_${placeId}`)); } catch (e) { setMyVote(null); }
    axios.get(`${API}/reactions/${encodeURIComponent(placeId)}`)
      .then(({ data }) => { if (live) setCounts(data); })
      .catch(() => {});
    return () => { live = false; };
  }, [placeId]);

  const vote = async (v) => {
    if (myVote) return;
    setMyVote(v);
    try { localStorage.setItem(`ff_rxn_${placeId}`, v); } catch (e) { /* ignore */ }
    // Optimistic bump so the % reacts instantly.
    setCounts((c) => {
      const up = (c?.up || 0) + (v === "up" ? 1 : 0);
      const down = (c?.down || 0) + (v === "down" ? 1 : 0);
      const total = up + down;
      return { up, down, total, pct: total ? Math.round((up / total) * 100) : null };
    });
    try {
      const { data } = await axios.post(`${API}/reactions`, { place_id: placeId, vote: v });
      setCounts(data);
    } catch (e) { /* dedupe or network — optimistic state stands */ }
  };

  const showPct = counts && counts.total >= MIN_VOTES_TO_SHOW && counts.pct !== null;
  const btn = (v, Icon, label, activeCls, idleCls) => (
    <motion.button
      type="button"
      whileTap={{ scale: 0.92 }}
      onClick={() => vote(v)}
      disabled={!!myVote}
      data-testid={`reaction-${v}`}
      aria-pressed={myVote === v}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 font-sans text-xs font-bold transition-colors ${
        myVote === v ? activeCls : myVote ? "border-transparent text-[#B8BCC2]" : idleCls
      }`}
    >
      <Icon className="h-3.5 w-3.5" /> {label}
    </motion.button>
  );

  return (
    <div className="flex flex-wrap items-center gap-2" data-testid="reaction-bar">
      {btn("up", Flame, "Fate chose well",
        "border-[#E01E26] bg-[#FCF4F4] text-[#E01E26]",
        "border-[#E2E4E7] text-[#6B7075] hover:border-[#E01E26] hover:text-[#E01E26]")}
      {btn("down", Skull, "Fate failed me",
        "border-[#0E0E0E] bg-[#EDEEF0] text-[#0E0E0E]",
        "border-[#E2E4E7] text-[#6B7075] hover:border-[#0E0E0E] hover:text-[#0E0E0E]")}
      {showPct && (
        <span className="inline-flex items-center gap-2 font-sans text-xs font-semibold text-[#6B7075]" data-testid="reaction-pct">
          <span className="relative h-1.5 w-16 overflow-hidden rounded-full bg-[#E2E4E7]">
            <span className="absolute inset-y-0 left-0 rounded-full bg-[#E01E26]" style={{ width: `${counts.pct}%` }} />
          </span>
          {counts.pct}% say fate chose well
        </span>
      )}
    </div>
  );
}
