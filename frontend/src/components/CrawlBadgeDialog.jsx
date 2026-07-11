import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Trophy, Share2, Download, Camera, X, Lock, Instagram } from "lucide-react";
import { toast } from "sonner";
import { useTheme } from "../hooks/useTheme";

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

async function buildBadge({ name, crew, label, photo, story = false, light = false }) {
  const P = light
    ? { bg1: "#F8F2E7", bg2: "#EDE2CF", panel: "#FFFFFF", panelStroke: "#E7DCC7", ink: "#2A2118", accent: "#4F6F47", muted: "#8A7C68", line: "#E4D9C4", box: "#F1EADB", boxInk: "#B9AC95" }
    : { bg1: "#1C0406", bg2: "#070707", panel: "#141414", panelStroke: "rgba(224,30,38,0.35)", ink: "#FFFFFF", accent: "#E01E26", muted: "#B9BEC4", line: "rgba(224,30,38,0.45)", box: "#141414", boxInk: "#5A5A5A" };
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

export default function CrawlBadgeDialog({ open, onClose, mode, crawlLabel = "", defaultCrew = "" }) {
  const { theme } = useTheme();
  const light = theme === "light";
  const [name, setName] = useState("");
  const [crew, setCrew] = useState(defaultCrew);
  const [photo, setPhoto] = useState(null);
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState("intro");
  const [cinemaDone, setCinemaDone] = useState(false);
  const [communityCount, setCommunityCount] = useState(null);
  const fileRef = useRef(null);
  const label = useMemo(() => (crawlLabel ? crawlLabel.toUpperCase() : crawlLabelFor(mode)), [crawlLabel, mode]);
  const labelFriendly = useMemo(
    () => crawlLabel || ({ bars: "Pub Crawl", food: "Food Crawl", drinks: "Drinks Crawl", desserts: "Dessert Crawl" }[mode] || "Pub Crawl"),
    [crawlLabel, mode]
  );

  useEffect(() => {
    if (!open) return;
    setStep("intro");
    setCinemaDone(false);
    const t = setTimeout(() => setCinemaDone(true), light ? 1400 : 2400);
    axios.post(`${API}/stats/crawl-completed`).then(({ data }) => setCommunityCount(data.count)).catch(() => {});
    let thunderT;
    try {
      if (localStorage.getItem("ff_muted") !== "1") {
        if (light) {
          // Cheerful Ta-Da! for the professional theme
          const tada = new Audio("/reveal-tada.wav");
          tada.volume = 1.0;
          setTimeout(() => tada.play().catch(() => {}), 900);
        } else {
          const a = new Audio("/crawl-congrats.mp3?v=2");
          a.volume = 1.0;
          a.play().catch(() => {});
          thunderT = setTimeout(() => {
            try { const boom = new Audio("/reveal-thunder-v4.mp3"); boom.volume = 1.0; boom.play().catch(() => {}); }
            catch (e) { /* audio unavailable */ }
          }, 350);
        }
      }
    } catch (e) { /* audio unavailable */ }
    return () => { clearTimeout(t); clearTimeout(thunderT); };
  }, [open, light]);

  const onPickPhoto = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Please choose an image"); return; }
    const reader = new FileReader();
    reader.onload = () => setPhoto(reader.result);
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const makeBlob = async () => {
    const img = photo ? await loadImage(photo).catch(() => null) : null;
    return buildBadge({ name: name.trim(), crew, label, photo: img, light });
  };
  const makeStoryBlob = async () => {
    const img = photo ? await loadImage(photo).catch(() => null) : null;
    return buildBadge({ name: name.trim(), crew, label, photo: img, story: true, light });
  };

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
      const text = `I completed the Fork\u00B7Fate ${label.toLowerCase()}${crew.trim() ? ` with ${crew.trim()}` : ""}! ${window.location.origin}`;
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: "Fork\u00B7Fate Crawl Badge", text });
      } else {
        await download();
      }
    } catch (e) { /* cancelled */ }
    finally { setBusy(false); }
  };

  const shareStory = async () => {
    setBusy(true);
    try {
      const blob = await makeStoryBlob();
      const file = new File([blob], "fork-fate-story.png", { type: "image/png" });
      const text = `I completed the Fork\u00B7Fate ${label.toLowerCase()}${crew.trim() ? ` with ${crew.trim()}` : ""}! ${window.location.origin}`;
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: "Fork\u00B7Fate Story", text });
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url; a.download = "fork-fate-story.png";
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 2000);
        toast.success("Story image saved \u2014 post it to your IG Story!");
      }
    } catch (e) { /* cancelled */ }
    finally { setBusy(false); }
  };

  // Theme-aware dialog + button styles
  const dlg = light
    ? "border-[#E7DCC7] bg-[#FBF7EF] text-[#2A2118]"
    : "border-[#2A2A2A] bg-[#0B0B0B] text-white";
  const inputCls = light
    ? "w-full rounded-xl border border-[#E4D9C4] bg-white px-4 py-3 text-sm text-[#2A2118] placeholder-[#A99C86] outline-none focus:border-[#A31621]"
    : "w-full rounded-xl border border-[#2A2A2A] bg-[#1A1A1A] px-4 py-3 text-sm text-white placeholder-[#6B7075] outline-none focus:border-[#E01E26]";
  const ghostBtn = light
    ? "border border-[#E4D9C4] text-[#2A2118] hover:bg-[#F1EADB]"
    : "border border-[#3A3A3A] text-white hover:bg-white/10";
  const accentBtn = light ? "bg-[#A8C99E] text-[#24391F] hover:bg-[#97BC8B]" : "bg-[#E01E26] text-white hover:bg-[#FF2E38]";

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className={`max-h-[94vh] overflow-y-auto sm:max-w-xl ${dlg}`} data-testid="crawl-badge-dialog">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-serif text-2xl">
            <Trophy className={`h-6 w-6 ${light ? "text-[#4F6F47]" : "text-[#E01E26]"}`} /> Crawl Complete
          </DialogTitle>
          <DialogDescription className={light ? "text-sm text-[#8A7C68]" : "text-sm text-[#A0A0A0]"}>
            Your reward awaits — claim your badge and share it.
          </DialogDescription>
        </DialogHeader>

        {step === "intro" ? (
          <div className="flex flex-col items-center gap-4 py-2 text-center" data-testid="crawl-badge-intro">
            <div className="relative flex h-60 w-full items-center justify-center overflow-hidden">
              {/* Dark mode keeps the cinematic reaper; light mode does a clean cream reveal */}
              {!light && (
                <AnimatePresence>
                  {!cinemaDone && (
                    <motion.img
                      key="reaper-shocked"
                      src="/reaper-shocked.png?v=1"
                      alt=""
                      data-testid="crawl-reaper-shocked"
                      initial={{ opacity: 0, scale: 0.82, y: 14, filter: "blur(3px)" }}
                      animate={{
                        opacity: [0, 1, 1, 1, 0],
                        scale: [0.82, 1, 1.06, 0.82, 0.28],
                        y: [14, 0, 0, -10, -64],
                        filter: ["blur(3px)", "blur(0px)", "blur(0px)", "blur(1.5px)", "blur(8px)"],
                      }}
                      transition={{ duration: 2.4, times: [0, 0.2, 0.5, 0.76, 1], ease: "easeInOut" }}
                      className="h-60 w-60 object-contain"
                    />
                  )}
                </AnimatePresence>
              )}
              {(cinemaDone || light) && (
                <div className="relative flex w-full items-center justify-center" data-testid="crawl-congrats-reveal">
                  <motion.div
                    aria-hidden="true"
                    initial={{ opacity: 0, scale: 0.2 }}
                    animate={{ opacity: [0, 1, 0.85, 0], scale: [0.2, 1.1, 1.7, 2.6] }}
                    transition={{ duration: 1.0, ease: "easeOut", times: [0, 0.18, 0.5, 1] }}
                    className="pointer-events-none absolute z-0 h-72 w-72 rounded-full"
                    style={{
                      background: light
                        ? "radial-gradient(circle, rgba(122,168,110,0.80) 0%, rgba(79,111,71,0.35) 40%, rgba(79,111,71,0) 72%)"
                        : "radial-gradient(circle, rgba(255,120,90,0.98) 0%, rgba(224,30,38,0.9) 30%, rgba(224,30,38,0.45) 55%, rgba(224,30,38,0) 75%)",
                    }}
                  />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.28, filter: "blur(14px)" }}
                    animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                    transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1], delay: light ? 0 : 0.12 }}
                    className="relative z-10"
                  >
                    {light ? (
                      <h3 className="font-serif text-5xl font-semibold tracking-tight text-[#4F6F47] sm:text-6xl">
                        Congratulations
                      </h3>
                    ) : (
                      <h3 className="flame-text font-serif text-5xl font-semibold tracking-tight sm:text-6xl">
                        Congratulations
                      </h3>
                    )}
                  </motion.div>
                </div>
              )}
            </div>

            {(cinemaDone || light) && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35, duration: 0.5 }}
                className="flex w-full flex-col items-center gap-4"
              >
                <p className={light ? "text-sm text-[#5A5142]" : "text-sm text-[#C7CBD1]"}>
                  You completed the <span className={`font-bold ${light ? "text-[#2A2118]" : "text-white"}`}>Fork·Fate {labelFriendly}</span>. Take a selfie and claim your reward?
                </p>
                {communityCount !== null && communityCount > 0 && (
                  <p className={light ? "text-xs text-[#8A7C68]" : "text-xs text-[#8A8F95]"} data-testid="crawl-badge-community-count">
                    🏆 <span className={`font-bold ${light ? "text-[#4F6F47]" : "text-[#E01E26]"}`}>{communityCount.toLocaleString()}</span> crawls completed on Fork·Fate
                  </p>
                )}
                <div className="mt-1 flex w-full flex-col gap-3">
                  <button onClick={() => { setStep("build"); setTimeout(() => fileRef.current?.click(), 150); }} data-testid="crawl-badge-selfie-cta"
                    className={`inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-bold ${accentBtn}`}>
                    <Camera className="h-4 w-4" /> Take a selfie & reveal my reward
                  </button>
                  <button onClick={() => setStep("build")} data-testid="crawl-badge-skip-selfie"
                    className={`inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-bold ${ghostBtn}`}>
                    Just show my reward
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        ) : (
        <>
        {/* Live horizontal preview: logo left · congrats middle · selfie right */}
        <div
          className="relative mx-auto flex w-full max-w-[520px] items-stretch overflow-hidden rounded-xl border"
          data-testid="crawl-badge-preview"
          style={{ aspectRatio: "16 / 9", background: light ? "#FFFFFF" : "linear-gradient(#1C0406,#0C0304 60%,#070707)", borderColor: light ? "#E7DCC7" : "rgba(224,30,38,0.35)" }}
        >
          {/* Left: logo */}
          <div className="flex w-[35%] flex-col items-center justify-center gap-1 px-2" style={{ borderRight: `1px solid ${light ? "#E4D9C4" : "rgba(224,30,38,0.35)"}` }}>
            <img src={light ? "/logo-mark-light.png" : "/logo-mark.png"} alt="Fork·Fate" className="h-[46%] w-auto object-contain" />
            <span className={`font-serif font-bold ${light ? "text-[#2A2118]" : "text-white"}`} style={{ fontSize: "clamp(11px,3.2vw,20px)" }}>Fork·Fate</span>
            <span className={`font-bold uppercase tracking-[0.2em] ${light ? "text-[#A31621]" : "text-[#E01E26]"}`} style={{ fontSize: "clamp(5px,1.4vw,9px)" }}>{label}</span>
          </div>
          {/* Middle: congrats */}
          <div className="flex w-[38%] flex-col items-center justify-center px-2 text-center leading-tight">
            <span className={`font-bold uppercase tracking-[0.18em] ${light ? "text-[#A31621]" : "text-[#E01E26]"}`} style={{ fontSize: "clamp(6px,1.7vw,11px)" }}>{light ? "Congratulations" : "I Survived"}</span>
            <span className={`mt-0.5 font-serif font-bold ${light ? "text-[#2A2118]" : "text-white"}`} style={{ fontSize: "clamp(9px,2.6vw,16px)" }}>THE FORK·FATE</span>
            <span className={`font-serif font-bold ${light ? "text-[#2A2118]" : "text-white"}`} style={{ fontSize: "clamp(9px,2.6vw,16px)" }}>{label}</span>
            <span className={`my-1 block h-0.5 w-5 ${light ? "bg-[#A31621]" : "bg-[#E01E26]"}`} />
            <span className={`font-serif italic ${light ? "text-[#2A2118]" : "text-[#F3F3F3]"}`} style={{ fontSize: "clamp(8px,2.2vw,13px)" }}>{name.trim() || "Your name"}</span>
            {crew.trim() && <span className={light ? "text-[#8A7C68]" : "text-[#B9BEC4]"} style={{ fontSize: "clamp(6px,1.5vw,9px)" }}>with {crew.trim()}</span>}
            <span className={`mt-0.5 tracking-wider ${light ? "text-[#A99C86]" : "text-[#9A9FA5]"}`} style={{ fontSize: "clamp(5px,1.2vw,8px)" }}>fork-fate.com</span>
          </div>
          {/* Right: selfie */}
          <div className="flex w-[27%] items-center justify-center p-2">
            <div className="aspect-[4/3] w-full overflow-hidden rounded-md border-2" style={{ borderColor: light ? "#A31621" : "#E01E26" }}>
              {photo
                ? <img src={photo} alt="Your selfie" className="h-full w-full object-cover" />
                : <div className={`grid h-full w-full place-items-center text-center ${light ? "bg-[#F1EADB] text-[#B9AC95]" : "bg-[#141414] text-[#5A5A5A]"}`}><Camera className="h-5 w-5" /></div>}
            </div>
          </div>
        </div>

        <input ref={fileRef} type="file" accept="image/*" capture="user" onChange={onPickPhoto} className="hidden" data-testid="crawl-badge-photo-input" />
        <p className={`flex items-start gap-1.5 text-xs ${light ? "text-[#8A7C68]" : "text-[#8A8F95]"}`} data-testid="crawl-badge-privacy-note">
          <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#4ADE80]" />
          Your photo stays on your device — it's added to the badge here on your phone and never uploaded or stored.
        </p>
        <p className={`-mt-1 flex items-start gap-1.5 text-xs ${light ? "text-[#B58900]" : "text-[#C9A227]"}`} data-testid="crawl-badge-orientation-note">
          <Camera className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          Use a horizontal (landscape) photo so it fills the card frame.
        </p>
        <div className="flex gap-3">
          <button onClick={() => fileRef.current?.click()} data-testid="crawl-badge-photo-button"
            className={`inline-flex flex-1 items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-bold ${ghostBtn}`}>
            <Camera className="h-4 w-4" /> {photo ? "Retake / change" : "Add selfie"}
          </button>
          {photo && (
            <button onClick={() => setPhoto(null)} data-testid="crawl-badge-photo-remove"
              className={`inline-flex items-center justify-center gap-1 rounded-full px-4 py-2.5 text-sm font-bold ${ghostBtn}`}>
              <X className="h-4 w-4" /> Remove
            </button>
          )}
        </div>

        <input value={name} onChange={(e) => setName(e.target.value.slice(0, 22))} placeholder="Your name"
          data-testid="crawl-badge-name-input" className={inputCls} />
        <input value={crew} onChange={(e) => setCrew(e.target.value.slice(0, 60))} placeholder="Who's with you? (e.g. Sam, Alex)"
          data-testid="crawl-badge-crew-input" className={inputCls} />

        <button onClick={shareStory} disabled={busy} data-testid="crawl-badge-story-button"
          className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#E01E26] via-[#C21C6B] to-[#7A3FF2] px-5 py-3 text-sm font-bold text-white shadow-lg shadow-[#C21C6B]/25 hover:opacity-95 disabled:opacity-50">
          <Instagram className="h-4 w-4" /> Share to your Story
        </button>
        <div className="flex flex-col gap-3 sm:flex-row">
          <button onClick={share} disabled={busy} data-testid="crawl-badge-share-button"
            className={`inline-flex flex-1 items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-bold disabled:opacity-50 ${accentBtn}`}>
            <Share2 className="h-4 w-4" /> Share badge
          </button>
          <button onClick={download} disabled={busy} data-testid="crawl-badge-download-button"
            className={`inline-flex flex-1 items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-bold disabled:opacity-50 ${ghostBtn}`}>
            <Download className="h-4 w-4" /> Download
          </button>
        </div>
        </>
        )}
      </DialogContent>
    </Dialog>
  );
}
