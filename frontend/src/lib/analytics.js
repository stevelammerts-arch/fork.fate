// Thin, safe wrapper around GA4 (gtag.js loaded in public/index.html).
// No-ops gracefully if gtag isn't present (e.g. blocked, offline, or dev).
export function trackEvent(name, params = {}) {
  try {
    if (typeof window !== "undefined" && typeof window.gtag === "function") {
      window.gtag("event", name, params);
    }
  } catch (e) {
    /* analytics is non-critical */
  }
}
