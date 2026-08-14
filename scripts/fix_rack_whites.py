# Fix the rack sprite's "white dots": bright near-neutral speckles (chain and
# metal glints keyed as near-white) get pulled to warm bronze, and tiny stray
# opaque islands at the bottom edge are erased entirely.
import numpy as np
from scipy import ndimage
from PIL import Image

P = "/app/frontend/public/steam-robot-rack.png"
im = Image.open(P).convert("RGBA")
a = np.asarray(im).astype(np.float64)
rgb, alpha = a[..., :3], a[..., 3]

# 1) Erase isolated specks: opaque islands < 300 px that aren't the main body.
mask = alpha > 100
lbl, n = ndimage.label(mask)
sizes = ndimage.sum(mask, lbl, range(1, n + 1))
for i, s in enumerate(sizes):
    if s < 300:
        alpha[lbl == (i + 1)] = 0

# 2) Warm down near-white glints: weight by how neutral-bright the pixel is.
mn = rgb.min(axis=-1)
w = np.clip((mn - 190.0) / 65.0, 0, 1)[..., None]  # 0 below 190, 1 at 255
WARM = np.array([205.0, 165.0, 110.0])
rgb = rgb * (1 - w) + WARM[None, None, :] * w

out = np.dstack([np.clip(rgb, 0, 255), alpha]).astype(np.uint8)
Image.fromarray(out, "RGBA").save(P)
print("rack cleaned: specks erased, whites warmed. affected px:", int((w > 0.05).sum()))
