import React from "react";
import { motion } from "framer-motion";
import { Skull, Sparkles, MousePointerClick } from "lucide-react";
import { useLang } from "../../i18n/i18n";

// Front face — gothic tarot (Reaper theme only, untouched design)
function ReaperCardFront({ t }) {
  return (
    <span className="absolute inset-0 overflow-hidden rounded-2xl border-2 border-[#C0C0C0]/50 bg-[radial-gradient(circle_at_50%_32%,#2a1519_0%,#0b0b0b_72%)] shadow-[0_0_40px_rgba(224,30,38,0.45)]" style={{ backfaceVisibility: "hidden" }}>
      <span className="pointer-events-none absolute inset-[6px] rounded-xl border border-[#C0C0C0]/25" />
      <span className="pointer-events-none absolute inset-[10px] rounded-lg border border-[#C0C0C0]/10" />
      <span className="pointer-events-none absolute left-2 top-2 h-2.5 w-2.5 rotate-45 border-l border-t border-[#C0C0C0]/60" />
      <span className="pointer-events-none absolute right-2 top-2 h-2.5 w-2.5 rotate-45 border-r border-t border-[#C0C0C0]/60" />
      <span className="pointer-events-none absolute bottom-2 left-2 h-2.5 w-2.5 rotate-45 border-b border-l border-[#C0C0C0]/60" />
      <span className="pointer-events-none absolute bottom-2 right-2 h-2.5 w-2.5 rotate-45 border-b border-r border-[#C0C0C0]/60" />
      <span className="flex h-full flex-col items-center justify-center gap-2.5 px-4">
        <span className="font-serif text-[10px] tracking-[0.35em] text-[#C0C0C0]/70">✦ FORK·FATE ✦</span>
        <span className="h-px w-16 bg-gradient-to-r from-transparent via-[#C0C0C0]/50 to-transparent" />
        <span className="relative">
          <Skull className="h-16 w-16 text-[#E01E26] drop-shadow-[0_0_14px_rgba(224,30,38,0.85)]" />
        </span>
        <span className="h-px w-16 bg-gradient-to-r from-transparent via-[#C0C0C0]/50 to-transparent" />
        <span className="font-serif text-base font-bold uppercase leading-tight tracking-[0.25em] text-[#C0C0C0]">{t("Seal your")}<br />{t("fate")}</span>
        <span className="font-serif text-lg text-[#C0C0C0]/50">☩</span>
      </span>
    </span>
  );
}

// Front face — themed tarot (accent color + per-theme seal icon)
function ThemedCardFront({ gt, t }) {
  const { accent, dark, SealIcon } = gt;
  return (
    <span
      className="absolute inset-0 overflow-hidden rounded-2xl border-2 shadow-2xl"
      style={{
        backfaceVisibility: "hidden",
        borderColor: `${accent}80`,
        background: dark
          ? "radial-gradient(circle at 50% 32%, #1c1c1c 0%, #0b0b0b 74%)"
          : "linear-gradient(180deg,#ffffff 0%,#eef1f4 100%)",
        boxShadow: `0 0 40px ${accent}66`,
      }}
    >
      <span className="pointer-events-none absolute inset-[6px] rounded-xl border" style={{ borderColor: `${accent}40` }} />
      <span className="pointer-events-none absolute inset-[10px] rounded-lg border" style={{ borderColor: `${accent}1f` }} />
      <span className="flex h-full flex-col items-center justify-center gap-2.5 px-4">
        <span className="font-serif text-[10px] tracking-[0.35em]" style={{ color: dark ? "rgba(192,192,192,0.7)" : accent }}>✦ FORK·FATE ✦</span>
        <span className="h-px w-16" style={{ background: `linear-gradient(to right, transparent, ${accent}80, transparent)` }} />
        <SealIcon className="h-16 w-16" style={{ color: accent, filter: `drop-shadow(0 0 14px ${accent}d9)` }} />
        <span className="h-px w-16" style={{ background: `linear-gradient(to right, transparent, ${accent}80, transparent)` }} />
        <span className="font-serif text-base font-bold uppercase leading-tight tracking-[0.25em]" style={{ color: dark ? "#C0C0C0" : "#3A3F45" }}>{t("Seal your")}<br />{t("fate")}</span>
      </span>
    </span>
  );
}

// STEP 4 — the tarot card the visitor taps to seal their fate
export function StepSeal({ gt, sealed, onSeal }) {
  const { t } = useLang();
  const { accent, dark, isReaper } = gt;
  return (
    <div className="text-center" data-testid="guided-step-seal">
      <p className="font-sans text-xs font-bold uppercase tracking-[0.2em] drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]" style={{ color: accent }}>{t("The final step")}</p>
      <h2 className="mt-1 font-serif text-3xl font-bold text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)]">
        {isReaper ? t("The reaper offers your fate") : t("Fate offers your card")}
      </h2>

      <div className="relative mx-auto mt-8 h-72 w-48" style={{ perspective: 1000 }}>
        {!sealed && (
          <motion.span
            aria-hidden
            className="pointer-events-none absolute -inset-5 rounded-[28px] border-2"
            style={{ borderColor: accent }}
            animate={{ opacity: [0.12, 0.6, 0.12], scale: [0.97, 1.03, 0.97] }}
            transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
          />
        )}
        <motion.button
          onClick={onSeal}
          data-testid="guided-seal-button"
          className="relative h-full w-full cursor-pointer rounded-2xl"
          style={{ transformStyle: "preserve-3d" }}
          animate={sealed ? { rotateY: 180, scale: 1.08, y: -10 } : { rotateY: 0, scale: 1, y: [0, -8, 0] }}
          transition={sealed ? { type: "spring", stiffness: 60, damping: 15 } : { y: { repeat: Infinity, duration: 3, ease: "easeInOut" } }}
          whileHover={sealed ? {} : { scale: 1.04 }}
        >
          {isReaper ? <ReaperCardFront t={t} /> : <ThemedCardFront gt={gt} t={t} />}
          {/* back */}
          <span
            className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-2xl border-2"
            style={{
              backfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
              borderColor: accent,
              background: dark
                ? (isReaper ? "linear-gradient(180deg,#2a0b0d,#0b0b0b)" : "linear-gradient(180deg,#1a1a1a,#0b0b0b)")
                : "linear-gradient(180deg,#ffffff,#eef1f4)",
              boxShadow: `0 0 55px ${accent}d9`,
            }}
          >
            <Sparkles className="h-12 w-12" style={{ color: accent }} />
            <span className="font-serif text-xl font-bold uppercase tracking-widest" style={{ color: dark ? "#fff" : "#0E0E0E" }}>{t("Fate Sealed")}</span>
          </span>
        </motion.button>
        {!sealed && (
          <motion.div
            aria-hidden
            className="pointer-events-none absolute bottom-[-6px] left-1/2 z-20 flex -translate-x-1/2 flex-col items-center"
            animate={{ y: [0, 7, 0] }}
            transition={{ repeat: Infinity, duration: 1.1, ease: "easeInOut" }}
          >
            <MousePointerClick className="h-10 w-10 drop-shadow-[0_2px_6px_rgba(0,0,0,0.95)]" style={{ color: accent }} />
            <span className="mt-1 whitespace-nowrap rounded-full bg-black/75 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.15em] text-white shadow-lg">{t("Tap here")}</span>
          </motion.div>
        )}
      </div>

      {sealed ? (
        <p className="mt-6 font-serif text-base italic text-[#C0C0C0] drop-shadow-[0_2px_8px_rgba(0,0,0,0.95)]">
          {t("The deck decides…")}
        </p>
      ) : (
        <motion.button
          onClick={onSeal}
          data-testid="guided-seal-hint"
          className="mt-7 inline-flex items-center gap-2 rounded-full border-2 px-5 py-2.5 font-sans text-sm font-bold text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]"
          style={{ borderColor: accent, backgroundColor: `${accent}33` }}
          animate={{ y: [0, -5, 0] }}
          transition={{ repeat: Infinity, duration: 1.4, ease: "easeInOut" }}
          whileTap={{ scale: 0.95 }}
        >
          <MousePointerClick className="h-4 w-4" style={{ color: accent }} />
          {t("Tap the card to seal your fate")}
        </motion.button>
      )}
    </div>
  );
}
