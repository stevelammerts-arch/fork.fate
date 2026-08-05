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
  { key: "leaves", name: "Leaf Pile", realm: "Fall", theme: "fall", accent: "#D97A2B", desc: "Fate lies buried under the harvest — sweep the leaves until it shows." },
  { key: "bloom", name: "Cherry Bloom", realm: "Spring", theme: "spring", accent: "#E87BA8", desc: "Coax the sakura buds until the branch bursts into full blossom." },
  { key: "melon", name: "Watermelon Smash", realm: "Summer", theme: "summer", accent: "#E23B4A", desc: "Three good whacks and the melon splits in a juicy spray of seeds." },
  { key: "globe", name: "Snow Globe", realm: "Winter", theme: "winter", accent: "#8FC6FF", desc: "Shake the globe into a blizzard — the fate settles with the snow." },
  { key: "latte", name: "Latte Stir", realm: "Café", theme: "light", accent: "#C08A4E", desc: "The crest is drawn in the cream — stir it away and your fate is served." },
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

// Realm heists: rare medallion thefts (easter eggs) tracked like rituals.
const HEIST_KEY = "ff_heists_seen";

export const HEISTS = [
  { key: "saucer", name: "Saucer Abduction", realm: "Cyberscape", accent: "#22E0E0", desc: "A stealth saucer locks its tractor beam on the medallion and beams it up — then drops it back." },
  { key: "dragon", name: "Dragon Heist", realm: "Dragon's Hoard", accent: "#E6B23A", desc: "A scaled claw rises from the hoard and drags the medallion down into the gold." },
  { key: "grave", name: "Grave Snatch", realm: "Reaper", accent: "#E01E26", desc: "Skeletal hands reach up from the grave and pull the medallion under." },
];

export function readHeistsSeen() {
  try {
    const raw = JSON.parse(localStorage.getItem(HEIST_KEY) || "{}");
    return raw && typeof raw === "object" ? raw : {};
  } catch (e) {
    return {};
  }
}

/** Records a heist sighting; returns true if this was the first time. */
export function recordHeistSeen(key) {
  try {
    const seen = readHeistsSeen();
    const cur = seen[key];
    seen[key] = { count: (cur?.count || 0) + 1, first: cur?.first || new Date().toISOString() };
    localStorage.setItem(HEIST_KEY, JSON.stringify(seen));
    return !cur;
  } catch (e) {
    return false;
  }
}
