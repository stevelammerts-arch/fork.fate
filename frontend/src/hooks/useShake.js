import { useEffect, useRef } from "react";

/**
 * Shake-to-shuffle: fires `onShake` when the device is shaken hard twice
 * within a short window. 3s cooldown so one vigorous shake doesn't chain-deal.
 *
 * iOS 13+ requires DeviceMotionEvent.requestPermission() from inside a user
 * gesture — call `requestMotionPermission()` from a click handler (e.g. the
 * Deal button) once; it no-ops everywhere else.
 */
const THRESHOLD = 11;      // m/s^2 delta considered a "jolt" (forgiving for iOS 60Hz sampling)
const JOLT_WINDOW = 900;   // two jolts within this window = a shake
const COOLDOWN = 3000;

/** Latest known iOS motion-permission state: "granted" | "denied" | null
 * (null = never resolved / non-iOS). Kept in sync by every request path and
 * broadcast via the "ff:motion-perm" window event so UI (ShakeHint) can react. */
let motionPerm = null;
const setMotionPerm = (r) => {
  motionPerm = r;
  try { window.dispatchEvent(new CustomEvent("ff:motion-perm", { detail: r })); } catch (e) { /* ignore */ }
};
export const getMotionPermission = () => motionPerm;

/** True on iOS-style devices where motion needs an explicit in-gesture grant
 * that hasn't happened yet — the ShakeHint turns into an "enable" button. */
export function needsMotionPermission() {
  try {
    return typeof DeviceMotionEvent !== "undefined" &&
      typeof DeviceMotionEvent.requestPermission === "function" &&
      motionPerm !== "granted";
  } catch (e) { return false; }
}

export function requestMotionPermission(onResult) {
  try {
    if (typeof DeviceMotionEvent !== "undefined" &&
        typeof DeviceMotionEvent.requestPermission === "function") {
      DeviceMotionEvent.requestPermission()
        .then((r) => { setMotionPerm(r); if (onResult) onResult(r); })
        .catch(() => {});
    }
  } catch (e) { /* non-iOS or blocked — shake just won't fire */ }
}

/** iOS only shows the Motion prompt from inside a real user gesture, and the
 * deal-button path can lose gesture context behind animations. This installs
 * a document-level capture listener so the very FIRST tap anywhere (realm
 * pick, guide page, anything) triggers the permission prompt. Keeps retrying
 * on later taps until iOS reports granted/denied. No-ops off-iOS. */
export function installMotionPermissionTap() {
  try {
    if (typeof DeviceMotionEvent === "undefined" ||
        typeof DeviceMotionEvent.requestPermission !== "function") return () => {};
    const h = () => {
      if (motionPerm === "granted" || motionPerm === "denied") return;
      DeviceMotionEvent.requestPermission()
        .then((r) => {
          setMotionPerm(r);
          if (r === "granted") document.removeEventListener("click", h, true);
        })
        .catch(() => {});
    };
    document.addEventListener("click", h, true);
    return () => document.removeEventListener("click", h, true);
  } catch (e) {
    return () => {};
  }
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
      // Some iOS states expose only `acceleration` — fall back so shake still works.
      const a = e.accelerationIncludingGravity || e.acceleration;
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
