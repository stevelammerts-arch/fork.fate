from PIL import Image
import numpy as np

try:
    from rembg import remove
    HAVE_REMBG = True
except Exception as e:
    HAVE_REMBG = False
    print("no rembg:", e)

# Canvas + wick placement matching the torch base
CW, CH = 848, 1264
WICK_CX = 424      # horizontal center of the wick
WICK_BASE_Y = 300  # flame should sit its base here
FLAME_TARGET_H = 250  # rendered flame height in canvas px

def isolate(im):
    if HAVE_REMBG:
        out = remove(im)
        return out.convert("RGBA")
    # fallback: color-key (warm pixels kept)
    a = np.asarray(im.convert("RGBA")).astype(np.float32)
    r, g, b = a[:, :, 0], a[:, :, 1], a[:, :, 2]
    warm = np.clip((r - b) / 120.0, 0, 1)
    bright = np.clip((np.maximum(r, g) - 120) / 135.0, 0, 1)
    neutral = 1 - np.clip((np.abs(r - g) + np.abs(g - b)) / 60.0, 0, 1)
    alpha = np.clip((warm + bright * (1 - neutral)) * 255, 0, 255)
    a[:, :, 3] = alpha
    return Image.fromarray(a.astype(np.uint8), "RGBA")

def crop_to_content(im):
    bbox = im.getbbox()
    return im.crop(bbox) if bbox else im

for i in [1, 2, 3, 4]:
    src = Image.open(f"/app/frontend/public/flame_alt_{i}.png").convert("RGBA")
    fl = crop_to_content(isolate(src))
    # scale so flame height == target
    w, h = fl.size
    scale = FLAME_TARGET_H / h
    fl = fl.resize((max(1, int(w * scale)), FLAME_TARGET_H), Image.LANCZOS)
    canvas = Image.new("RGBA", (CW, CH), (0, 0, 0, 0))
    fw, fh = fl.size
    x = WICK_CX - fw // 2
    y = WICK_BASE_Y - fh
    canvas.alpha_composite(fl, (x, max(0, y)))
    canvas.save(f"/app/frontend/public/tiki-flame-gen-{i}.png")
    print("saved gen", i, "flame size", fl.size)
