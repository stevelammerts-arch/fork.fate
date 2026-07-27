// Passports the user has opened on this device. Server-side codes are the source
// of truth; this is only so they can find their quests again (no accounts yet).
const KEY = "ff_passports";
const MAX = 12;

export function readPassports() {
  try {
    const list = JSON.parse(localStorage.getItem(KEY) || "[]");
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export function rememberPassport(p) {
  if (!p?.code) return;
  try {
    const list = readPassports().filter((x) => x.code !== p.code);
    list.unshift({ ...p, opened_at: Date.now() });
    localStorage.setItem(KEY, JSON.stringify(list.slice(0, MAX)));
  } catch { /* storage unavailable */ }
}

export function forgetPassport(code) {
  try {
    localStorage.setItem(KEY, JSON.stringify(readPassports().filter((x) => x.code !== code)));
  } catch { /* storage unavailable */ }
}
