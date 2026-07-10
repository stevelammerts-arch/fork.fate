import { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Trophy, Share2, Download, Camera, X, Lock } from "lucide-react";
import { toast } from "sonner";

const REAPER_SRC = "/reaper-award.png";
const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

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

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawFit(ctx, text, cx, y, maxWidth, weight, basePx, family, color, spacing = 0, italic = false) {
  let px = basePx;
  const font = (p) => `${italic ? "italic " : ""}${weight} ${p}px ${family}`;
  ctx.font = font(px);
  const measure = (s) => ctx.measureText(s).width + (spacing ? spacing * (s.length - 1) : 0);
  while (px > 10 && measure(text) > maxWidth) { px -= 1; ctx.font = font(px); }
  ctx.fillStyle = color;
  ctx.textBaseline = "top";
  if (spacing) {
    let x = cx - measure(text) / 2;
    ctx.textAlign = "left";
    for (const ch of text) { ctx.fillText(ch, x, y); x += ctx.measureText(ch).width + spacing; }
    ctx.textAlign = "center";
  } else {
    ctx.textAlign = "center";
    ctx.fillText(text, cx, y);
  }
}

async function buildBadge({ name, crew, label, photo }) {
  const W = 1080, H = 1520;
  const canvas = document.createElement("canvas");
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d");
  // Red/black backdrop behind the reaper
  const base = ctx.createLinearGradient(0, 0, 0, H);
  base.addColorStop(0, "#1C0406");
  base.addColorStop(0.5, "#0C0304");
  base.addColorStop(1, "#070707");
  ctx.fillStyle = base; ctx.fillRect(0, 0, W, H);
  const glow = ctx.createRadialGradient(W * 0.5, H * 0.22, 40, W * 0.5, H * 0.22, 720);
  glow.addColorStop(0, "rgba(224,30,38,0.42)");
  glow.addColorStop(0.55, "rgba(150,16,22,0.14)");
  glow.addColorStop(1, "rgba(224,30,38,0)");
  ctx.fillStyle = glow; ctx.fillRect(0, 0, W, H);
  // Corner vignette for depth
  const vig = ctx.createRadialGradient(W * 0.5, H * 0.45, H * 0.3, W * 0.5, H * 0.5, H * 0.75);
  vig.addColorStop(0, "rgba(0,0,0,0)");
  vig.addColorStop(1, "rgba(0,0,0,0.6)");
  ctx.fillStyle = vig; ctx.fillRect(0, 0, W, H);

  try {
    const reaper = await loadImage(REAPER_SRC);
    ctx.drawImage(reaper, 0, 0, W, W); // reaper is square, drawn across the top
  } catch (e) { /* text still renders */ }

  // Selfie fills the card the reaper holds
  if (photo) {
    try {
      const img = await loadImage(photo);
      const sx = 0.522 * W, sy = 0.35 * W, sw = 0.42 * W, sh = 0.205 * W;
      const scale = Math.max(sw / img.width, sh / img.height);
      const dw = img.width * scale, dh = img.height * scale;
      ctx.save();
      roundRect(ctx, sx, sy, sw, sh, 10);
      ctx.clip();
      ctx.drawImage(img, sx + (sw - dw) / 2, sy + (sh - dh) / 2, dw, dh);
      ctx.restore();
    } catch (e) { /* skip photo */ }
  }

  // Info tarot card below (not held)
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

  return new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
}

export default function CrawlBadgeDialog({ open, onClose, mode, defaultCrew = "" }) {
  const [name, setName] = useState("");
  const [crew, setCrew] = useState(defaultCrew);
  const [photo, setPhoto] = useState(null);
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState("intro");
  const [communityCount, setCommunityCount] = useState(null);
  const fileRef = useRef(null);
  const label = useMemo(() => crawlLabelFor(mode), [mode]);
  const labelFriendly = useMemo(
    () => ({ bars: "Pub Crawl", food: "Food Crawl", drinks: "Drinks Crawl", desserts: "Dessert Crawl" }[mode] || "Pub Crawl"),
    [mode]
  );

  useEffect(() => {
    if (!open) return;
    setStep("intro");
    // Count this survived crawl and grab the community total for social proof
    axios.post(`${API}/stats/crawl-completed`).then(({ data }) => setCommunityCount(data.count)).catch(() => {});
    // Play the recorded congrats clip on reveal (respects the app mute toggle)
    try {
      if (localStorage.getItem("ff_muted") !== "1") {
        const a = new Audio("/crawl-congrats.mp3");
        a.volume = 1.0;
        a.play().catch(() => {});
      }
    } catch (e) { /* audio unavailable */ }
  }, [open]);

  const onPickPhoto = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Please choose an image"); return; }
    const reader = new FileReader();
    reader.onload = () => setPhoto(reader.result);
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const makeBlob = () => buildBadge({ name: name.trim(), crew, label, photo });

  const download = async () => {
    setBusy(true);
    try {
      const blob = await makeBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = "fork-fate-crawl-badge.png";
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
      toast.success("Badge saved!");
    } catch (e) { toast.error("Couldn't build the badge — try again"); }
    finally { setBusy(false); }
  };

  const share = async () => {
    setBusy(true);
    try {
      const blob = await makeBlob();
      const file = new File([blob], "fork-fate-crawl-badge.png", { type: "image/png" });
      const text = `I survived the Fork\u00B7Fate ${label.toLowerCase()}${crew.trim() ? ` with ${crew.trim()}` : ""}! \u2620\uFE0F ${window.location.origin}`;
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: "Fork\u00B7Fate Crawl Badge", text });
      } else {
        await download();
      }
    } catch (e) { /* cancelled */ }
    finally { setBusy(false); }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[94vh] overflow-y-auto border-[#2A2A2A] bg-[#0B0B0B] text-white sm:max-w-md" data-testid="crawl-badge-dialog">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-serif text-2xl">
            <Trophy className="h-6 w-6 text-[#E01E26]" /> Crawl Complete
          </DialogTitle>
          <DialogDescription className="text-sm text-[#A0A0A0]">
            Your reward awaits — claim your badge and share the glory.
          </DialogDescription>
        </DialogHeader>

        {step === "intro" ? (
          <div className="flex flex-col items-center gap-4 py-4 text-center" data-testid="crawl-badge-intro">
            <div className="grid h-16 w-16 place-items-center rounded-full bg-[#E01E26]/15 ring-1 ring-[#E01E26]/40">
              <Trophy className="h-8 w-8 text-[#E01E26]" />
            </div>
            <h3 className="font-serif text-2xl text-white">Congratulations!</h3>
            <p className="text-sm text-[#C7CBD1]">
              You survived the <span className="font-bold text-white">Fork·Fate {labelFriendly}</span>. Would you like to take a selfie and see your reward?
            </p>
            {communityCount !== null && communityCount > 0 && (
              <p className="text-xs text-[#8A8F95]" data-testid="crawl-badge-community-count">
                🏆 <span className="font-bold text-[#E01E26]">{communityCount.toLocaleString()}</span> brave souls have survived a Fork·Fate crawl
              </p>
            )}
            <div className="mt-1 flex w-full flex-col gap-3">
              <button onClick={() => { setStep("build"); setTimeout(() => fileRef.current?.click(), 150); }} data-testid="crawl-badge-selfie-cta"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#E01E26] px-5 py-3 text-sm font-bold text-white hover:bg-[#FF2E38]">
                <Camera className="h-4 w-4" /> Take a selfie & reveal my reward
              </button>
              <button onClick={() => setStep("build")} data-testid="crawl-badge-skip-selfie"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-[#3A3A3A] px-5 py-3 text-sm font-bold text-white hover:bg-white/10">
                Just show my reward
              </button>
            </div>
          </div>
        ) : (
        <>
        {/* Live preview */}
        <div className="relative mx-auto aspect-[108/152] w-full max-w-[300px] overflow-hidden rounded-lg" data-testid="crawl-badge-preview"
          style={{ background: "linear-gradient(#1C0406,#0C0304 50%,#070707)" }}>
          <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(circle at 50% 22%, rgba(224,30,38,0.42), rgba(150,16,22,0.12) 55%, rgba(224,30,38,0) 72%)" }} />
          <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(circle at 50% 48%, rgba(0,0,0,0) 45%, rgba(0,0,0,0.55) 100%)" }} />
          <img src={REAPER_SRC} alt="Reaper award" className="absolute left-0 top-0 h-[71%] w-full object-contain" />
          <div className="absolute overflow-hidden rounded-md" style={{ left: "52.2%", top: "24.9%", width: "42%", height: "14.6%" }}>
            {photo
              ? <img src={photo} alt="Your selfie" className="h-full w-full object-cover" />
              : <div className="grid h-full w-full place-items-center bg-[#141414] text-center text-[#5A5A5A]"><Camera className="h-5 w-5" /></div>}
          </div>
          <div
            className="absolute flex flex-col items-center justify-center rounded-2xl border-2 border-[#E01E26]/70 bg-gradient-to-b from-[#161616] to-[#0C0C0C] text-center leading-none"
            style={{ left: "21.3%", top: "71.7%", width: "57.4%", height: "25%", padding: "0 14px", boxShadow: "0 0 20px rgba(224,30,38,0.3)" }}
          >
            <span className="font-serif font-bold uppercase tracking-[0.2em] text-[#E01E26]" style={{ fontSize: "clamp(7px,2vw,10px)" }}>I Survived</span>
            <span className="mt-1 font-serif font-bold text-white" style={{ fontSize: "clamp(12px,3.6vw,17px)" }}>THE FORK·FATE</span>
            <span className="font-serif font-bold text-white" style={{ fontSize: "clamp(12px,3.6vw,17px)" }}>{label}</span>
            <span className="my-1 block h-0.5 w-6 bg-[#E01E26]" />
            <span className="font-serif italic text-[#F3F3F3]" style={{ fontSize: "clamp(10px,2.8vw,14px)" }}>{name.trim() || "Your name"}</span>
            {crew.trim() && <span className="mt-0.5 text-[#B9BEC4]" style={{ fontSize: "clamp(7px,1.9vw,10px)" }}>with {crew.trim()}</span>}
            <span className="mt-0.5 tracking-wider text-[#9A9FA5]" style={{ fontSize: "clamp(6px,1.5vw,8px)" }}>fork-fate.com</span>
          </div>
        </div>

        <input ref={fileRef} type="file" accept="image/*" capture="user" onChange={onPickPhoto} className="hidden" data-testid="crawl-badge-photo-input" />
        <p className="flex items-start gap-1.5 text-xs text-[#8A8F95]" data-testid="crawl-badge-privacy-note">
          <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#4ADE80]" />
          Your photo stays on your device — it's added to the badge here on your phone and never uploaded or stored.
        </p>
        <p className="-mt-1 flex items-start gap-1.5 text-xs text-[#C9A227]" data-testid="crawl-badge-orientation-note">
          <Camera className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          Use a horizontal (landscape) photo so it fills the card frame.
        </p>
        <div className="flex gap-3">
          <button onClick={() => fileRef.current?.click()} data-testid="crawl-badge-photo-button"
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-[#3A3A3A] px-4 py-2.5 text-sm font-bold text-white hover:bg-white/10">
            <Camera className="h-4 w-4" /> {photo ? "Retake / change" : "Add selfie"}
          </button>
          {photo && (
            <button onClick={() => setPhoto(null)} data-testid="crawl-badge-photo-remove"
              className="inline-flex items-center justify-center gap-1 rounded-full border border-[#3A3A3A] px-4 py-2.5 text-sm font-bold text-[#A0A0A0] hover:bg-white/10">
              <X className="h-4 w-4" /> Remove
            </button>
          )}
        </div>

        <input value={name} onChange={(e) => setName(e.target.value.slice(0, 22))} placeholder="Your name"
          data-testid="crawl-badge-name-input"
          className="w-full rounded-xl border border-[#2A2A2A] bg-[#1A1A1A] px-4 py-3 text-sm text-white placeholder-[#6B7075] outline-none focus:border-[#E01E26]" />
        <input value={crew} onChange={(e) => setCrew(e.target.value.slice(0, 60))} placeholder="Who's with you? (e.g. Sam, Alex)"
          data-testid="crawl-badge-crew-input"
          className="w-full rounded-xl border border-[#2A2A2A] bg-[#1A1A1A] px-4 py-3 text-sm text-white placeholder-[#6B7075] outline-none focus:border-[#E01E26]" />

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
        </>
        )}
      </DialogContent>
    </Dialog>
  );
}
