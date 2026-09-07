// Shared PWA / install detection helpers.
export const ua = () => window.navigator.userAgent || "";

export const isStandalone = () =>
  window.matchMedia?.("(display-mode: standalone)").matches ||
  window.navigator.standalone === true;

export const isIOS = () =>
  /iphone|ipad|ipod/i.test(ua()) ||
  // iPadOS 13+ reports as Mac; detect touch to disambiguate
  (/Macintosh/i.test(ua()) && "ontouchend" in document);

// Since iOS 16.4 all iOS browsers can Add to Home Screen from their share
// menu; Safari detection is only used to describe where the button lives.
export const isIOSSafari = () => isIOS() && !/(CriOS|FxiOS|EdgiOS|OPiOS|GSA)/i.test(ua());

export const isAndroid = () => /Android/i.test(ua());

// Detect the iOS App Store wrapper (PWABuilder / WKWebView shell) specifically.
// A native wrapper reports as iOS but lacks Safari in its User-Agent string.
export const isIOSWrapper = () => isIOS() && isStandalone() && !/Safari/.test(ua());

// Native-style share via the Web Share API. Inside the iOS wrapper this
// invokes UIActivityViewController; in-browser it falls back to clipboard.
export async function nativeShare({ title, text, url }) {
  try {
    if (navigator.share) {
      await navigator.share({ title, text, url });
      return { ok: true, method: "native" };
    }
  } catch (e) {
    // User cancelled — fall through to clipboard
  }
  try {
    await navigator.clipboard.writeText(url || text || "");
    return { ok: true, method: "clipboard" };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

// Haptic buzz that works EVERYWHERE: Android/desktop use the Vibration API;
// the iOS Capacitor shell (where navigator.vibrate doesn't exist) replays the
// pattern as native Taptic impacts via the injected Capacitor bridge.
export function haptic(pattern = 15) {
  try {
    const H = window.Capacitor?.Plugins?.Haptics;
    if (H) {
      const segs = Array.isArray(pattern) ? pattern : [pattern];
      if (segs.length === 1 && segs[0] === 0) return; // vibrate(0) = cancel; nothing queued natively
      let at = 0;
      segs.forEach((ms, i) => {
        if (i % 2 === 0 && ms > 0) {
          // longer web buzzes read as harder native thumps
          const style = ms >= 100 ? "HEAVY" : ms >= 55 ? "MEDIUM" : "LIGHT";
          if (at === 0) H.impact({ style }).catch(() => {});
          else setTimeout(() => H.impact({ style }).catch(() => {}), at);
        }
        at += ms;
      });
      return;
    }
    if (typeof navigator.vibrate === "function") navigator.vibrate(pattern);
  } catch (e) {
    /* no-op */
  }
}
