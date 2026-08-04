"""Generate a tiki gecko sprite (magenta-keyed)."""
import asyncio

from gen_critters import gen

PROMPT = (
    "A small bright GREEN TROPICAL GECKO in profile side view facing right, "
    "body low in a running stance, tail curved behind it, tiny toe pads "
    "visible. Vivid lime-green skin with subtle orange spots, glossy, warm "
    "tropical bar lighting, strong three-dimensional form. Shown COMPLETELY "
    "ALONE, centered, filling most of the frame, on a PERFECTLY FLAT SOLID "
    "PURE MAGENTA background (#FF00FF) with no gradient, no floor, no shadow "
    "on the background, no text, no watermark, no border."
)

if __name__ == "__main__":
    asyncio.run(gen("tiki-gecko", PROMPT, 180))
