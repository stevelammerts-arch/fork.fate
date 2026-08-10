# Recolor the pink petal sprite into a soft white one: keep the alpha and
# shading, but push every pixel toward white so it reads as a pale blossom.
from PIL import Image

src = Image.open("/app/frontend/public/petal-pink.png").convert("RGBA")
px = src.load()
w, h = src.size
for y in range(h):
    for x in range(w):
        r, g, b, a = px[x, y]
        if a == 0:
            continue
        lum = int(0.299 * r + 0.587 * g + 0.114 * b)
        # mostly white, with the original shading kept as gentle grey
        v = 255 - int((255 - lum) * 0.28)
        # whisper of warm ivory so it doesn't look clinical
        px[x, y] = (v, v, max(0, v - 6), a)
src.save("/app/frontend/public/petal-white.png")
print("saved petal-white.png", src.size)
