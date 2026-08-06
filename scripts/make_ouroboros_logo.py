"""Build the transparent hoard logo: the approved slim red/gold ouroboros
ring (redgold_ring_raw.png) framing the FF gold medallion, on a fully
transparent canvas. Output: /app/frontend/public/logo-ouroboros.png"""
from PIL import Image, ImageDraw

from mockup_dragon_logo import flood_key

raw = Image.open("/app/scripts/redgold_ring_raw.png")
ring, hole_r, (hx, hy) = flood_key(raw)
bbox = ring.getbbox()
ring = ring.crop(bbox)
hx -= bbox[0]
hy -= bbox[1]

S = 900
canvas = Image.new("RGBA", (S, S), (0, 0, 0, 0))
ring_size = 800
rs = ring.resize((ring_size, int(ring.height * ring_size / ring.width)), Image.LANCZOS)
scale = ring_size / ring.width
hole_px = hole_r * scale * 2

coin_d = int(hole_px * 0.94)
logo = Image.open("/app/frontend/public/logo-crest-gold.png").convert("RGBA")
logo = logo.resize((coin_d, coin_d), Image.LANCZOS)
mask = Image.new("L", (coin_d, coin_d), 0)
ImageDraw.Draw(mask).ellipse([0, 0, coin_d, coin_d], fill=255)
black = Image.new("RGBA", (coin_d, coin_d), (10, 6, 3, 255))

cx, cy = S // 2, S // 2
canvas.paste(black, (cx - coin_d // 2, cy - coin_d // 2), mask)
canvas.alpha_composite(logo, (cx - coin_d // 2, cy - coin_d // 2))
canvas.alpha_composite(rs, (int(cx - hx * scale), int(cy - hy * scale)))
bb = canvas.getbbox()
pad = 8
canvas = canvas.crop((max(0, bb[0] - pad), max(0, bb[1] - pad), min(S, bb[2] + pad), min(S, bb[3] + pad)))
canvas.save("/app/frontend/public/logo-ouroboros.png")
print("saved", canvas.size, "| coin:", coin_d)
