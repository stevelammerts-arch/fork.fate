// Tiny helpers for realm touch-reactions (gecko, bats, console beeps, unicorn…)

/** Play a one-shot sound, respecting the global mute. */
export const tapSound = (src, vol = 0.8) => {
  try {
    if (localStorage.getItem("ff_muted") === "1") return;
    const a = new Audio(src);
    a.volume = vol;
    a.play().catch(() => {});
  } catch (e) { /* audio unavailable */ }
};

/** Content sections float ABOVE the fixed realm scenes (z-10/z-40 vs z-0),
 * so taps landing on "empty" UI space never reach the scene's easter-egg
 * hotspots underneath. This document-level delegate re-routes taps that hit
 * inert elements to any `[data-egg]` hotspot whose box contains the point. */
export const installEggTapThrough = () => {
  const INERT_BLOCK =
    "button, a, input, textarea, select, label, iframe, [role='button'], " +
    "[role='dialog'], [aria-modal], [data-sonner-toast], " +
    "[data-radix-popper-content-wrapper], [data-egg]";
  const handler = (e) => {
    const t = e.target;
    if (!t || !t.closest || t.closest(INERT_BLOCK)) return;
    // Never steal taps owned by a full-screen overlay (dialogs, guides,
    // parchment intro, mode chooser…): any fixed ancestor at z >= 60.
    let el = t;
    while (el && el !== document.body) {
      const cs = getComputedStyle(el);
      if (cs.position === "fixed" && (parseInt(cs.zIndex, 10) || 0) >= 60) return;
      el = el.parentElement;
    }
    const x = e.clientX, y = e.clientY;
    for (const egg of document.querySelectorAll("[data-egg]")) {
      const r = egg.getBoundingClientRect();
      if (!r.width || x < r.left || x > r.right || y < r.top || y > r.bottom) continue;
      egg.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, cancelable: true, clientX: x, clientY: y }));
      egg.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, clientX: x, clientY: y }));
      return;
    }
  };
  document.addEventListener("click", handler);
  return () => document.removeEventListener("click", handler);
};

/** Retro console beep sequence (WebAudio — no asset needed). */
export const consoleBeeps = () => {
  try {
    if (localStorage.getItem("ff_muted") === "1") return;
    const Ctx = window.AudioContext || window.webkitAudioContext;
    const ctx = window.__ffBeepCtx || (window.__ffBeepCtx = new Ctx());
    if (ctx.state === "suspended") ctx.resume().catch(() => {});
    const t0 = ctx.currentTime;
    [0, 0.14, 0.3, 0.5].forEach((dt, i) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "square";
      o.frequency.value = [880, 1320, 660, 1760][i % 4] + Math.random() * 140;
      g.gain.setValueAtTime(0.0001, t0 + dt);
      g.gain.exponentialRampToValueAtTime(0.055, t0 + dt + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dt + 0.12);
      o.connect(g);
      g.connect(ctx.destination);
      o.start(t0 + dt);
      o.stop(t0 + dt + 0.14);
    });
  } catch (e) { /* audio unavailable */ }
};
