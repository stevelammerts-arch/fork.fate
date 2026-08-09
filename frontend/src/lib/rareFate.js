// Rare-fate cadence + per-theme ritual pools (extracted from Home.jsx).

/** Every 10th deal tap is a rare fate (localStorage-tracked; falls back to a
 * 1-in-10 roll when storage is unavailable). */
export function shouldRareFate() {
  try {
    const taps = parseInt(localStorage.getItem("ff_deal_taps") || "0", 10) + 1;
    let target = parseInt(localStorage.getItem("ff_rare_at") || "0", 10);
    if (!target) target = 10;
    if (taps >= target) {
      localStorage.setItem("ff_deal_taps", "0");
      localStorage.setItem("ff_rare_at", "10");
      return true;
    }
    localStorage.setItem("ff_deal_taps", String(taps));
    localStorage.setItem("ff_rare_at", String(target));
    return false;
  } catch (e) {
    return Math.random() < 1 / 10;
  }
}

/** The ritual pool fate draws from for a rare reveal in each realm: the three
 * universal covers plus every theme's signature rituals (wand, hack terminal,
 * keypad, crank, tiki shaker, volcano, tarot, coffin, seance, ouija, dragon
 * eye, treasure chest, leaf pile, cherry bloom, melon smash, snow globe,
 * latte stir). */
export function rarePoolFor(theme) {
  return theme === "fairy" ? ["scratch", "8ball", "wheel", "wand"]
    : theme === "cyber" ? ["scratch", "8ball", "wheel", "hack", "code"]
    : theme === "steam" ? ["scratch", "8ball", "wheel", "crank"]
    : theme === "tiki" ? ["scratch", "8ball", "wheel", "shaker", "volcano"]
    : theme === "dark" ? ["scratch", "8ball", "wheel", "tarot", "coffin", "seance", "ouija"]
    : theme === "fantasy" ? ["scratch", "8ball", "wheel", "eye", "chest"]
    : theme === "fall" ? ["scratch", "8ball", "wheel", "leaves"]
    : theme === "spring" ? ["scratch", "8ball", "wheel", "bloom"]
    : theme === "summer" ? ["scratch", "8ball", "wheel", "melon"]
    : theme === "winter" ? ["scratch", "8ball", "wheel", "globe"]
    : theme === "light" ? ["scratch", "8ball", "wheel", "latte"]
    : ["scratch", "8ball", "wheel"];
}
