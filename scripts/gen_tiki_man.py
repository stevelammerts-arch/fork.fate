"""Generate the Tiki Man heist sprites for the Tiki Lounge realm.

Style reference: the user's chibi tiki-warrior drawings (/tmp/tiki_ref.jpg —
carved wooden skull masks, feathered headdresses, grass skirts, sepia
woodburn shading). Two sprites on pure black, flood-keyed (border fill, not
global threshold — the linework has interior blacks):
  1. surf:  riding a wooden surfboard on a small wave, facing right
     -> /app/frontend/public/tiki-man-surf.png
  2. spear: lunging spear-jab, spear horizontal, tip to the right
     -> /app/frontend/public/tiki-man-spear.png
"""
import asyncio
import base64
import os
import sys
from collections import deque

from dotenv import load_dotenv
from PIL import Image

load_dotenv("/app/backend/.env")

STYLE = (
    "Using this image as the exact character style reference — a chibi tiki "
    "warrior with a carved wooden skull mask, feathered headdress, grass "
    "skirt, tribal arm bands, warm woodburn shading — but add A LITTLE "
    "COLOR: vivid red-orange and teal feathers in the headdress, faded red "
    "and teal painted tribal stripes on the mask and arm bands, glowing "
    "ember-orange eyes, keeping the carved wooden body in warm sepia tones — "
)

SURF_PROMPT = STYLE + (
    "paint ONE tiki man RIDING A WOODEN SURFBOARD on a small curling ocean "
    "wave: crouched surf stance, knees bent, arms out for balance, the board "
    "angled slightly nose-up, white foam spray under the board. Full body, "
    "side profile facing RIGHT. PURE SOLID BLACK background (#000000) — no "
    "scenery besides the small wave directly under the board. Centered with "
    "clear black space all around."
)

SPEAR_PROMPT = STYLE + (
    "paint ONE tiki man in a fierce spear-jab pose: both hands gripping a "
    "long wooden spear held HORIZONTALLY at shoulder height, the sharp stone "
    "tip thrusting forward to the RIGHT, front leg lunging. Full body, side "
    "profile facing RIGHT. PURE SOLID BLACK background (#000000), no "
    "scenery. Centered with clear black space all around."
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
    from emergentintegrations.llm.chat import LlmChat, UserMessage, ImageContent
    with open("/tmp/tiki_ref.jpg", "rb") as f:
        ref = base64.b64encode(f.read()).decode("utf-8")
    chat = LlmChat(
        api_key=os.getenv("EMERGENT_LLM_KEY"),
        session_id=session_id,
        system_message="You are an expert character sprite artist.",
    )
    chat.with_model("gemini", "gemini-3.1-flash-image-preview").with_params(modalities=["image", "text"])
    text, images = await chat.send_message_multimodal_response(
        UserMessage(text=prompt, file_contents=[ImageContent(ref)])
    )
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
    which = sys.argv[1:] or ["surf", "spear"]
    if "surf" in which:
        await gen("tiki-man-surf", SURF_PROMPT, "/app/frontend/public/tiki-man-surf.png", "/app/scripts/tiki_surf_raw.png")
    if "spear" in which:
        await gen("tiki-man-spear", SPEAR_PROMPT, "/app/frontend/public/tiki-man-spear.png", "/app/scripts/tiki_spear_raw.png")


if __name__ == "__main__":
    asyncio.run(main())
