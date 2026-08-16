// SAVE PROGRESS: everything a player earns (trophies, witnessed fates,
// streaks, passports, favorites, journal...) lives in localStorage under
// "ff_" keys. Export bundles it all into one portable code; import writes
// it back — so clearing browser data or switching phones loses nothing.

const SKIP = new Set(["ff_season_test", "ff_rare_force"]); // dev-only toggles

export function exportProgress() {
  const data = {};
  for (let i = 0; i < localStorage.length; i += 1) {
    const k = localStorage.key(i);
    if (k && k.startsWith("ff_") && !SKIP.has(k)) data[k] = localStorage.getItem(k);
  }
  const json = JSON.stringify({ v: 1, app: "forkfate", ts: Date.now(), data });
  return btoa(unescape(encodeURIComponent(json)));
}

/** Writes a backup code back into localStorage. Returns the number of
 * restored keys, or throws on a bad/foreign code. */
export function importProgress(code) {
  const json = decodeURIComponent(escape(atob((code || "").trim())));
  const parsed = JSON.parse(json);
  if (!parsed || parsed.app !== "forkfate" || typeof parsed.data !== "object") {
    throw new Error("not a Fork\u00b7Fate backup");
  }
  const entries = Object.entries(parsed.data).filter(([k]) => k.startsWith("ff_"));
  entries.forEach(([k, v]) => { if (typeof v === "string") localStorage.setItem(k, v); });
  return entries.length;
}
