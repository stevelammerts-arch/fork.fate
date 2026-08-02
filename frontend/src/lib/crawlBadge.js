/**
 * Canvas painters for the Crawl Complete badge/story images.
 * Dark theme renders the cinematic reaper reward card; light/seasonal themes
 * render a clean horizontal (or vertical story) certificate card.
 */
export const REAPER_SRC = "/reaper-award.png";

export function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawFit(ctx, text, cx, y, maxWidth, weight, basePx, family, color, spacing = 0, italic = false, align = "center") {
  let px = basePx;
  const font = (p) => `${italic ? "italic " : ""}${weight} ${p}px ${family}`;
  ctx.font = font(px);
  const measure = (s) => ctx.measureText(s).width + (spacing ? spacing * (s.length - 1) : 0);
  while (px > 10 && measure(text) > maxWidth) { px -= 1; ctx.font = font(px); }
  ctx.fillStyle = color;
  ctx.textBaseline = "top";
  if (spacing) {
    const w = measure(text);
    let x = align === "left" ? cx : cx - w / 2;
    ctx.textAlign = "left";
    for (const ch of text) { ctx.fillText(ch, x, y); x += ctx.measureText(ch).width + spacing; }
    ctx.textAlign = "center";
  } else {
    ctx.textAlign = align;
    ctx.fillText(text, cx, y);
  }
  return px;
}

function drawSelfie(ctx, photo, x, y, w, h, r, P) {
  roundRect(ctx, x, y, w, h, r);
  ctx.save();
  ctx.fillStyle = P.box;
  ctx.fill();
  ctx.clip();
  if (photo) {
    const scale = Math.max(w / photo.width, h / photo.height);
    const dw = photo.width * scale, dh = photo.height * scale;
    ctx.drawImage(photo, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
  } else {
    ctx.fillStyle = P.boxInk;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "600 30px Arial, sans-serif";
    ctx.fillText("YOUR SELFIE", x + w / 2, y + h / 2);
  }
  ctx.restore();
  roundRect(ctx, x, y, w, h, r);
  ctx.strokeStyle = P.accent; ctx.lineWidth = 4; ctx.stroke();
}

async function buildReaperBadge({ name, crew, label, photo, story = false }) {
  const W = 1080, H = story ? 1920 : 1520;
  const canvas = document.createElement("canvas");
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d");
  // Red/black backdrop behind the reaper
  const base = ctx.createLinearGradient(0, 0, 0, H);
  base.addColorStop(0, "#1C0406"); base.addColorStop(0.5, "#0C0304"); base.addColorStop(1, "#070707");
  ctx.fillStyle = base; ctx.fillRect(0, 0, W, H);
  const glow = ctx.createRadialGradient(W * 0.5, H * 0.22, 40, W * 0.5, H * 0.22, 720);
  glow.addColorStop(0, "rgba(224,30,38,0.42)"); glow.addColorStop(0.55, "rgba(150,16,22,0.14)"); glow.addColorStop(1, "rgba(224,30,38,0)");
  ctx.fillStyle = glow; ctx.fillRect(0, 0, W, H);
  const vig = ctx.createRadialGradient(W * 0.5, H * 0.45, H * 0.3, W * 0.5, H * 0.5, H * 0.75);
  vig.addColorStop(0, "rgba(0,0,0,0)"); vig.addColorStop(1, "rgba(0,0,0,0.6)");
  ctx.fillStyle = vig; ctx.fillRect(0, 0, W, H);

  try { const reaper = await loadImage(REAPER_SRC); ctx.drawImage(reaper, 0, 0, W, W); } catch (e) { /* text still renders */ }

  // Selfie fills the card the reaper holds (photo is a preloaded Image or null)
  if (photo) {
    const sx = 0.522 * W, sy = 0.35 * W, sw = 0.42 * W, sh = 0.205 * W;
    const scale = Math.max(sw / photo.width, sh / photo.height);
    const dw = photo.width * scale, dh = photo.height * scale;
    ctx.save();
    roundRect(ctx, sx, sy, sw, sh, 10);
    ctx.clip();
    ctx.drawImage(photo, sx + (sw - dw) / 2, sy + (sh - dh) / 2, dw, dh);
    ctx.restore();
  }

  // Info plaque below the reaper
  const cardX = (W - 620) / 2, cardW = 620, cardY = 1090, cardH = 380, r = 20;
  roundRect(ctx, cardX, cardY, cardW, cardH, r);
  const cg = ctx.createLinearGradient(0, cardY, 0, cardY + cardH);
  cg.addColorStop(0, "#161616"); cg.addColorStop(1, "#0C0C0C");
  ctx.fillStyle = cg; ctx.fill();
  ctx.strokeStyle = "rgba(224,30,38,0.7)"; ctx.lineWidth = 3; ctx.stroke();

  const cx = W / 2, maxW = cardW - 64;
  const hasCrew = !!(crew && crew.trim());
  const rows = [
    { draw: (y) => drawFit(ctx, "I SURVIVED", cx, y, maxW, "700", 24, "Georgia, serif", "#E01E26", 3), h: 24, mb: 14 },
    { draw: (y) => drawFit(ctx, "THE FORK\u00B7FATE", cx, y, maxW, "700", 42, "Georgia, serif", "#FFFFFF"), h: 42, mb: 2 },
    { draw: (y) => drawFit(ctx, label, cx, y, maxW, "700", 42, "Georgia, serif", "#FFFFFF"), h: 42, mb: 16 },
    { draw: (y) => { ctx.fillStyle = "#E01E26"; ctx.fillRect(cx - 24, y, 48, 2); }, h: 2, mb: 16 },
    { draw: (y) => drawFit(ctx, name || "A Brave Soul", cx, y, maxW, "400", 34, "Georgia, serif", "#F3F3F3", 0, true), h: 34, mb: hasCrew ? 10 : 12 },
    ...(hasCrew ? [{ draw: (y) => drawFit(ctx, `with ${crew.trim()}`, cx, y, maxW, "400", 22, "Arial, sans-serif", "#B9BEC4"), h: 22, mb: 10 }] : []),
    { draw: (y) => drawFit(ctx, "fork-fate.com", cx, y, maxW, "400", 18, "Arial, sans-serif", "#9A9FA5", 1), h: 18, mb: 0 },
  ];
  const totalH = rows.reduce((s, x) => s + x.h + x.mb, 0);
  let y = cardY + (cardH - totalH) / 2;
  for (const row of rows) { row.draw(y); y += row.h + row.mb; }

  if (story) {
    const cy = cardY + cardH + 74;
    drawFit(ctx, "CAN YOU SURVIVE?", cx, cy, W - 160, "700", 46, "Georgia, serif", "#FFFFFF", 2);
    drawFit(ctx, "Shuffle your fate at fork-fate.com", cx, cy + 66, W - 160, "400", 30, "Arial, sans-serif", "#E01E26", 1);
  }

  return new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
}

export async function buildBadge({ name, crew, label, photo, story = false, light = false, accent }) {
  // Dark/Reaper theme keeps its unique reaper reward card
  if (!light) return buildReaperBadge({ name, crew, label, photo, story });
  const P = light
    ? { bg1: "#F8F2E7", bg2: "#EDE2CF", panel: "#FFFFFF", panelStroke: "#E7DCC7", ink: "#2A2118", accent: "#4F6F47", muted: "#8A7C68", line: "#E4D9C4", box: "#F1EADB", boxInk: "#B9AC95" }
    : { bg1: "#1C0406", bg2: "#070707", panel: "#141414", panelStroke: "rgba(224,30,38,0.35)", ink: "#FFFFFF", accent: "#E01E26", muted: "#B9BEC4", line: "rgba(224,30,38,0.45)", box: "#141414", boxInk: "#5A5A5A" };
  if (light && accent) { P.accent = accent; P.line = accent; P.panelStroke = "#E7DCC7"; }
  const logoSrc = light ? "/logo-mark-light.png" : "/logo-mark.png";

  const W = story ? 1080 : 1600;
  const H = story ? 1920 : 900;
  const canvas = document.createElement("canvas");
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d");

  // Backdrop
  const base = ctx.createLinearGradient(0, 0, 0, H);
  base.addColorStop(0, P.bg1); base.addColorStop(1, P.bg2);
  ctx.fillStyle = base; ctx.fillRect(0, 0, W, H);
  if (!light) {
    const glow = ctx.createRadialGradient(W * 0.5, H * 0.3, 40, W * 0.5, H * 0.3, W * 0.7);
    glow.addColorStop(0, "rgba(224,30,38,0.30)"); glow.addColorStop(1, "rgba(224,30,38,0)");
    ctx.fillStyle = glow; ctx.fillRect(0, 0, W, H);
  }

  // Card frame
  const m = 40;
  roundRect(ctx, m, m, W - 2 * m, H - 2 * m, 36);
  ctx.fillStyle = light ? "#FFFFFF" : "rgba(20,20,20,0.55)";
  ctx.fill();
  ctx.strokeStyle = P.panelStroke; ctx.lineWidth = 3; ctx.stroke();

  const logo = await loadImage(logoSrc).catch(() => null);
  const drawText = (t, cx, y, maxW, weight, px, family, color, sp = 0, it = false, align = "center") =>
    drawFit(ctx, t, cx, y, maxW, weight, px, family, color, sp, it, align);

  if (!story) {
    // ── Horizontal: logo left · congrats middle · selfie right ──
    const divX = 560;
    if (logo) { const s = 300; ctx.drawImage(logo, divX / 2 - s / 2, 250, s, s); }
    drawText("Fork·Fate", divX / 2, 575, 440, "700", 60, "Georgia, serif", P.ink);
    drawText(label, divX / 2, 660, 440, "700", 24, "Arial, sans-serif", P.accent, 4);

    ctx.strokeStyle = P.line; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(divX, 150); ctx.lineTo(divX, H - 150); ctx.stroke();

    const midCx = 810, midMaxW = 440;
    let y = 250;
    drawText(light ? "CONGRATULATIONS" : "I SURVIVED", midCx, y, midMaxW, "700", 28, "Arial, sans-serif", P.accent, 4); y += 54;
    drawText("THE FORK·FATE", midCx, y, midMaxW, "700", 42, "Georgia, serif", P.ink); y += 52;
    drawText(label, midCx, y, midMaxW, "700", 46, "Georgia, serif", P.ink); y += 66;
    ctx.fillStyle = P.accent; ctx.fillRect(midCx - 26, y, 52, 3); y += 26;
    drawText(name || "A Brave Soul", midCx, y, midMaxW, "400", 36, "Georgia, serif", P.ink, 0, true); y += 48;
    if (crew && crew.trim()) { drawText(`with ${crew.trim()}`, midCx, y, midMaxW, "400", 24, "Arial, sans-serif", P.muted); y += 40; }
    drawText("fork-fate.com", midCx, y, midMaxW, "400", 20, "Arial, sans-serif", P.muted, 1);

    drawSelfie(ctx, photo, 1085, 285, 440, 330, 18, P);
  } else {
    // ── Vertical story: logo top · congrats · selfie · CTA ──
    const cx = W / 2;
    if (logo) { const s = 320; ctx.drawImage(logo, cx - s / 2, 150, s, s); }
    drawText("Fork·Fate", cx, 500, 700, "700", 66, "Georgia, serif", P.ink);
    let y = 640;
    drawText(light ? "CONGRATULATIONS" : "I SURVIVED THE", cx, y, 760, "700", 32, "Arial, sans-serif", P.accent, 4); y += 60;
    drawText("FORK·FATE " + label, cx, y, 820, "700", 56, "Georgia, serif", P.ink); y += 90;
    drawSelfie(ctx, photo, cx - 380, y, 760, 560, 22, P); y += 620;
    drawText(name || "A Brave Soul", cx, y, 760, "400", 44, "Georgia, serif", P.ink, 0, true); y += 62;
    if (crew && crew.trim()) { drawText(`with ${crew.trim()}`, cx, y, 760, "400", 30, "Arial, sans-serif", P.muted); y += 50; }
    y += 20;
    drawText(light ? "Spin your own at fork-fate.com" : "Shuffle your fate at fork-fate.com", cx, y, 820, "700", 34, "Georgia, serif", P.accent, 1);
  }

  return new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
}
