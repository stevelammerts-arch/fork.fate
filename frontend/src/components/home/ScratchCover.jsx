import { useEffect, useRef } from "react";

// Theme-matched foil palettes so the scratch surface always belongs to the
// active world: gold for Dragon's Hoard, bone-ash for Reaper, neon chrome
// for cyber, brass for steampunk, sunset for tiki, seasonal accents, and a
// classic red lotto foil for light mode.
const FOILS = {
  fantasy: { stops: ["#C89B3C", "#F2D98A", "#E6B23A", "#A87A24"], text: "#5C3D0E" },
  dark: { stops: ["#5A5E64", "#C9CDD2", "#9BA1A8", "#3E4247"], text: "#17191C" },
  cyber: { stops: ["#153B3B", "#6FF7F7", "#22E0E0", "#3A1D5C"], text: "#062121" },
  steam: { stops: ["#8A5B2B", "#D9A85C", "#C08A3E", "#6E4218"], text: "#3B2410" },
  tiki: { stops: ["#B3541E", "#F0A24E", "#E0813A", "#7E3413"], text: "#4A1F0B" },
  fall: { stops: ["#9C4A1A", "#E8A24C", "#D97B2C", "#6E3311"], text: "#45200A" },
  winter: { stops: ["#4A7A9C", "#CFE8F5", "#9CC8E0", "#33586F"], text: "#1B3648" },
  spring: { stops: ["#B25A78", "#F5C9D8", "#E098B4", "#8A3F5C"], text: "#5C2038" },
  summer: { stops: ["#1E8A8A", "#9CE8E0", "#4CC8C0", "#136060"], text: "#0A3D3D" },
  fairy: { stops: ["#1E7A4A", "#8FF0C0", "#4ECF8A", "#145C36"], text: "#06301C" },
  light: { stops: ["#B3141A", "#F26B70", "#E01E26", "#8E0E13"], text: "#FFFFFF" },
};

export function foilForTheme(theme) {
  return FOILS[theme] || FOILS.light;
}

// Theme accent used for card frames / wheel segments (matches deck card backs).
const ACCENTS = {
  fantasy: "#E6B23A", cyber: "#22E0E0", tiki: "#F0A24E", steam: "#D9A44E",
  dark: "#E01E26", light: "#A31621", fall: "#D97B2C", winter: "#9CC8E0",
  spring: "#E098B4", summer: "#4CC8C0", fairy: "#5EE0A8",
};

export function accentForTheme(theme) {
  return ACCENTS[theme] || ACCENTS.light;
}

/**
 * The double inset border the shuffle-deck card backs use, as an overlay —
 * frames the rare-fate reveals so they read as one of fate's cards.
 */
export function ThemeCardFrame({ theme }) {
  const accent = accentForTheme(theme);
  return (
    <div className="pointer-events-none absolute inset-0 z-30" data-testid="rare-fate-frame">
      {/* Dark rim first so the accent lines read on light foils (e.g. gold) */}
      <div className="absolute inset-0 rounded-2xl border-2" style={{ borderColor: "rgba(10,9,12,0.55)" }} />
      <div className="absolute inset-2 rounded-xl border" style={{ borderColor: `${accent}B3`, boxShadow: `inset 0 0 12px ${accent}4D, 0 0 0 1px rgba(10,9,12,0.35)` }} />
      <div className="absolute inset-[10px] rounded-lg border" style={{ borderColor: `${accent}55` }} />
    </div>
  );
}

/**
 * Scratch-off overlay: covers its parent (which must be position:relative)
 * with a themed foil canvas the user scratches away with finger/mouse. Once
 * `threshold` of the surface is cleared, calls onDone() and fades out.
 *
 * Progress is tracked on a coarse 16px grid (cheap, no getImageData reads
 * per frame).
 */
export function ScratchCover({ onDone, label = "Scratch to reveal", theme = "light", threshold = 0.45, radius = 22, testId = "scratch-cover" }) {
  const canvasRef = useRef(null);
  const doneRef = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    const rect = parent.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    const ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);
    const w = rect.width, h = rect.height;
    const foil = foilForTheme(theme);

    // Foil fill with a diagonal sheen + speckle texture.
    const grad = ctx.createLinearGradient(0, 0, w, h);
    const n = foil.stops.length;
    foil.stops.forEach((c, i) => grad.addColorStop(i / (n - 1), c));
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
    ctx.globalAlpha = 0.08;
    for (let i = 0; i < 220; i++) {
      ctx.fillStyle = Math.random() > 0.5 ? "#fff" : "#000";
      ctx.fillRect(Math.random() * w, Math.random() * h, 1.5, 1.5);
    }
    ctx.globalAlpha = 1;
    ctx.fillStyle = foil.text;
    ctx.font = "bold 13px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`✦ ${label} ✦`, w / 2, Math.min(h / 2, 120));

    // Scratch state
    const cell = 16;
    const cols = Math.ceil(w / cell), rows = Math.ceil(h / cell);
    const hit = new Set();
    const totalCells = cols * rows;
    let scratching = false;

    const scratchAt = (x, y) => {
      ctx.globalCompositeOperation = "destination-out";
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalCompositeOperation = "source-over";
      // Mark a 3x3 cell neighbourhood as cleared.
      const cx = Math.floor(x / cell), cy = Math.floor(y / cell);
      for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) {
        const gx = cx + dx, gy = cy + dy;
        if (gx >= 0 && gy >= 0 && gx < cols && gy < rows) hit.add(gy * cols + gx);
      }
      if (!doneRef.current && hit.size / totalCells >= threshold) {
        doneRef.current = true;
        canvas.style.transition = "opacity 0.45s ease";
        canvas.style.opacity = "0";
        setTimeout(() => onDone?.(), 380);
      }
    };

    const pos = (e) => {
      const r = canvas.getBoundingClientRect();
      return [e.clientX - r.left, e.clientY - r.top];
    };
    const down = (e) => { scratching = true; canvas.setPointerCapture?.(e.pointerId); scratchAt(...pos(e)); };
    const move = (e) => { if (scratching) { e.preventDefault(); scratchAt(...pos(e)); } };
    const up = () => { scratching = false; };
    canvas.addEventListener("pointerdown", down);
    canvas.addEventListener("pointermove", move);
    canvas.addEventListener("pointerup", up);
    canvas.addEventListener("pointercancel", up);
    return () => {
      canvas.removeEventListener("pointerdown", down);
      canvas.removeEventListener("pointermove", move);
      canvas.removeEventListener("pointerup", up);
      canvas.removeEventListener("pointercancel", up);
    };
  }, [onDone, label, theme, threshold, radius]);

  return (
    <canvas
      ref={canvasRef}
      data-testid={testId}
      className="absolute inset-0 z-10 h-full w-full cursor-crosshair rounded-2xl"
      style={{ touchAction: "none" }}
    />
  );
}
