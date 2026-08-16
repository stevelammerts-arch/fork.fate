"""Generate the peeking seagull head sprite for the summer 'Mine!' heist.

Style-matched to /summer-seagull.png (clean flat cartoon illustration with
thin outlines). Front-facing quizzical stare like the reference photo the
user supplied: head cocked, beady eyes, yellow beak.
"""
import asyncio

from gen_critters import gen

PROMPT = (
    "A SEAGULL'S HEAD AND UPPER NECK ONLY, viewed head-on FACING THE CAMERA, "
    "head cocked slightly to one side with a comical wide-eyed quizzical "
    "stare, small round amber eyes looking straight at the viewer, bright "
    "yellow beak pointing at the camera, clean white head feathers, pale "
    "grey neck. FLAT CARTOON ILLUSTRATION style with thin dark outlines and "
    "simple cel shading, like a children's book vector illustration. Shown "
    "COMPLETELY ALONE, centered, filling most of the frame, cut off cleanly "
    "at the base of the neck, on a PERFECTLY FLAT SOLID PURE MAGENTA "
    "background (#FF00FF) with no gradient, no shadow on the background, "
    "no text, no watermark, no border."
)

if __name__ == "__main__":
    asyncio.run(gen("summer-gull-head", PROMPT, 240))
