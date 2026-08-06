"""Generate the little flying Reaper companion sprites for the Dark realm.

Style reference: /app/frontend/public/reaper.png (ornate black-robed reaper
with skull face, silver-embroidered trim and a bone staff with skeleton,
crescent moon and red lantern) — but WITHOUT the plate of food, in a flying
side-profile pose facing RIGHT so CompanionPatrol can scaleX-flip him to fly
left and right. Two frames on PURE WHITE (the robe is black, so we key the
white border-connected background instead):
  1. glide: robe hem streaming back      -> /app/frontend/public/reaper-fly-1.png
  2. billow: robe hem billowed, lantern swung -> /app/frontend/public/reaper-fly-2.png
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
    "Using this image as the EXACT character style reference — an ornate "
    "grim reaper in a flowing black robe with silver-embroidered trim, a "
    "pale skull face inside a deep black hood, bony skeletal hands, and a "
    "tall bone staff topped with a little skeleton, a crescent moon and a "
    "red-glowing lantern — "
)

FRAME1_PROMPT = STYLE + (
    "paint the SAME reaper FLYING through the air: full body in side "
    "profile facing RIGHT, body leaned gently forward as he glides "
    "horizontally, the tattered hem of his robe streaming out BEHIND him to "
    "the left like smoke (no legs or feet visible — the robe dissolves into "
    "wisps), one skeletal hand holding the staff with the red lantern. "
    "IMPORTANT: NO plate, NO food — his free hand is empty. PURE SOLID "
    "WHITE background (#FFFFFF), no scenery, no ground shadow. Centered "
    "with clear white space all around."
)

FRAME2_PROMPT = STYLE + (
    "paint the SAME reaper FLYING through the air: full body in side "
    "profile facing RIGHT, body leaned gently forward as he glides, but in "
    "a SECOND animation frame — the tattered robe hem billowed UP behind "
    "him mid-flutter and the red lantern on his staff swung slightly "
    "forward (no legs or feet visible — the robe dissolves into wisps), "
    "same size and pose otherwise. IMPORTANT: NO plate, NO food — his free "
    "hand is empty. PURE SOLID WHITE background (#FFFFFF), no scenery, no "
    "ground shadow. Centered with clear white space all around."
)


def flood_key_white(img: Image.Image, thresh: int = 235) -> Image.Image:
    """Alpha-key only the WHITE connected to the borders (keeps interior whites like the skull)."""
    img = img.convert("RGB")
    w, h = img.size
    px = img.load()
    def bright(x, y):
        r, g, b = px[x, y]
        return min(r, g, b) >= thresh
    bg = bytearray(w * h)
    q = deque()
    for x in range(w):
        for y in (0, h - 1):
            if bright(x, y) and not bg[y * w + x]: bg[y * w + x] = 1; q.append((x, y))
    for y in range(h):
        for x in (0, w - 1):
            if bright(x, y) and not bg[y * w + x]: bg[y * w + x] = 1; q.append((x, y))
    while q:
        x, y = q.popleft()
        for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
            if 0 <= nx < w and 0 <= ny < h and not bg[ny * w + nx] and bright(nx, ny):
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


def ref_b64() -> str:
    """The reaper art has transparency — flatten onto white for the reference."""
    src = Image.open("/app/frontend/public/reaper.png").convert("RGBA")
    flat = Image.new("RGB", src.size, (255, 255, 255))
    flat.paste(src, mask=src.split()[3])
    flat.save("/tmp/reaper_ref.jpg", quality=92)
    with open("/tmp/reaper_ref.jpg", "rb") as f:
        return base64.b64encode(f.read()).decode("utf-8")


async def gen(session_id: str, prompt: str, out_path: str, raw_path: str, max_h: int = 260):
    from emergentintegrations.llm.chat import LlmChat, UserMessage, ImageContent
    chat = LlmChat(
        api_key=os.getenv("EMERGENT_LLM_KEY"),
        session_id=session_id,
        system_message="You are an expert character sprite artist.",
    )
    chat.with_model("gemini", "gemini-3.1-flash-image-preview").with_params(modalities=["image", "text"])
    text, images = await chat.send_message_multimodal_response(
        UserMessage(text=prompt, file_contents=[ImageContent(ref_b64())])
    )
    if not images:
        print(f"{session_id}: NO IMAGE. text={str(text)[:200]}")
        return
    with open(raw_path, "wb") as f:
        f.write(base64.b64decode(images[0]["data"]))
    sprite = trim(flood_key_white(Image.open(raw_path)))
    if sprite.height > max_h:
        ratio = max_h / sprite.height
        sprite = sprite.resize((max(1, int(sprite.width * ratio)), max_h), Image.LANCZOS)
    sprite.save(out_path, optimize=True)
    print("saved", out_path, sprite.size)


async def main():
    which = sys.argv[1:] or ["1", "2"]
    if "1" in which:
        await gen("reaper-fly-1", FRAME1_PROMPT, "/app/frontend/public/reaper-fly-1.png", "/app/scripts/reaper_fly1_raw.png")
    if "2" in which:
        await gen("reaper-fly-2", FRAME2_PROMPT, "/app/frontend/public/reaper-fly-2.png", "/app/scripts/reaper_fly2_raw.png")


if __name__ == "__main__":
    asyncio.run(main())
