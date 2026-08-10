# Fix spring-ground2.png: the AI generator baked the transparency
# checkerboard (opaque white/#E9E9E9 squares) into the sky half of the
# meadow art. Flood-fill from the top edge across near-neutral light pixels
# (the checker + white sky glow) and make them truly transparent, stopping
# at the green watercolor grass. Petals INSIDE the grass are untouched
# because they don't connect to the top region.
from collections import deque
from PIL import Image

PATH = "/app/frontend/public/spring-ground2.png"
im = Image.open(PATH).convert("RGBA")
w, h = im.size
px = im.load()

def neutral_light(r, g, b, a):
    return a > 0 and min(r, g, b) >= 200 and abs(r - g) <= 8 and abs(g - b) <= 8 and abs(r - b) <= 8

seen = bytearray(w * h)
q = deque()
for x in range(w):
    for y in (0, 1, 2):
        r, g, b, a = px[x, y]
        if neutral_light(r, g, b, a) and not seen[y * w + x]:
            seen[y * w + x] = 1
            q.append((x, y))

cleared = 0
while q:
    x, y = q.popleft()
    px[x, y] = (0, 0, 0, 0)
    cleared += 1
    for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
        if 0 <= nx < w and 0 <= ny < h and not seen[ny * w + nx]:
            r, g, b, a = px[nx, ny]
            if neutral_light(r, g, b, a):
                seen[ny * w + nx] = 1
                q.append((nx, ny))

# soften the ragged boundary: any remaining near-neutral pixel touching a
# cleared one gets half alpha so the grass edge doesn't look sawtoothed
edge = 0
for y in range(h):
    for x in range(w):
        if seen[y * w + x]:
            continue
        r, g, b, a = px[x, y]
        if a > 0 and min(r, g, b) >= 190 and abs(r - g) <= 14 and abs(g - b) <= 14:
            for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
                if 0 <= nx < w and 0 <= ny < h and seen[ny * w + nx]:
                    px[x, y] = (r, g, b, a // 2)
                    edge += 1
                    break

im.save(PATH)
print(f"cleared {cleared} px ({100 * cleared / (w * h):.0f}%), feathered {edge} edge px")
