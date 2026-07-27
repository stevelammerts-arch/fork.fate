import { useSyncExternalStore } from "react";

const KEY = "ff_theme";
const ALLOWED = ["light", "dark", "fall", "winter", "spring", "summer", "cyber", "steam", "tiki", "fantasy"];

// Map the current date to a season. Northern hemisphere by default; flip for southern.
function seasonForDate(d, southern) {
  const m = d.getMonth();
  let s;
  if (m >= 2 && m <= 4) s = "spring";
  else if (m >= 5 && m <= 7) s = "summer";
  else if (m >= 8 && m <= 10) s = "fall";
  else s = "winter";
  if (southern) s = { spring: "fall", summer: "winter", fall: "spring", winter: "summer" }[s];
  return s;
}

function stored() {
  try {
    const s = localStorage.getItem(KEY);
    if (ALLOWED.includes(s)) return s;
  } catch (e) { /* storage unavailable */ }
  return null;
}

// Infer hemisphere from the device timezone's DST pattern — no network call needed.
// Southern-hemisphere zones observe DST in their local summer (≈ Jan), so July's
// offset is larger than January's. Zones without DST fall back to northern.
function isSouthernHemisphere() {
  try {
    const y = new Date().getFullYear();
    const jan = new Date(y, 0, 1).getTimezoneOffset();
    const jul = new Date(y, 6, 1).getTimezoneOffset();
    return jul > jan;
  } catch (e) { return false; }
}

// First visit (nothing stored): default to the current season, mapped by hemisphere.
function read() {
  return stored() || seasonForDate(new Date(), isSouthernHemisphere());
}

let current = read();
const listeners = new Set();

function apply() {
  try { document.documentElement.dataset.ffTheme = current; } catch (e) { /* ignore */ }
}
apply();

export function setTheme(next) {
  if (next === current) return;
  current = next;
  try { localStorage.setItem(KEY, next); } catch (e) { /* ignore */ }
  try {
    if (typeof window !== "undefined" && typeof window.gtag === "function") {
      window.gtag("event", "theme_select", { theme: next });
    }
  } catch (e) { /* analytics non-critical */ }
  apply();
  listeners.forEach((l) => l());
}

export function toggleTheme() {
  setTheme(current === "dark" ? "light" : "dark");
}

function subscribe(cb) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function useTheme() {
  const theme = useSyncExternalStore(subscribe, () => current, () => "dark");
  return { theme, toggle: toggleTheme };
}
