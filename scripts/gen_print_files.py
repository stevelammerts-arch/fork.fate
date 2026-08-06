"""Generate print-ready PNG files for the Fork·Fate merch shirts.

Outputs to /app/print_files/ at 300 DPI, transparent backgrounds, sized to
Printful's standard chest print (12" x 14" = 3600x4200 px) and full-back print
(14" x 18" = 4200x5400 px) areas. Also includes tiny left-chest badge files
(3" x 3" = 900x900 px).

Everything is composited from the app's original source assets so the print art
matches what shows in the app's spring/fall theme scenes exactly.
"""
import random
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFont

PUB = Path("/app/frontend/public")
OUT = Path("/app/print_files")
OUT.mkdir(exist_ok=True)

DPI = 300
CHEST_W, CHEST_H = 12 * DPI, 14 * DPI       # 3600 x 4200
BACK_W, BACK_H = 14 * DPI, 18 * DPI          # 4200 x 5400
BADGE_W, BADGE_H = 3 * DPI, 3 * DPI          # 900 x 900

SERIF = "/usr/share/fonts/truetype/liberation/LiberationSerif-Italic.ttf"


def load(name):
    return Image.open(PUB / name).convert("RGBA")


def scale_to_width(im, w):
    """Preserve aspect ratio, scale to given width."""
    r = w / im.width
    return im.resize((w, int(im.height * r)), Image.LANCZOS)


def scale_to_height(im, h):
    r = h / im.height
    return im.resize((int(im.width * r), h), Image.LANCZOS)


def rotate(im, deg):
    return im.rotate(deg, resample=Image.BICUBIC, expand=True)


def paste(canvas, layer, x, y):
    canvas.alpha_composite(layer, dest=(x, y))


def wordmark(text, w, color, height_ratio=0.11):
    """Render 'Fork·Fate' style italic-serif wordmark at a target width."""
    # We iterate font size to fit target width. Height_ratio = wordmark height / target width.
    h_target = int(w * height_ratio)
    font_size = h_target
    for _ in range(6):
        font = ImageFont.truetype(SERIF, font_size)
        bbox = font.getbbox(text)
        tw = bbox[2] - bbox[0]
        if tw <= w * 0.92:
            font_size = int(font_size * (w * 0.85 / max(tw, 1)))
        else:
            font_size = int(font_size * 0.9)
    font = ImageFont.truetype(SERIF, font_size)
    bbox = font.getbbox(text)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    txt = Image.new("RGBA", (int(tw * 1.05), int(th * 1.6)), (0, 0, 0, 0))
    d = ImageDraw.Draw(txt)
    d.text((-bbox[0], -bbox[1] + int(th * 0.15)), text, font=font, fill=color)
    return txt


def add_ground_alpha(im, fade_top=0.35):
    """Ground assets are opaque; give the top edge a soft alpha fade so they
    blend into transparent canvas naturally."""
    arr = np.asarray(im.convert("RGBA")).astype(np.float32).copy()
    h = arr.shape[0]
    fade_h = int(h * fade_top)
    ramp = np.linspace(0, 1, fade_h) ** 1.5
    arr[:fade_h, :, 3] = arr[:fade_h, :, 3] * ramp[:, None]
    return Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8), "RGBA")


# ---------------------------------------------------------------------------
# 1) SPRING PETALS — chest print, scattered petals + wordmark
# ---------------------------------------------------------------------------
def spring_petals_chest():
    canvas = Image.new("RGBA", (CHEST_W, CHEST_H), (0, 0, 0, 0))
    rng = random.Random(3)

    # Wordmark near top
    mark = wordmark("Fork·Fate", int(CHEST_W * 0.62), (185, 90, 120, 255), height_ratio=0.18)
    paste(canvas, mark, (CHEST_W - mark.width) // 2, int(CHEST_H * 0.05))

    # Petal cascade — 25 blossoms/petals drifting diagonally
    petal_files = ["blossom-pink.png", "blossom-white.png", "petal-coral.png"]
    petals = [load(f) for f in petal_files]

    # Place along diagonal band
    for i in range(28):
        p = rng.choice(petals).copy()
        size = rng.randint(int(CHEST_W * 0.08), int(CHEST_W * 0.22))
        p = p.resize((size, int(p.height * size / p.width)), Image.LANCZOS)
        p = rotate(p, rng.uniform(-30, 30))
        # Diagonal drift: x goes right, y goes down
        t = i / 27.0
        x = int(CHEST_W * 0.15 + t * CHEST_W * 0.55 + rng.uniform(-CHEST_W * 0.08, CHEST_W * 0.08)) - size // 2
        y = int(CHEST_H * 0.22 + t * CHEST_H * 0.70 + rng.uniform(-CHEST_H * 0.05, CHEST_H * 0.05)) - size // 2
        paste(canvas, p, x, y)

    canvas.save(OUT / "01-spring-petals-CHEST-12x14.png", optimize=True, dpi=(DPI, DPI))
    print(f"  wrote {OUT / '01-spring-petals-CHEST-12x14.png'}")


# ---------------------------------------------------------------------------
# 2) SPRING BLOSSOM TREE — chest print, tree + wordmark
# ---------------------------------------------------------------------------
def spring_tree_chest():
    canvas = Image.new("RGBA", (CHEST_W, CHEST_H), (0, 0, 0, 0))

    mark = wordmark("Fork·Fate", int(CHEST_W * 0.55), (185, 90, 120, 255), height_ratio=0.19)
    paste(canvas, mark, (CHEST_W - mark.width) // 2, int(CHEST_H * 0.03))

    # Tree fills most of the chest print below the wordmark
    tree = load("spring-tree.png")
    tree_h = int(CHEST_H * 0.85)
    tree = scale_to_height(tree, tree_h)
    if tree.width > CHEST_W * 0.95:
        tree = scale_to_width(tree, int(CHEST_W * 0.95))
    x = (CHEST_W - tree.width) // 2
    y = int(CHEST_H * 0.15)
    paste(canvas, tree, x, y)

    canvas.save(OUT / "02-spring-tree-CHEST-12x14.png", optimize=True, dpi=(DPI, DPI))
    print(f"  wrote {OUT / '02-spring-tree-CHEST-12x14.png'}")


# ---------------------------------------------------------------------------
# 3) SPRING FULL SCENE — back print, tree + muted pagoda + ground + petals
# ---------------------------------------------------------------------------
def spring_scene_back():
    canvas = Image.new("RGBA", (BACK_W, BACK_H), (0, 0, 0, 0))
    rng = random.Random(11)

    # Ground fades in at the bottom
    ground = add_ground_alpha(load("spring-ground2.png"), fade_top=0.55)
    ground = scale_to_width(ground, BACK_W)
    paste(canvas, ground, 0, BACK_H - ground.height)

    # Pagoda (already muted from the color-shift work earlier) — left side, mid-lower
    pagoda = load("spring-decor.png")
    pagoda_w = int(BACK_W * 0.55)
    pagoda = scale_to_width(pagoda, pagoda_w)
    px, py = int(BACK_W * 0.02), int(BACK_H * 0.32)
    paste(canvas, pagoda, px, py)

    # Tree — right side, rising to fill upper right
    tree = load("spring-tree.png")
    tree_h = int(BACK_H * 0.85)
    tree = scale_to_height(tree, tree_h)
    tx = BACK_W - tree.width + int(BACK_W * 0.05)
    ty = int(BACK_H * 0.05)
    paste(canvas, tree, tx, ty)

    # Drifting petals — 12 scattered around the upper 2/3
    petal_files = ["blossom-pink.png", "blossom-white.png", "petal-coral.png"]
    petals = [load(f) for f in petal_files]
    for _ in range(14):
        p = rng.choice(petals).copy()
        size = rng.randint(int(BACK_W * 0.05), int(BACK_W * 0.11))
        p = p.resize((size, int(p.height * size / p.width)), Image.LANCZOS)
        p = rotate(p, rng.uniform(-40, 40))
        x = rng.randint(int(BACK_W * 0.05), int(BACK_W * 0.85))
        y = rng.randint(int(BACK_H * 0.15), int(BACK_H * 0.75))
        paste(canvas, p, x - size // 2, y - size // 2)

    canvas.save(OUT / "03-spring-scene-BACK-14x18.png", optimize=True, dpi=(DPI, DPI))
    print(f"  wrote {OUT / '03-spring-scene-BACK-14x18.png'}")


# ---------------------------------------------------------------------------
# 4) FALL FULL SCENE — back print, tree + scarecrow + pumpkins + owl + moon + leaves
# ---------------------------------------------------------------------------
def fall_scene_back():
    canvas = Image.new("RGBA", (BACK_W, BACK_H), (0, 0, 0, 0))
    rng = random.Random(23)

    # Soft moon in upper-left — simple pale disc with warm edge glow.
    # Note: moon is drawn AFTER leaves at the end of this function so no leaf
    # ever draws on top of it.
    moon_r = int(BACK_W * 0.10)
    moon_center = (int(BACK_W * 0.05) + moon_r * 3 // 2, int(BACK_H * 0.05) + moon_r * 3 // 2)
    moon = Image.new("RGBA", (moon_r * 3, moon_r * 3), (0, 0, 0, 0))
    md = ImageDraw.Draw(moon)
    # Halo
    for i in range(24, 0, -1):
        alpha = int(6 + i * 4)
        rr = moon_r + i * 6
        md.ellipse(
            [moon.width // 2 - rr, moon.height // 2 - rr, moon.width // 2 + rr, moon.height // 2 + rr],
            fill=(255, 230, 180, alpha),
        )
    md.ellipse(
        [moon.width // 2 - moon_r, moon.height // 2 - moon_r, moon.width // 2 + moon_r, moon.height // 2 + moon_r],
        fill=(255, 245, 220, 250),
    )
    # (moon will be pasted AFTER falling leaves below — see end of function)

    # Ground
    ground = add_ground_alpha(load("fall-ground.png"), fade_top=0.55)
    ground = scale_to_width(ground, BACK_W)
    paste(canvas, ground, 0, BACK_H - ground.height)

    # Fall tree — right side, tall
    tree = load("fall-tree.png")
    tree_h = int(BACK_H * 0.88)
    tree = scale_to_height(tree, tree_h)
    tx = BACK_W - tree.width + int(BACK_W * 0.04)
    ty = int(BACK_H * 0.05)
    paste(canvas, tree, tx, ty)

    # Owl on a branch (small, tucked in tree)
    owl = load("fall-owl.png")
    owl_w = int(BACK_W * 0.12)
    owl = scale_to_width(owl, owl_w)
    paste(canvas, owl, int(BACK_W * 0.62), int(BACK_H * 0.28))

    # Scarecrow — bottom-left, stands tall
    scare = load("fall-scarecrow.png")
    scare_h = int(BACK_H * 0.48)
    scare = scale_to_height(scare, scare_h)
    sx = int(BACK_W * 0.06)
    sy = BACK_H - scare.height - int(BACK_H * 0.10)
    paste(canvas, scare, sx, sy)

    # Jack-o-lanterns — bottom-center cluster
    pumpkins = load("fall-jackolanterns.png")
    p_w = int(BACK_W * 0.42)
    pumpkins = scale_to_width(pumpkins, p_w)
    paste(canvas, pumpkins, int(BACK_W * 0.30), BACK_H - pumpkins.height - int(BACK_H * 0.06))

    # Falling leaves — 16 across the upper 2/3
    leaf_files = ["leaf-red.png", "leaf-orange.png", "leaf-yellow.png", "leaf-brown.png"]
    leaves = [load(f) for f in leaf_files]
    for _ in range(18):
        L = rng.choice(leaves).copy()
        size = rng.randint(int(BACK_W * 0.05), int(BACK_W * 0.10))
        L = L.resize((size, int(L.height * size / L.width)), Image.LANCZOS)
        L = rotate(L, rng.uniform(-50, 50))
        # Never place a leaf where the moon lives (upper-left ~14% of width)
        while True:
            x = rng.randint(int(BACK_W * 0.10), int(BACK_W * 0.80))
            y = rng.randint(int(BACK_H * 0.10), int(BACK_H * 0.65))
            dx = x - moon_center[0]
            dy = y - moon_center[1]
            if (dx * dx + dy * dy) ** 0.5 > moon_r * 1.6:
                break
        paste(canvas, L, x - size // 2, y - size // 2)

    # Moon draws LAST so no leaf ever lands on top of it
    paste(canvas, moon, int(BACK_W * 0.05), int(BACK_H * 0.05))

    canvas.save(OUT / "04-fall-scene-BACK-14x18.png", optimize=True, dpi=(DPI, DPI))
    print(f"  wrote {OUT / '04-fall-scene-BACK-14x18.png'}")


# ---------------------------------------------------------------------------
# 5) FEMININE FF BADGE (spring) — 3x3 left chest
# ---------------------------------------------------------------------------
def feminine_ff_badge():
    """Recolor the classic FF button into a feminine rose/rose-gold palette by
    shifting red pixels toward blush and lifting the black bezel toward rose-gold.
    Uses direct RGB replacement (not brightness-scaled) so the shift is visible."""
    src = load("logo-mark.png")
    arr = np.asarray(src).astype(np.float32).copy()
    r, g, b, a = arr[..., 0], arr[..., 1], arr[..., 2], arr[..., 3]
    opaque = a > 20

    # Interior red pixels: red dominates, greens/blues low but not near-black.
    red_mask = opaque & (r > 40) & (r > g + 15) & (r > b + 15) & ~((r < 60) & (g < 60) & (b < 60))
    # Target: blush rose #EEB1C0 (238, 177, 192). Direct blend 88% target.
    # Preserve highlights: pixels where original r > 180 get slightly lighter target.
    hi = (r > 180).astype(np.float32)
    tgt_r = 238.0 + hi * 12.0
    tgt_g = 177.0 + hi * 30.0
    tgt_b = 192.0 + hi * 20.0
    blend = 0.88
    r = np.where(red_mask, tgt_r * blend + r * (1 - blend), r)
    g = np.where(red_mask, tgt_g * blend + g * (1 - blend), g)
    b = np.where(red_mask, tgt_b * blend + b * (1 - blend), b)

    # Black bezel → rose-gold (#C89A82)
    dark_mask = opaque & (r < 65) & (g < 65) & (b < 65)
    lift = 0.80
    r = np.where(dark_mask, r * (1 - lift) + 200.0 * lift, r)
    g = np.where(dark_mask, g * (1 - lift) + 154.0 * lift, g)
    b = np.where(dark_mask, b * (1 - lift) + 130.0 * lift, b)

    arr[..., 0] = np.clip(r, 0, 255)
    arr[..., 1] = np.clip(g, 0, 255)
    arr[..., 2] = np.clip(b, 0, 255)
    out = Image.fromarray(arr.astype(np.uint8), "RGBA").resize((BADGE_W, BADGE_H), Image.LANCZOS)
    out.save(OUT / "05-spring-FF-badge-CHEST-3x3.png", optimize=True, dpi=(DPI, DPI))
    print(f"  wrote {OUT / '05-spring-FF-badge-CHEST-3x3.png'}")


# ---------------------------------------------------------------------------
# 6) CLASSIC FF BADGE (fall) — 3x3 left chest, as-is
# ---------------------------------------------------------------------------
def classic_ff_badge():
    out = load("logo-mark.png").resize((BADGE_W, BADGE_H), Image.LANCZOS)
    out.save(OUT / "06-fall-FF-badge-CHEST-3x3.png", optimize=True, dpi=(DPI, DPI))
    print(f"  wrote {OUT / '06-fall-FF-badge-CHEST-3x3.png'}")


def main():
    print("Generating Fork·Fate print-ready files (300 DPI, transparent bg)...")
    spring_petals_chest()
    spring_tree_chest()
    spring_scene_back()
    fall_scene_back()
    feminine_ff_badge()
    classic_ff_badge()
    print(f"\nDone. Files at: {OUT}/")
    print("\nUpload to Printful:")
    print("  - Files ending in -CHEST-12x14.png -> Front / Chest print position")
    print("  - Files ending in -CHEST-3x3.png   -> Left chest print position (small)")
    print("  - Files ending in -BACK-14x18.png  -> Back print position")


if __name__ == "__main__":
    main()
