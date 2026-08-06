"""Mock up the FF medallion framed by a red & gold ouroboros dragon.

Generates the ring (user's reference image guides the coiled composition),
flood-keys the black background (strict threshold - lesson from the claw),
then composites the real fantasy medallion (logo-crest-gold.png) into the
ring's center hole on a dark header-toned canvas.
Output: /app/frontend/public/dragon-logo-mockup.jpg
"""
import asyncio
import base64
import math
import os
from collections import deque

from dotenv import load_dotenv
from PIL import Image, ImageDraw

load_dotenv("/app/backend/.env")

PROMPT = (
    "Using this image as the exact composition reference, paint an ouroboros "
    "dragon: a majestic dragon with deep RED scales and rich GOLD belly "
    "plates, gold fins, gold horns and warm gold highlights, coiled in a "
    "PERFECT CIRCLE biting toward its own tail, head at the top left, ornate "
    "scales, painterly dark-fantasy style with warm ember lighting (no white "
    "frost, no pale rim light). The CENTER of the circle must be completely "
    "EMPTY pure black, and the background around the outside must be PURE "
    "SOLID BLACK (#000000). The dragon's coiled body should form an evenly "
    "thick ring so it can frame a circular coin logo."
)


def flood_key(img, thresh=16):
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
            if dark(x, y) and not bg[y*w+x]: bg[y*w+x] = 1; q.append((x, y))
    for y in range(h):
        for x in (0, w - 1):
            if dark(x, y) and not bg[y*w+x]: bg[y*w+x] = 1; q.append((x, y))
    while q:
        x, y = q.popleft()
        for nx, ny in ((x+1,y),(x-1,y),(x,y+1),(x,y-1)):
            if 0 <= nx < w and 0 <= ny < h and not bg[ny*w+nx] and dark(nx, ny):
                bg[ny*w+nx] = 1; q.append((nx, ny))
    # center hole: enclosed dark region seeded from image center
    cx0, cy0 = w // 2, h // 2
    hole = []
    if dark(cx0, cy0) and not bg[cy0*w+cx0]:
        q = deque([(cx0, cy0)])
        seen = {(cx0, cy0)}
        while q:
            x, y = q.popleft(); hole.append((x, y))
            for nx, ny in ((x+1,y),(x-1,y),(x,y+1),(x,y-1)):
                if 0 <= nx < w and 0 <= ny < h and (nx, ny) not in seen and not bg[ny*w+nx] and dark(nx, ny):
                    seen.add((nx, ny)); q.append((nx, ny))
        for x, y in hole:
            bg[y*w+x] = 1
    out = img.convert("RGBA")
    opx = out.load()
    for y in range(h):
        for x in range(w):
            if bg[y*w+x]:
                r, g, b = px[x, y]
                opx[x, y] = (r, g, b, 0)
    hole_r = math.sqrt(len(hole) / math.pi) if hole else 0
    return out, hole_r


async def main():
    from emergentintegrations.llm.chat import LlmChat, UserMessage, ImageContent
    with open("/app/scripts/ouroboros_ref.jpg", "rb") as f:
        ref = base64.b64encode(f.read()).decode("utf-8")
    chat = LlmChat(
        api_key=os.getenv("EMERGENT_LLM_KEY"),
        session_id="red-gold-ouroboros",
        system_message="You are an expert fantasy ornament artist.",
    )
    chat.with_model("gemini", "gemini-3.1-flash-image-preview").with_params(modalities=["image", "text"])
    text, images = await chat.send_message_multimodal_response(
        UserMessage(text=PROMPT, file_contents=[ImageContent(ref)])
    )
    if not images:
        print(f"NO IMAGE. text={str(text)[:200]}")
        return
    with open("/app/scripts/redgold_ring_raw.png", "wb") as f:
        f.write(base64.b64decode(images[0]["data"]))
    raw = Image.open("/app/scripts/redgold_ring_raw.png")
    print("raw:", raw.size)
    ring, hole_r = flood_key(raw)
    bbox = ring.getbbox()
    ring = ring.crop(bbox)
    print("ring trimmed:", ring.size, "| hole radius:", round(hole_r))

    # ---- composite mockup ----
    S = 900
    canvas = Image.new("RGB", (S, S), (18, 10, 6))
    # subtle vertical grad like the fantasy header
    for y in range(S):
        v = int(6 + 10 * y / S)
        ImageDraw.Draw(canvas).line([(0, y), (S, y)], fill=(18 + v // 2, 10 + v // 3, 6 + v // 4))
    ring_size = 760
    rs = ring.resize((ring_size, int(ring.height * ring_size / ring.width)), Image.LANCZOS)
    scale = ring_size / ring.width
    hole_px = hole_r * scale * 2 if hole_r else ring_size * 0.5
    logo = Image.open("/app/frontend/public/logo-crest-gold.png").convert("RGBA")
    coin_d = int(hole_px * 0.96)
    logo = logo.resize((coin_d, coin_d), Image.LANCZOS)
    mask = Image.new("L", (coin_d, coin_d), 0)
    ImageDraw.Draw(mask).ellipse([0, 0, coin_d, coin_d], fill=255)
    black = Image.new("RGB", (coin_d, coin_d), (0, 0, 0))
    cx, cy = S // 2, S // 2
    canvas.paste(black, (cx - coin_d // 2, cy - coin_d // 2), mask)
    canvas.paste(logo, (cx - coin_d // 2, cy - coin_d // 2), logo)
    canvas.paste(rs, (cx - rs.width // 2, cy - rs.height // 2), rs)
    canvas.save("/app/frontend/public/dragon-logo-mockup.jpg", quality=90)
    print("saved /app/frontend/public/dragon-logo-mockup.jpg")


if __name__ == "__main__":
    asyncio.run(main())
