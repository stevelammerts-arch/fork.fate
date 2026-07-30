"""Convert the JPEG dragon-claw asset into a true transparent PNG.

Nano Banana returned JPEG (no alpha) and baked in a light-gray checkerboard
where the transparency was supposed to be. This script keys out that
checkerboard by treating any "background-looking" pixel (light gray, near-
neutral) that is connected to the image edge as transparent. The dragon
claws and the deep shadow between them stay opaque.

Uses PIL flood-fill from the four corners with a broad color tolerance so
both shades of the checker pattern get removed, but interior dark pixels
(claws, talons) survive.
"""
from PIL import Image, ImageFilter

SRC = "/app/frontend/public/dragon-claw.png"
OUT = "/app/frontend/public/dragon-claw.png"


def is_background(rgb, tol=70):
    r, g, b = rgb[:3]
    # neutral-ish (R,G,B are close) AND light-to-mid gray
    if abs(r - g) > 22 or abs(g - b) > 22 or abs(r - b) > 22:
        return False
    # light gray / white / mid-gray checker keeps values roughly 150-255 range
    return r >= 120 and g >= 120 and b >= 120


def flood_transparent(im: Image.Image) -> Image.Image:
    im = im.convert("RGBA")
    w, h = im.size
    px = im.load()
    stack = []
    # Seed from every edge pixel that looks like background
    for x in range(w):
        for y in (0, h - 1):
            if is_background(px[x, y]):
                stack.append((x, y))
    for y in range(h):
        for x in (0, w - 1):
            if is_background(px[x, y]):
                stack.append((x, y))
    visited = set()
    while stack:
        x, y = stack.pop()
        if (x, y) in visited:
            continue
        if not (0 <= x < w and 0 <= y < h):
            continue
        p = px[x, y]
        if not is_background(p):
            continue
        visited.add((x, y))
        # Set alpha to 0
        px[x, y] = (p[0], p[1], p[2], 0)
        stack.extend([(x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)])
    return im


def soften_edges(im: Image.Image) -> Image.Image:
    # Slight alpha blur to avoid hard-key jaggies without dulling the claw.
    a = im.split()[3].filter(ImageFilter.GaussianBlur(radius=0.8))
    r, g, b, _ = im.split()
    return Image.merge("RGBA", (r, g, b, a))


def main():
    im = Image.open(SRC)
    im = flood_transparent(im)
    im = soften_edges(im)
    im.save(OUT, "PNG")
    im2 = Image.open(OUT)
    w, h = im2.size
    print(f"saved: mode={im2.mode} size={im2.size}")
    print("center alpha:", im2.getpixel((w // 2, h // 2))[3])
    print("corner alpha:", im2.getpixel((5, 5))[3])


if __name__ == "__main__":
    main()
