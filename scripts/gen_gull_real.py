"""Generate photoreal summer gull sprites + a gold coin (magenta-keyed)."""
import asyncio

from gen_critters import gen

HEAD = (
    "PHOTOREALISTIC close-up of a SEAGULL'S HEAD AND UPPER NECK ONLY, viewed "
    "head-on FACING THE CAMERA, head cocked slightly to one side with a "
    "comical wide-eyed quizzical stare, round pale-yellow eyes looking "
    "straight into the lens, bright yellow beak with a red spot pointing at "
    "the camera, crisp white head feathers, soft daylight, rich feather "
    "detail. Shown COMPLETELY ALONE, centered, filling most of the frame, "
    "cut off cleanly at the base of the neck, on a PERFECTLY FLAT SOLID PURE "
    "MAGENTA background (#FF00FF) with no gradient, no shadow on the "
    "background, no text, no watermark, no border."
)

FLY_UP = (
    "A PHOTOREALISTIC HERRING GULL seagull IN FLIGHT, photographed in clean "
    "profile side view FLYING TOWARD THE LEFT, BOTH WINGS RAISED HIGH above "
    "its back at the TOP of the upstroke forming a shallow V, white body, "
    "pale grey wings with black wingtips, yellow beak, feet tucked. Rich "
    "feather detail, soft summer daylight. Shown COMPLETELY ALONE, centered, "
    "filling most of the frame, on a PERFECTLY FLAT SOLID PURE MAGENTA "
    "background (#FF00FF) with no gradient, no shadow on the background, "
    "no text, no watermark, no border."
)

FLY_DOWN = (
    "A PHOTOREALISTIC HERRING GULL seagull IN FLIGHT, photographed in clean "
    "profile side view FLYING TOWARD THE LEFT, BOTH WINGS SWEPT FULLY "
    "DOWNWARD below its body at the BOTTOM of the downstroke, white body, "
    "pale grey wings with black wingtips, yellow beak, feet tucked. Rich "
    "feather detail, soft summer daylight. Shown COMPLETELY ALONE, centered, "
    "filling most of the frame, on a PERFECTLY FLAT SOLID PURE MAGENTA "
    "background (#FF00FF) with no gradient, no shadow on the background, "
    "no text, no watermark, no border."
)

COIN = (
    "A single ANCIENT GOLD COIN seen face-on, thick and slightly worn, "
    "stamped with a small DRAGON emblem, warm polished gold with glinting "
    "edges and tiny scratches of age, photorealistic treasure-hoard prop. "
    "Shown COMPLETELY ALONE, centered, filling most of the frame, on a "
    "PERFECTLY FLAT SOLID PURE MAGENTA background (#FF00FF) with no "
    "gradient, no shadow on the background, no text, no watermark, no border."
)


async def main():
    await gen("summer-gull-head", HEAD, 240)
    await gen("summer-gull-fly-1", FLY_UP, 260)
    await gen("summer-gull-fly-2", FLY_DOWN, 260)
    await gen("fantasy-coin", COIN, 96)


if __name__ == "__main__":
    asyncio.run(main())
