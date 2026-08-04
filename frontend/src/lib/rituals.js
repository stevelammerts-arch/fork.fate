// Registry of every rare-fate ritual + per-device "witnessed" tracking.
// Witnessed rituals are stored in localStorage as { [key]: { count, first } }.

const STORE_KEY = "ff_rituals_seen";

export const RITUALS = [
  { key: "scratch", name: "Scratch Foil", realm: "All realms", theme: null, accent: "#E6B23A", desc: "Fate arrives hidden under themed foil — scratch it clean to see who was chosen." },
  { key: "8ball", name: "Magic 8-Ball", realm: "All realms", theme: null, accent: "#B8BCC2", desc: "Shake the ball until the answer floats up through the ink." },
  { key: "wheel", name: "Wheel of Fate", realm: "All realms", theme: null, accent: "#E01E26", desc: "Every contender rides the wheel — flick it and let it settle." },
  { key: "wand", name: "Fairy Wand", realm: "Fairy Gully", theme: "fairy", accent: "#5EE0A8", desc: "Tap the wand — a burst of fae sparkles unveils the fate." },
  { key: "hack", name: "Hack Terminal", realm: "Cyberscape", theme: "cyber", accent: "#B24DE0", desc: "Jack in and watch the breach log decrypt your target, character by character." },
  { key: "code", name: "Code Breaker", realm: "Cyberscape", theme: "cyber", accent: "#22E0E0", desc: "Crack the 3-digit cipher before the countdown forces a system override." },
  { key: "crank", name: "Crank Gear", realm: "Steampunk", theme: "steam", accent: "#F0A24E", desc: "Crank the brass gear until the pressure valve blows the fate loose." },
  { key: "shaker", name: "Tiki Shaker", realm: "Tiki Lounge", theme: "tiki", accent: "#FF8A3C", desc: "Shake the carved mug until it tips — the fate pours out with the drums." },
  { key: "volcano", name: "Volcano Wake", realm: "Tiki Lounge", theme: "tiki", accent: "#FF5428", desc: "Rumble the island volcano awake — it erupts and the fate emerges." },
  { key: "tarot", name: "Tarot Draw", realm: "Reaper", theme: "dark", accent: "#B9A5E3", desc: "Three cards face down. The Reaper insists you draw one." },
  { key: "coffin", name: "Coffin Knock", realm: "Reaper", theme: "dark", accent: "#8FE3A8", desc: "Knock three times — the casket creaks open in soul-light." },
  { key: "seance", name: "Séance Candles", realm: "Reaper", theme: "dark", accent: "#D9A44E", desc: "Snuff five candles, one by one, until the spirits speak in the dark." },
  { key: "ouija", name: "Ouija Board", realm: "Reaper", theme: "dark", accent: "#C8A96A", desc: "The planchette drags itself across the board, spelling out where you'll eat." },
  { key: "eye", name: "Dragon's Eye", realm: "Dragon's Hoard", theme: "fantasy", accent: "#E6B23A", desc: "Wake the sleeping dragon — its molten eye opens and fixes on your fate." },
  { key: "chest", name: "Treasure Chest", realm: "Dragon's Hoard", theme: "fantasy", accent: "#F0C878", desc: "Break the iron lock — the hoard bursts open in a fountain of gold." },
];

export function readRitualsSeen() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORE_KEY) || "{}");
    return raw && typeof raw === "object" ? raw : {};
  } catch (e) {
    return {};
  }
}

export function recordRitualSeen(key) {
  try {
    const seen = readRitualsSeen();
    const cur = seen[key];
    seen[key] = { count: (cur?.count || 0) + 1, first: cur?.first || new Date().toISOString() };
    localStorage.setItem(STORE_KEY, JSON.stringify(seen));
  } catch (e) { /* storage unavailable */ }
}
