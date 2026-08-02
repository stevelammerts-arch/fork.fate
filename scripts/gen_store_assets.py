"""Generate store listing assets from the Fork·Fate crest.

Outputs to /app/frontend/public/store-assets/ :
  - appstore-icon-1024.png   (1024x1024, OPAQUE — Apple rejects alpha)
  - play-icon-512.png        (512x512, opaque)
  - play-feature-1024x500.png (Google Play feature graphic)
"""
import os
from PIL import Image, ImageDraw, ImageFont, ImageFilter

SRC = "/app/frontend/public/logo-crest.png"
OUT = "/app/frontend/public/store-assets"
os.makedirs(OUT, exist_ok=True)

crest = Image.open(SRC).convert("RGBA")


def brand_bg(w, h):
    """Near-black canvas with a soft red radial glow behind center."""
    bg = Image.new("RGB", (w, h), (12, 12, 13))
    glow = Image.new("L", (w, h), 0)
    d = ImageDraw.Draw(glow)
    r = int(min(w, h) * 0.42)
    cx, cy = w // 2, h // 2
    d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=70)
    glow = glow.filter(ImageFilter.GaussianBlur(min(w, h) // 7))
    red = Image.new("RGB", (w, h), (150, 18, 24))
    bg = Image.composite(red, bg, glow)
    return bg


def icon(size, crest_frac=0.82):
    img = brand_bg(size, size)
    cs = int(size * crest_frac)
    c = crest.resize((cs, cs), Image.LANCZOS)
    img.paste(c, ((size - cs) // 2, (size - cs) // 2), c)
    return img


icon(1024).save(f"{OUT}/appstore-icon-1024.png")
icon(512).save(f"{OUT}/play-icon-512.png")

# Feature graphic: crest left, wordmark + tagline right.
fg = brand_bg(1024, 500)
cs = 360
c = crest.resize((cs, cs), Image.LANCZOS)
fg.paste(c, (95, (500 - cs) // 2), c)
d = ImageDraw.Draw(fg)
try:
    title_f = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf", 92)
    tag_f = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 34)
except OSError:
    title_f = tag_f = ImageFont.load_default()
d.text((510, 168), "Fork·Fate", font=title_f, fill=(255, 255, 255))
d.text((514, 292), "Let fate pick your next meal.", font=tag_f, fill=(220, 190, 190))
fg.save(f"{OUT}/play-feature-1024x500.png")

for f in sorted(os.listdir(OUT)):
    p = os.path.join(OUT, f)
    print(f, Image.open(p).size, f"{os.path.getsize(p)//1024}KB")
