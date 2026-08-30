// Seasonal Events: limited-time takeovers with exclusive collectable fates.
// Each season has a yearly MM-DD window; its fate can ONLY be witnessed while
// the window is open (tracked per-device like heists).

const STORE_KEY = "ff_seasonal_seen";

export const SEASONS = [
  { id: "sweethearts", name: "Sweetheart Season", start: "02-01", end: "02-21", realm: "All realms", accent: "#FF5C8A", fateKey: "cupid", fateName: "Cupid's Drift", effect: "hearts", desc: "For three weeks in February, drifting hearts haunt every realm. Witness the heart drift to claim a fate no one can earn any other time of year." },
  { id: "beachballs", name: "Endless Summer", start: "08-01", end: "08-31", realm: "All realms", accent: "#FF6B57", fateKey: "beachball", fateName: "The Bounce-Through", effect: "beachballs", desc: "All August long, runaway beach balls escape the shore and bounce clean through every realm. Witness a bounce-through before summer ends." },
  { id: "steins", name: "Stein Season", start: "09-01", end: "09-30", realm: "All realms", accent: "#F0B429", fateKey: "stein", fateName: "The First Pour", effect: "steins", desc: "Oktoberfest comes early — all September, foamy steins drift through every realm on their way to the tents. Witness the first pour before the taps run dry." },
  { id: "haunting", name: "Halloween Takeover", start: "10-01", end: "10-31", realm: "All realms", accent: "#FF8C1A", fateKey: "haunt", fateName: "The Passing Souls", effect: "wisps", desc: "All October the Reaper's realm bleeds into the others — pale souls cross every sky, and fate itself may arrive inside a carved Jack-o'-Lantern no other month can light. Witness the souls and carve the lantern before November seals them away." },
  { id: "solstice", name: "Longest Night", start: "12-18", end: "12-28", realm: "All realms", accent: "#8FC6FF", fateKey: "aurora", fateName: "The Aurora", effect: "aurora", desc: "For the darkest week of winter an aurora ribbons across every realm. Witness it — then it is gone for a year." },
];

/** The season whose MM-DD window contains `now`, or null.
 * (`ff_season_test` in localStorage forces a season by id — dev/testing.) */
export function activeSeason(now = new Date()) {
  try {
    const f = localStorage.getItem("ff_season_test");
    if (f) return SEASONS.find((s) => s.id === f) || null;
  } catch (e) { /* ignore */ }
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
