"""Generate the tiny flourish pixie for the Fairy Gully reveal.

Uses fairy-gully.png as the character-design reference so she matches the two
painted fairies (green leaf outfit, brown hair, iridescent wings). Asks for a
two-pose sprite sheet (wings up | wings down) on a pure black background with
a soft glowing aura, then keys out the black, splits the halves, trims and
saves /app/frontend/public/fairy-pixie-1.png and fairy-pixie-2.png.
"""
import asyncio
import base64
import os

from dotenv import load_dotenv
from PIL import Image

load_dotenv("/app/backend/.env")

REF = "/app/frontend/public/fairy-gully.png"

PROMPT = (
    "Using the two fairies in this painting as the exact character design "
    "reference, paint ONE tiny fairy from that same family in the same art "
    "style: young female fairy, warm brown hair, green leaf-woven forest "
    "outfit, bare feet, large translucent iridescent rainbow-sheen wings, "
    "surrounded by a soft glowing teal-green magical aura and tiny sparkles. "
    "Full body, flying sideways facing right. Show her TWICE side by side as "
    "a sprite sheet on a PURE SOLID BLACK background (#000000, no scenery, "
    "no ground, no stars): LEFT copy with wings raised high in an upstroke, "
    "RIGHT copy identical in every way but wings swept downward in a "
    "downstroke. Same size, same pose, same face on both copies - only the "
    "wing angle differs. Centered, with clear black space around each copy."
)


def key_black(img: Image.Image) -> Image.Image:
    """Alpha from darkness: pure black -> transparent, soft ramp to 60."""
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


async def main():
    from emergentintegrations.llm.chat import LlmChat, UserMessage, ImageContent

    with open(REF, "rb") as f:
        ref_b64 = base64.b64encode(f.read()).decode("utf-8")
    chat = LlmChat(
        api_key=os.getenv("EMERGENT_LLM_KEY"),
        session_id="fairy-pixie-sheet",
        system_message="You are an expert fantasy character sprite artist.",
    )
    chat.with_model("gemini", "gemini-3.1-flash-image-preview").with_params(modalities=["image", "text"])
    text, images = await chat.send_message_multimodal_response(
        UserMessage(text=PROMPT, file_contents=[ImageContent(ref_b64)])
    )
    if not images:
        print(f"NO IMAGE RETURNED. text={str(text)[:200]}")
        return
    raw = base64.b64decode(images[0]["data"])
    with open("/app/scripts/fairy_pixie_sheet.png", "wb") as f:
        f.write(raw)
    sheet = Image.open("/app/scripts/fairy_pixie_sheet.png")
    print("sheet size:", sheet.size)
    keyed = key_black(sheet)
    w, h = keyed.size
    halves = [keyed.crop((0, 0, w // 2, h)), keyed.crop((w // 2, 0, w, h))]
    for i, half in enumerate(halves, 1):
        sprite = trim(half)
        # Downscale: she's displayed ~56px tall, keep 3x for retina
        if sprite.height > 220:
            ratio = 220 / sprite.height
            sprite = sprite.resize((max(1, int(sprite.width * ratio)), 220), Image.LANCZOS)
        out = f"/app/frontend/public/fairy-pixie-{i}.png"
        sprite.save(out, optimize=True)
        print("saved", out, sprite.size)


if __name__ == "__main__":
    asyncio.run(main())
