import { useSyncExternalStore } from "react";

const KEY = "ff_theme";
const ALLOWED = ["light", "dark", "fall", "winter", "spring", "summer", "cyber", "steam", "tiki", "fantasy", "fairy"];

function stored() {
  try {
    const s = localStorage.getItem(KEY);
    if (ALLOWED.includes(s)) return s;
  } catch (e) { /* storage unavailable */ }
  return null;
}

// First visit (nothing stored): Reaper — the original. The "Choose your realm"
// welcome window handles the user's real pick; no more seasonal auto-defaults.
function read() {
  return stored() || "dark";
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
