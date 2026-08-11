#!/usr/bin/env python3
"""Police livery for the cyber pursuit spinner: black/white scheme with unit
number on the front door. Derived from cyber-spinner-suv.png (906x352, faces
RIGHT): body darkened toward black, magenta neon accents shifted to police
blue, white front-door panel (keeps the underlying shading) with the unit
number in black, small POLICE lettering on the rear quarter."""
from PIL import Image, ImageDraw, ImageFont

UNIT = "07"

src = Image.open("/app/frontend/public/cyber-spinner-suv.png").convert("RGBA")
W, H = src.size
px = src.load()

def fx(p): return int(p * W / 100.0)
def fy(p): return int(p * H / 100.0)

# ---- 1. recolor pass: body -> near-black, magenta neon -> police blue ----
for y in range(H):
    for x in range(W):
        r, g, b, a = px[x, y]
        if a == 0:
            continue
        mx, mn = max(r, g, b), min(r, g, b)
        if r > 140 and b > 140 and g < min(r, b) - 30:
            # magenta accent line -> police blue, keep brightness
            lum = (r + b) // 2
            px[x, y] = (int(lum * 0.25), int(lum * 0.55), 255 if lum > 160 else int(lum * 1.1), a)
        elif mx - mn < 46 and mx > 40:
            # neutral gray body/panels -> darken hard toward black
            px[x, y] = (int(r * 0.32), int(g * 0.34), int(b * 0.38), a)

# ---- 2. white front-door panel (keeps shading via luminance blend) ----
panel = Image.new("L", (W, H), 0)
pd = ImageDraw.Draw(panel)
# front door: behind the front wheel arch, below the glass line
pd.polygon([
    (fx(43), fy(37)), (fx(63), fy(37)),
    (fx(64), fy(66)), (fx(60), fy(74)),
    (fx(45), fy(73)), (fx(43), fy(58)),
], fill=255)
pp = panel.load()
for y in range(fy(30), fy(80)):
    for x in range(fx(40), fx(68)):
        m = pp[x, y]
        if not m:
            continue
        r, g, b, a = px[x, y]
        if a < 160:
            continue
        mx, mn = max(r, g, b), min(r, g, b)
        if mx - mn > 60 and g > r:  # keep teal glow lines crossing the door
            continue
        lum = (r * 299 + g * 587 + b * 114) // 1000
        v = min(255, 205 + int(lum * 0.35))  # white with original shading
        px[x, y] = (v, v, min(255, v + 2), a)

# ---- 3. lettering ----
d = ImageDraw.Draw(src)
f_big = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", fy(19))
f_sm = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", fy(9))
# unit number, black on the white door panel
d.text((fx(53), fy(53)), UNIT, font=f_big, fill=(16, 18, 24, 255), anchor="mm")
# POLICE on the rear quarter, white on black
d.text((fx(29), fy(50)), "POLICE", font=f_sm, fill=(235, 240, 248, 255), anchor="mm")

src.save("/app/frontend/public/cyber-police.png")

# preview on dark backdrop
bg = Image.new("RGBA", (W, H), (16, 16, 28, 255))
bg.alpha_composite(src)
bg.convert("RGB").save("/tmp/police_preview.png")
print("saved cyber-police.png", src.size)
