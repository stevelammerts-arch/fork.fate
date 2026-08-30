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
