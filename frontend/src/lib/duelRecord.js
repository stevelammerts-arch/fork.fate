// Duel Record: per-device win/loss ledger from Fate Duels (localStorage).
// Entries: { code, won, rival, myPick, theirPick, date } — deduped by code,
// recorded only for actual participants (challenger flag / answered flag).

const KEY = "ff_duel_record";
const MAX = 100;

export function readDuelRecord() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || "[]");
    // Keep plain objects only — legacy/corrupt rows must never crash pages.
    return Array.isArray(raw) ? raw.filter((x) => x && typeof x === "object" && !Array.isArray(x)) : [];
  } catch (e) {
    return [];
  }
}

/** Record a settled duel from this device's point of view.
 * role: "challenger" | "responder". No-op without a verdict or on replays. */
export function recordDuelOutcome(duel, role) {
  if (!duel?.verdict || !duel.code) return;
  try {
    const duels = readDuelRecord();
    if (duels.some((d) => d.code === duel.code)) return;
    const mine = role === "challenger" ? duel.challenger_pick : duel.responder_pick;
    const theirs = role === "challenger" ? duel.responder_pick : duel.challenger_pick;
    duels.unshift({
      code: duel.code,
      won: duel.verdict.winner === role,
      rival: (role === "challenger" ? duel.responder : duel.challenger) || "",
      myPick: mine?.name || "",
      theirPick: theirs?.name || "",
      date: new Date().toISOString(),
    });
    localStorage.setItem(KEY, JSON.stringify(duels.slice(0, MAX)));
  } catch (e) { /* storage unavailable */ }
}

export function duelStats(duels) {
  const wins = duels.filter((d) => d.won).length;
  const losses = duels.length - wins;
  // Current streak: consecutive same-outcome duels from the most recent.
  let streak = 0;
  for (const d of duels) {
    if (d.won === duels[0]?.won) streak += 1;
    else break;
  }
  return { wins, losses, streak, streakWon: duels[0]?.won ?? null };
}
