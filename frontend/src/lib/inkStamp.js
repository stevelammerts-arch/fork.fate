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

/**
 * Letters laid along a circle, spaced by their real widths so long venue names
 * don't collide. `flip` draws the run clockwise with upright letters for the
 * bottom of the ring (otherwise the date reads upside down).
 */
function arcText(ctx, text, radius, centerAngle, size, flip = false) {
  ctx.font = `700 ${size}px Manrope, system-ui, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const chars = [...text];
  const widths = chars.map((c) => ctx.measureText(c).width + size * 0.08);
  const total = widths.reduce((a, b) => a + b, 0);
  const dir = flip ? -1 : 1;
  let a = centerAngle - (dir * total) / (2 * radius);
  chars.forEach((ch, i) => {
    const step = widths[i] / radius;
    a += (dir * step) / 2;
    ctx.save();
    ctx.translate(Math.cos(a) * radius, Math.sin(a) * radius);
    ctx.rotate(a + (flip ? -Math.PI / 2 : Math.PI / 2));
    ctx.fillText(ch, 0, 0);
    ctx.restore();
    a += (dir * step) / 2;
  });
}

/** Fit a name to the top arc: trim first, then shrink until it stays in the band. */
function fitArc(ctx, text, radius, maxSize, maxSweep) {
  let size = maxSize;
  for (let i = 0; i < 8; i++) {
    ctx.font = `700 ${size}px Manrope, system-ui, sans-serif`;
    const w = ctx.measureText(text).width + text.length * size * 0.08;
    if (w / radius <= maxSweep) break;
    size *= 0.9;
  }
  return size;
}

/** Stamp one impression on a canvas, centred at (cx, cy). */
export function stampOnCanvas(ctx, cx, cy, radius, { name = "", date = "", id = "", kicker, verified = true }) {
  const { ink, angle } = stampStyle(id);
  const label = kicker || (verified ? "VISITED" : "SELF-REPORTED");
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle);
  // A self-reported stop is drawn faint with a broken ring — it reads as a
  // provisional stamp next to the solid ones you earned on site.
  ctx.globalAlpha = verified ? 0.86 : 0.45;
  ctx.strokeStyle = verified ? ink : "#6E6257";
  ctx.fillStyle = verified ? ink : "#6E6257";
  ctx.lineWidth = Math.max(2, radius * (verified ? 0.045 : 0.03));
  if (!verified) ctx.setLineDash([radius * 0.12, radius * 0.09]);

  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.78, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  // Name rides the top of the ring band, date the bottom.
  const band = radius * 0.89;
  const short = name.length > 26 ? `${name.slice(0, 25)}…` : name;
  const nameSize = fitArc(ctx, short.toUpperCase(), band, radius * 0.15, Math.PI * 0.95);
  arcText(ctx, short.toUpperCase(), band, -Math.PI / 2, nameSize);
  if (date) arcText(ctx, date, band, Math.PI / 2, radius * 0.13, true);

  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  const kickSize = label.length > 9 ? radius * 0.15 : radius * 0.24;
  ctx.font = `800 ${kickSize}px Manrope, system-ui, sans-serif`;
  ctx.fillText(label, 0, radius * 0.02);
  ctx.font = `700 ${radius * 0.12}px Manrope, system-ui, sans-serif`;
  ctx.fillText("FORK · FATE", 0, radius * 0.26);

  // Star flourishes either side of the middle line, like a real entry stamp.
  ctx.font = `700 ${radius * 0.16}px Manrope, system-ui, sans-serif`;
  ctx.fillText("✦", -radius * 0.52, radius * 0.02);
  ctx.fillText("✦", radius * 0.52, radius * 0.02);

  // Ink gaps, so it reads as rubber-stamped rather than printed.
  ctx.globalAlpha = verified ? 0.75 : 0.4;
  ctx.strokeStyle = "rgba(255,252,244,0.9)";
  ctx.lineWidth = radius * 0.035;
  ctx.beginPath();
  ctx.moveTo(-radius * 0.95, -radius * 0.42);
  ctx.lineTo(radius * 0.45, -radius * 0.58);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-radius * 0.5, radius * 0.62);
  ctx.lineTo(radius * 0.92, radius * 0.42);
  ctx.stroke();
  ctx.restore();
}
