// Shareable brag cards drawn on canvas: Cuisine Bingo snapshot + Fate Journal
// story. Both return PNG blobs; shareImage() uses the Web Share API with a
// download fallback.

const GOLD = "#E6B23A";
const GOLD_LIGHT = "#F3D9A0";
const RED = "#E01E26";
const BG = "#0B0B0D";

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function wrapLines(ctx, text, maxWidth) {
  const words = String(text).split(" ");
  const lines = [];
  let cur = "";
  for (const w of words) {
    const trial = cur ? `${cur} ${w}` : w;
    if (ctx.measureText(trial).width <= maxWidth || !cur) cur = trial;
    else { lines.push(cur); cur = w; }
  }
  if (cur) lines.push(cur);
  return lines.slice(0, 2);
}

export async function buildBingoShareImage(cells, marked, stamps, lineIdx) {
  const S = 1080;
  const H = 1350; // 4:5 portrait — the 5x5 grid needs the extra height
  const canvas = document.createElement("canvas");
  canvas.width = S; canvas.height = H;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = BG; ctx.fillRect(0, 0, S, H);
  ctx.fillStyle = RED; ctx.fillRect(0, 0, S, 10);

  ctx.textAlign = "center";
  ctx.fillStyle = GOLD_LIGHT;
  ctx.font = "700 62px Georgia, serif";
  ctx.fillText("CUISINE BINGO", S / 2, 112);
  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.font = "700 26px Arial, sans-serif";
  ctx.fillText(`${stamps} ${stamps === 1 ? "STAMP" : "STAMPS"} EARNED`, S / 2, 162);

  const margin = 60, gap = 12;
  const cell = (S - margin * 2 - gap * 4) / 5;
  const top = 215;
  const markedCount = cells.filter((c) => c !== "FREE" && marked[c]).length;

  cells.forEach((c, i) => {
    const col = i % 5, row = Math.floor(i / 5);
    const x = margin + col * (cell + gap);
    const y = top + row * (cell + gap);
    const free = c === "FREE";
    const isMarked = free || !!marked[c];
    const inLine = lineIdx.has(i);
    roundRect(ctx, x, y, cell, cell, 16);
    ctx.fillStyle = inLine ? "rgba(230,178,58,0.18)" : isMarked ? "rgba(224,30,38,0.14)" : "rgba(255,255,255,0.04)";
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = inLine ? GOLD : isMarked ? "rgba(224,30,38,0.7)" : "rgba(255,255,255,0.12)";
    ctx.stroke();
    if (free) {
      ctx.fillStyle = GOLD;
      ctx.font = "700 64px Georgia, serif";
      ctx.fillText("★", x + cell / 2, y + cell / 2 + 14);
      ctx.font = "700 18px Arial, sans-serif";
      ctx.fillText("FREE", x + cell / 2, y + cell - 22);
    } else {
      ctx.fillStyle = isMarked ? "#FFFFFF" : "rgba(255,255,255,0.5)";
      ctx.font = "700 24px Arial, sans-serif";
      const lines = wrapLines(ctx, c, cell - 20);
      lines.forEach((ln, li) => {
        ctx.fillText(ln, x + cell / 2, y + cell / 2 + (li - (lines.length - 1) / 2) * 30 + 8);
      });
      if (isMarked) {
        ctx.beginPath();
        ctx.arc(x + cell - 22, y + 22, 16, 0, Math.PI * 2);
        ctx.fillStyle = inLine ? GOLD : RED;
        ctx.fill();
        ctx.fillStyle = inLine ? "#241804" : "#FFFFFF";
        ctx.font = "700 20px Arial, sans-serif";
        ctx.fillText("✓", x + cell - 22, y + 29);
      }
    }
  });

  ctx.fillStyle = "rgba(255,255,255,0.45)";
  ctx.font = "600 26px Arial, sans-serif";
  ctx.fillText(`${markedCount}/24 stamped — fate fills the card`, S / 2, H - 72);
  ctx.fillStyle = GOLD;
  ctx.font = "700 24px Georgia, serif";
  ctx.fillText("fork-fate.com", S / 2, H - 30);

  return new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
}

export async function buildJournalShareImage(stats, streak) {
  const S = 1080;
  const canvas = document.createElement("canvas");
  canvas.width = S; canvas.height = S;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = BG; ctx.fillRect(0, 0, S, S);
  ctx.fillStyle = RED; ctx.fillRect(0, 0, S, 10);

  ctx.textAlign = "center";
  ctx.fillStyle = GOLD_LIGHT;
  ctx.font = "700 58px Georgia, serif";
  ctx.fillText("MY FORK·FATE STORY", S / 2, 120);

  const rows = [
    [String(stats.total), "FATES DEALT"],
    [stats.wellPct === null ? "—" : `${stats.wellPct}%`, "TOLD FATE IT CHOSE WELL"],
    [String(stats.dares), "DARES TAKEN"],
    [streak > 0 ? `${streak}` : "—", "DAY STREAK"],
  ];
  const top = 235, rowH = 150;
  rows.forEach(([val, label], i) => {
    const y = top + i * rowH;
    roundRect(ctx, 90, y - 82, S - 180, 118, 20);
    ctx.fillStyle = "rgba(255,255,255,0.045)";
    ctx.fill();
    ctx.strokeStyle = "rgba(230,178,58,0.25)";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.textAlign = "left";
    ctx.fillStyle = RED;
    ctx.font = "700 76px Georgia, serif";
    ctx.fillText(val, 130, y + 8);
    ctx.textAlign = "right";
    ctx.fillStyle = "rgba(255,255,255,0.75)";
    ctx.font = "700 30px Arial, sans-serif";
    ctx.fillText(label, S - 130, y);
    ctx.textAlign = "center";
  });

  if (stats.topCuisine) {
    ctx.fillStyle = GOLD;
    ctx.font = "700 34px Georgia, serif";
    ctx.fillText(`Fate keeps sending me to ${stats.topCuisine}`, S / 2, 880);
  }

  ctx.fillStyle = "rgba(255,255,255,0.5)";
  ctx.font = "italic 600 30px Georgia, serif";
  ctx.fillText("The Reaper remembers.", S / 2, S - 92);
  ctx.fillStyle = GOLD;
  ctx.font = "700 24px Georgia, serif";
  ctx.fillText("fork-fate.com", S / 2, S - 40);

  return new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
}

/** Fate Duel verdict brag card: both picks, both fate-scores, crowned winner. */
export async function buildDuelShareImage(duel) {
  const S = 1080;
  const canvas = document.createElement("canvas");
  canvas.width = S; canvas.height = S;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = BG; ctx.fillRect(0, 0, S, S);
  ctx.fillStyle = RED; ctx.fillRect(0, 0, S, 10);

  ctx.textAlign = "center";
  ctx.fillStyle = GOLD_LIGHT;
  ctx.font = "700 64px Georgia, serif";
  ctx.fillText("FATE DUEL", S / 2, 118);
  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.font = "700 26px Arial, sans-serif";
  ctx.fillText("TWO MORTALS. ONE LOCATION. ONE WINNER.", S / 2, 168);

  const v = duel.verdict || {};
  const panels = [
    { name: duel.challenger || "The challenger", pick: duel.challenger_pick, score: v.challenger_score, won: v.winner === "challenger", x: 70 },
    { name: duel.responder || "The challenged", pick: duel.responder_pick, score: v.responder_score, won: v.winner === "responder", x: S / 2 + 20 },
  ];
  const pw = S / 2 - 90, py = 250, ph = 520;

  panels.forEach((p) => {
    roundRect(ctx, p.x, py, pw, ph, 24);
    ctx.fillStyle = p.won ? "rgba(230,178,58,0.10)" : "rgba(255,255,255,0.045)";
    ctx.fill();
    ctx.strokeStyle = p.won ? GOLD : "rgba(255,255,255,0.18)";
    ctx.lineWidth = p.won ? 5 : 2;
    ctx.stroke();

    const cx = p.x + pw / 2;
    if (p.won) {
      // Simple crown above the winning panel.
      ctx.fillStyle = GOLD;
      const cw = 84, chh = 52, bx = cx - cw / 2, by = py - 74;
      ctx.beginPath();
      ctx.moveTo(bx, by + chh);
      ctx.lineTo(bx, by + 14);
      ctx.lineTo(bx + cw * 0.25, by + chh * 0.55);
      ctx.lineTo(bx + cw * 0.5, by);
      ctx.lineTo(bx + cw * 0.75, by + chh * 0.55);
      ctx.lineTo(bx + cw, by + 14);
      ctx.lineTo(bx + cw, by + chh);
      ctx.closePath();
      ctx.fill();
    }

    ctx.textAlign = "center";
    ctx.fillStyle = "rgba(255,255,255,0.6)";
    ctx.font = "700 24px Arial, sans-serif";
    const nm = p.name.length > 18 ? `${p.name.slice(0, 17)}…` : p.name;
    ctx.fillText(nm.toUpperCase(), cx, py + 64);

    ctx.fillStyle = "#FFFFFF";
    ctx.font = "700 42px Georgia, serif";
    const lines = wrapLines(ctx, p.pick?.name || "?", pw - 60);
    lines.forEach((ln, li) => ctx.fillText(ln, cx, py + 150 + li * 52));

    if (p.pick?.cuisine) {
      ctx.fillStyle = "rgba(255,255,255,0.5)";
      ctx.font = "600 28px Arial, sans-serif";
      ctx.fillText(p.pick.cuisine, cx, py + 282);
    }

    ctx.fillStyle = p.won ? GOLD : "rgba(255,255,255,0.65)";
    ctx.font = "700 108px Georgia, serif";
    ctx.fillText(p.score != null ? p.score.toFixed(1) : "—", cx, py + 430);
    ctx.fillStyle = "rgba(255,255,255,0.4)";
    ctx.font = "700 22px Arial, sans-serif";
    ctx.fillText("FATE-SCORE", cx, py + 470);
  });

  // Center VS medallion.
  ctx.beginPath();
  ctx.arc(S / 2, py + ph / 2, 56, 0, Math.PI * 2);
  ctx.fillStyle = BG; ctx.fill();
  ctx.strokeStyle = RED; ctx.lineWidth = 4; ctx.stroke();
  ctx.fillStyle = RED;
  ctx.font = "700 44px Georgia, serif";
  ctx.fillText("VS", S / 2, py + ph / 2 + 16);

  const winner = v.winner === "challenger" ? panels[0].name : panels[1].name;
  ctx.fillStyle = GOLD;
  ctx.font = "700 54px Georgia, serif";
  ctx.fillText(`Fate favors ${winner}!`, S / 2, 880);
  ctx.fillStyle = "rgba(255,255,255,0.5)";
  ctx.font = "italic 600 30px Georgia, serif";
  ctx.fillText("The Reaper has spoken.", S / 2, S - 92);
  ctx.fillStyle = GOLD;
  ctx.font = "700 24px Georgia, serif";
  ctx.fillText("fork-fate.com", S / 2, S - 40);

  return new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
}

/** Trophy shelf brag card: rituals, heists, and every earned realm seal. */
export async function buildCollectionShareImage(stats) {
  const S = 1080;
  const canvas = document.createElement("canvas");
  canvas.width = S; canvas.height = S;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = BG; ctx.fillRect(0, 0, S, S);
  ctx.fillStyle = RED; ctx.fillRect(0, 0, S, 10);

  ctx.textAlign = "center";
  ctx.fillStyle = GOLD_LIGHT;
  ctx.font = "700 60px Georgia, serif";
  ctx.fillText("MY FATE COLLECTION", S / 2, 118);
  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.font = "700 26px Arial, sans-serif";
  ctx.fillText("RARE FATES WITNESSED AT THE TABLE", S / 2, 166);

  const rows = [
    [`${stats.rituals}/${stats.ritualsTotal}`, "RARE RITUALS SURVIVED"],
    [`${stats.heists}/${stats.heistsTotal}`, "HEISTS WITNESSED"],
    [`${stats.seals}/${stats.sealsTotal}`, "REALM SEALS EARNED"],
  ];
  const top = 268, rowH = 148;
  rows.forEach(([val, label], i) => {
    const y = top + i * rowH;
    roundRect(ctx, 90, y - 82, S - 180, 118, 20);
    ctx.fillStyle = "rgba(255,255,255,0.045)";
    ctx.fill();
    ctx.strokeStyle = "rgba(230,178,58,0.25)";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.textAlign = "left";
    ctx.fillStyle = RED;
    ctx.font = "700 70px Georgia, serif";
    ctx.fillText(val, 130, y + 6);
    ctx.textAlign = "right";
    ctx.fillStyle = "rgba(255,255,255,0.75)";
    ctx.font = "700 30px Arial, sans-serif";
    ctx.fillText(label, S - 130, y);
    ctx.textAlign = "center";
  });

  // the seal shelf: earned seals gleam gold, the rest wait in shadow
  ctx.fillStyle = "rgba(255,255,255,0.45)";
  ctx.font = "700 24px Arial, sans-serif";
  ctx.fillText("REALM SEALS", S / 2, 742);
  const names = stats.sealNames;
  const perRow = Math.min(names.length, 6);
  const gap = (S - 160) / perRow;
  names.forEach((sn, i) => {
    const row = Math.floor(i / perRow), col = i % perRow;
    const x = 80 + gap * col + gap / 2;
    const y = 800 + row * 104;
    ctx.beginPath();
    ctx.arc(x, y, 30, 0, Math.PI * 2);
    ctx.fillStyle = sn.earned ? GOLD : "rgba(255,255,255,0.07)";
    ctx.fill();
    ctx.strokeStyle = sn.earned ? GOLD_LIGHT : "rgba(255,255,255,0.15)";
    ctx.lineWidth = 3;
    ctx.stroke();
    if (sn.earned) {
      ctx.fillStyle = "#241804";
      ctx.font = "700 30px Georgia, serif";
      ctx.fillText("★", x, y + 11);
    }
    ctx.fillStyle = sn.earned ? GOLD_LIGHT : "rgba(255,255,255,0.35)";
    ctx.font = "600 17px Arial, sans-serif";
    ctx.fillText(sn.name.length > 12 ? `${sn.name.slice(0, 11)}…` : sn.name, x, y + 62);
  });

  ctx.fillStyle = "rgba(255,255,255,0.5)";
  ctx.font = "italic 600 30px Georgia, serif";
  ctx.fillText("Fate favors the watchful.", S / 2, S - 92);
  ctx.fillStyle = GOLD;
  ctx.font = "700 24px Georgia, serif";
  ctx.fillText("fork-fate.com", S / 2, S - 40);

  return new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
}

/** Hidden Bonuses hunt card: gold stars for found secrets, shadows for the
 * rest — hints stay secret, only trophy TITLES of found ones are revealed. */
export async function buildSecretsShareImage(secrets, found) {
  const S = 1080;
  const H = 1350; // 4:5 portrait — room for the full trophy shelf
  const canvas = document.createElement("canvas");
  canvas.width = S; canvas.height = H;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = BG; ctx.fillRect(0, 0, S, H);
  ctx.fillStyle = RED; ctx.fillRect(0, 0, S, 10);

  const n = secrets.filter((s) => found[s.id]).length;
  ctx.textAlign = "center";
  ctx.fillStyle = GOLD_LIGHT;
  ctx.font = "700 62px Georgia, serif";
  ctx.fillText("HIDDEN BONUSES", S / 2, 112);
  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.font = "700 26px Arial, sans-serif";
  ctx.fillText("THE REALMS REACT WHEN TOUCHED — I FOUND THESE", S / 2, 162);

  // progress bar
  const bw = S - 240;
  roundRect(ctx, 120, 196, bw, 26, 13);
  ctx.fillStyle = "rgba(255,255,255,0.08)"; ctx.fill();
  if (n > 0) {
    roundRect(ctx, 120, 196, Math.max(26, bw * (n / secrets.length)), 26, 13);
    ctx.fillStyle = GOLD; ctx.fill();
  }
  ctx.fillStyle = GOLD_LIGHT;
  ctx.font = "700 40px Georgia, serif";
  ctx.fillText(`${n} of ${secrets.length} discovered`, S / 2, 292);

  // trophy shelf: 3 columns of chips
  const cols = 3, gapX = 24, gapY = 20;
  const cw = (S - 120 - gapX * (cols - 1)) / cols, ch = 138;
  const top = 340;
  secrets.forEach((s, i) => {
    const col = i % cols, row = Math.floor(i / cols);
    const x = 60 + col * (cw + gapX);
    const y = top + row * (ch + gapY);
    const isFound = !!found[s.id];
    roundRect(ctx, x, y, cw, ch, 18);
    ctx.fillStyle = isFound ? "rgba(230,178,58,0.12)" : "rgba(255,255,255,0.04)";
    ctx.fill();
    ctx.strokeStyle = isFound ? GOLD : "rgba(255,255,255,0.12)";
    ctx.lineWidth = isFound ? 3 : 2;
    ctx.stroke();
    const cx = x + cw / 2;
    ctx.fillStyle = isFound ? GOLD : "rgba(255,255,255,0.18)";
    ctx.font = "700 44px Georgia, serif";
    ctx.fillText(isFound ? "★" : "?", cx, y + 58);
    ctx.font = "700 21px Arial, sans-serif";
    if (isFound) {
      ctx.fillStyle = GOLD_LIGHT;
      const nm = s.title.length > 22 ? `${s.title.slice(0, 21)}…` : s.title;
      ctx.fillText(nm, cx, y + 96);
      ctx.fillStyle = "rgba(255,255,255,0.45)";
      ctx.font = "600 17px Arial, sans-serif";
      ctx.fillText(s.realm, cx, y + 122);
    } else {
      ctx.fillStyle = "rgba(255,255,255,0.3)";
      ctx.fillText("Still hidden…", cx, y + 96);
      ctx.fillStyle = "rgba(255,255,255,0.2)";
      ctx.font = "600 17px Arial, sans-serif";
      ctx.fillText(s.realm, cx, y + 122);
    }
  });

  ctx.fillStyle = "rgba(255,255,255,0.5)";
  ctx.font = "italic 600 30px Georgia, serif";
  ctx.fillText("Think you can find them all? Keep touching things.", S / 2, H - 92);
  ctx.fillStyle = GOLD;
  ctx.font = "700 24px Georgia, serif";
  ctx.fillText("fork-fate.com", S / 2, H - 40);

  return new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
}

/** Native share when possible, silent download otherwise.
 * Returns "shared" | "downloaded" | null (user cancelled). */
export async function shareImage(blob, filename, text) {
  const file = new File([blob], filename, { type: "image/png" });
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: "Fork·Fate", text });
      return "shared";
    } catch (e) {
      if (e?.name === "AbortError") return null;
    }
  }
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 4000);
  return "downloaded";
}
