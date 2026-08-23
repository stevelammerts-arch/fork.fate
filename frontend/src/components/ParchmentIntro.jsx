// FIRST-RUN FIELD GUIDE: an old parchment explaining the app, shown once
// before the realm chooser. Closing it plays a paper-flip and seals it
// permanently (ff_guide_seen) — reopen anytime via the footer's "How to
// play" link (window "ff:open-guide" event).
import { useState } from "react";
import { motion } from "framer-motion";
import { Utensils, Globe2, Medal, Users, Coins } from "lucide-react";
import { useLang } from "../i18n/i18n";

const INK = "#241305";

const ROWS = [
  { icon: Utensils, title: "Deal a fate", text: "Pick a craving — fate shuffles great local spots and lands your next meal." },
  { icon: Globe2, title: "Enter a realm", text: "Eleven themed worlds, each with its own scenery, sounds and rituals." },
  { icon: Medal, title: "Collect them all", text: "Witness rare fates and sneaky heists to fill your Trophy Room." },
  { icon: Users, title: "Play together", text: "Group votes, pub crawls and head-to-head duels with friends." },
];

export default function ParchmentIntro({ onDone }) {
  const { t } = useLang();
  const [closing, setClosing] = useState(false);
  const [dontShow, setDontShow] = useState(false);

  const close = () => {
    if (closing) return;
    setClosing(true);
    try {
      if (dontShow) localStorage.setItem("ff_guide_seen", "1");
    } catch (e) { /* ignore */ }
    try { const a = new Audio("/paper-flip.mp3"); a.volume = 0.8; a.play().catch(() => {}); } catch (e) { /* ignore */ }
    setTimeout(onDone, 620);
  };

  return (
    <div data-testid="parchment-intro" className="fixed inset-0 z-[140] overflow-y-auto bg-black/85 backdrop-blur-md">
      <div className="flex min-h-full items-center justify-center p-3 py-6" style={{ perspective: "1400px" }}>
        <motion.div
          initial={{ opacity: 0, y: 26, scale: 0.97 }}
          animate={closing ? { rotateY: -102, opacity: 0, transition: { duration: 0.6, ease: [0.5, 0, 0.8, 0.4] } } : { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5, ease: "easeOut" } }}
          style={{ transformOrigin: "0% 50%", transformStyle: "preserve-3d" }}
          className="relative w-full max-w-md"
        >
          <img src="/guide-parchment-v2.png" alt="" className="w-full select-none drop-shadow-[0_18px_44px_rgba(0,0,0,0.6)]" draggable="false" />
          <div className="absolute inset-0 flex flex-col px-[15%] pb-[9%] pt-[20%]">
            <h2 className="text-center font-serif text-2xl font-bold sm:text-3xl" style={{ color: INK }}>
              {t("How Fork·Fate works")}
            </h2>
            <div className="mt-[4%] flex flex-1 flex-col justify-center gap-[4%]">
              {ROWS.map((r) => (
                <div key={r.title} className="flex items-start gap-2.5">
                  <r.icon className="mt-0.5 h-4 w-4 shrink-0 sm:h-5 sm:w-5" style={{ color: INK }} />
                  <p className="font-serif text-[13px] leading-snug sm:text-[15px]" style={{ color: INK }}>
                    <span className="font-bold">{t(r.title)}.</span> {t(r.text)}
                  </p>
                </div>
              ))}
              <div className="flex items-start gap-2.5 rounded-lg border border-dashed p-2" style={{ borderColor: `${INK}55` }}>
                <Coins className="mt-0.5 h-4 w-4 shrink-0 sm:h-5 sm:w-5" style={{ color: INK }} />
                <p className="font-serif text-[13px] leading-snug sm:text-[15px]" style={{ color: INK }}>
                  <span className="font-bold">{t("Coming soon")}.</span> {t("Accrue points redeemable for savings at some of your favorite sponsored restaurants & businesses.")}
                </p>
              </div>
            </div>
            <label className="mx-auto mt-[3%] flex cursor-pointer items-center gap-2" data-testid="parchment-dont-show">
              <input
                type="checkbox"
                checked={dontShow}
                onChange={(e) => setDontShow(e.target.checked)}
                className="h-4 w-4 cursor-pointer accent-[#241305]"
              />
              <span className="font-serif text-xs font-bold sm:text-sm" style={{ color: INK }}>{t("Don't show this again")}</span>
            </label>
            <button
              type="button"
              data-testid="parchment-close"
              onClick={close}
              className="mx-auto mt-[2.5%] rounded-full border-2 px-6 py-2 font-serif text-sm font-bold transition-transform active:scale-95 sm:text-base"
              style={{ borderColor: INK, color: "#F5EBD3", backgroundColor: INK }}
            >
              {t("Enter the realms")}
            </button>
            <p className="mx-auto mt-1.5 w-fit rounded-md bg-[#F0E4C8]/80 px-2 py-0.5 text-center font-serif text-[10px] font-semibold italic sm:text-xs" style={{ color: INK }}>
              {t("Reopen anytime from \"How to play\" in the footer.")}
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
