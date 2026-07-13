/* Fork·Fate service worker.
   Purpose: make the PWA installable on Android/Chrome (Chrome requires a
   registered service worker with a functional fetch handler for the
   beforeinstallprompt event and a real home-screen install).
   It is intentionally a network passthrough — it does NOT cache anything,
   so the app can never serve stale HTML/JS/icons. Bump SW_VERSION to force
   an update when needed. */
const SW_VERSION = "2026.06-162";

self.addEventListener("install", function () {
  self.skipWaiting();
});

self.addEventListener("activate", function (event) {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", function (event) {
  // Passthrough: required so Chrome treats the app as installable.
  event.respondWith(fetch(event.request));
});
