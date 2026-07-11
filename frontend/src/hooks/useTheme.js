import { useSyncExternalStore } from "react";

const KEY = "ff_theme";
const ALLOWED = ["light", "dark", "fall", "winter", "spring", "summer", "cyber", "steam", "tiki"];

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

// First visit (nothing stored): default to the current season (northern mapping first).
function read() {
  return stored() || seasonForDate(new Date(), false);
}

let current = read();
const listeners = new Set();

function apply() {
  try { document.documentElement.dataset.ffTheme = current; } catch (e) { /* ignore */ }
}
apply();

// If no explicit choice yet, refine the season default by detecting hemisphere via IP location.
if (!stored()) {
  fetch("https://ipapi.co/latitude/")
    .then((r) => r.text())
    .then((t) => {
      const lat = parseFloat(t);
      if (!stored() && !isNaN(lat) && lat < 0) {
        current = seasonForDate(new Date(), true);
        apply();
        listeners.forEach((l) => l());
      }
    })
    .catch(() => { /* keep northern default */ });
}

export function setTheme(next) {
  if (next === current) return;
  current = next;
  try { localStorage.setItem(KEY, next); } catch (e) { /* ignore */ }
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
