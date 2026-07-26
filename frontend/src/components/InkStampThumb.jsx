import { useEffect, useRef } from "react";
import { stampOnCanvas } from "../lib/inkStamp";

/** The same ink stamp used on the award, rendered small next to a visited stop. */
export default function InkStampThumb({ name, date, id, size = 72 }) {
  const ref = useRef(null);

  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const dpr = window.devicePixelRatio || 1;
    c.width = size * dpr;
    c.height = size * dpr;
    const ctx = c.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, size, size);
    stampOnCanvas(ctx, size / 2, size / 2, size * 0.46, { name, date, id });
  }, [name, date, id, size]);

  return <canvas ref={ref} style={{ width: size, height: size }} aria-label={`Stamp for ${name}`} />;
}
