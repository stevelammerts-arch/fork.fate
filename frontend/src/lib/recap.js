// FATE RECAP: "Wrapped"-style stats crunched from the device's own history —
// journal deals, verdicts, realms, duels, check-ins, secrets and streaks.

import { readJournal } from "./journal";
import { readDuelRecord, duelStats } from "./duelRecord";
import { readBestStreak, readCheckinWeekStreak } from "./points";
import { SECRETS, readSecretsFound } from "./secretTrophies";

export const REALM_LABELS = {
  dark: "Reaper's Domain",
  light: "Coffee Shop",
  fall: "Fall",
  winter: "Winter",
  spring: "Spring",
  summer: "Summer",
  cyber: "Cyberscape",
  steam: "Steampunk",
  tiki: "Tiki Lounge",
  fantasy: "Dragon's Hoard",
  fairy: "Fairy Gully",
};

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const inPeriod = (iso, { year, month }) => {
  if (!iso) return false;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime()) || d.getFullYear() !== year) return false;
  return month == null || d.getMonth() === month;
};

const topOf = (counts) => {
  const [key, n] = Object.entries(counts).sort((a, b) => b[1] - a[1])[0] || [null, 0];
  return key ? { key, count: n } : null;
};

/** Crunch every stat the Recap slides need for a year (month = null) or a
 * single month (0-11) of that year. */
export function buildRecap({ year, month = null }) {
  const period = { year, month };
  const entries = readJournal().filter((e) => inPeriod(e.date, period));

  const cuisines = {};
  const realms = {};
  const byMonth = {};
  let well = 0, failed = 0, dares = 0;
  for (const e of entries) {
    if (e.cuisine) cuisines[e.cuisine] = (cuisines[e.cuisine] || 0) + 1;
    if (e.theme && REALM_LABELS[e.theme]) realms[e.theme] = (realms[e.theme] || 0) + 1;
    if (e.verdict === "up") well += 1;
    if (e.verdict === "down") failed += 1;
    if (e.dared) dares += 1;
    const m = new Date(e.date).getMonth();
    byMonth[m] = (byMonth[m] || 0) + 1;
  }
  const judged = well + failed;
  const topCuisine = topOf(cuisines);
  const topRealmRaw = topOf(realms);
  const busiestRaw = month == null ? topOf(byMonth) : null;

  const duels = readDuelRecord().filter((d) => inPeriod(d.date, period));
  const d = duelStats(duels);

  let checkins = 0;
  try {
    const map = JSON.parse(localStorage.getItem("ff_checkins") || "{}");
    checkins = Object.values(map).filter((day) => inPeriod(`${day}T12:00:00`, period)).length;
  } catch (e) { /* ignore */ }

  const found = readSecretsFound();
  const secretsFound = SECRETS.filter((s) => found[s.id]).length;

  return {
    year,
    month,
    label: month == null ? String(year) : `${MONTHS[month]} ${year}`,
    total: entries.length,
    uniquePlaces: new Set(entries.map((e) => e.name)).size,
    topCuisine,
    wellPct: judged ? Math.round((well / judged) * 100) : null,
    judged,
    dares,
    topRealm: topRealmRaw ? { label: REALM_LABELS[topRealmRaw.key], count: topRealmRaw.count } : null,
    busiestMonth: busiestRaw ? { label: MONTHS[busiestRaw.key], count: busiestRaw.count } : null,
    duels: duels.length ? { wins: d.wins, losses: d.losses } : null,
    checkins,
    bestStreak: readBestStreak(),
    checkinWeekStreak: readCheckinWeekStreak().streak,
    secretsFound,
    secretsTotal: SECRETS.length,
  };
}
