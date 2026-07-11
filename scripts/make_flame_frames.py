import numpy as np
from PIL import Image

src = Image.open("/app/frontend/public/tiki-flame.png").convert("RGBA")
arr = np.asarray(src).astype(np.float32)
h, w, _ = arr.shape

BASE_Y = 300.0   # wick top stays fixed
TOP_Y = 40.0

def warp(sway, stretch, curl):
    out = np.zeros_like(arr)
    for y in range(h):
        # normalized height above the wick (0 at base, 1 at tip)
        t = max(0.0, (BASE_Y - y) / (BASE_Y - TOP_Y))
        t = min(1.0, t)
        # horizontal sway grows toward the tip, with an S-curl
        dx = sway * (t ** 1.6) + curl * np.sin(t * 3.14159) * 0.5
        # vertical stretch: sample from a scaled source row (anchored at base)
        sy = BASE_Y - (BASE_Y - y) * stretch
        y0 = int(np.floor(sy))
        if y0 < 0 or y0 >= h - 1:
            continue
        fy = sy - y0
        row = arr[y0] * (1 - fy) + arr[y0 + 1] * fy
        shift = int(round(dx))
        if shift == 0:
            out[y] = row
        elif shift > 0:
            out[y, shift:] = row[:w - shift]
        else:
            out[y, :w + shift] = row[-shift:]
    return Image.fromarray(np.clip(out, 0, 255).astype(np.uint8), "RGBA")

frames = [
    (0.0, 1.00, 0.0),
    (6.0, 1.08, 4.0),
    (-5.0, 0.94, -3.0),
    (3.0, 1.12, -5.0),
    (-7.0, 1.02, 3.0),
]
for i, (s, st, c) in enumerate(frames, 1):
    warp(s, st, c).save(f"/app/frontend/public/tiki-flame-{i}.png")
    print("saved frame", i)
