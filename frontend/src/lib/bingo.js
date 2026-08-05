// Cuisine Bingo: a deterministic 5x5 card of cuisines (FREE center). Squares
// stamp themselves when fate deals that cuisine; completed rows / columns /
// diagonals earn Collection stamps. State lives in localStorage (ff_bingo).

const KEY = "ff_bingo";

// Common cuisines with a realistic chance of being dealt (food + a few
// drink/dessert staples so those modes can stamp squares too).
export const BINGO_POOL = [
  "American", "Diner", "BBQ", "Burgers", "Fried Chicken", "Steakhouse",
  "Sandwiches", "Seafood", "Pizza", "Pasta", "Italian", "Chinese", "Japanese",
  "Sushi", "Korean", "Thai", "Vietnamese", "Ramen", "Indian", "Mexican",
  "Tacos", "Tex-Mex", "Mediterranean", "Greek", "French", "Middle Eastern",
  "Breakfast", "Brunch", "Cafe", "Salads", "Vegan", "Coffee", "Bakery",
  "Ice Cream", "Pub", "Fast Food",
];

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function readBingo() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || "null");
    if (raw && raw.seed) return { marked: {}, lines: [], stamps: 0, cards: 0, ...raw };
  } catch (e) { /* fall through to a fresh card */ }
  const fresh = { seed: Math.floor(Math.random() * 2 ** 31) || 1, marked: {}, lines: [], stamps: 0, cards: 0 };
  try { localStorage.setItem(KEY, JSON.stringify(fresh)); } catch (e) { /* ignore */ }
  return fresh;
}

function save(state) {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* ignore */ }
}

/** The 25 cells for a seed — deterministic, index 12 is the FREE center. */
export function bingoCard(seed) {
  const rnd = mulberry32(seed);
  const pool = [...BINGO_POOL];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  const cells = pool.slice(0, 24);
  cells.splice(12, 0, "FREE");
  return cells;
}

const LINES = (() => {
  const l = [];
  for (let r = 0; r < 5; r++) l.push({ id: `r${r}`, idx: [0, 1, 2, 3, 4].map((c) => r * 5 + c) });
  for (let c = 0; c < 5; c++) l.push({ id: `c${c}`, idx: [0, 1, 2, 3, 4].map((r) => r * 5 + c) });
  l.push({ id: "d0", idx: [0, 6, 12, 18, 24] });
  l.push({ id: "d1", idx: [4, 8, 12, 16, 20] });
  return l;
})();

const isMarked = (cell, marked) => cell === "FREE" || !!marked[cell];

export function completedLines(cells, marked) {
  return LINES.filter((L) => L.idx.every((i) => isMarked(cells[i], marked))).map((L) => L.id);
}

/** Cell indexes that belong to any completed line (for highlighting). */
export function completedCellIndexes(cells, marked) {
  const done = new Set(completedLines(cells, marked));
  const idx = new Set();
  for (const L of LINES) if (done.has(L.id)) L.idx.forEach((i) => idx.add(i));
  return idx;
}

/** Marks the square matching this cuisine (case-insensitive). Returns
 * { hit, square, newLines, stamps, blackout } or null when nothing matched. */
export function markCuisine(cuisine) {
  if (!cuisine) return null;
  const st = readBingo();
  const cells = bingoCard(st.seed);
  const wanted = String(cuisine).trim().toLowerCase();
  const square = cells.find((c) => c !== "FREE" && c.toLowerCase() === wanted);
  if (!square || st.marked[square]) return null;
  st.marked[square] = new Date().toISOString();
  const done = completedLines(cells, st.marked);
  const newLines = done.filter((id) => !st.lines.includes(id)).length;
  st.lines = done;
  st.stamps += newLines;
  const blackout = cells.every((c) => isMarked(c, st.marked));
  save(st);
  return { hit: true, square, newLines, stamps: st.stamps, blackout };
}

/** Start a fresh card after a blackout — stamps and card count carry over. */
export function newBingoCard() {
  const st = readBingo();
  save({ ...st, seed: Math.floor(Math.random() * 2 ** 31) || 1, marked: {}, lines: [], cards: (st.cards || 0) + 1 });
}
