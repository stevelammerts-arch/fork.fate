// The big Deal button + nearby-count + weather-bias chip.
// When every solo step is set (`pulse`), the button gets a HEARTBEAT:
// a lub-dub scale thump synced with a soft heartbeat loop + slight haptics.
import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Dices } from "lucide-react";
import { SPIN_TAP } from "../../pages/homeConstants";
import { useLang } from "../../i18n/i18n";

const BEAT_MS = 882;  // one lub-dub cycle in /heartbeat-loop.mp3 (~68 bpm)
const RACE_MS = 460;  // the drumroll pace while the deck shuffles (~130 bpm)

export const DealRow = ({ spin, spinning, loading, passportMode, groupMode, light, resultsCount, weather, pulse }) => {
  const { t } = useLang();
  const audioRef = useRef(null);
  // "beat": calm lub-dub while everything's set and fate waits.
  // "race": the DRUMROLL — the same heart sprinting while the deck shuffles.
  const mode = spinning ? "race" : pulse && !loading ? "beat" : null;
  const period = mode === "race" ? RACE_MS : BEAT_MS;
  useEffect(() => {
    if (!mode) return undefined;
    const race = mode === "race";
    const muted = () => { try { return localStorage.getItem("ff_muted") === "1"; } catch { return true; } };
    if (!audioRef.current) {
      audioRef.current = new Audio("/heartbeat-loop.mp3");
      audioRef.current.loop = true;
    }
    const a = audioRef.current;
    a.playbackRate = race ? BEAT_MS / RACE_MS : 1;
    a.volume = race ? 0.32 : 0.22;
    const tryPlay = () => { if (!muted() && a.paused) a.play().catch(() => {}); };
    tryPlay();
    window.addEventListener("pointerdown", tryPlay);
    // keep the sound honest with the mute toggle
    const watch = setInterval(() => { if (muted()) { if (!a.paused) a.pause(); } else tryPlay(); }, 500);
    // slight haptic lub-dub on devices that support it
    const buzz = setInterval(() => {
      try { if (navigator.vibrate) navigator.vibrate(race ? [16, 120, 12] : [26, 240, 18]); } catch { /* no haptics */ }
    }, race ? RACE_MS : BEAT_MS);
    return () => {
      clearInterval(watch); clearInterval(buzz);
      window.removeEventListener("pointerdown", tryPlay);
      a.pause();
    };
  }, [mode]);
  return (
    <div className="flex flex-wrap items-center gap-4">
      {/* the heartbeat lives on a wrapper so framer's hover/tap transforms
          on the button itself stay untouched */}
      <span className="inline-block" style={{ animation: mode ? `ffHeartbeat ${period}ms ease-in-out infinite` : "none" }} data-testid={mode ? `deal-heartbeat-${mode}` : undefined}>
        <motion.button
          data-testid="spin-roulette-button"
          onClick={spin}
          disabled={spinning || loading}
          whileHover={{ scale: spinning || loading ? 1 : 1.03 }}
          whileTap={SPIN_TAP}
          className="inline-flex items-center gap-3 rounded-full border-2 border-[#0E0E0E] bg-[#E01E26] px-10 py-5 font-sans text-lg font-bold text-white shadow-lg shadow-[#E01E26]/25 transition-colors hover:bg-[#B3141A] disabled:opacity-70"
        >
          <Dices className={`h-6 w-6 ${spinning || loading ? "animate-spin" : ""}`} />
          {loading ? t("Finding spots…") : spinning ? t("Shuffling…") : passportMode ? t("Deal My Passport") : groupMode ? (light ? t("Pick 3 Spots") : t("Deal 3 Fates!")) : (light ? t("Shuffle the Deck") : t("Deal Your Fate!"))}
        </motion.button>
      </span>
      {resultsCount > 0 && (
        <span className="font-sans text-sm text-[#6B7075]">
          {resultsCount} {resultsCount !== 1 ? t("spots nearby") : t("spot nearby")}
        </span>
      )}
      {weather && (
        <span
          data-testid="weather-chip"
          className="inline-flex items-center gap-1.5 rounded-full border border-[#CFE0F5] bg-[#EEF5FE] px-3 py-1.5 font-sans text-xs font-bold text-[#245C97]"
        >
          {{ indoor: "🌧️", water: "🔥", snow: "❄️", outdoor: "☀️" }[weather.bias]}
          {t(weather.label)} {weather.temp_f}° ·{" "}
          {{ indoor: t("indoor picks"), water: t("water picks"), snow: t("snow picks"), outdoor: t("outdoor picks") }[weather.bias]}
        </span>
      )}
    </div>
  );
};
