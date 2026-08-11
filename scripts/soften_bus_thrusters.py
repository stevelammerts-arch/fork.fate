# Soften the two solid teal hover-thruster blobs baked into cyber-bus.png:
# below the chassis line, bright cyan pixels get a vertical alpha fade (solid
# cone -> wispy tail) and the alpha in that band is blurred for fuzz. The
# animated CSS plumes then supply the "energy" motion on top.
from PIL import Image, ImageFilter

PATH = "/app/frontend/public/cyber-bus.png"
im = Image.open(PATH).convert("RGBA")
w, h = im.size  # 1048x313
px = im.load()

BAND_TOP = 242  # chassis underside — blobs live below this line

def is_energy(r, g, b, a):
    return a > 0 and g > 130 and b > 120 and r < g - 35  # saturated teal glow

for y in range(BAND_TOP, h):
    t = (y - BAND_TOP) / (h - BAND_TOP)  # 0 at chassis, 1 at sprite bottom
    keep = 0.62 - 0.56 * t  # 62% alpha up top -> 6% at the tip
    for x in range(w):
        r, g, b, a = px[x, y]
        if is_energy(r, g, b, a):
            px[x, y] = (r, g, b, int(a * keep))

# fuzz: blur only the energy band's alpha, then paste back
band = im.crop((0, BAND_TOP, w, h))
alpha = band.getchannel("A").filter(ImageFilter.GaussianBlur(2.2))
band.putalpha(alpha)
im.paste(band, (0, BAND_TOP))
im.save(PATH)
print("softened thruster blobs", im.size)
