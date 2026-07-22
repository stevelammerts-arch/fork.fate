import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Skull, Cog } from "lucide-react";

const DECK_SIZE = 5;

// Branded card back shown on every shuffling card (photo only appears on the landed winner)
function CardBack({ light, seasonItem, theme }) {
  if (seasonItem) {
    return (
      <div className="absolute inset-0 grid place-items-center bg-[#F5F0E6]" data-testid="card-back">
        <img src={seasonItem} alt="" className="h-3/4 w-3/4 object-contain drop-shadow-md" />
      </div>
    );
  }
  if (light) {
    return (
      <div className="absolute inset-0 bg-[#F5F0E6]" data-testid="card-back">
        <img src="/card-back-light.png" alt="" className="h-full w-full object-cover" />
      </div>
    );
  }
  if (theme === "cyber") {
    return (
      <div className="absolute inset-0 grid place-items-center overflow-hidden bg-[#080B18]" data-testid="card-back">
        <div className="absolute inset-0" style={{ background: "radial-gradient(circle at 50% 46%, rgba(34,224,224,0.20), rgba(0,0,0,0) 66%)" }} />
        <div className="absolute inset-2 rounded-xl border border-[#22E0E0]/60" style={{ boxShadow: "inset 0 0 14px rgba(34,224,224,0.45)" }} />
        <img src="/cyber-spinner-suv.png" alt="" className="w-[84%] object-contain" style={{ filter: "drop-shadow(0 0 10px rgba(34,224,224,0.8)) drop-shadow(0 0 20px rgba(199,125,255,0.55))" }} />
        <span className="absolute bottom-4 font-sans text-[8px] font-bold uppercase tracking-[0.45em] text-[#FF6FCB]" style={{ textShadow: "0 0 8px rgba(255,47,176,0.7)" }}>Neon Nights</span>
      </div>
    );
  }
  if (theme === "tiki") {
    const accent = "#F0A24E";
    return (
      <div className="absolute inset-0 grid place-items-center bg-[#141210]" data-testid="card-back">
        <div className="absolute inset-2 rounded-xl border" style={{ borderColor: `${accent}88` }} />
        <div className="absolute inset-[10px] rounded-lg border" style={{ borderColor: `${accent}33` }} />
        <div className="absolute inset-0" style={{ background: "radial-gradient(circle at 50% 45%, rgba(240,162,78,0.18), rgba(0,0,0,0) 62%)" }} />
        <div className="flex flex-col items-center gap-2">
          <img src="/tiki-mask.png" alt="" className="h-3/4 w-auto max-w-[78%] object-contain drop-shadow-[0_4px_12px_rgba(0,0,0,0.65)]" />
        </div>
      </div>
    );
  }
  if (theme === "steam") {
    const brass = "#D9A44E";
    return (
      <div className="absolute inset-0 grid place-items-center overflow-hidden" data-testid="card-back"
        style={{ background: "radial-gradient(circle at 50% 42%, #3A2A18 0%, #1A120B 72%)" }}>
        <div className="absolute inset-0" style={{ background: "radial-gradient(circle at 50% 44%, rgba(217,164,78,0.22), rgba(0,0,0,0) 62%)" }} />
        <div className="relative flex items-center justify-center">
          <Cog className="h-24 w-24" strokeWidth={1.1} style={{ color: brass, filter: "drop-shadow(0 2px 5px rgba(0,0,0,0.55))" }} />
          <Cog className="absolute -bottom-5 -right-6 h-12 w-12" strokeWidth={1.15} style={{ color: "#B9833A" }} />
          <span className="absolute h-3 w-3 rounded-full" style={{ background: "radial-gradient(circle at 35% 30%, #F3D28A, #8A5E24)" }} />
        </div>
        <div className="absolute inset-2 rounded-xl border" style={{ borderColor: `${brass}99`, boxShadow: "inset 0 0 12px rgba(217,164,78,0.32)" }} />
        <div className="absolute inset-[10px] rounded-lg border" style={{ borderColor: `${brass}40` }} />
        {[["7px", "7px", "auto", "auto"], ["7px", "auto", "auto", "7px"], ["auto", "7px", "7px", "auto"], ["auto", "auto", "7px", "7px"]].map((p) => (
          <span key={p.join("-")} className="absolute h-1.5 w-1.5 rounded-full" style={{ top: p[0], right: p[1], bottom: p[2], left: p[3], background: "radial-gradient(circle at 35% 30%, #F3D28A, #7A5220)" }} />
        ))}
        <span className="absolute bottom-4 font-serif text-[9px] uppercase tracking-[0.4em]" style={{ color: brass }}>Clockwork</span>
      </div>
    );
  }
  return (
    <div className="absolute inset-0 bg-[#0E0E0E]" data-testid="card-back">
      <div
        className="absolute inset-0"
        style={{ background: "radial-gradient(circle at 50% 42%, rgba(224,30,38,0.20), rgba(0,0,0,0) 62%)" }}
      />
      <div className="absolute inset-2 rounded-xl border border-[#E01E26]/70" />
      <div className="absolute inset-[10px] rounded-lg border border-[#E01E26]/25" />
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
        <Skull className="h-14 w-14 text-[#E01E26]" strokeWidth={1.25} />
        <span className="font-serif text-[10px] uppercase tracking-[0.4em] text-[#C7CACE]">
          Fork · Fate
        </span>
      </div>
    </div>
  );
}

// Tarot-style front: photo centered inside a black card with matching red frame
function CardFront({ src, light }) {
  return (
    <div className={`absolute inset-0 ${light ? "bg-[#F5F0E6]" : "bg-[#0E0E0E]"}`} data-testid="card-front">
      <div
        className="absolute inset-0"
        style={{ background: light
          ? "radial-gradient(circle at 50% 42%, rgba(163,22,33,0.10), rgba(255,255,255,0) 62%)"
          : "radial-gradient(circle at 50% 42%, rgba(224,30,38,0.20), rgba(0,0,0,0) 62%)" }}
      />
      <div className="absolute inset-[13px] overflow-hidden rounded-md">
        <img src={src} alt="" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/45 to-transparent" />
      </div>
      <div className={`absolute inset-2 rounded-xl border ${light ? "border-[#A31621]/60" : "border-[#E01E26]/70"}`} />
      <div className={`absolute inset-[10px] rounded-lg border ${light ? "border-[#A31621]/25" : "border-[#E01E26]/25"}`} />
    </div>
  );
}

export function ShufflingDeck({ cards, flash, landed, light, theme, season, seasonItems, seasonAccent }) {
  const source = cards.length ? cards : (flash ? [flash] : []);
  // Always fill a full visual deck so the shuffle never looks like a single card,
  // even when the filtered result set is tiny (repeats are visual-only).
  const base = [];
  for (let i = 0; source.length && base.length < DECK_SIZE; i++) {
    base.push(source[i % source.length]);
  }
  const deck = (landed && flash
    ? [flash, ...base.filter((c) => c?.id !== flash?.id)]
    : base
  ).slice(0, DECK_SIZE);
  const label = flash?.name;
  return (
    <div className="grid h-full min-h-[400px] place-items-center" data-testid="shuffling-deck">
      <div className="flex flex-col items-center gap-8">
        <div className="relative h-72 w-44">
          <AnimatePresence>
            {landed && theme === "dark" && (
              <motion.div
                className="pointer-events-none absolute left-1/2 top-1/2 z-50"
                style={{ transform: "translate(-50%, calc(-50% + 48px))" }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
                data-testid="skeleton-hands-overlay"
              >
                <motion.img
                  src="/skeleton-hand.png"
                  alt=""
                  className="w-[310px] max-w-none select-none drop-shadow-2xl"
                  initial={{ scale: 1.15 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 240, damping: 18 }}
                />
              </motion.div>
            )}
          </AnimatePresence>
          {landed && theme === "cyber" && (
            <motion.div
              className="pointer-events-none absolute inset-[-14px] z-40 rounded-3xl"
              data-testid="cyber-neon-pulse"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 0.15, 1, 0.15, 1, 0] }}
              transition={{ duration: 1.2, times: [0, 0.12, 0.28, 0.45, 0.62, 0.8, 1], ease: "easeOut" }}
              style={{ border: "2px solid rgba(34,224,224,0.95)", boxShadow: "0 0 24px 6px rgba(34,224,224,0.9), 0 0 60px 18px rgba(199,125,255,0.7), inset 0 0 22px rgba(34,224,224,0.5)" }}
            />
          )}
          {deck.map((c, i) => {
            // Once landed, render only the winning card — no backing cards to peek out as lines
            if (landed && i !== 0) return null;
            const showPhoto = landed && i === 0 && c?.image;
            return (
            <motion.div
              key={(c?.id || "c") + i}
              className={`absolute inset-0 overflow-hidden rounded-2xl border-2 shadow-2xl ${season ? "bg-[#F5F0E6] shadow-black/10" : light ? "border-[#D9C9A8] bg-[#F5F0E6] shadow-black/10" : "border-[#E01E26] bg-[#0E0E0E] shadow-black/30"}`}
              style={{ zIndex: DECK_SIZE - i, ...(season && seasonAccent ? { borderColor: seasonAccent } : {}) }}
              animate={
                landed
                  ? {
                      x: 0,
                      y: 0,
                      rotate: 0,
                      scale: i === 0 ? 1.05 : 0.96,
                      opacity: i === 0 ? 1 : 0,
                    }
                  : {
                      x: [0, i % 2 === 0 ? -96 : 96, 0],
                      y: [0, -26, 0],
                      rotate: [(i - 2) * 4, i % 2 === 0 ? -17 : 17, (i - 2) * 4],
                      scale: [1, 0.97, 1],
                      opacity: 1,
                    }
              }
              transition={
                landed
                  ? { type: "spring", stiffness: 320, damping: 22 }
                  : { duration: 0.72, repeat: Infinity, ease: "easeInOut", delay: i * 0.1 }
              }
            >
              {showPhoto ? (
                <CardFront src={c.image} light={light} />
              ) : (
                <CardBack light={light} theme={theme} seasonItem={season && seasonItems ? seasonItems[i % seasonItems.length] : null} />
              )}
            </motion.div>
            );
          })}
        </div>
        <div className="relative z-[60] text-center">
          <p className={`font-sans text-xs font-bold uppercase tracking-[0.25em] ${light ? "text-[#A31621]" : "text-[#E01E26]"}`} style={season && seasonAccent ? { color: seasonAccent } : undefined}>
            {landed ? (light ? "Your pick" : "Fate has chosen") : (light ? "Shuffling…" : "Shuffling the deck")}
          </p>
          <p className={`mt-1 h-7 font-serif text-2xl drop-shadow ${light ? "text-[#18181B]" : "text-white"}`}>{label}</p>
        </div>
      </div>
    </div>
  );
}
