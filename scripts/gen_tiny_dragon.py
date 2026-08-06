"""Generate the Dragon Horde companion sprites + ouroboros logo ring.

1. Tiny red & gold dragon, two-pose sprite sheet (wings up | wings down) on
   pure black with an ember glow -> keyed to alpha, split, trimmed, saved as
   /app/frontend/public/dragon-tiny-1.png and dragon-tiny-2.png.
2. Gold ouroboros dragon ring (modeled on the user's reference image
   /app/scripts/ouroboros_ref.jpg) on pure black with an EMPTY circular
   center -> keyed, saved as /app/frontend/public/dragon-ring.png.
"""
import asyncio
import base64
import os
import sys

from dotenv import load_dotenv
from PIL import Image

load_dotenv("/app/backend/.env")

DRAGON_PROMPT = (
    "Paint ONE tiny fierce-but-charming dragon in rich fantasy digital art "
    "style: RED scales with GOLD belly plates, gold horns and gold-tipped "
    "bat-like wings, small ember-orange glowing eyes, a wisp of ember glow "
    "around it. Full body, flying sideways facing right, tail trailing. "
    "Show it TWICE side by side as a sprite sheet on a PURE SOLID BLACK "
    "background (#000000, no scenery, no stars): LEFT copy with wings "
    "raised high in an upstroke, RIGHT copy identical in every way but "
    "wings swept downward in a downstroke. Same size, same pose, same face "
    "on both copies - only the wing angle differs. Centered, with clear "
    "black space around each copy."
)

RING_PROMPT = (
    "Using this image as the exact style reference, paint a golden ouroboros "
    "dragon: a majestic gold-scaled Chinese-style dragon coiled in a PERFECT "
    "CIRCLE biting toward its own tail, head at the top left, ornate scales "
    "and fins, subtle sparkle highlights. The CENTER of the circle must be "
    "completely EMPTY pure black, and the background around the outside must "
    "be PURE SOLID BLACK (#000000). The ring of the dragon's body should be "
    "evenly thick so it can frame a circular logo."
)


def key_black(img: Image.Image) -> Image.Image:
    img = img.convert("RGB")
    px = img.load()
    out = img.convert("RGBA")
    opx = out.load()
    w, h = img.size
    for y in range(h):
        for x in range(w):
            r, g, b = px[x, y]
            m = max(r, g, b)
            if m <= 28:
                a = 0
            elif m < 60:
                a = int(255 * (m - 28) / 32)
            else:
                a = 255
            opx[x, y] = (r, g, b, a)
    return out


def trim(img: Image.Image, pad: int = 6) -> Image.Image:
    bbox = img.getbbox()
    if not bbox:
        return img
    x0, y0, x1, y1 = bbox
    x0 = max(0, x0 - pad); y0 = max(0, y0 - pad)
    x1 = min(img.width, x1 + pad); y1 = min(img.height, y1 + pad)
    return img.crop((x0, y0, x1, y1))


async def make_chat(session_id):
    from emergentintegrations.llm.chat import LlmChat
    chat = LlmChat(
        api_key=os.getenv("EMERGENT_LLM_KEY"),
        session_id=session_id,
        system_message="You are an expert fantasy sprite and ornament artist.",
    )
    chat.with_model("gemini", "gemini-3.1-flash-image-preview").with_params(modalities=["image", "text"])
    return chat


async def gen_dragon():
    from emergentintegrations.llm.chat import UserMessage
    chat = await make_chat("dragon-tiny-sheet")
    text, images = await chat.send_message_multimodal_response(UserMessage(text=DRAGON_PROMPT))
    if not images:
        print(f"DRAGON: NO IMAGE. text={str(text)[:200]}")
        return
    raw = base64.b64decode(images[0]["data"])
    with open("/app/scripts/dragon_tiny_sheet.png", "wb") as f:
        f.write(raw)
    sheet = Image.open("/app/scripts/dragon_tiny_sheet.png")
    print("dragon sheet:", sheet.size)
    keyed = key_black(sheet)
    w, h = keyed.size
    for i, half in enumerate([keyed.crop((0, 0, w // 2, h)), keyed.crop((w // 2, 0, w, h))], 1):
        sprite = trim(half)
        if sprite.height > 220:
            ratio = 220 / sprite.height
            sprite = sprite.resize((max(1, int(sprite.width * ratio)), 220), Image.LANCZOS)
        out = f"/app/frontend/public/dragon-tiny-{i}.png"
        sprite.save(out, optimize=True)
        print("saved", out, sprite.size)


async def gen_ring():
    from emergentintegrations.llm.chat import UserMessage, ImageContent
    with open("/app/scripts/ouroboros_ref.jpg", "rb") as f:
        ref_b64 = base64.b64encode(f.read()).decode("utf-8")
    chat = await make_chat("dragon-ouroboros-ring")
    text, images = await chat.send_message_multimodal_response(
        UserMessage(text=RING_PROMPT, file_contents=[ImageContent(ref_b64)])
    )
    if not images:
        print(f"RING: NO IMAGE. text={str(text)[:200]}")
        return
    raw = base64.b64decode(images[0]["data"])
    with open("/app/scripts/dragon_ring_raw.png", "wb") as f:
        f.write(raw)
    ring = key_black(Image.open("/app/scripts/dragon_ring_raw.png"))
    ring = trim(ring, pad=4)
    if ring.width > 520:
        ratio = 520 / ring.width
        ring = ring.resize((520, max(1, int(ring.height * ratio))), Image.LANCZOS)
    ring.save("/app/frontend/public/dragon-ring.png", optimize=True)
    print("saved /app/frontend/public/dragon-ring.png", ring.size)


async def main():
    which = sys.argv[1:] or ["dragon", "ring"]
    if "dragon" in which:
        await gen_dragon()
    if "ring" in which:
        await gen_ring()


if __name__ == "__main__":
    asyncio.run(main())
