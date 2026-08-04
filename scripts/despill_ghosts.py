"""Remove magenta spill left on translucent edges after keying."""
from PIL import Image

def despill(path):
    im = Image.open(path).convert("RGBA")
    px = im.load()
    w, h = im.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a == 0:
                continue
            # magenta cast: red and blue noticeably above green
            if r > g and b > g:
                spill = min(r - g, b - g)
                r -= spill
                b -= spill
                px[x, y] = (r, g, b, a)
    im.save(path)
    print("despilled", path)

despill("/app/frontend/public/reaper-ghost-1.png")
despill("/app/frontend/public/reaper-ghost-2.png")
