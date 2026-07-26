// Shared PWA / install detection helpers.
export const ua = () => window.navigator.userAgent || "";

export const isStandalone = () =>
  window.matchMedia?.("(display-mode: standalone)").matches ||
  window.navigator.standalone === true;

export const isIOS = () =>
  /iphone|ipad|ipod/i.test(ua()) ||
  // iPadOS 13+ reports as Mac; detect touch to disambiguate
  (/Macintosh/i.test(ua()) && "ontouchend" in document);

// On iOS only Safari can Add to Home Screen (Chrome/Firefox/Edge in-app cannot).
export const isIOSSafari = () => isIOS() && !/(CriOS|FxiOS|EdgiOS|OPiOS|GSA)/i.test(ua());

export const isAndroid = () => /Android/i.test(ua());
