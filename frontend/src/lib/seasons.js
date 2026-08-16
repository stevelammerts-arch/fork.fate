// Seasonal Events: limited-time takeovers with exclusive collectable fates.
// Each season has a yearly MM-DD window; its fate can ONLY be witnessed while
// the window is open (tracked per-device like heists).

const STORE_KEY = "ff_seasonal_seen";

export const SEASONS = [
  { id: "sweethearts", name: "Sweetheart Season", start: "02-01", end: "02-21", realm: "All realms", accent: "#FF5C8A", fateKey: "cupid", fateName: "Cupid's Drift", effect: "hearts", desc: "For three weeks in February, drifting hearts haunt every realm. Witness the heart drift to claim a fate no one can earn any other time of year." },
  { id: "fireflies", name: "Firefly Nights", start: "08-01", end: "08-31", realm: "All realms", accent: "#FFD166", fateKey: "firefly", fateName: "The Firefly Drift", effect: "fireflies", desc: "On hot August nights, wild fireflies stray into every realm and drift glowing across the sky. Witness a swarm before summer ends." },
  { id: "haunting", name: "The Haunting", start: "10-18", end: "11-02", realm: "All realms", accent: "#B9A5E3", fateKey: "haunt", fateName: "The Passing Souls", effect: "wisps", desc: "Around Halloween the Reaper's realm bleeds into the others — pale souls cross the sky. Witness one before they fade for the year." },
  { id: "solstice", name: "Longest Night", start: "12-18", end: "12-28", realm: "All realms", accent: "#8FC6FF", fateKey: "aurora", fateName: "The Aurora", effect: "aurora", desc: "For the darkest week of winter an aurora ribbons across every realm. Witness it — then it is gone for a year." },
];

/** The season whose MM-DD window contains `now`, or null. */
export function activeSeason(now = new Date()) {
  const md = `${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  return SEASONS.find((s) => (s.start <= s.end ? md >= s.start && md <= s.end : md >= s.start || md <= s.end)) || null;
}

export function readSeasonalSeen() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORE_KEY) || "{}");
    return raw && typeof raw === "object" ? raw : {};
  } catch (e) {
    return {};
  }
}

/** Records a seasonal sighting; returns true if it was the first time. */
export function recordSeasonalSeen(fateKey) {
  try {
    const seen = readSeasonalSeen();
    const cur = seen[fateKey];
    seen[fateKey] = { count: (cur?.count || 0) + 1, first: cur?.first || new Date().toISOString() };
    localStorage.setItem(STORE_KEY, JSON.stringify(seen));
    return !cur;
  } catch (e) {
    return false;
  }
}
