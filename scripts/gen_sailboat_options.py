#!/usr/bin/env python3
"""Three sailboat sprite options for the summer ocean, previewed side by side."""
from PIL import Image, ImageDraw, ImageFilter

S = 4
W, H = 130 * S, 150 * S

def px(v):
    return v * S

def base_canvas():
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    return img, ImageDraw.Draw(img)

def hull(d, top_col, shade_col, stripe_col):
    hull_top, hull_bot = px(112), px(132)
    d.polygon([(px(14), hull_top + px(3)), (px(104), hull_top), (px(124), hull_top - px(4)),
               (px(112), hull_bot - px(2)), (px(30), hull_bot), (px(20), hull_bot - px(3))], fill=top_col)
    d.polygon([(px(16), hull_bot - px(9)), (px(116), hull_bot - px(11)),
               (px(112), hull_bot - px(2)), (px(30), hull_bot), (px(20), hull_bot - px(3))], fill=shade_col)
    d.line([(px(15), hull_bot - px(5)), (px(115), hull_bot - px(7))], fill=stripe_col, width=px(3))

def mast_and_stays(d, col=(94, 74, 56, 255)):
    d.line([(px(62), px(10)), (px(62), px(114))], fill=col, width=px(2))
    d.line([(px(62), px(10)), (px(122), px(107))], fill=(150, 140, 122, 200), width=S)
    d.line([(px(62), px(10)), (px(18), px(115))], fill=(150, 140, 122, 170), width=S)

def reflection(img):
    refl = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    rd = ImageDraw.Draw(refl)
    rd.polygon([(px(24), px(132)), (px(110), px(132)), (px(100), px(141)), (px(34), px(141))],
               fill=(240, 238, 230, 70))
    return Image.alpha_composite(img, refl.filter(ImageFilter.GaussianBlur(px(2))))

def pennant(d, col):
    d.polygon([(px(62), px(6)), (px(73), px(9)), (px(62), px(12))], fill=col)

# ── Option A: classic white sloop (current) ─────────────────────────────────
def boat_a():
    img, d = base_canvas()
    hull(d, (246, 243, 235, 255), (216, 210, 196, 255), (31, 58, 88, 255))
    mast_and_stays(d)
    d.polygon([(px(60), px(14)), (px(60), px(106)), (px(16), px(106))], fill=(252, 250, 244, 255))
    d.polygon([(px(60), px(40)), (px(60), px(106)), (px(28), px(106))], fill=(238, 233, 220, 255))
    for fy in (0.35, 0.6, 0.82):
        y = px(14) + (px(106) - px(14)) * fy
        x0 = px(16) + (px(60) - px(16)) * (1 - fy) * 0.92
        d.line([(x0, y), (px(60), y - px(2))], fill=(222, 216, 200, 255), width=S)
    d.polygon([(px(64), px(20)), (px(118), px(108)), (px(64), px(110))], fill=(248, 244, 234, 255))
    pennant(d, (198, 44, 44, 255))
    return reflection(img)

# ── Option B: vintage gaff cutter — wooden hull, warm tanbark sails ─────────
def boat_b():
    img, d = base_canvas()
    hull(d, (146, 96, 58, 255), (108, 68, 40, 255), (240, 232, 214, 255))
    mast_and_stays(d, (74, 52, 36, 255))
    # gaff mainsail: four-sided, warm rust canvas
    d.polygon([(px(60), px(30)), (px(38), px(16)), (px(14), px(104)), (px(60), px(106))], fill=(178, 96, 66, 255))
    d.polygon([(px(60), px(62)), (px(24), px(104)), (px(60), px(106))], fill=(158, 82, 56, 255))
    for fy in (0.4, 0.66, 0.86):
        y = px(24) + (px(106) - px(24)) * fy
        d.line([(px(15) + px(8) * (1 - fy), y), (px(60), y - px(2))], fill=(140, 72, 48, 255), width=S)
    # gaff spar
    d.line([(px(60), px(30)), (px(38), px(16))], fill=(74, 52, 36, 255), width=px(2))
    # jib in cream
    d.polygon([(px(64), px(26)), (px(118), px(108)), (px(64), px(110))], fill=(236, 222, 196, 255))
    pennant(d, (222, 168, 62, 255))
    return reflection(img)

# ── Option C: sporty racer — navy hull, tall white main + blue spinnaker ────
def boat_c():
    img, d = base_canvas()
    hull(d, (28, 54, 92, 255), (18, 38, 66, 255), (236, 240, 244, 255))
    mast_and_stays(d, (120, 126, 134, 255))
    # tall crisp main with subtle grey panels
    d.polygon([(px(60), px(8)), (px(60), px(106)), (px(20), px(106))], fill=(250, 251, 253, 255))
    for fy in (0.3, 0.55, 0.78):
        y = px(8) + (px(106) - px(8)) * fy
        x0 = px(20) + (px(60) - px(20)) * (1 - fy) * 0.92
        d.line([(x0, y), (px(60), y - px(2))], fill=(214, 222, 232, 255), width=S)
    # blue genoa with a white slash
    d.polygon([(px(64), px(16)), (px(120), px(106)), (px(64), px(110))], fill=(58, 128, 196, 255))
    d.polygon([(px(64), px(52)), (px(96), px(102)), (px(64), px(96))], fill=(120, 178, 230, 255))
    pennant(d, (236, 240, 244, 255))
    return reflection(img)

boats = {"a": boat_a(), "b": boat_b(), "c": boat_c()}
for k, im in boats.items():
    im.resize((130, 150), Image.LANCZOS).save(f"/tmp/sailboat_{k}.png")

# preview strip on ocean blue, boats at ~2x display size for visibility
strip = Image.new("RGBA", (720, 300), (60, 140, 200, 255))
dd = ImageDraw.Draw(strip)
dd.rectangle([0, 210, 720, 300], fill=(44, 110, 168, 255))
labels = {"a": "A  classic white sloop", "b": "B  vintage tanbark cutter", "c": "C  sporty navy racer"}
for i, k in enumerate("abc"):
    small = boats[k].resize((156, 180), Image.LANCZOS)
    strip.paste(small, (40 + i * 230, 55), small)
    dd.text((45 + i * 230, 262), labels[k], fill=(255, 255, 255, 255))
strip.save("/tmp/sailboat_options.png")
print("done")
