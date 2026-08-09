// Fate Journal: per-device history of every fate dealt (localStorage).
// Entries: { id, name, cuisine, price, distance, theme, mode, dared, group,
//            date, verdict, lat, lng } — verdict is null | "up" | "down";
//            lat/lng feed the Conquest Map (null for pre-406 entries).

const KEY = "ff_journal";
const MAX = 250;

export function readJournal() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || "[]");
    return Array.isArray(raw) ? raw : [];
  } catch (e) {
    return [];
  }
}

export function recordFate(card, { theme, mode, dared = false, group = false } = {}) {
  try {
    const entries = readJournal();
    entries.unshift({
      id: card.id,
      name: card.name,
      cuisine: card.cuisine || "",
      price: card.price || "",
      distance: card.distance ?? null,
      lat: card.lat ?? null,
      lng: card.lng ?? null,
      theme,
      mode,
      dared,
      group,
      date: new Date().toISOString(),
      verdict: null,
    });
    localStorage.setItem(KEY, JSON.stringify(entries.slice(0, MAX)));
  } catch (e) { /* storage unavailable */ }
}

/** Attach the "chose well / failed me" verdict to the latest unjudged entry
 * for this place (verdicts arrive after the deal, via ReactionBar). */
export function recordVerdict(placeId, verdict) {
  try {
    const entries = readJournal();
    const hit = entries.find((en) => en.id === placeId && !en.verdict);
    if (!hit) return;
    hit.verdict = verdict;
    localStorage.setItem(KEY, JSON.stringify(entries));
  } catch (e) { /* ignore */ }
}

export function journalStats(entries) {
  const total = entries.length;
  const well = entries.filter((e) => e.verdict === "up").length;
  const failed = entries.filter((e) => e.verdict === "down").length;
  const judged = well + failed;
  const dares = entries.filter((e) => e.dared).length;
  const byCuisine = {};
  for (const e of entries) if (e.cuisine) byCuisine[e.cuisine] = (byCuisine[e.cuisine] || 0) + 1;
  const topCuisine = Object.entries(byCuisine).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
  return {
    total,
    well,
    failed,
    judged,
    wellPct: judged ? Math.round((well / judged) * 100) : null,
    dares,
    topCuisine,
  };
}
