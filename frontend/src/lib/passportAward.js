// Client-side image prep + the completion award: a Fork·Fate passport page with a
// real ink stamp for every stop (and the traveller's selfies, if they took any).
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

function paperTexture(ctx, W, H) {
  ctx.fillStyle = "#F6EEDC";
  ctx.fillRect(0, 0, W, H);
  // Faint guilloche-ish waves, like the security print on a passport page.
  ctx.strokeStyle = "rgba(150,125,86,0.13)";
  ctx.lineWidth = 1;
  for (let i = 0; i < 46; i++) {
    ctx.beginPath();
    for (let x = 0; x <= W; x += 8) {
      const y = 120 + i * 26 + Math.sin((x / W) * Math.PI * 4 + i * 0.5) * 12;
      x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  // Aged edges.
  const vig = ctx.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, H * 0.78);
  vig.addColorStop(0, "rgba(0,0,0,0)");
  vig.addColorStop(1, "rgba(90,66,32,0.20)");
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, W, H);
}

/**
 * 1080x1350 PNG Blob: passport page, ink stamp per stop, selfie strip at the foot.
 * stops: [{ name, date }] — date is the day it was stamped.
 */
export async function buildAwardImage({ title, code, stops, photoUrls = [], completedAt }) {
  const W = 1080;
  const H = 1350;
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const ctx = c.getContext("2d");

  paperTexture(ctx, W, H);

  ctx.strokeStyle = "#8A5210";
  ctx.lineWidth = 5;
  roundRect(ctx, 30, 30, W - 60, H - 60, 26);
  ctx.stroke();
  ctx.strokeStyle = "rgba(138,82,16,0.45)";
  ctx.lineWidth = 2;
  roundRect(ctx, 46, 46, W - 92, H - 92, 20);
  ctx.stroke();

  ctx.textAlign = "center";
  ctx.fillStyle = "#7A1F2B";
  ctx.font = "800 30px Manrope, system-ui, sans-serif";
  ctx.fillText("F O R K · F A T E", W / 2, 112);
  ctx.fillStyle = "#2A2118";
  ctx.font = "700 76px 'Cormorant Garamond', Georgia, serif";
  ctx.fillText("PASSPORT", W / 2, 190);
  ctx.font = "600 30px Manrope, system-ui, sans-serif";
  ctx.fillStyle = "#5B4A31";
  ctx.fillText(title.toUpperCase(), W / 2, 234);

  ctx.font = "600 24px Manrope, system-ui, sans-serif";
  ctx.fillStyle = "#8A7355";
  const when = completedAt ? new Date(completedAt).toLocaleDateString() : new Date().toLocaleDateString();
  ctx.fillText(`${stops.length} STOPS · COMPLETED ${when} · NO. ${code}`, W / 2, 272);

  ctx.strokeStyle = "rgba(138,82,16,0.35)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(90, 296);
  ctx.lineTo(W - 90, 296);
  ctx.stroke();

  // --- the stamps ------------------------------------------------------------
  const imgs = (await Promise.all(photoUrls.slice(0, 4).map(loadImg))).filter(Boolean);
  const stripH = imgs.length ? 250 : 0;
  const areaTop = 330;
  const areaH = H - areaTop - stripH - 110;
  const cols = stops.length <= 4 ? 2 : 3;
  const rows = Math.ceil(stops.length / cols);
  const cellW = (W - 160) / cols;
  const cellH = Math.min(areaH / rows, cellW);
  const radius = Math.min(cellW, cellH) * 0.44;

  stops.forEach((s, i) => {
    const cx = 80 + (i % cols) * cellW + cellW / 2;
    const cy = areaTop + Math.floor(i / cols) * cellH + cellH / 2;
    stampOnCanvas(ctx, cx, cy, radius, { name: s.name, date: s.date || when, id: s.id || s.name });
  });

  // --- selfie strip ----------------------------------------------------------
  if (imgs.length) {
    const y = H - stripH - 70;
    const gap = 16;
    const cw = (W - 160 - gap * (imgs.length - 1)) / imgs.length;
    const ch = stripH - 40;
    imgs.forEach((img, i) => {
      const x = 80 + i * (cw + gap);
      ctx.save();
      ctx.translate(x + cw / 2, y + ch / 2);
      ctx.rotate(((i % 2 ? 1 : -1) * 1.4 * Math.PI) / 180);
      roundRect(ctx, -cw / 2, -ch / 2, cw, ch, 10);
      ctx.fillStyle = "#FFFDF7";
      ctx.fill();
      ctx.save();
      roundRect(ctx, -cw / 2 + 8, -ch / 2 + 8, cw - 16, ch - 16, 6);
      ctx.clip();
      const sc = Math.max((cw - 16) / img.width, (ch - 16) / img.height);
      ctx.drawImage(img, -(img.width * sc) / 2, -(img.height * sc) / 2, img.width * sc, img.height * sc);
      ctx.restore();
      ctx.strokeStyle = "rgba(138,82,16,0.4)";
      ctx.lineWidth = 2;
      roundRect(ctx, -cw / 2, -ch / 2, cw, ch, 10);
      ctx.stroke();
      ctx.restore();
    });
  }

  ctx.textAlign = "center";
  ctx.fillStyle = "#8A7355";
  ctx.font = "700 24px Manrope, system-ui, sans-serif";
  ctx.fillText("fork-fate.com", W / 2, H - 46);

  return new Promise((resolve) => c.toBlob(resolve, "image/png"));
}
