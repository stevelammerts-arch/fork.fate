// Visibility watchdog for framer-motion entrances.
// Live bug (Dragon's Hoard + Winter, different phones, intermittent): heavy
// realm scenes can starve the JS animation loop (rAF) on phones, so
// JS-driven entrance animations freeze at their initial opacity 0 — the
// shuffle and reveal run invisibly while audio/timers play on (CSS
// animations are compositor-driven and unaffected, which is why the rest of
// the page still moves).
// This hook polls the element after mount and forces it visible if its
// entrance never progressed. It stops as soon as the element has been seen
// visible once, so normal entrances AND exit fades are untouched.
import { useEffect, useRef } from "react";

export function useVisibilityRescue(firstCheckMs = 700, retriggerKey = null) {
  const ref = useRef(null);
  useEffect(() => {
    let cancelled = false;
    let checksLeft = 8;
    let timer;
    const check = () => {
      if (cancelled) return;
      const el = ref.current;
      if (!el) return;
      try {
        const op = parseFloat(getComputedStyle(el).opacity || "1");
        if (op >= 0.5) return; // entrance completed (or we already rescued) — done
        // !important beats framer's plain inline writes on re-renders, which
        // would otherwise re-apply the frozen 0 right after we rescue it.
        el.style.setProperty("opacity", "1", "important");
        el.style.setProperty("transform", "none", "important");
      } catch (e) { return; /* detached node — stop */ }
      if (--checksLeft > 0) timer = setTimeout(check, 900);
    };
    timer = setTimeout(check, firstCheckMs);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [firstCheckMs, retriggerKey]);
  return ref;
}
