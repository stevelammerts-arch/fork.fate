// Seasonal Events: limited-time takeovers with exclusive collectable fates.
// Each season has a yearly MM-DD window; its fate can ONLY be witnessed while
// the window is open (tracked per-device like heists).

const STORE_KEY = "ff_seasonal_seen";

export const SEASONS = [
  { id: "firstlight", name: "New Year's First Light", start: "01-01", end: "01-21", realm: "All realms", accent: "#FFD75E", fateKey: "sparkler", fateName: "The Midnight Spark", effect: "sparks", desc: "For three weeks in January, golden sparks rise through every realm — embers of resolutions still burning. Catch the sparks climbing before the new year settles in and they gutter out." },
  { id: "sweethearts", name: "Sweetheart Season", start: "02-01", end: "02-21", realm: "All realms", accent: "#FF5C8A", fateKey: "cupid", fateName: "Cupid's Drift", effect: "hearts", desc: "For three weeks in February, drifting hearts haunt every realm. Witness the heart drift to claim a fate no one can earn any other time of year." },
  { id: "clovers", name: "Clover Luck", start: "03-01", end: "03-31", realm: "All realms", accent: "#3ECF6A", fateKey: "clover", fateName: "The Lucky Drift", effect: "clovers", desc: "All March, four-leaf clovers tumble loose from somewhere no map shows and drift through every realm. Witness the lucky drift before the wind takes the luck elsewhere." },
  { id: "petalstorm", name: "Petal Storm", start: "04-01", end: "04-30", realm: "All realms", accent: "#FFA7C4", fateKey: "petal", fateName: "The Petal Storm", effect: "petals", desc: "April shakes the blossoms loose — pale petals storm through every realm on their way to spring. Witness the petal storm before the last bloom lands." },
  { id: "flutter", name: "The Flutter", start: "05-01", end: "05-31", realm: "All realms", accent: "#6FC8FF", fateKey: "butterfly", fateName: "The Flutter-By", effect: "butterflies", desc: "All May, butterflies slip between the realms as if the walls were never there. Witness a flutter-by before they find whatever garden they're looking for." },
  { id: "kiteseason", name: "Kite Season", start: "06-01", end: "06-30", realm: "All realms", accent: "#FF8A3D", fateKey: "kite", fateName: "The String Cutter", effect: "kites", desc: "June winds carry runaway kites — strings cut, tails snapping — across every realm's sky. Witness one sail past before summer reels them all back in." },
  { id: "skybloom", name: "The Grand Finale", start: "07-01", end: "07-31", realm: "All realms", accent: "#FF5A5A", fateKey: "firework", fateName: "The Sky Bloom", effect: "fireworks", desc: "All July the night blooms — fireworks burst over every realm whether its sky allows fire or not. Witness the sky bloom before the last shell falls quiet." },
  { id: "beachballs", name: "Endless Summer", start: "08-01", end: "08-31", realm: "All realms", accent: "#FF6B57", fateKey: "beachball", fateName: "The Bounce-Through", effect: "beachballs", desc: "All August long, runaway beach balls escape the shore and bounce clean through every realm. Witness a bounce-through before summer ends." },
  { id: "steins", name: "Stein Season", start: "09-01", end: "09-30", realm: "All realms", accent: "#F0B429", fateKey: "stein", fateName: "The First Pour", effect: "steins", desc: "Oktoberfest comes early — all September, foamy steins drift through every realm on their way to the tents. Witness the first pour before the taps run dry." },
  { id: "haunting", name: "Halloween Takeover", start: "10-01", end: "10-31", realm: "All realms", accent: "#FF8C1A", fateKey: "haunt", fateName: "The Passing Souls", effect: "wisps", desc: "All October the Reaper's realm bleeds into the others — pale souls cross every sky, and fate itself may arrive inside a carved Jack-o'-Lantern no other month can light. Witness the souls and carve the lantern before November seals them away." },
  { id: "wishbones", name: "Wishbone Season", start: "11-01", end: "11-30", realm: "All realms", accent: "#E8C89A", fateKey: "wishbone", fateName: "The Lucky Break", effect: "wishbones", desc: "All November, unclaimed wishbones drift through every realm looking for someone to snap them. Witness the lucky break before the feast is cleared." },
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
