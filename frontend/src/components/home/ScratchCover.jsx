import { useEffect, useRef } from "react";

/**
 * Scratch-off overlay: covers its parent (which must be position:relative)
 * with a gold-foil canvas the user scratches away with finger/mouse. Once
 * ~45% of the surface is cleared, calls onDone() and fades out.
 *
 * Progress is tracked on a coarse 16px grid (cheap, no getImageData reads
 * per frame).
 */
export function ScratchCover({ onDone, label = "Scratch to reveal" }) {
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

    // Gold-foil fill with a subtle diagonal sheen + speckle texture.
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, "#C89B3C");
    grad.addColorStop(0.45, "#F2D98A");
    grad.addColorStop(0.55, "#E6B23A");
    grad.addColorStop(1, "#A87A24");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
    ctx.globalAlpha = 0.08;
    for (let i = 0; i < 180; i++) {
      ctx.fillStyle = Math.random() > 0.5 ? "#fff" : "#5c3d0e";
      ctx.fillRect(Math.random() * w, Math.random() * h, 1.5, 1.5);
    }
    ctx.globalAlpha = 1;
    ctx.fillStyle = "#5C3D0E";
    ctx.font = "bold 12px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`✦ ${label} ✦`, w / 2, h / 2);

    // Scratch state
    const cell = 16;
    const cols = Math.ceil(w / cell), rows = Math.ceil(h / cell);
    const hit = new Set();
    const totalCells = cols * rows;
    let scratching = false;

    const scratchAt = (x, y) => {
      ctx.globalCompositeOperation = "destination-out";
      ctx.beginPath();
      ctx.arc(x, y, 22, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalCompositeOperation = "source-over";
      // Mark a 3x3 cell neighbourhood as cleared.
      const cx = Math.floor(x / cell), cy = Math.floor(y / cell);
      for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) {
        const gx = cx + dx, gy = cy + dy;
        if (gx >= 0 && gy >= 0 && gx < cols && gy < rows) hit.add(gy * cols + gx);
      }
      if (!doneRef.current && hit.size / totalCells >= 0.45) {
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
  }, [onDone, label]);

  return (
    <canvas
      ref={canvasRef}
      data-testid="scratch-cover"
      className="absolute inset-0 z-10 h-full w-full cursor-crosshair rounded-2xl"
      style={{ touchAction: "none" }}
    />
  );
}
