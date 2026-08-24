"""Build the plate cutout (diff of F3 vs F2) and print its bbox for ffmpeg."""
import numpy as np
from PIL import Image, ImageFilter

W, H = 1080, 1920
f2 = Image.open("/app/scripts/outro_f2.png").convert("RGB").resize((W, H), Image.LANCZOS)
f3 = Image.open("/app/scripts/outro_f3.png").convert("RGB").resize((W, H), Image.LANCZOS)
f2.save("/app/scripts/outro_f2_n.png")
f3.save("/app/scripts/outro_f3_n.png")

a2, a3 = np.array(f2).astype(np.int16), np.array(f3).astype(np.int16)
diff = np.abs(a3 - a2).sum(axis=2)
mask = (diff > 45).astype(np.uint8) * 255
m = Image.fromarray(mask, "L").filter(ImageFilter.MaxFilter(9)).filter(ImageFilter.MinFilter(5)).filter(ImageFilter.GaussianBlur(3))
mm = np.array(m)
# keep only the plate itself — steam wisps above shouldn't "fall"
keep = np.zeros_like(mm)
keep[960:1400, :] = mm[960:1400, :]
mm = keep
ys, xs = np.nonzero(mm > 40)
x0, x1, y0, y1 = xs.min(), xs.max(), ys.min(), ys.max()
pad = 12
x0, y0 = max(0, x0 - pad), max(0, y0 - pad)
x1, y1 = min(W, x1 + pad), min(H, y1 + pad)
cut = np.dstack([a3.astype(np.uint8), mm])[y0:y1, x0:x1]
Image.fromarray(cut, "RGBA").save("/app/scripts/outro_plate.png")
print(f"BBOX x={x0} y={y0} w={x1 - x0} h={y1 - y0}")
