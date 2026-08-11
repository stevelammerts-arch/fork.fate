import React from "react";
import { motion } from "framer-motion";
import { Moon, Sun, Leaf, Snowflake, Flower2, Umbrella, Zap, Cog, Wine, Swords, Dices, Check } from "lucide-react";
import { MushroomIcon } from "./guided/theme";
import { useTheme, setTheme } from "../hooks/useTheme";
import { useLang } from "../i18n/i18n";

// One entry per theme: swatch gradient + accent tuned to each realm's palette.
const THEMES = [
  { id: "dark", label: "Reaper (Original)", icon: Moon, grad: "linear-gradient(135deg,#1A1A1D 0%,#2B0A0E 100%)", accent: "#E01E26", text: "#FFFFFF" },
  { id: "light", label: "Coffee Shop", icon: Sun, grad: "linear-gradient(135deg,#FFFFFF 0%,#EFEAE0 100%)", accent: "#A31621", text: "#18181B" },
  { id: "fall", label: "Fall", icon: Leaf, grad: "linear-gradient(135deg,#3A1E0D 0%,#C0451B 100%)", accent: "#FFC08A", text: "#FFF4E8" },
  { id: "winter", label: "Winter", icon: Snowflake, grad: "linear-gradient(135deg,#0E2A3F 0%,#2E77A6 100%)", accent: "#BEE3F8", text: "#F0F8FF" },
  { id: "spring", label: "Spring", icon: Flower2, grad: "linear-gradient(135deg,#43203A 0%,#D46A9F 100%)", accent: "#FFD7E8", text: "#FFF0F6" },
  { id: "summer", label: "Summer", icon: Umbrella, grad: "linear-gradient(135deg,#7A3E0A 0%,#E07E17 100%)", accent: "#FFE8B0", text: "#FFF8EA" },
  { id: "cyber", label: "Cyberscape", icon: Zap, grad: "linear-gradient(135deg,#070A16 0%,#160A28 100%)", accent: "#22E0E0", text: "#D8F9FF" },
  { id: "steam", label: "Steampunk", icon: Cog, grad: "linear-gradient(135deg,#17100A 0%,#3A2810 100%)", accent: "#D9A44E", text: "#F1D9A6" },
  { id: "tiki", label: "Tiki Lounge", icon: Wine, grad: "linear-gradient(135deg,#2A140A 0%,#3A1C0E 100%)", accent: "#F0A24E", text: "#FBE3C0" },
  { id: "fantasy", label: "Dragon's Hoard", icon: Swords, grad: "linear-gradient(135deg,#1C0808 0%,#7E1B0E 100%)", accent: "#FF7A3D", text: "#FFD9A0" },
  { id: "fairy", label: "Fairy Gully", icon: MushroomIcon, grad: "linear-gradient(135deg,#0B1F14 0%,#1E5C38 100%)", accent: "#5EE0A8", text: "#CFF5DC" },
];

/**
 * "Choose Your Realm" window — shown on first run and reopened anytime from
 * the header's Theme pill. Tapping a swatch applies the theme and enters
 * Fork·Fate immediately; no separate confirm step.
 */
export default function ThemeWelcomeDialog({ onDone }) {
  const { theme } = useTheme();
  const { t } = useLang();
  const pickTheme = (id) => { setTheme(id); onDone(); };

  return (
    <div data-testid="theme-welcome" className="fixed inset-0 z-[130] overflow-y-auto">
      <div className="fixed inset-0 bg-black/85 backdrop-blur-md" />
      <div className="relative flex min-h-full items-center justify-center p-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="w-full max-w-lg rounded-3xl border border-white/15 bg-[#101013]/95 p-6 shadow-2xl sm:p-8"
        >
          <img src="/logo-crest.png" alt="" className="mx-auto h-16 w-16 object-contain drop-shadow-[0_0_18px_rgba(224,30,38,0.45)]" />
          <h2 className="mt-3 text-center font-serif text-3xl font-semibold text-white">
            {t("Choose your realm")}
          </h2>
          <p className="mx-auto mt-1.5 max-w-sm text-center font-sans text-sm text-white/60">
            {t("Every theme reshapes the ritual — scenery, sounds, and the voice of fate. Choose yours.")}
          </p>

          <div className="mt-6 grid grid-cols-2 gap-2.5">
            {THEMES.map((th, i) => {
              const Icon = th.icon;
              const selected = theme === th.id;
              return (
                <motion.button
                  key={th.id}
                  type="button"
                  data-testid={`theme-welcome-option-${th.id}`}
                  onClick={() => pickTheme(th.id)}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.12 + i * 0.05, duration: 0.35, ease: "easeOut" }}
                  whileTap={{ scale: 0.96 }}
                  style={{
                    background: th.grad,
                    boxShadow: selected ? `0 0 0 2px ${th.accent}, 0 0 22px ${th.accent}55` : undefined,
                  }}
                  className="relative flex items-center gap-2.5 rounded-2xl border border-white/10 px-3.5 py-3 text-left transition-shadow"
                >
                  <span
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-full"
                    style={{ backgroundColor: `${th.accent}26`, color: th.accent }}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="font-sans text-sm font-bold leading-tight" style={{ color: th.text }}>
                    {t(th.label)}
                  </span>
                  {selected && (
                    <span
                      className="absolute right-2 top-2 grid h-5 w-5 place-items-center rounded-full"
                      style={{ backgroundColor: th.accent, color: "#101013" }}
                    >
                      <Check className="h-3.5 w-3.5" />
                    </span>
                  )}
                </motion.button>
              );
            })}
            {/* 12th slot: let fate pick the realm */}
            <motion.button
              type="button"
              data-testid="theme-welcome-random"
              onClick={() => pickTheme(THEMES[Math.floor(Math.random() * THEMES.length)].id)}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12 + THEMES.length * 0.05, duration: 0.35, ease: "easeOut" }}
              whileTap={{ scale: 0.96 }}
              style={{ background: "linear-gradient(135deg,#191014 0%,#3D1B2E 55%,#14252E 100%)" }}
              className="relative flex items-center gap-2.5 rounded-2xl border border-dashed border-white/25 px-3.5 py-3 text-left transition-shadow hover:border-white/50"
            >
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full" style={{ backgroundColor: "#FFFFFF1A", color: "#F5D06B" }}>
                <Dices className="h-4 w-4" />
              </span>
              <span className="font-sans text-sm font-bold leading-tight text-white/90">
                {t("Let Fate Decide")}
              </span>
            </motion.button>
          </div>

          <p className="mt-6 text-center font-sans text-[11px] text-white/40">
            {t("Tap a realm to enter — the Theme pill up top brings you back anytime.")}
          </p>
        </motion.div>
      </div>
    </div>
  );
}
