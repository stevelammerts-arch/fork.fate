// A real-passport-style ink stamp: double ring, arced venue name, date and a
// slight rotation + ink colour that are stable per stop (hashed from the id) so a
// stamp looks identical on the page and on the award image.
const INKS = ["#1F4E79", "#7A1F2B", "#2E5D3B", "#5B3A86", "#8A5210"];

export function stampStyle(id = "") {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 100000;
  const deg = (h % 25) - 12;
  return { ink: INKS[h % INKS.length], deg, angle: (deg * Math.PI) / 180 };
}

function arcText(ctx, text, radius, startAngle, endAngle, size) {
  const chars = [...text];
  const step = (endAngle - startAngle) / Math.max(chars.length - 1, 1);
  ctx.font = `700 ${size}px Manrope, system-ui, sans-serif`;
  ctx.textAlign = "center";
  chars.forEach((ch, i) => {
    const a = startAngle + step * i;
    ctx.save();
    ctx.translate(Math.cos(a) * radius, Math.sin(a) * radius);
    ctx.rotate(a + Math.PI / 2);
    ctx.fillText(ch, 0, 0);
    ctx.restore();
  });
}

/** Stamp one impression on a canvas, centred at (cx, cy). */
export function stampOnCanvas(ctx, cx, cy, radius, { name = "", date = "", id = "", kicker = "VISITED" }) {
  const { ink, angle } = stampStyle(id);
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle);
  ctx.globalAlpha = 0.86;
  ctx.strokeStyle = ink;
  ctx.fillStyle = ink;
  ctx.lineWidth = Math.max(3, radius * 0.05);

  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.82, 0, Math.PI * 2);
  ctx.stroke();

  const short = name.length > 22 ? `${name.slice(0, 21)}…` : name;
  arcText(ctx, short.toUpperCase(), radius * 0.66, Math.PI * 1.28, Math.PI * 1.72, radius * 0.15);
  arcText(ctx, date, radius * 0.66, Math.PI * 0.75, Math.PI * 0.25, radius * 0.15);

  ctx.textAlign = "center";
  ctx.font = `800 ${radius * 0.26}px Manrope, system-ui, sans-serif`;
  ctx.fillText(kicker, 0, radius * 0.08);
  ctx.font = `700 ${radius * 0.13}px Manrope, system-ui, sans-serif`;
  ctx.fillText("FORK · FATE", 0, radius * 0.32);

  // Ink gaps, so it reads as rubber-stamped rather than printed.
  ctx.globalAlpha = 1;
  ctx.strokeStyle = "rgba(255,252,244,0.85)";
  ctx.lineWidth = radius * 0.06;
  ctx.beginPath();
  ctx.moveTo(-radius * 0.95, -radius * 0.35);
  ctx.lineTo(radius * 0.5, -radius * 0.55);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-radius * 0.6, radius * 0.58);
  ctx.lineTo(radius * 0.9, radius * 0.3);
  ctx.stroke();
  ctx.restore();
}
