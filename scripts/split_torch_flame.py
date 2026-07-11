from PIL import Image

CUT = 305  # rows above CUT = flame, below = torch base
src = Image.open("/app/frontend/public/tiki-torch.png").convert("RGBA")
w, h = src.size

flame = src.copy()
base = src.copy()

fp = flame.load()
bp = base.load()
for y in range(h):
    for x in range(w):
        if y < CUT:
            # keep in flame, clear from base
            r, g, b, a = bp[x, y]
            bp[x, y] = (r, g, b, 0)
        else:
            r, g, b, a = fp[x, y]
            fp[x, y] = (r, g, b, 0)

flame.save("/app/frontend/public/tiki-flame.png")
base.save("/app/frontend/public/tiki-torch-base.png")
print("done", src.size)
