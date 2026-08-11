import React from "react";
import {
  Sparkles, Skull, Snowflake, Sun, Flower2, Leaf, Zap, Cog, Palmtree, Swords,
} from "lucide-react";

// Page-turn transition — the finished step curls away, the next turns in.
export const pageVariants = {
  initial: { rotateY: 75, opacity: 0, x: 60 },
  animate: { rotateY: 0, opacity: 1, x: 0 },
  exit: { rotateY: -75, opacity: 0, x: -60 },
};

export const AMBIANCE_THEMES = ["cyber", "steam", "tiki", "fantasy", "fairy"];

// Lucide-style mushroom for the Fairy Gully seal (lucide has no mushroom).
export const MushroomIcon = ({ className, style }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <path d="M3 11c0-4.4 4-8 9-8s9 3.6 9 8c0 1.1-.9 2-2 2H5c-1.1 0-2-.9-2-2Z" />
    <path d="M9 13l-.5 5a2.5 2.5 0 0 0 2.5 3h2a2.5 2.5 0 0 0 2.5-3l-.5-5" />
    <circle cx="9" cy="7.5" r="0.4" />
    <circle cx="14" cy="6" r="0.4" />
    <circle cx="16.5" cy="9" r="0.4" />
  </svg>
);

export const SEAL_ICONS = {
  winter: Snowflake, summer: Sun, spring: Flower2, fall: Leaf,
  cyber: Zap, steam: Cog, tiki: Palmtree, light: Sparkles, fantasy: Swords,
  fairy: MushroomIcon,
};

// Resolve every surface/text token for the guide in one place so the step
// components stay purely presentational.
// dark = gothic/ambiance, light = bright seasonal themes;
// fairy = moss-green card with light beige tiles/buttons so picks pop.
export function buildGuidedTheme(theme, accentProp) {
  const accent = accentProp || "#E01E26";
  const isReaper = theme === "dark" || !theme;
  const dark = isReaper || AMBIANCE_THEMES.includes(theme); // dark card surface
  const fairy = theme === "fairy";
  return {
    accent,
    isReaper,
    dark,
    fairy,
    SealIcon: SEAL_ICONS[theme] || Skull,
    surface: fairy ? "border-[#3E7A55] bg-[#235C3D]/95" : dark ? "border-[#2A2A2A] bg-[#0E0E0E]/95" : "border-black/10 bg-white/95",
    titleColor: dark ? "text-white" : "text-[#0E0E0E]",
    tileText: fairy ? "text-[#22301F]" : dark ? "text-white" : "text-[#0E0E0E]", // text on beige fairy tiles
    subColor: fairy ? "text-[#CFEBDA]" : dark ? "text-[#A0A0A0]" : "text-[#5A6068]",
    tileIdle: fairy ? "border-[#D9CBB0] bg-[#F5F0E6]" : dark ? "border-[#2A2A2A] bg-[#161616]" : "border-black/10 bg-black/[0.03]",
    iconIdle: fairy ? "text-[#1E7A4A]" : dark ? "text-[#C0C0C0]" : "text-[#5A6068]",
    trackBg: fairy ? "bg-[#2E6847]" : dark ? "bg-[#2A2A2A]" : "bg-black/10",
    chipIdle: fairy ? "border-[#D9CBB0] bg-[#F5F0E6] text-[#3A3F45]" : dark ? "border-[#2A2A2A] bg-[#1C1C1C] text-[#A0A0A0]" : "border-black/10 bg-black/[0.03] text-[#3A3F45]",
    backBtn: dark ? "text-[#C0C0C0] hover:text-white" : "text-[#5A6068] hover:text-[#0E0E0E]",
    skipIdle: dark ? "border-white/40 bg-white/15 text-white" : "border-black/30 bg-white text-[#0E0E0E]",
    // small labels that differ from subColor
    radiusLabel: fairy ? "text-[#5A6068]" : dark ? "text-[#C0C0C0]" : "text-[#5A6068]",
    groupLabel: fairy ? "text-[#A8D8BC]" : dark ? "text-[#C0C0C0]" : "text-[#5A6068]",
  };
}
