// Client-side image prep + the completion award: an open Fork·Fate passport book —
// ID page on the left, visa stamps on the right, creased down the spine.
import { stampOnCanvas } from "./inkStamp";

const MAX_EDGE = 1000;
const JPEG_QUALITY = 0.72;

export async function fileToResizedDataUrl(file) {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  canvas.getContext("2d").drawImage(bitmap, 0, 0, w, h);
  bitmap.close?.();
  return canvas.toDataURL("image/jpeg", JPEG_QUALITY);
}

const loadImg = (src) =>
  new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** Aged paper with faint guilloche waves, drawn per page so the spine breaks it. */
function paperPage(ctx, x, y, w, h) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.fillStyle = "#F6EEDC";
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = "rgba(150,125,86,0.13)";
  ctx.lineWidth = 1;
  for (let i = 0; i < 60; i++) {
    ctx.beginPath();
    for (let px = 0; px <= w; px += 8) {
      const py = y + 20 + i * 24 + Math.sin((px / w) * Math.PI * 3 + i * 0.6) * 10;
      px === 0 ? ctx.moveTo(x + px, py) : ctx.lineTo(x + px, py);
    }
    ctx.stroke();
  }
  const vig = ctx.createRadialGradient(x + w / 2, y + h / 2, h * 0.28, x + w / 2, y + h / 2, h * 0.8);
  vig.addColorStop(0, "rgba(0,0,0,0)");
  vig.addColorStop(1, "rgba(90,66,32,0.2)");
  ctx.fillStyle = vig;
  ctx.fillRect(x, y, w, h);
  ctx.restore();
}

/** The gutter: paper curving into the spine, shaded on both sides of a dark seam. */
function crease(ctx, cx, top, bottom, width) {
  const h = bottom - top;
  const g = ctx.createLinearGradient(cx - width, 0, cx + width, 0);
  g.addColorStop(0, "rgba(90,66,32,0)");
  g.addColorStop(0.34, "rgba(90,66,32,0.22)");
  g.addColorStop(0.47, "rgba(58,40,16,0.55)");
  g.addColorStop(0.5, "rgba(38,26,10,0.72)");
  g.addColorStop(0.53, "rgba(58,40,16,0.55)");
  g.addColorStop(0.66, "rgba(90,66,32,0.22)");
  g.addColorStop(1, "rgba(90,66,32,0)");
  ctx.fillStyle = g;
  ctx.fillRect(cx - width, top, width * 2, h);

  // Sheen on the paper as it lifts away from the seam.
  const sheen = ctx.createLinearGradient(cx - width * 1.6, 0, cx + width * 1.6, 0);
  sheen.addColorStop(0, "rgba(255,252,240,0)");
  sheen.addColorStop(0.22, "rgba(255,252,240,0.45)");
  sheen.addColorStop(0.5, "rgba(255,252,240,0)");
  sheen.addColorStop(0.78, "rgba(255,252,240,0.45)");
  sheen.addColorStop(1, "rgba(255,252,240,0)");
  ctx.fillStyle = sheen;
  ctx.fillRect(cx - width * 1.6, top, width * 3.2, h);

  // Stitch marks along the seam.
  ctx.strokeStyle = "rgba(246,238,220,0.5)";
  ctx.lineWidth = 3;
  for (let y = top + 40; y < bottom - 30; y += 54) {
    ctx.beginPath();
    ctx.moveTo(cx, y);
    ctx.lineTo(cx, y + 22);
    ctx.stroke();
  }
}

/** ID-page portrait: photo in a printed frame, or an empty frame if they skipped it. */
function drawPortrait(ctx, img, x, y, w, h) {
  ctx.save();
  roundRect(ctx, x, y, w, h, 8);
  ctx.fillStyle = "#EFE4CC";
  ctx.fill();
  if (img) {
    ctx.save();
    roundRect(ctx, x + 6, y + 6, w - 12, h - 12, 5);
    ctx.clip();
    const sc = Math.max((w - 12) / img.width, (h - 12) / img.height);
    ctx.drawImage(
      img,
      x + w / 2 - (img.width * sc) / 2,
      y + h / 2 - (img.height * sc) / 2,
      img.width * sc,
      img.height * sc
    );
    // Slight sepia wash so it sits in the paper rather than on top of it.
    ctx.fillStyle = "rgba(150,110,50,0.14)";
    ctx.fillRect(x, y, w, h);
    ctx.restore();
  } else {
    ctx.fillStyle = "#B9A57F";
    ctx.textAlign = "center";
    ctx.font = "700 22px Manrope, system-ui, sans-serif";
    ctx.fillText("NO PHOTO", x + w / 2, y + h / 2);
  }
  ctx.strokeStyle = "rgba(122,31,43,0.55)";
  ctx.lineWidth = 3;
  roundRect(ctx, x, y, w, h, 8);
  ctx.stroke();
  ctx.restore();
}

function polaroid(ctx, img, x, y, w, h, tiltDeg) {
  ctx.save();
  ctx.translate(x + w / 2, y + h / 2);
  ctx.rotate((tiltDeg * Math.PI) / 180);
  roundRect(ctx, -w / 2, -h / 2, w, h, 8);
  ctx.fillStyle = "#FFFDF7";
  ctx.fill();
  ctx.save();
  roundRect(ctx, -w / 2 + 6, -h / 2 + 6, w - 12, h - 12, 5);
  ctx.clip();
  const sc = Math.max((w - 12) / img.width, (h - 12) / img.height);
  ctx.drawImage(img, -(img.width * sc) / 2, -(img.height * sc) / 2, img.width * sc, img.height * sc);
  ctx.restore();
  ctx.strokeStyle = "rgba(138,82,16,0.4)";
  ctx.lineWidth = 2;
  roundRect(ctx, -w / 2, -h / 2, w, h, 8);
  ctx.stroke();
  ctx.restore();
}

/**
 * 1080x1350 PNG Blob of an open passport: ID page (traveller's photo + details)
 * on the left, an ink stamp per stop on the right, creased down the middle.
 * stops: [{ name, id, date }]
 */
export async function buildAwardImage({
  title,
  code,
  stops,
  photoUrls = [],
  completedAt,
  holderName = "",
  holderPhotoUrl = "",
}) {
  const W = 1080;
  const H = 1350;
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const ctx = c.getContext("2d");

  const [holderImg, ...selfies] = await Promise.all([
    holderPhotoUrl ? loadImg(holderPhotoUrl) : Promise.resolve(null),
    ...photoUrls.slice(0, 3).map(loadImg),
  ]);
  const shots = selfies.filter(Boolean);
  // No portrait? The first selfie stands in — the award should always feel personal.
  const portrait = holderImg || shots[0] || null;

  // Leather cover peeking around the open pages.
  const cover = ctx.createLinearGradient(0, 0, W, H);
  cover.addColorStop(0, "#3A2416");
  cover.addColorStop(1, "#20140B");
  ctx.fillStyle = cover;
  ctx.fillRect(0, 0, W, H);

  const M = 26;
  const gutter = 26;
  const top = M;
  const bottom = H - M;
  const pageW = (W - M * 2 - gutter) / 2;
  const leftX = M;
  const rightX = M + pageW + gutter;

  paperPage(ctx, leftX, top, pageW, bottom - top);
  paperPage(ctx, rightX, top, pageW, bottom - top);
  crease(ctx, W / 2, top, bottom, gutter * 1.3);

  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";

  // ---- left: the ID page ----------------------------------------------------
  const lcx = leftX + pageW / 2;
  ctx.fillStyle = "#7A1F2B";
  ctx.font = "800 22px Manrope, system-ui, sans-serif";
  ctx.fillText("F O R K · F A T E", lcx, top + 62);
  ctx.fillStyle = "#2A2118";
  ctx.font = "700 54px 'Cormorant Garamond', Georgia, serif";
  ctx.fillText("PASSPORT", lcx, top + 118);
  ctx.strokeStyle = "rgba(138,82,16,0.35)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(leftX + 40, top + 140);
  ctx.lineTo(leftX + pageW - 40, top + 140);
  ctx.stroke();

  const pw = 250;
  const ph = 310;
  drawPortrait(ctx, portrait, lcx - pw / 2, top + 168, pw, ph);

  const when = completedAt ? new Date(completedAt).toLocaleDateString() : new Date().toLocaleDateString();
  let y = top + 168 + ph + 58;
  ctx.fillStyle = "#2A2118";
  ctx.font = "700 42px 'Cormorant Garamond', Georgia, serif";
  ctx.fillText(holderName ? holderName.toUpperCase() : "FATE TRAVELLER", lcx, y);
  y += 34;
  ctx.fillStyle = "#5B4A31";
  ctx.font = "600 22px Manrope, system-ui, sans-serif";
  ctx.fillText(title.toUpperCase(), lcx, y);

  y += 46;
  const rows = [
    ["PASSPORT NO.", code],
    ["STOPS", String(stops.length)],
    ["COMPLETED", when],
  ];
  rows.forEach(([k, v]) => {
    ctx.textAlign = "left";
    ctx.fillStyle = "#9A8460";
    ctx.font = "700 17px Manrope, system-ui, sans-serif";
    ctx.fillText(k, leftX + 44, y);
    ctx.textAlign = "right";
    ctx.fillStyle = "#2A2118";
    ctx.font = "700 22px Manrope, system-ui, sans-serif";
    ctx.fillText(v, leftX + pageW - 44, y);
    ctx.strokeStyle = "rgba(138,82,16,0.2)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(leftX + 44, y + 12);
    ctx.lineTo(leftX + pageW - 44, y + 12);
    ctx.stroke();
    y += 44;
  });

  // Selfies from the road, tucked at the foot of the ID page.
  if (shots.length) {
    ctx.textAlign = "left";
    ctx.fillStyle = "#9A8460";
    ctx.font = "700 17px Manrope, system-ui, sans-serif";
    ctx.fillText("ON THE ROAD", leftX + 44, y + 16);
    const strip = shots.slice(0, 3);
    const gap = 12;
    const cw = (pageW - 88 - gap * (strip.length - 1)) / strip.length;
    const ch = Math.min(cw * 1.15, bottom - (y + 34) - 56);
    strip.forEach((img, i) => polaroid(ctx, img, leftX + 44 + i * (cw + gap), y + 34, cw, ch, i % 2 ? 1.6 : -1.6));
  }

  ctx.textAlign = "center";
  ctx.fillStyle = "#9A8460";
  ctx.font = "700 18px Manrope, system-ui, sans-serif";
  ctx.fillText("fork-fate.com", lcx, bottom - 26);

  // ---- right: the stamp page ------------------------------------------------
  const rcx = rightX + pageW / 2;
  ctx.fillStyle = "#7A1F2B";
  ctx.font = "800 20px Manrope, system-ui, sans-serif";
  ctx.fillText("VISAS · STAMPS", rcx, top + 62);
  ctx.strokeStyle = "rgba(138,82,16,0.35)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(rightX + 40, top + 84);
  ctx.lineTo(rightX + pageW - 40, top + 84);
  ctx.stroke();

  const areaTop = top + 108;
  const areaH = bottom - 40 - areaTop;
  const cols = stops.length <= 3 ? 1 : 2;
  const rowCount = Math.ceil(stops.length / cols);
  const cellW = (pageW - 40) / cols;
  const cellH = areaH / rowCount;
  const radius = Math.min(cellW, cellH) * 0.46;

  stops.forEach((s, i) => {
    const cx = rightX + 20 + (i % cols) * cellW + cellW / 2;
    const cy = areaTop + Math.floor(i / cols) * cellH + cellH / 2;
    stampOnCanvas(ctx, cx, cy, radius, { name: s.name, date: s.date || when, id: s.id || s.name });
  });

  return new Promise((resolve) => c.toBlob(resolve, "image/png"));
}
