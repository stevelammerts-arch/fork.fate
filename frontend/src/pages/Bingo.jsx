import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Stamp, Crown, Check, RotateCcw } from "lucide-react";
import { readBingo, bingoCard, completedCellIndexes, newBingoCard } from "../lib/bingo";
import { useLang } from "../i18n/i18n";

export default function Bingo() {
  const { t } = useLang();
  const [state, setState] = useState(readBingo);
  const cells = bingoCard(state.seed);
  const lineCells = completedCellIndexes(cells, state.marked);
  const markedCount = cells.filter((c) => c !== "FREE" && state.marked[c]).length;
  const blackout = markedCount === 24;

  const freshCard = () => {
    newBingoCard();
    setState(readBingo());
  };

  return (
    <div className="min-h-screen bg-[#0B0B0D] px-5 py-10 text-white md:px-12">
      <div className="mx-auto max-w-lg">
        <Link to="/" data-testid="bingo-back-link" className="inline-flex items-center gap-2 font-sans text-sm font-bold text-white/60 transition-colors hover:text-white">
          <ArrowLeft className="h-4 w-4" /> {t("Back to the table")}
        </Link>

        <div className="mt-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#E6B23A]/15">
              <Stamp className="h-5 w-5 text-[#E6B23A]" />
            </span>
            <div>
              <h1 className="font-serif text-3xl font-bold" data-testid="bingo-title">{t("Cuisine Bingo")}</h1>
              <p className="font-sans text-xs text-white/60">{t("Squares stamp themselves when fate deals that cuisine.")}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="font-serif text-2xl font-bold text-[#E6B23A]" data-testid="bingo-stamps">{state.stamps}</p>
            <p className="font-sans text-[10px] font-bold uppercase tracking-[0.15em] text-white/50">{t("Stamps")}</p>
          </div>
        </div>

        <p className="mt-3 font-sans text-xs text-white/40">
          {t("Complete a row, column or diagonal to earn a Collection stamp.")} · {markedCount}/24
        </p>

        <div className="mt-4 grid grid-cols-5 gap-1.5" data-testid="bingo-grid">
          {cells.map((c, i) => {
            const free = c === "FREE";
            const marked = free || !!state.marked[c];
            const inLine = lineCells.has(i);
            return (
              <motion.div
                key={`${state.seed}-${i}`}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: (i % 5) * 0.03 + Math.floor(i / 5) * 0.03 }}
                className={`relative flex aspect-square flex-col items-center justify-center rounded-lg border p-1 text-center ${
                  inLine ? "border-[#E6B23A] bg-[#E6B23A]/15"
                  : marked ? "border-[#E01E26]/60 bg-[#E01E26]/10"
                  : "border-white/10 bg-white/[0.03]"
                }`}
                data-testid={`bingo-cell-${i}`}
              >
                {free ? (
                  <>
                    <Crown className="h-5 w-5 text-[#E6B23A]" />
                    <span className="mt-0.5 font-sans text-[8px] font-bold uppercase tracking-widest text-[#E6B23A]">{t("Free")}</span>
                  </>
                ) : (
                  <>
                    <span className={`font-sans text-[10px] font-bold leading-tight ${marked ? "text-white" : "text-white/55"}`}>{t(c)}</span>
                    {marked && (
                      <span className={`absolute -right-1 -top-1 flex h-5 w-5 rotate-12 items-center justify-center rounded-full ${inLine ? "bg-[#E6B23A] text-black" : "bg-[#E01E26] text-white"}`}>
                        <Check className="h-3 w-3" />
                      </span>
                    )}
                  </>
                )}
              </motion.div>
            );
          })}
        </div>

        {blackout ? (
          <button
            onClick={freshCard}
            data-testid="bingo-new-card"
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#E6B23A] px-5 py-3 font-sans text-sm font-bold text-black transition-colors hover:bg-[#F3D9A0]"
          >
            <RotateCcw className="h-4 w-4" /> {t("Card conquered — deal a fresh card")}
          </button>
        ) : (
          <p className="mt-6 text-center font-serif text-sm italic text-white/40">
            {t("Eat your way across the card — fate fills it in.")}
          </p>
        )}

        {state.cards > 0 && (
          <p className="mt-2 text-center font-sans text-xs text-white/35" data-testid="bingo-cards-done">
            {t("Cards conquered")}: {state.cards}
          </p>
        )}
      </div>
    </div>
  );
}
