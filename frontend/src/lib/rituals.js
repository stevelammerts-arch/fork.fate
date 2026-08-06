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
  { key: "pixie", name: "Pixie Poof", realm: "Fairy Gully", accent: "#5EE0A8", desc: "The tiny third sister flits up and — one wave of her wand — poofs the medallion into sparkles, then giggles it back." },
  { key: "breath", name: "Dragon's Breath", realm: "Dragon's Hoard", accent: "#FF8C3A", desc: "The tiny dragon huffs, puffs, and torches the medallion to cinders — don't worry, it always grows back." },
  { key: "ball", name: "Beach Ball Bonk", realm: "Summer", accent: "#E07E17", desc: "A runaway beach ball bonks the medallion clean off its perch — then squats in its spot acting innocent." },
  { key: "crab", name: "Crab Grab", realm: "Summer", accent: "#E0451B", desc: "A little red crab scuttles across the banner, hoists the medallion overhead and hauls it away sideways." },
  { key: "surf", name: "Tiki Wipeout", realm: "Tiki Lounge", accent: "#F0A24E", desc: "The roaming tiki surfer loses control of his board and wipes out straight into the medallion — knocking it clean off the screen." },
  { key: "spear", name: "Spear Pop", realm: "Tiki Lounge", accent: "#E0451B", desc: "A tiki hunter charges across the banner to war drums and POPS the medallion like a balloon with one spear jab. It puffs right back up." },
  { key: "spring", name: "Sprung Face", realm: "Steampunk", accent: "#D9A44E", desc: "The medallion rattles loose and BOINGS out of its socket on a coiled brass spring like a popped watch face — until the spring gives out." },
  { key: "gears", name: "Open Works", realm: "Steampunk", accent: "#B98A44", desc: "The medallion swings open like a pocket-watch door, showing off its spinning gearworks — until they grind and cough smoke, the door drops off its hinge, and every gear spills out." },
  { key: "snatch", name: "Soul Snatch", realm: "Reaper", accent: "#9BA8C0", desc: "The white spectre materializes out of thin air behind the medallion — claws already around it — lingers with a mournful wail, then vanishes into the dark and takes it with him." },
  { key: "snowman", name: "Blown Away", realm: "Winter", accent: "#8FC7E8", desc: "A smiling snowman shuffles onto the banner — then a snowy gust blows his head clean off. It bonks the medallion out of its perch and squats there grinning until the breeze moves him along." },
  { key: "owl", name: "Night Talons", realm: "Fall", accent: "#C67B3B", desc: "A great horned owl swoops across the banner on silent wings, closes its talons around the medallion and carries it clean off into the autumn sky." },
  { key: "petals", name: "Petal Storm", realm: "Spring", accent: "#F49AC1", desc: "A warm gust sweeps a blizzard of cherry blossoms across the page — and the medallion gets knocked clean off the screen, riding the wind with them." },
  { key: "wreck", name: "Neon Wreck", realm: "Cyberscape", accent: "#C77DFF", desc: "A flying car sputters out of traffic and crunches into the neon sign — its tubes flutter out, bzzz... bzzz... then hum back to life." },
  { key: "coffee", name: "Sugar Melt", realm: "Café", accent: "#C08A4E", desc: "A runaway cup of hot coffee slides onto the banner and tips over — the spill washes across the title and melts the medallion away like a sugar cube." },
  { key: "plate", name: "Plated by Death", realm: "Reaper", accent: "#B03030", desc: "The little reaper drifts up to the medallion and — one flick of dark magic — turns it into the very plate of food his master is holding. Dinner is served." },
  { key: "unicorn", name: "Unicorn Charge", realm: "Fairy Gully", accent: "#E6B23A", desc: "A white unicorn thunders across the banner at full gallop and punts the medallion clean off the screen with its golden horn — never breaking stride." },
  { key: "cardinal", name: "Featherweight", realm: "Winter", accent: "#D2413A", desc: "The little cardinal flutters down for a rest on top of the medallion — which teeters under the featherweight and tips right off its perch." },
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
