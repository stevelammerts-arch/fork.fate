"""Generate reaper raven sprites: perched + flying (magenta-keyed)."""
import asyncio

from gen_critters import gen

PERCHED = (
    "A BLACK RAVEN perched in profile side view facing left, wings folded, "
    "head slightly raised, glossy black feathers with subtle cold blue-violet "
    "rim lighting along its back and head so its silhouette reads against a "
    "dark background, one pale glinting eye. Dark gothic storybook "
    "illustration style. Shown COMPLETELY ALONE, centered, filling most of "
    "the frame, on a PERFECTLY FLAT SOLID PURE MAGENTA background (#FF00FF) "
    "with no branch, no perch, no gradient, no shadow on the background, no "
    "text, no watermark, no border."
)

FLYING = (
    "A BLACK RAVEN IN FLIGHT in profile side view FLYING TOWARD THE LEFT, "
    "both wings fully spread mid-flap raised above its body, tail fanned, "
    "glossy black feathers with subtle cold blue-violet rim lighting so its "
    "silhouette reads against a dark background. Dark gothic storybook "
    "illustration style. Shown COMPLETELY ALONE, centered, filling most of "
    "the frame, on a PERFECTLY FLAT SOLID PURE MAGENTA background (#FF00FF) "
    "with no gradient, no shadow on the background, no text, no watermark, "
    "no border."
)


async def main():
    await gen("reaper-raven", PERCHED, 180)
    await gen("reaper-raven-fly", FLYING, 220)


if __name__ == "__main__":
    asyncio.run(main())
