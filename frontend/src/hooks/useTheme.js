import { useState, useEffect } from "react";

const KEY = "ff_theme";

// Public-page theme: "dark" (Grim Reaper, default) or "light" (Professional).
// Persists per device in localStorage.
export function useTheme() {
  const [theme, setTheme] = useState(() => {
    try {
      const saved = localStorage.getItem(KEY);
      if (saved === "light" || saved === "dark") return saved;
    } catch (e) { /* storage unavailable */ }
    return "dark";
  });

  useEffect(() => {
    try { document.documentElement.dataset.ffTheme = theme; } catch (e) { /* ignore */ }
  }, [theme]);

  const toggle = () =>
    setTheme((t) => {
      const next = t === "dark" ? "light" : "dark";
      try { localStorage.setItem(KEY, next); } catch (e) { /* ignore */ }
      return next;
    });

  return { theme, toggle };
}
