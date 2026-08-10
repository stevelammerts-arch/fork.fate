#!/usr/bin/env python3
"""Second rabbit frame: legs gathered under the body (from the leap photo).
The hind legs trailing back-left get rotated down under the rump; slight
body settle. Displayed ~48px wide so seams are invisible."""
from PIL import Image, ImageDraw, ImageFilter

src = Image.open("/app/frontend/public/spring-rabbit.png").convert("RGBA")
W, H = src.size  # 240x122; rabbit faces RIGHT, hind legs trail LEFT

# ---- 1. lift the trailing hind-leg region off the base ----
limb_mask = Image.new("L", (W, H), 0)
md = ImageDraw.Draw(limb_mask)
# trailing legs: everything left of the rump, lower band
md.polygon([(0, 52), (78, 60), (88, 122), (0, 122)], fill=255)
limb_mask = limb_mask.filter(ImageFilter.GaussianBlur(3))

limbs = Image.new("RGBA", (W, H), (0, 0, 0, 0))
limbs.paste(src, (0, 0), limb_mask)

base = src.copy()
# erase limbs from base (soft edge)
erase = Image.new("L", (W, H), 255)
ed = ImageDraw.Draw(erase)
ed.polygon([(0, 58), (70, 66), (80, 122), (0, 122)], fill=0)
erase = erase.filter(ImageFilter.GaussianBlur(4))
r, g, b, a = base.split()
from PIL import ImageChops
a = ImageChops.multiply(a, erase)
base = Image.merge("RGBA", (r, g, b, a))

# ---- 2. rotate limbs to tuck under the rump ----
limbs_rot = limbs.rotate(-42, center=(88, 88), resample=Image.BICUBIC)
# nudge them toward the body and down to the ground line
limbs_rot = ImageChops.offset(limbs_rot, 26, 8)

# ---- 3. compose: tucked legs BEHIND the body, body settled slightly ----
out = Image.new("RGBA", (W, H), (0, 0, 0, 0))
out.alpha_composite(limbs_rot)
# settle: compress the body a touch horizontally (gathered) keeping baseline
body = base.resize((int(W * 0.94), H), Image.LANCZOS)
out.alpha_composite(body, (int(W * 0.06), 0))

# clip anything below the ground line
d = ImageDraw.Draw(out)
d.rectangle([0, 119, W, H], fill=(0, 0, 0, 0))

out.save("/app/frontend/public/spring-rabbit-sit.png")

# preview strip: leap vs sit on grass
strip = Image.new("RGBA", (560, 200), (176, 214, 170, 255))
strip.paste(src.resize((240, 122)), (15, 40), src.resize((240, 122)))
strip.paste(out.resize((240, 122)), (300, 40), out.resize((240, 122)))
strip.save("/tmp/rabbit_frames.png")
print("done")
