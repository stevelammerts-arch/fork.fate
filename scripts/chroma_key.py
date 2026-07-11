import sys
import numpy as np
from PIL import Image

def key(inp, outp):
    im = Image.open(inp).convert("RGBA")
    a = np.asarray(im).astype(np.int16)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    greenness = g - np.maximum(r, b)
    alpha = a[..., 3].astype(np.float32)
    # full background
    alpha[(greenness > 45) & (g > 80)] = 0
    # soft edge band
    soft = (greenness > 18) & (greenness <= 45)
    alpha[soft] = alpha[soft] * (45 - greenness[soft]) / 27.0
    alpha = alpha.clip(0, 255)
    # despill: clamp green channel on kept pixels
    mx = np.maximum(r, b)
    keep = alpha > 0
    spill = keep & (g > mx)
    g2 = g.copy()
    g2[spill] = mx[spill]
    out = np.stack([r, g2, b, alpha.astype(np.int16)], axis=-1).clip(0, 255).astype(np.uint8)
    im2 = Image.fromarray(out, "RGBA")
    a0 = int((out[..., 3] < 10).sum())
    h, w = out.shape[:2]
    im2.save(outp)
    print("KEYED", outp, "transp%%=%.1f" % (100 * a0 / (w * h)), flush=True)

if __name__ == "__main__":
    pairs = [
        ("/tmp/g_spring.png", "/app/frontend/public/spring-decor.png"),
        ("/tmp/g_summer.png", "/app/frontend/public/summer-decor.png"),
        ("/tmp/g_pump.png", "/app/frontend/public/fall-pumpkins.png"),
        ("/tmp/g_jack.png", "/app/frontend/public/fall-jackolanterns.png"),
    ]
    for i, o in pairs:
        key(i, o)
    print("ALL_KEYED", flush=True)
