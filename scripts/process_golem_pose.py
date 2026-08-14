"""Shared post-processing for golem pose sprites: key white bg from edges,
shadow-fill bright enclosed patches + enclosed transparent holes, normalize
to the base sprite's 696x1180 canvas (content scaled to full height, centered)."""
import sys
from collections import deque

from PIL import Image


def process(src, dst):
    im = Image.open(src).convert('RGBA')
    w, h = im.size
    px = im.load()

    def bgish(p, tol=200, chroma=26):
        r, g, b, a = p
        return a > 0 and r > tol and g > tol and b > tol and (max(r, g, b) - min(r, g, b)) < chroma

    seen = set(); q = deque()
    for x in range(w):
        for y in (0, h - 1):
            if bgish(px[x, y]): q.append((x, y)); seen.add((x, y))
    for y in range(h):
        for x in (0, w - 1):
            if bgish(px[x, y]) and (x, y) not in seen: q.append((x, y)); seen.add((x, y))
    while q:
        cx, cy = q.popleft()
        for nx, ny in ((cx + 1, cy), (cx - 1, cy), (cx, cy + 1), (cx, cy - 1)):
            if 0 <= nx < w and 0 <= ny < h and (nx, ny) not in seen and bgish(px[nx, ny], 196, 30):
                seen.add((nx, ny)); q.append((nx, ny))
    for (x, y) in seen: px[x, y] = (0, 0, 0, 0)

    def bright(p): return p[3] > 0 and p[0] > 224 and p[1] > 224 and p[2] > 224 and max(p[:3]) - min(p[:3]) < 28
    seen2 = set(); rm = set()
    for y in range(h):
        for x in range(w):
            if (x, y) in seen2 or not bright(px[x, y]): continue
            q = deque([(x, y)]); seen2.add((x, y)); pts = []
            while q:
                cx, cy = q.popleft(); pts.append((cx, cy))
                for nx, ny in ((cx + 1, cy), (cx - 1, cy), (cx, cy + 1), (cx, cy - 1)):
                    if 0 <= nx < w and 0 <= ny < h and (nx, ny) not in seen2 and bright(px[nx, ny]):
                        seen2.add((nx, ny)); q.append((nx, ny))
            if len(pts) > 40: rm.update(pts)
    for (x, y) in rm: px[x, y] = (13, 10, 7, 255)

    outer = set(); q = deque()
    for x in range(w):
        for y in (0, h - 1):
            if px[x, y][3] == 0 and (x, y) not in outer: outer.add((x, y)); q.append((x, y))
    for y in range(h):
        for x in (0, w - 1):
            if px[x, y][3] == 0 and (x, y) not in outer: outer.add((x, y)); q.append((x, y))
    while q:
        cx, cy = q.popleft()
        for nx, ny in ((cx + 1, cy), (cx - 1, cy), (cx, cy + 1), (cx, cy - 1)):
            if 0 <= nx < w and 0 <= ny < h and (nx, ny) not in outer and px[nx, ny][3] == 0:
                outer.add((nx, ny)); q.append((nx, ny))
    for y in range(h):
        for x in range(w):
            if px[x, y][3] == 0 and (x, y) not in outer: px[x, y] = (13, 10, 7, 255)

    im = im.crop(im.getbbox())
    scale = 1180 / im.height
    im = im.resize((int(im.width * scale), 1180), Image.LANCZOS)
    canvas = Image.new('RGBA', (696, 1180), (0, 0, 0, 0))
    canvas.alpha_composite(im, ((696 - im.width) // 2, 0))
    canvas.save(dst)
    print("saved", dst, im.size)


if __name__ == "__main__":
    process(sys.argv[1], sys.argv[2])
