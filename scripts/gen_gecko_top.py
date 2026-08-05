"""Top-down (dorsal) gecko sprite for climbing the tiki totem — tan with green spots."""
import asyncio

from gen_critters import gen

PROMPT = (
    "A GECKO SEEN DIRECTLY FROM ABOVE (perfect top-down dorsal view), body "
    "pointing straight UP toward the top of the frame, head at the top, "
    "long tail curving slightly at the bottom, four legs splayed out to the "
    "sides in a climbing pose with sticky toe pads visible. TAN / sandy "
    "beige skin covered in small BRIGHT GREEN SPOTS. Photorealistic, "
    "detailed scales, soft warm lighting, strong three-dimensional form. "
    "Shown COMPLETELY ALONE, centered, filling most of the frame, on a "
    "PERFECTLY FLAT SOLID PURE MAGENTA background (#FF00FF) chroma-key "
    "color with no gradient, no shadow on the background, no text, no "
    "watermark, no border."
)

if __name__ == "__main__":
    asyncio.run(gen("tiki-gecko-top", PROMPT, 160))
