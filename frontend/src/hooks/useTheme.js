import { useSyncExternalStore } from "react";

const KEY = "ff_theme";

function read() {
  try {
    const s = localStorage.getItem(KEY);
    if (["light", "dark", "fall", "winter", "spring", "summer"].includes(s)) return s;
  } catch (e) { /* storage unavailable */ }
  return "dark";
}

// Shared module-level store so every useTheme() consumer stays in sync.
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
