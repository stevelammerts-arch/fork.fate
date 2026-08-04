"""Generate a flying cardinal sprite (wings spread, facing left, magenta-keyed)."""
import asyncio

from gen_critters import gen

PROMPT = (
    "A NORTHERN CARDINAL bird IN FLIGHT, brilliant red plumage with black "
    "face mask and orange beak, photographed in profile side view FLYING "
    "TOWARD THE LEFT, both wings fully spread mid-flap raised above its "
    "body, tail fanned. Photorealistic, richly detailed feathers, soft "
    "winter daylight, strong three-dimensional form. Shown COMPLETELY "
    "ALONE, centered, filling most of the frame, on a PERFECTLY FLAT SOLID "
    "PURE MAGENTA background (#FF00FF) with no branch, no gradient, no "
    "shadow on the background, no text, no watermark, no border."
)

if __name__ == "__main__":
    asyncio.run(gen("winter-cardinal-fly", PROMPT, 220))
