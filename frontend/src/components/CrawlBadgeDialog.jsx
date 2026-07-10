import { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Trophy, Share2, Download } from "lucide-react";
import { toast } from "sonner";

const REAPER_SRC = "/reaper-award.png";

const crawlLabelFor = (mode) =>
  ({ bars: "PUB CRAWL", food: "FOOD CRAWL", drinks: "DRINKS CRAWL", desserts: "DESSERT CRAWL" }[mode] || "PUB CRAWL");

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

// Shrink font until the text fits maxWidth, then draw it centered at (cx, y) with top baseline.
function drawFit(ctx, text, cx, y, maxWidth, weight, basePx, family, color, spacing = 0) {
  let px = basePx;
  const font = (p) => `${weight} ${p}px ${family}`;
  ctx.font = font(px);
  const measure = (s) => (spacing ? ctx.measureText(s).width + spacing * (s.length - 1) : ctx.measureText(s).width);
  while (px > 9 && measure(text) > maxWidth) {
    px -= 1;
    ctx.font = font(px);
  }
  ctx.fillStyle = color;
  ctx.textBaseline = "top";
  if (spacing) {
    const total = measure(text);
    let x = cx - total / 2;
    ctx.textAlign = "left";
    for (const ch of text) {
      ctx.fillText(ch, x, y);
      x += ctx.measureText(ch).width + spacing;
    }
    ctx.textAlign = "center";
  } else {
    ctx.textAlign = "center";
    ctx.fillText(text, cx, y);
  }
  return px;
}

async function buildBadge({ name, label }) {
  const S = 1080;
  const canvas = document.createElement("canvas");
  canvas.width = S; canvas.height = S;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#0B0B0B";
  ctx.fillRect(0, 0, S, S);
  const glow = ctx.createRadialGradient(S * 0.81, S * 0.36, 20, S * 0.81, S * 0.36, 460);
  glow.addColorStop(0, "rgba(224,30,38,0.28)");
  glow.addColorStop(1, "rgba(224,30,38,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, S, S);

  try {
    const reaper = await loadImage(REAPER_SRC);
    ctx.drawImage(reaper, 0, 0, S, S);
  } catch (e) { /* image failed — text still renders */ }

  // Card face region (matches the on-screen preview overlay — horizontal card)
  const cardCX = (0.645 + 0.28 / 2) * S;
  const cardCY = (0.355 + 0.235 / 2) * S;
  const maxW = 0.28 * S - 40;

  const segs = [
    { h: 18, mb: 10 }, // kicker
    { h: 27, mb: 2 },  // title 1
    { h: 27, mb: 12 }, // title 2
    { h: 2, mb: 12 },  // rule
    { h: 26, mb: 8 },  // name
    { h: 14, mb: 0 },  // footer
  ];
  const total = segs.reduce((s, x) => s + x.h + x.mb, 0);
  let y = cardCY - total / 2;

  drawFit(ctx, "I SURVIVED", cardCX, y, maxW, "700", 18, "Georgia, serif", "#E01E26", 2);
  y += segs[0].h + segs[0].mb;
  drawFit(ctx, "THE FORK\u00B7FATE", cardCX, y, maxW, "700", 27, "Georgia, serif", "#FFFFFF");
  y += segs[1].h + segs[1].mb;
  drawFit(ctx, label, cardCX, y, maxW, "700", 27, "Georgia, serif", "#FFFFFF");
  y += segs[2].h + segs[2].mb;
  ctx.fillStyle = "#E01E26";
  ctx.fillRect(cardCX - 22, y, 44, 2);
  y += segs[3].h + segs[3].mb;
  drawFit(ctx, name || "A Brave Soul", cardCX, y, maxW, "400", 26, "Georgia, serif", "#EDEDED");
  ctx.font = "italic 26px Georgia, serif"; // (name is drawn upright; keep simple)
  y += segs[4].h + segs[4].mb;
  drawFit(ctx, "fork-fate.com", cardCX, y, maxW, "400", 14, "Arial, sans-serif", "#9A9FA5", 1);

  return new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
}

export default function CrawlBadgeDialog({ open, onClose, mode }) {
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const label = useMemo(() => crawlLabelFor(mode), [mode]);

  const makeBlob = () => buildBadge({ name: name.trim(), label });

  const download = async () => {
    setBusy(true);
    try {
      const blob = await makeBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "fork-fate-crawl-badge.png";
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
      toast.success("Badge saved!");
    } catch (e) {
      toast.error("Couldn't build the badge — try again");
    } finally {
      setBusy(false);
    }
  };

  const share = async () => {
    setBusy(true);
    try {
      const blob = await makeBlob();
      const file = new File([blob], "fork-fate-crawl-badge.png", { type: "image/png" });
      const text = `I survived the Fork\u00B7Fate ${label.toLowerCase()}! \u2620\uFE0F Deal your own fate: ${window.location.origin}`;
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: "Fork\u00B7Fate Crawl Badge", text });
      } else {
        await download();
        toast.message("Sharing images isn't supported here — saved it instead so you can post it.");
      }
    } catch (e) {
      // user cancelled share sheet
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[92vh] overflow-y-auto border-[#2A2A2A] bg-[#0B0B0B] text-white sm:max-w-md" data-testid="crawl-badge-dialog">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-serif text-2xl">
            <Trophy className="h-6 w-6 text-[#E01E26]" /> Crawl Complete
          </DialogTitle>
          <DialogDescription className="text-sm text-[#A0A0A0]">
            You survived the crawl. Claim your badge, add your name, and share the glory.
          </DialogDescription>
        </DialogHeader>

        {/* Live preview */}
        <div className="relative mx-auto aspect-square w-full max-w-[360px]" data-testid="crawl-badge-preview">
          <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(circle at 79% 47%, rgba(224,30,38,0.28), rgba(224,30,38,0) 40%)" }} />
          <img src={REAPER_SRC} alt="Reaper award" className="absolute inset-0 h-full w-full object-contain" />
          <div
            className="absolute z-10 flex flex-col items-center justify-center text-center leading-none"
            style={{ left: "64.5%", top: "35.5%", width: "28%", height: "23.5%" }}
          >
            <span className="font-serif font-bold uppercase tracking-[0.12em] text-[#E01E26]" style={{ fontSize: "clamp(7px,1.9vw,10px)" }}>I Survived</span>
            <span className="mt-0.5 font-serif font-bold text-white drop-shadow" style={{ fontSize: "clamp(10px,2.9vw,17px)" }}>THE FORK·FATE</span>
            <span className="font-serif font-bold text-white drop-shadow" style={{ fontSize: "clamp(10px,2.9vw,17px)" }}>{label}</span>
            <span className="my-1 block h-0.5 w-7 bg-[#E01E26]" />
            <span className="font-serif italic text-[#EDEDED]" style={{ fontSize: "clamp(9px,2.4vw,14px)" }}>{name.trim() || "Your name"}</span>
            <span className="mt-0.5 tracking-wider text-[#9A9FA5]" style={{ fontSize: "clamp(6px,1.6vw,9px)" }}>fork-fate.com</span>
          </div>
        </div>

        <input
          value={name}
          onChange={(e) => setName(e.target.value.slice(0, 22))}
          placeholder="Add your name for the badge"
          data-testid="crawl-badge-name-input"
          className="w-full rounded-xl border border-[#2A2A2A] bg-[#1A1A1A] px-4 py-3 text-sm text-white placeholder-[#6B7075] outline-none focus:border-[#E01E26]"
        />

        <div className="flex flex-col gap-3 sm:flex-row">
          <button onClick={share} disabled={busy} data-testid="crawl-badge-share-button"
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-[#E01E26] px-5 py-3 text-sm font-bold text-white hover:bg-[#FF2E38] disabled:opacity-50">
            <Share2 className="h-4 w-4" /> Share badge
          </button>
          <button onClick={download} disabled={busy} data-testid="crawl-badge-download-button"
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-[#3A3A3A] px-5 py-3 text-sm font-bold text-white hover:bg-white/10 disabled:opacity-50">
            <Download className="h-4 w-4" /> Download
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
