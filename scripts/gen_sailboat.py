#!/usr/bin/env python3
"""Tiny realistic sailboat sprite for the summer ocean (drawn 4x, downscaled
for crisp anti-aliased edges). Faces RIGHT; CSS flips it on the return tack."""
from PIL import Image, ImageDraw, ImageFilter

S = 4  # supersample
W, H = 130 * S, 150 * S
img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
d = ImageDraw.Draw(img)

def px(v):
    return v * S

# ---- hull: white cruiser hull with sheer curve + dark waterline stripe ----
hull_top = px(112)
hull_bot = px(132)
# gentle sheer: bow (right) rides a touch higher
hull = [
    (px(14), hull_top + px(3)),   # stern top
    (px(104), hull_top),          # midship
    (px(124), hull_top - px(4)),  # bow tip (raked)
    (px(112), hull_bot - px(2)),  # bow underside
    (px(30), hull_bot),           # keel run
    (px(20), hull_bot - px(3)),   # stern underside
]
d.polygon(hull, fill=(246, 243, 235, 255))
# hull shading (lower third)
d.polygon([(px(16), hull_bot - px(9)), (px(116), hull_bot - px(11)),
           (px(112), hull_bot - px(2)), (px(30), hull_bot), (px(20), hull_bot - px(3))],
          fill=(216, 210, 196, 255))
# waterline boot stripe
d.line([(px(15), hull_bot - px(5)), (px(115), hull_bot - px(7))], fill=(31, 58, 88, 255), width=px(3))
# sheer accent
d.line([(px(14), hull_top + px(3)), (px(124), hull_top - px(4))], fill=(196, 188, 170, 255), width=S)

# ---- mast ----
mast_x = px(62)
d.line([(mast_x, px(10)), (mast_x, hull_top + px(2))], fill=(94, 74, 56, 255), width=px(2))

# ---- mainsail (behind mast, triangular with slight belly) ----
main = [
    (mast_x - px(2), px(14)),
    (mast_x - px(2), px(106)),
    (px(16), px(106)),
]
d.polygon(main, fill=(252, 250, 244, 255))
# belly shading + seams
d.polygon([(mast_x - px(2), px(40)), (mast_x - px(2), px(106)), (px(28), px(106))],
          fill=(238, 233, 220, 255))
for fy in (0.35, 0.6, 0.82):
    y = px(14) + (px(106) - px(14)) * fy
    x0 = px(16) + (mast_x - px(2) - px(16)) * (1 - fy) * 0.92
    d.line([(x0, y), (mast_x - px(2), y - px(2))], fill=(222, 216, 200, 255), width=S)

# ---- jib (foresail, ahead of mast to the bow) ----
jib = [
    (mast_x + px(2), px(20)),
    (px(118), hull_top - px(4)),
    (mast_x + px(2), hull_top - px(2)),
]
d.polygon(jib, fill=(248, 244, 234, 255))
d.line([(mast_x + px(2), px(20)), (px(118), hull_top - px(4))], fill=(228, 222, 206, 255), width=S)

# forestay above the jib
d.line([(mast_x, px(10)), (px(122), hull_top - px(5))], fill=(150, 140, 122, 200), width=S)
# backstay
d.line([(mast_x, px(10)), (px(18), hull_top + px(2))], fill=(150, 140, 122, 170), width=S)

# ---- tiny pennant at the masthead ----
d.polygon([(mast_x, px(6)), (mast_x + px(11), px(9)), (mast_x, px(12))], fill=(198, 44, 44, 255))

# soft hull reflection hint below the waterline
refl = Image.new("RGBA", (W, H), (0, 0, 0, 0))
rd = ImageDraw.Draw(refl)
rd.polygon([(px(24), hull_bot), (px(110), hull_bot), (px(100), hull_bot + px(9)), (px(34), hull_bot + px(9))],
           fill=(240, 238, 230, 70))
refl = refl.filter(ImageFilter.GaussianBlur(px(2)))
img = Image.alpha_composite(img, refl)

img = img.resize((130, 150), Image.LANCZOS)
img.save("/app/frontend/public/summer-sailboat.png")
print("saved", img.size)
