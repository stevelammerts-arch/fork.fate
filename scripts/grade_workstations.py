# Color-grade the valve pedestal + alchemy bench to sit in the steampunk room:
# push cool/gray steel toward the room's warm bronze-brown (room avg ~ 55,40,26),
# via a luminance-driven warm duotone blended over the original.
import numpy as np
from PIL import Image

SHADOW = np.array([26.0, 18.0, 11.0])     # deep room brown
HIGHLIGHT = np.array([214.0, 168.0, 106.0])  # warm bronze tan
BLEND = 0.42  # how strongly to pull toward the room palette

for name in ["steam-valve-pedestal", "steam-alchemy-bench"]:
    im = Image.open(f"/app/frontend/public/{name}.png").convert("RGBA")
    a = np.asarray(im).astype(np.float64)
    rgb, alpha = a[..., :3], a[..., 3:]
    lum = (0.299 * rgb[..., 0] + 0.587 * rgb[..., 1] + 0.114 * rgb[..., 2]) / 255.0
    duo = SHADOW[None, None, :] + lum[..., None] * (HIGHLIGHT - SHADOW)[None, None, :]
    out = rgb * (1 - BLEND) + duo * BLEND
    out *= 0.96  # settle slightly darker into the scene
    out = np.clip(out, 0, 255)
    res = np.concatenate([out, alpha], axis=-1).astype(np.uint8)
    Image.fromarray(res, "RGBA").save(f"/app/frontend/public/{name}.png")
    print(name, "graded")
