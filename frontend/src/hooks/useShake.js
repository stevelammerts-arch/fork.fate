import { useEffect, useRef } from "react";

/**
 * Shake-to-shuffle: fires `onShake` when the device is shaken hard twice
 * within a short window. 3s cooldown so one vigorous shake doesn't chain-deal.
 *
 * iOS 13+ requires DeviceMotionEvent.requestPermission() from inside a user
 * gesture — call `requestMotionPermission()` from a click handler (e.g. the
 * Deal button) once; it no-ops everywhere else.
 */
const THRESHOLD = 14;      // m/s^2 delta considered a "jolt"
const JOLT_WINDOW = 900;   // two jolts within this window = a shake
const COOLDOWN = 3000;

export function requestMotionPermission() {
  try {
    if (typeof DeviceMotionEvent !== "undefined" &&
        typeof DeviceMotionEvent.requestPermission === "function") {
      DeviceMotionEvent.requestPermission().catch(() => {});
    }
  } catch (e) { /* non-iOS or blocked — shake just won't fire */ }
}

export function useShake(onShake, enabled = true) {
  const cbRef = useRef(onShake);
  cbRef.current = onShake;

  useEffect(() => {
    if (!enabled || typeof window === "undefined" || !("DeviceMotionEvent" in window)) return;
    let last = { x: null, y: null, z: null };
    let lastJolt = 0;
    let lastFire = 0;
    const handler = (e) => {
      const a = e.accelerationIncludingGravity;
      if (!a || a.x === null) return;
      if (last.x !== null) {
        const delta = Math.abs(a.x - last.x) + Math.abs(a.y - last.y) + Math.abs(a.z - last.z);
        const now = Date.now();
        if (delta > THRESHOLD) {
          if (now - lastJolt < JOLT_WINDOW && now - lastFire > COOLDOWN) {
            lastFire = now;
            lastJolt = 0;
            cbRef.current?.();
          } else {
            lastJolt = now;
          }
        }
      }
      last = { x: a.x, y: a.y, z: a.z };
    };
    window.addEventListener("devicemotion", handler);
    return () => window.removeEventListener("devicemotion", handler);
  }, [enabled]);
}
