"""Sprites for the final four heists: charging unicorn + side-view coffee cup
(magenta-keyed, despilled), plus the reaper's plate extracted from reaper.png."""
import asyncio

from PIL import Image, ImageDraw, ImageFilter
from gen_critters import gen

UNICORN = (
    "A majestic WHITE UNICORN galloping at full speed in profile side view "
    "facing LEFT, head lowered in a charge with a golden spiral horn pointing "
    "forward, flowing white mane and tail streaming behind, all four legs in "
    "a dramatic mid-gallop stride. Photorealistic, luminous white coat, soft "
    "enchanted light, strong three-dimensional form. Shown COMPLETELY ALONE, "
    "centered, filling most of the frame, on a PERFECTLY FLAT SOLID PURE "
    "MAGENTA background (#FF00FF) with no ground, no gradient, no shadow on "
    "the background, no sparkles, no text, no watermark, no border."
)

CUP = (
    "A white ceramic COFFEE CUP full of hot coffee viewed from the SIDE in "
    "profile, handle on the RIGHT, coffee surface just visible at the brim, "
    "a gentle wisp of steam rising. Photorealistic, warm cafe daylight, "
    "strong three-dimensional form. Shown COMPLETELY ALONE, centered, "
    "filling most of the frame, on a PERFECTLY FLAT SOLID PURE MAGENTA "
    "background (#FF00FF) with no saucer, no table, no gradient, no shadow "
    "on the background, no text, no watermark, no border."
)


def extract_plate():
    """Elliptical cut of the glowing plate from the big reaper's hands."""
    im = Image.open("/app/frontend/public/reaper.png").convert("RGBA")
    crop = im.crop((280, 420, 580, 600))  # plate region (300x180)
    mask = Image.new("L", crop.size, 0)
    d = ImageDraw.Draw(mask)
    d.ellipse([6, 22, 296, 172], fill=255)  # inside the rim, skips the thumb
    mask = mask.filter(ImageFilter.GaussianBlur(2))
    out = Image.new("RGBA", crop.size, (0, 0, 0, 0))
    out.paste(crop, (0, 0), mask)
    out.save("/app/frontend/public/reaper-plate.png", optimize=True)
    print("plate saved", out.size)


async def main():
    extract_plate()
    await gen("fairy-unicorn", UNICORN, 360)
    await gen("cafe-cup-side", CUP, 220)


if __name__ == "__main__":
    asyncio.run(main())
