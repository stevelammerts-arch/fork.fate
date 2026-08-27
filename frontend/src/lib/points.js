// FATE POINTS: device-local rewards currency (auto-included in Save Progress
// backups via the ff_ prefix). Earned by daily logins, witnessing rare fates
// (rituals) and realm heists; redeemed for sponsor discount coupons.

const BAL = "ff_points";
const LOG = "ff_points_log";
const COUPONS = "ff_points_coupons";
const DAY = "ff_points_day"; // last daily claim, local YYYY-MM-DD
const STREAK = "ff_points_streak"; // consecutive-day login count

export const EARN = { daily: 10, streakBonus: 5, streakCap: 50, ritual: 15, heist: 25, checkin: 50, firefly: 5 };

// Launch catalog: DEMO sponsors — swapped for real partners later.
export const SPONSOR_OFFERS = [
  { id: "rusty-fork", sponsor: "The Rusty Fork Tavern", offer: "10% off any entrée", cost: 500, accent: "#B3141A" },
  { id: "moonlight-brew", sponsor: "Moonlight Brew Co.", offer: "Free appetizer with any pint", cost: 350, accent: "#7A4DB2" },
  { id: "neon-noodle", sponsor: "Neon Noodle Bar", offer: "Buy one boba, get one free", cost: 250, accent: "#0E7490" },
  { id: "gully-green", sponsor: "Gully Green Café", offer: "Free pastry with any coffee", cost: 200, accent: "#2E7D32" },
];

const readJson = (k, fallback) => {
  try {
    const v = JSON.parse(localStorage.getItem(k) || "null");
    return v ?? fallback;
  } catch (e) { return fallback; }
};

export function readPoints() {
  const n = parseInt(localStorage.getItem(BAL) || "0", 10);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

export const readPointsLog = () => readJson(LOG, []);

function writeBalance(next, delta, reason) {
  try {
    localStorage.setItem(BAL, String(next));
    const log = readPointsLog();
    log.unshift({ t: new Date().toISOString(), d: delta, r: reason });
    localStorage.setItem(LOG, JSON.stringify(log.slice(0, 40)));
  } catch (e) { /* storage unavailable */ }
  try { window.dispatchEvent(new CustomEvent("ff:points", { detail: { total: next, delta } })); } catch (e) { /* ignore */ }
  return next;
}

export function awardPoints(amount, reason) {
  if (!amount || amount <= 0) return readPoints();
  return writeBalance(readPoints() + amount, amount, reason);
}

const localDay = (d) => {
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};

/** Once-per-day login award with a consecutive-day streak bonus.
 * Returns { awarded, streak, total } or null if already claimed today. */
export function claimDaily(now = new Date()) {
  const today = localDay(now);
  let last = null;
  let streak = 0;
  try {
    last = localStorage.getItem(DAY);
    streak = parseInt(localStorage.getItem(STREAK) || "0", 10) || 0;
  } catch (e) { return null; }
  if (last === today) return null;
  const yesterday = localDay(new Date(now.getTime() - 86400000));
  streak = last === yesterday ? streak + 1 : 1;
  const bonus = Math.min((streak - 1) * EARN.streakBonus, EARN.streakCap);
  const awarded = EARN.daily + bonus;
  try {
    localStorage.setItem(DAY, today);
    localStorage.setItem(STREAK, String(streak));
  } catch (e) { /* ignore */ }
  const total = writeBalance(readPoints() + awarded, awarded, `Daily login (day ${streak})`);
  return { awarded, streak, total };
}

/** Active-first coupon list; expired ones sink to the bottom. */
export function readCoupons() {
  const list = readJson(COUPONS, []);
  const now = Date.now();
  return list
    .map((c) => ({ ...c, expired: new Date(c.expires).getTime() < now }))
    .sort((a, b) => (a.expired === b.expired ? new Date(b.at) - new Date(a.at) : a.expired ? 1 : -1));
}

/** GPS-verified restaurant check-in: once per place per day. Returns the new
 * total, or null when already claimed today. */
export function claimCheckin(placeKey, name) {
  const today = localDay(new Date());
  const map = readJson("ff_checkins", {});
  if (map[placeKey] === today) return null;
  map[placeKey] = today;
  try { localStorage.setItem("ff_checkins", JSON.stringify(map)); } catch (e) { return null; }
  return awardPoints(EARN.checkin, `Checked in: ${name}`);
}

export function checkedInToday(placeKey) {
  return readJson("ff_checkins", {})[placeKey] === localDay(new Date());
}

/** Tiny bonus the first time the fireflies get scattered each night.
 * Returns the new total, or null when already claimed today. */
export function claimFireflyScatter() {
  const today = localDay(new Date());
  try {
    if (localStorage.getItem("ff_firefly_day") === today) return null;
    localStorage.setItem("ff_firefly_day", today);
  } catch (e) { return null; }
  return awardPoints(EARN.firefly, "Scattered the fireflies");
}

const CODE_CHARS = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // no ambiguous 0/O/1/I/L
const chunk = () => Array.from({ length: 4 }, () => CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]).join("");

/** Deducts the offer cost and mints a 7-day cashier coupon.
 * Returns the coupon, or null when the balance is short. */
export function redeemOffer(offer) {
  const bal = readPoints();
  if (bal < offer.cost) return null;
  const coupon = {
    id: `${offer.id}-${Date.now()}`,
    code: `FF-${chunk()}-${chunk()}`,
    sponsor: offer.sponsor,
    offer: offer.offer,
    cost: offer.cost,
    accent: offer.accent,
    at: new Date().toISOString(),
    expires: new Date(Date.now() + 7 * 86400000).toISOString(),
  };
  try {
    const list = readJson(COUPONS, []);
    list.unshift(coupon);
    localStorage.setItem(COUPONS, JSON.stringify(list.slice(0, 20)));
  } catch (e) { return null; }
  writeBalance(bal - offer.cost, -offer.cost, `Redeemed: ${offer.sponsor}`);
  return coupon;
}
