"""Generate snowman stick arm + coconut sprites (magenta-keyed)."""
import asyncio

from gen_critters import gen

ARM = (
    "A single bare brown TWIG BRANCH, thin and slightly crooked like a "
    "snowman's stick arm, with two tiny offshoot twigs near the tip, "
    "oriented diagonally from lower-right to upper-left. Painterly "
    "storybook style matching a winter illustration, soft shading. Shown "
    "COMPLETELY ALONE, centered, filling most of the frame, on a PERFECTLY "
    "FLAT SOLID PURE MAGENTA background (#FF00FF) with no gradient, no "
    "shadow on the background, no text, no watermark, no border."
)

COCONUT = (
    "A single round brown COCONUT with fibrous husk texture and three "
    "small dark eye spots, painterly storybook illustration style matching "
    "a tropical beach scene, warm sunlight. Shown COMPLETELY ALONE, "
    "centered, filling most of the frame, on a PERFECTLY FLAT SOLID PURE "
    "MAGENTA background (#FF00FF) with no gradient, no shadow on the "
    "background, no text, no watermark, no border."
)


async def main():
    await gen("winter-arm", ARM, 140)
    await gen("summer-coconut", COCONUT, 80)


if __name__ == "__main__":
    asyncio.run(main())
