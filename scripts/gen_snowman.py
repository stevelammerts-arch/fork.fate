"""Generate the Winter snowman heist sprites.

Two sprites on pure black, flood-keyed (border fill keeps interior darks
like coal eyes/buttons and the top hat):
  1. body: headless snowman body, stick arms, red scarf blowing LEFT
     -> /app/frontend/public/snowman-body.png
  2. head: smiling carrot-nosed head (carrot points LEFT) with top hat
     -> /app/frontend/public/snowman-head.png
"""
import asyncio
import base64
import os
import sys
from collections import deque

from dotenv import load_dotenv
from PIL import Image

load_dotenv("/app/backend/.env")

BODY_PROMPT = (
    "A charming painterly storybook snowman WITHOUT A HEAD — just the two "
    "stacked snowball body sections (round base ball, smaller chest ball), "
    "thin brown stick arms raised cheerfully, a cozy red knitted scarf tied "
    "around the neck stump with its tails fluttering to the LEFT in a "
    "breeze, three small coal buttons down the chest, soft blue-white snow "
    "shading. NO head at all — the neck is a flat snowy stump where a head "
    "would sit. PURE SOLID BLACK background (#000000), no scenery, no "
    "ground shadow. Centered with clear black space all around."
)

HEAD_PROMPT = (
    "A charming painterly storybook snowman HEAD only — one round snowball "
    "head with a wide happy smile made of small coal dots, two friendly "
    "coal eyes, a long bright orange CARROT nose pointing to the LEFT, and "
    "a small snow-dusted black top hat sitting on top, soft blue-white snow "
    "shading. JUST the head, no body, nothing else. PURE SOLID BLACK "
    "background (#000000), no scenery. Centered with clear black space all "
    "around."
)


def flood_key(img: Image.Image, thresh: int = 20) -> Image.Image:
    """Alpha-key only the black connected to the borders (keeps interior blacks)."""
    img = img.convert("RGB")
    w, h = img.size
    px = img.load()
    def dark(x, y):
        r, g, b = px[x, y]
        return max(r, g, b) <= thresh
    bg = bytearray(w * h)
    q = deque()
    for x in range(w):
        for y in (0, h - 1):
            if dark(x, y) and not bg[y * w + x]: bg[y * w + x] = 1; q.append((x, y))
    for y in range(h):
        for x in (0, w - 1):
            if dark(x, y) and not bg[y * w + x]: bg[y * w + x] = 1; q.append((x, y))
    while q:
        x, y = q.popleft()
        for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
            if 0 <= nx < w and 0 <= ny < h and not bg[ny * w + nx] and dark(nx, ny):
                bg[ny * w + nx] = 1; q.append((nx, ny))
    out = img.convert("RGBA")
    opx = out.load()
    for y in range(h):
        for x in range(w):
            if bg[y * w + x]:
                r, g, b = px[x, y]
                opx[x, y] = (r, g, b, 0)
    return out


def trim(img: Image.Image, pad: int = 6) -> Image.Image:
    bbox = img.getbbox()
    if not bbox:
        return img
    x0, y0, x1, y1 = bbox
    return img.crop((max(0, x0 - pad), max(0, y0 - pad), min(img.width, x1 + pad), min(img.height, y1 + pad)))


async def gen(session_id: str, prompt: str, out_path: str, raw_path: str, max_h: int = 260):
    from emergentintegrations.llm.chat import LlmChat, UserMessage
    chat = LlmChat(
        api_key=os.getenv("EMERGENT_LLM_KEY"),
        session_id=session_id,
        system_message="You are an expert character sprite artist.",
    )
    chat.with_model("gemini", "gemini-3.1-flash-image-preview").with_params(modalities=["image", "text"])
    text, images = await chat.send_message_multimodal_response(UserMessage(text=prompt))
    if not images:
        print(f"{session_id}: NO IMAGE. text={str(text)[:200]}")
        return
    with open(raw_path, "wb") as f:
        f.write(base64.b64decode(images[0]["data"]))
    sprite = trim(flood_key(Image.open(raw_path)))
    if sprite.height > max_h:
        ratio = max_h / sprite.height
        sprite = sprite.resize((max(1, int(sprite.width * ratio)), max_h), Image.LANCZOS)
    sprite.save(out_path, optimize=True)
    print("saved", out_path, sprite.size)


async def main():
    which = sys.argv[1:] or ["body", "head"]
    if "body" in which:
        await gen("snowman-body", BODY_PROMPT, "/app/frontend/public/snowman-body.png", "/app/scripts/snowman_body_raw.png")
    if "head" in which:
        await gen("snowman-head", HEAD_PROMPT, "/app/frontend/public/snowman-head.png", "/app/scripts/snowman_head_raw.png", max_h=200)


if __name__ == "__main__":
    asyncio.run(main())
