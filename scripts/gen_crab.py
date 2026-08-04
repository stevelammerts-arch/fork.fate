"""Generate a red beach crab sprite for the summer scene (magenta-keyed)."""
import asyncio

from gen_critters import gen

PROMPT = (
    "A small bright RED BEACH CRAB viewed from the front, both claws raised "
    "slightly, legs spread in a walking stance. Photorealistic, glossy shell "
    "detail, bright summer sunlight, strong three-dimensional form. Shown "
    "COMPLETELY ALONE, centered, filling most of the frame, on a PERFECTLY "
    "FLAT SOLID PURE MAGENTA background (#FF00FF) with no gradient, no sand, "
    "no shadow on the background, no text, no watermark, no border."
)

if __name__ == "__main__":
    asyncio.run(gen("summer-crab", PROMPT, 160))
