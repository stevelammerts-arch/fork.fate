import QRCode from "qrcode";

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function wrapLines(ctx, text, maxWidth) {
  const words = (text || "").split(" ");
  const lines = [];
  let line = "";
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = w;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines.slice(0, 3);
}

// Per-theme styling for the shareable Fate Card (art, colors, headline).
const FATE_CARD = {
  dark:   { hand: true },
  light:  { lightBg: true,  bg1: "#F7F1E6", bg2: "#E9DAC1", accent: "#4F6F47", art: "/logo-mark-light.png", artSize: 190, kicker: "FATE HAS DEALT YOUR TABLE" },
  fall:   { lightBg: true,  bg1: "#F6E9D4", bg2: "#E7C79B", accent: "#C0451B", art: "/leaf-orange.png",     artSize: 170, kicker: "FATE FALLS TO", scatter: ["/leaf-red.png", "/leaf-yellow.png", "/leaf-brown.png"] },
  winter: { lightBg: true,  bg1: "#EAF3FA", bg2: "#C6DCEE", accent: "#2E77A6", art: "/flake-white.png",     artSize: 160, kicker: "FATE IS SEALED IN FROST", scatter: ["/flake-blue.png", "/flake-silver.png", "/flake-white.png"] },
  spring: { lightBg: true,  bg1: "#F6FBEF", bg2: "#F3D9E7", accent: "#D46A9F", art: "/blossom-pink.png",    artSize: 165, kicker: "FATE BLOOMS AT", scatter: ["/blossom-white.png", "/petal-coral.png", "/blossom-pink.png"] },
  summer: { lightBg: true,  bg1: "#BFE8F7", bg2: "#EAD199", accent: "#E07E17", art: "/summer-sun.png",      artSize: 195, kicker: "FATE UNDER THE SUN" },
  cyber:  { lightBg: false, bg1: "#070A16", bg2: "#160A28", accent: "#22E0E0", art: "/cyber-neon-logo.png", artSize: 300, kicker: "FATE.EXE // EXECUTED", glow2: "#C77DFF" },
  steam:  { lightBg: false, bg1: "#1B120A", bg2: "#0F0A06", accent: "#D9A44E", art: "/steam-gears.png",     artSize: 260, kicker: "THE MACHINE DECREES" },
  tiki:   { lightBg: false, bg1: "#2A140A", bg2: "#150B06", accent: "#F0A24E", art: "/tiki-mask.png",       artSize: 240, kicker: "THE TIKI GODS CHOOSE" },
};

function hexA(hex, a) {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
}

export async function buildFateCard(card, theme) {
  const cfg = FATE_CARD[theme] || FATE_CARD.dark;
  if (cfg.hand) return buildReaperCard(card);
  return buildThemedCard(card, cfg);
}

async function buildThemedCard(card, cfg) {
  const W = 1080, H = 1080;
  const canvas = document.createElement("canvas");
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d");
  const cx = W / 2;
  const lightBg = !!cfg.lightBg;
  const textMain = lightBg ? "#241C12" : "#FFFFFF";
  const textMuted = lightBg ? "#6B5C48" : "#C9CDD3";

  // Background gradient
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, cfg.bg1); bg.addColorStop(1, cfg.bg2);
  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
  // Accent glow (top)
  const glow = ctx.createRadialGradient(cx, 360, 30, cx, 360, 660);
  glow.addColorStop(0, hexA(cfg.accent, lightBg ? 0.22 : 0.34));
  glow.addColorStop(1, hexA(cfg.glow2 || cfg.accent, 0));
  ctx.fillStyle = glow; ctx.fillRect(0, 0, W, H);

  ctx.textAlign = "center";

  // Scattered motif accents (seasonal)
  if (cfg.scatter && cfg.scatter.length) {
    const spots = [[120, 250, 70], [960, 300, 58], [180, 760, 64], [930, 720, 74], [90, 470, 50]];
    for (let i = 0; i < spots.length; i++) {
      try {
        const im = await loadImage(cfg.scatter[i % cfg.scatter.length]);
        const [sx, sy, ss] = spots[i];
        ctx.save(); ctx.globalAlpha = 0.5; ctx.drawImage(im, sx - ss / 2, sy - ss / 2, ss, ss); ctx.restore();
      } catch (e) { console.debug("scatter skipped", e); }
    }
  }

  // Hero emblem (theme signature art)
  try {
    const art = await loadImage(cfg.art);
    const s = cfg.artSize || 200;
    const ratio = art.height ? art.width / art.height : 1;
    const aw = ratio >= 1 ? s : s * ratio;
    const ah = ratio >= 1 ? s / ratio : s;
    ctx.save();
    ctx.globalAlpha = 0.96;
    ctx.drawImage(art, cx - aw / 2, 120, aw, ah);
    ctx.restore();
  } catch (e) { console.debug("themed art skipped", e); }

  // Text panel
  const pX = 130, pW = W - 260, pY = 372, pH = 392, pr = 26;
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(pX + pr, pY);
  ctx.arcTo(pX + pW, pY, pX + pW, pY + pH, pr);
  ctx.arcTo(pX + pW, pY + pH, pX, pY + pH, pr);
  ctx.arcTo(pX, pY + pH, pX, pY, pr);
  ctx.arcTo(pX, pY, pX + pW, pY, pr);
  ctx.closePath();
  ctx.fillStyle = lightBg ? "rgba(255,255,255,0.82)" : "rgba(6,6,10,0.62)";
  ctx.fill();
  ctx.strokeStyle = hexA(cfg.accent, 0.85); ctx.lineWidth = 3; ctx.stroke();
  ctx.restore();

  // Kicker
  ctx.fillStyle = cfg.accent;
  ctx.font = "700 26px Georgia, serif";
  ctx.fillText((cfg.kicker || "FATE HAS SPOKEN").toUpperCase(), cx, pY + 66);

  // Restaurant name (wrapped)
  ctx.fillStyle = textMain;
  ctx.font = "700 60px Georgia, serif";
  const lines = wrapLines(ctx, card.name || "Your pick", pW - 120);
  let ny = pY + 150;
  for (const ln of lines) { ctx.fillText(ln, cx, ny); ny += 68; }

  // Divider
  ctx.strokeStyle = hexA(cfg.accent, 0.85); ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(cx - 60, ny + 2); ctx.lineTo(cx + 60, ny + 2); ctx.stroke();

  // Meta
  ctx.fillStyle = textMuted;
  ctx.font = "400 30px Arial, sans-serif";
  const metaTop = [card.cuisine, card.price].filter(Boolean).join("   ·   ");
  const metaBot = [card.rating ? `★ ${Number(card.rating).toFixed(1)}` : null, card.distance ? `${card.distance} mi` : null].filter(Boolean).join("   ·   ");
  if (metaTop) ctx.fillText(metaTop, cx, ny + 52);
  if (metaBot) ctx.fillText(metaBot, cx, ny + 96);

  // Bottom scrim for footer legibility
  const scrim = ctx.createLinearGradient(0, H - 230, 0, H);
  const scrimC = lightBg ? "255,255,255" : "6,6,10";
  scrim.addColorStop(0, `rgba(${scrimC},0)`);
  scrim.addColorStop(1, `rgba(${scrimC},0.96)`);
  ctx.fillStyle = scrim; ctx.fillRect(0, H - 230, W, 230);

  // QR (bottom-right)
  const shareUrl = (typeof window !== "undefined" && window.location?.origin && !window.location.origin.includes("localhost"))
    ? window.location.origin
    : "https://fork-fate.com";
  try {
    const qrDataUrl = await QRCode.toDataURL(shareUrl, { margin: 1, width: 300, color: { dark: "#0B0B0B", light: "#FFFFFF" } });
    const qr = await loadImage(qrDataUrl);
    const qs = 150, pad = 14, boxS = qs + pad * 2;
    const qx = W - 56 - boxS, qy = H - 44 - boxS, rr = 16;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(qx + rr, qy);
    ctx.arcTo(qx + boxS, qy, qx + boxS, qy + boxS, rr);
    ctx.arcTo(qx + boxS, qy + boxS, qx, qy + boxS, rr);
    ctx.arcTo(qx, qy + boxS, qx, qy, rr);
    ctx.arcTo(qx, qy, qx + boxS, qy, rr);
    ctx.closePath();
    ctx.fillStyle = "#FFFFFF"; ctx.fill();
    ctx.strokeStyle = hexA(cfg.accent, 0.9); ctx.lineWidth = 3; ctx.stroke();
    ctx.drawImage(qr, qx + pad, qy + pad, qs, qs);
    ctx.restore();
  } catch (e) { console.debug("qr draw skipped", e); }

  // Footer CTA
  ctx.textAlign = "left";
  ctx.fillStyle = textMain;
  ctx.font = "700 46px Georgia, serif";
  ctx.fillText("Fork·Fate", 64, H - 114);
  ctx.fillStyle = textMuted;
  ctx.font = "400 28px Arial, sans-serif";
  ctx.fillText("Scan the code to", 64, H - 70);
  ctx.fillText("shuffle your own fate", 64, H - 34);
  ctx.textAlign = "center";

  return new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
}


async function buildReaperCard(card) {
  const W = 1080, H = 1080;
  const canvas = document.createElement("canvas");
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#0B0B0B";
  ctx.fillRect(0, 0, W, H);
  const glow = ctx.createRadialGradient(W / 2, 430, 30, W / 2, 430, 640);
  glow.addColorStop(0, "rgba(224,30,38,0.30)");
  glow.addColorStop(1, "rgba(224,30,38,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);
  ctx.textAlign = "center";
  const cx = W / 2;

  // Logo badge (top)
  try {
    const logo = await loadImage("/logo-mark.png");
    const s = 120, lx = cx - s / 2, ly = 64, lcy = ly + s / 2;
    ctx.save();
    ctx.beginPath(); ctx.arc(cx, lcy, s / 2, 0, Math.PI * 2); ctx.clip();
    ctx.drawImage(logo, lx, ly, s, s);
    ctx.restore();
    ctx.strokeStyle = "rgba(255,255,255,0.35)"; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(cx, lcy, s / 2, 0, Math.PI * 2); ctx.stroke();
  } catch (e) { console.debug("logo draw skipped", e); }

  // Held card (geometry matches the skeleton-hand cutout)
  const cardX = 392, cardY = 300, cardW = 296, cardH = 504, r = 14;
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(cardX + r, cardY);
  ctx.arcTo(cardX + cardW, cardY, cardX + cardW, cardY + cardH, r);
  ctx.arcTo(cardX + cardW, cardY + cardH, cardX, cardY + cardH, r);
  ctx.arcTo(cardX, cardY + cardH, cardX, cardY, r);
  ctx.arcTo(cardX, cardY, cardX + cardW, cardY, r);
  ctx.closePath();
  const cardGrad = ctx.createLinearGradient(0, cardY, 0, cardY + cardH);
  cardGrad.addColorStop(0, "#161616");
  cardGrad.addColorStop(1, "#0C0C0C");
  ctx.fillStyle = cardGrad; ctx.fill();
  const innerGlow = ctx.createRadialGradient(cx, cardY + cardH / 2, 20, cx, cardY + cardH / 2, cardH / 1.4);
  innerGlow.addColorStop(0, "rgba(224,30,38,0.20)");
  innerGlow.addColorStop(1, "rgba(224,30,38,0)");
  ctx.fillStyle = innerGlow; ctx.fill();
  ctx.strokeStyle = "rgba(224,30,38,0.55)"; ctx.lineWidth = 2; ctx.stroke();
  ctx.restore();

  // Kicker
  ctx.fillStyle = "#E01E26";
  ctx.font = "700 20px Georgia, serif";
  ctx.fillText("THE REAPER HAS SPOKEN", cx, cardY + 58);

  // Restaurant name (wrapped inside card)
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "700 46px Georgia, serif";
  const lines = wrapLines(ctx, card.name || "Your pick", cardW - 44);
  let ny = cardY + 152;
  for (const ln of lines) { ctx.fillText(ln, cx, ny); ny += 54; }

  // Divider
  ctx.strokeStyle = "rgba(224,30,38,0.8)"; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(cx - 50, ny + 4); ctx.lineTo(cx + 50, ny + 4); ctx.stroke();

  // Meta (stacked to fit the narrow card)
  ctx.fillStyle = "#B9BEC4";
  ctx.font = "400 26px Arial, sans-serif";
  const metaTop = [card.cuisine, card.price].filter(Boolean).join("   ·   ");
  const metaBot = [card.rating ? `★ ${Number(card.rating).toFixed(1)}` : null, card.distance ? `${card.distance} mi` : null].filter(Boolean).join("   ·   ");
  if (metaTop) ctx.fillText(metaTop, cx, ny + 46);
  if (metaBot) ctx.fillText(metaBot, cx, ny + 82);

  // Skeleton hand gripping the card (drawn on top so fingers grip the edges)
  try {
    const hand = await loadImage("/skeleton-hand.png");
    const hw = 520, hh = 776, hx = cx - hw / 2, hy = 230;
    ctx.drawImage(hand, hx, hy, hw, hh);
  } catch (e) { console.debug("hand draw skipped", e); }

  // Bottom scrim for footer legibility over the forearm
  const scrim = ctx.createLinearGradient(0, H - 230, 0, H);
  scrim.addColorStop(0, "rgba(11,11,11,0)");
  scrim.addColorStop(1, "rgba(11,11,11,0.97)");
  ctx.fillStyle = scrim; ctx.fillRect(0, H - 230, W, 230);

  // Scannable QR (bottom-right) — lets anyone who sees the shared image jump straight to the app
  const shareUrl = (typeof window !== "undefined" && window.location?.origin && !window.location.origin.includes("localhost"))
    ? window.location.origin
    : "https://fork-fate.com";
  try {
    const qrDataUrl = await QRCode.toDataURL(shareUrl, { margin: 1, width: 300, color: { dark: "#0B0B0B", light: "#FFFFFF" } });
    const qr = await loadImage(qrDataUrl);
    const qs = 150, pad = 14, boxS = qs + pad * 2;
    const qx = W - 56 - boxS, qy = H - 44 - boxS, rr = 16;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(qx + rr, qy);
    ctx.arcTo(qx + boxS, qy, qx + boxS, qy + boxS, rr);
    ctx.arcTo(qx + boxS, qy + boxS, qx, qy + boxS, rr);
    ctx.arcTo(qx, qy + boxS, qx, qy, rr);
    ctx.arcTo(qx, qy, qx + boxS, qy, rr);
    ctx.closePath();
    ctx.fillStyle = "#FFFFFF"; ctx.fill();
    ctx.drawImage(qr, qx + pad, qy + pad, qs, qs);
    ctx.restore();
  } catch (e) { console.debug("qr draw skipped", e); }

  // Footer CTA (left-aligned, beside the QR)
  ctx.textAlign = "left";
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "700 44px Georgia, serif";
  ctx.fillText("Fork·Fate", 64, H - 116);
  ctx.fillStyle = "#B9BEC4";
  ctx.font = "400 28px Arial, sans-serif";
  ctx.fillText("Scan the code to", 64, H - 72);
  ctx.fillText("shuffle your own fate", 64, H - 36);
  ctx.textAlign = "center";

  return new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
}
