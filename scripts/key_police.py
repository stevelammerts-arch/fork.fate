#!/usr/bin/env python3
"""Key the white background off the generated police cruiser: BFS flood fill
from the image edges over near-white pixels (the enclosed white door panel is
unreachable, so it survives), with a soft alpha ramp at the glow boundaries."""
import sys
from collections import deque
from PIL import Image

src, dst = sys.argv[1], sys.argv[2]
im = Image.open(src).convert("RGBA")
w, h = im.size
px = im.load()

def whiteness(r, g, b):
    return min(r, g, b)

seen = bytearray(w * h)
q = deque()
for x in range(w):
    for y in (0, h - 1):
        if whiteness(*px[x, y][:3]) >= 226 and not seen[y * w + x]:
            seen[y * w + x] = 1; q.append((x, y))
for y in range(h):
    for x in (0, w - 1):
        if whiteness(*px[x, y][:3]) >= 226 and not seen[y * w + x]:
            seen[y * w + x] = 1; q.append((x, y))

while q:
    x, y = q.popleft()
    r, g, b, a = px[x, y]
    wn = whiteness(r, g, b)
    # soft ramp: pure white -> fully clear; pale glow -> partial alpha
    alpha = 0 if wn >= 248 else int((248 - wn) * 255 / 60)
    px[x, y] = (r, g, b, min(a, alpha))
    for nx, ny in ((x-1, y), (x+1, y), (x, y-1), (x, y+1)):
        if 0 <= nx < w and 0 <= ny < h and not seen[ny * w + nx]:
            if whiteness(*px[nx, ny][:3]) >= 226:
                seen[ny * w + nx] = 1
                q.append((nx, ny))

im = im.crop(im.getbbox())
im.save(dst)
print("keyed ->", dst, im.size)
