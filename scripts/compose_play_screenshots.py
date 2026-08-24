"""Compose captioned Play Store screenshots (1080x1920) from raw captures.
Brand background + red serif caption + rounded-corner inset screenshot.
Outputs /app/frontend/public/store-assets/play-shot-N-*.png + a zip.
"""
import os
import zipfile
from PIL import Image, ImageDraw, ImageFilter, ImageFont

RAW = "/app/scripts/play_shots/raw"
OUT = "/app/frontend/public/store-assets"
W, H = 1080, 1920
SERIF = "/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf"
RED = (224, 30, 38)
os.makedirs(OUT, exist_ok=True)

SHOTS = [
    ("1_hero", "play-shot-1-hero", ["Let fate pick", "tonight's table"]),
    ("2_realms", "play-shot-2-realms", ["Choose your realm", "11 immersive worlds"]),
    ("4_reveal", "play-shot-3-reveal", ["Real local spots,", "deals ride along"]),
    ("5_points", "play-shot-4-points", ["Earn Fate Points,", "redeem in town"]),
    ("6_dragon", "play-shot-5-dragon", ["Rare heists &", "living realms"]),
    ("7_fall", "play-shot-6-fall", ["Seasons transform", "the realm"]),
    ("3_guide", "play-shot-7-guide", ["Your field guide", "awaits"]),
    ("8_coffee", "play-shot-8-coffee", ["Or keep it", "light & cozy"]),
]


def brand_bg(w, h):
    bg = Image.new("RGB", (w, h), (12, 12, 13))
    glow = Image.new("L", (w, h), 0)
    d = ImageDraw.Draw(glow)
    r = int(min(w, h) * 0.5)
    cx, cy = w // 2, int(h * 0.62)
    d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=60)
    glow = glow.filter(ImageFilter.GaussianBlur(min(w, h) // 6))
    red = Image.new("RGB", (w, h), (120, 15, 20))
    return Image.composite(red, bg, glow)


def rounded(img, radius):
    mask = Image.new("L", img.size, 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, img.size[0] - 1, img.size[1] - 1], radius, fill=255)
    out = img.convert("RGBA")
    out.putalpha(mask)
    return out


font = ImageFont.truetype(SERIF, 78)

for raw_name, out_name, lines in SHOTS:
    src = Image.open(f"{RAW}/{raw_name}.png").convert("RGB")
    canvas = brand_bg(W, H)
    d = ImageDraw.Draw(canvas)
    # caption: two centered lines starting y=96
    y = 96
    for line in lines:
        tw = d.textlength(line, font=font)
        x = (W - tw) / 2
        d.text((x + 3, y + 3), line, font=font, fill=(0, 0, 0))  # shadow
        d.text((x, y), line, font=font, fill=RED)
        y += 96
    # screenshot inset: fit below caption with margins
    inset_h = H - (y + 42) - 56
    inset_w = int(src.width * inset_h / src.height)
    if inset_w > W - 96:
        inset_w = W - 96
        inset_h = int(src.height * inset_w / src.width)
    shot = src.resize((inset_w, inset_h), Image.LANCZOS)
    shot = rounded(shot, 42)
    sx, sy = (W - inset_w) // 2, y + 42
    # soft red glow behind the inset
    glow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    ImageDraw.Draw(glow).rounded_rectangle(
        [sx - 10, sy - 10, sx + inset_w + 10, sy + inset_h + 10], 48, fill=(224, 30, 38, 110))
    glow = glow.filter(ImageFilter.GaussianBlur(26))
    canvas = Image.alpha_composite(canvas.convert("RGBA"), glow)
    canvas.alpha_composite(shot, (sx, sy))
    ImageDraw.Draw(canvas).rounded_rectangle(
        [sx, sy, sx + inset_w - 1, sy + inset_h - 1], 42, outline=(58, 58, 60), width=3)
    canvas.convert("RGB").save(f"{OUT}/{out_name}.png", optimize=True)
    print("composed", out_name)

zp = f"{OUT}/forkfate-play-screenshots-1080x1920.zip"
with zipfile.ZipFile(zp, "w", zipfile.ZIP_DEFLATED) as z:
    for _, out_name, _ in SHOTS:
        z.write(f"{OUT}/{out_name}.png", f"{out_name}.png")
print("zip:", zp, os.path.getsize(zp))
