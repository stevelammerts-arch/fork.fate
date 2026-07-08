import React, { useState } from "react";
import { motion } from "framer-motion";
import { Star, MapPin, Users, Trophy, Plus, RotateCcw, Dices } from "lucide-react";

// Group mode: everyone votes on 3 fate-dealt candidates, highest tally wins.
export default function GroupVote({ picks, onReSpin, onWinner }) {
  const [votes, setVotes] = useState(() => picks.map(() => 0));
  const [locked, setLocked] = useState(false);

  const total = votes.reduce((a, b) => a + b, 0);
  const max = Math.max(...votes);
  const leaders = votes.map((v, i) => (v === max && max > 0 ? i : -1)).filter((i) => i >= 0);
  const addVote = (i) => setVotes((p) => p.map((v, idx) => (idx === i ? v + 1 : v)));

  const lockIn = () => {
    let winnerIdx = leaders.length ? leaders[Math.floor(Math.random() * leaders.length)] : Math.floor(Math.random() * picks.length);
    setLocked(true);
    setTimeout(() => onWinner(picks[winnerIdx]), 650);
  };

  return (
    <div className="grid h-full min-h-[400px] content-start gap-4 p-1" data-testid="group-vote">
      <div className="flex items-center justify-between">
        <p className="flex items-center gap-2 font-sans text-xs font-bold uppercase tracking-[0.2em] text-[#E01E26]">
          <Users className="h-4 w-4" /> Group vote
        </p>
        <span className="font-sans text-xs font-bold text-[#6B7075]" data-testid="group-vote-total">
          {total} vote{total !== 1 && "s"}
        </span>
      </div>
      <p className="font-serif text-2xl leading-tight text-[#0E0E0E]">
        Fate dealt three. Tap to vote, then lock it in.
      </p>

      <div className="mt-1 space-y-3">
        {picks.map((p, i) => {
          const leading = locked && leaders.includes(i);
          return (
            <motion.div
              key={p.id}
              data-testid={`group-pick-${i}`}
              animate={leading ? { scale: 1.02 } : { scale: 1 }}
              className={`flex items-center gap-3 rounded-2xl border p-2 transition-colors ${
                leading ? "border-[#E01E26] bg-[#FCF4F4]" : "border-[#E2E4E7] bg-white"
              }`}
            >
              <div className="relative">
                <img src={p.image} alt={p.name} className="h-16 w-16 shrink-0 rounded-xl object-cover" />
                {leading && (
                  <span className="absolute -right-1.5 -top-1.5 grid h-6 w-6 place-items-center rounded-full bg-[#E01E26] text-white">
                    <Trophy className="h-3.5 w-3.5" />
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-serif text-lg font-medium leading-tight text-[#0E0E0E]">{p.name}</p>
                <p className="mt-0.5 flex items-center gap-2 font-sans text-xs text-[#6B7075]">
                  <span>{p.cuisine} · {p.price}</span>
                  <span className="flex items-center gap-1">
                    <Star className="h-3 w-3 fill-[#E01E26] text-[#E01E26]" />
                    {p.rating > 0 ? p.rating.toFixed(1) : "New"}
                  </span>
                  <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {p.distance} mi</span>
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span data-testid={`group-pick-count-${i}`} className="min-w-6 text-center font-serif text-xl font-bold text-[#0E0E0E]">
                  {votes[i]}
                </span>
                {!locked && (
                  <button
                    onClick={() => addVote(i)}
                    data-testid={`group-vote-button-${i}`}
                    className="grid h-9 w-9 place-items-center rounded-full bg-[#0E0E0E] text-white transition-colors hover:bg-[#E01E26]"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="mt-2 flex flex-wrap gap-3">
        <button
          onClick={lockIn}
          disabled={locked}
          data-testid="group-lock-in-button"
          className="inline-flex items-center gap-2 rounded-full bg-[#E01E26] px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#B3141A] disabled:opacity-60"
        >
          <Trophy className="h-4 w-4" /> {total === 0 ? "Lock in random" : "Lock in winner"}
        </button>
        <button
          onClick={onReSpin}
          disabled={locked}
          data-testid="group-respin-button"
          className="inline-flex items-center gap-2 rounded-full border border-[#E2E4E7] bg-white px-5 py-2.5 text-sm font-semibold text-[#0E0E0E] transition-colors hover:bg-[#EDEEF0] disabled:opacity-60"
        >
          <Dices className="h-4 w-4" /> Deal 3 again
        </button>
      </div>
    </div>
  );
}
