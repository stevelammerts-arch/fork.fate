import { useEffect, useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { Eye } from "lucide-react";
import { useLang } from "../../i18n/i18n";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Accent per theme, darkened for readability on the white reveal card.
const ACCENT = {
  dark: "#E01E26", light: "#A31621", fall: "#C0451B", winter: "#2E77A6",
  spring: "#C2497F", summer: "#C96F0E", cyber: "#0E8F8F", steam: "#8A6A2F",
  tiki: "#B06A1E", fantasy: "#9A7420",
};

/**
 * AI Fate Oracle: a short mystical one-liner about why fate chose this spot,
 * spoken in the current theme's voice. Cached server-side per (place, theme,
 * lang) so repeat reveals are instant. Hides itself entirely if the oracle
 * is silent (budget exhausted, no key, or an error).
 */
export function FateOracle({ card, mode, theme }) {
  const { t, lang } = useLang();
  const [line, setLine] = useState(null);
  const [state, setState] = useState("loading"); // loading | done | hidden
  const accent = ACCENT[theme] || ACCENT.dark;

  useEffect(() => {
    let live = true;
    setLine(null);
    setState("loading");
    axios
      .post(`${API}/oracle`, {
        place_id: card.id,
        name: card.name,
        cuisine: card.cuisine || null,
        category: card.category || mode,
        theme,
        lang,
      })
      .then(({ data }) => {
        if (!live) return;
        if (data && data.line) { setLine(data.line); setState("done"); }
        else setState("hidden");
      })
      .catch(() => { if (live) setState("hidden"); });
    return () => { live = false; };
    // Re-consult only when the revealed place changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [card.id]);

  if (state === "hidden") return null;

  return (
    <div
      data-testid="fate-oracle"
      className="rounded-xl border border-dashed px-3.5 py-2.5"
      style={{ borderColor: `${accent}66`, backgroundColor: `${accent}0d` }}
    >
      <p
        className="mb-1 flex items-center gap-1.5 font-sans text-[10px] font-bold uppercase tracking-[0.2em]"
        style={{ color: accent }}
      >
        <Eye className="h-3.5 w-3.5" /> {t("The Oracle speaks")}
      </p>
      {state === "loading" ? (
        <motion.p
          data-testid="fate-oracle-loading"
          className="font-serif text-sm italic text-[#6B7075]"
          animate={{ opacity: [0.35, 0.9, 0.35] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
        >
          {t("Consulting the fates…")}
        </motion.p>
      ) : (
        <motion.p
          data-testid="fate-oracle-line"
          initial={{ opacity: 0, filter: "blur(5px)", y: 4 }}
          animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
          transition={{ duration: 0.9, ease: "easeOut" }}
          className="font-serif text-[15px] italic leading-snug text-[#3F3F46]"
        >
          {line}
        </motion.p>
      )}
    </div>
  );
}
