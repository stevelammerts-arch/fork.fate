"""Generate a small classic wooden snap MOUSETRAP with cheese for the
steampunk floor corner (the rats scurry in front of it)."""
import asyncio
import base64
import os
import sys

from dotenv import load_dotenv
from emergentintegrations.llm.chat import LlmChat, UserMessage
from PIL import Image, ImageEnhance, ImageFilter

load_dotenv("/app/backend/.env")

PROMPT = (
    "A single small classic WOODEN SNAP MOUSETRAP seen from a low side-front "
    "angle, sitting flat on the ground: worn rectangular wooden base, "
    "tarnished brass-copper spring coil and snap bar armed and ready, and a "
    "small appetizing wedge of YELLOW SWISS CHEESE with holes sitting on the "
    "trigger plate. Slightly dusty and aged, fitting a dim steampunk "
    "workshop, painterly digital game prop art, warm palette. The mousetrap "
    "is shown COMPLETELY ALONE, centered, filling most of the frame, WIDE "
    "LANDSCAPE composition, on a PERFECTLY FLAT SOLID PURE MAGENTA "
    "background (#FF00FF) with no gradient, no shadow on the background, "
    "no floor, no text, no watermark, no border."
)


def key_and_grade(src, out):
    im = Image.open(src).convert("RGBA")
    w, h = im.size
    px = im.load()
    bgc = px[5, 5][:3]

    def is_bg(rgb, tol=48):
        return all(abs(rgb[i] - bgc[i]) <= tol for i in range(3))

    stack = [(x, y) for x in range(w) for y in (0, h - 1)] + [(x, y) for y in range(h) for x in (0, w - 1)]
    visited = set()
    while stack:
        x, y = stack.pop()
        if (x, y) in visited or not (0 <= x < w and 0 <= y < h):
            continue
        p = px[x, y]
        if not is_bg(p):
            continue
        visited.add((x, y))
        px[x, y] = (p[0], p[1], p[2], 0)
        stack.extend([(x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)])
    a = im.split()[3].filter(ImageFilter.GaussianBlur(1.0))
    im.putalpha(a)
    px = im.load()
    for y in range(h):
        for x in range(w):
            r, g, b, al = px[x, y]
            if al == 0:
                continue
            if is_bg((r, g, b), 60):
                px[x, y] = (r, g, b, 0)
            elif b > g + 25 and r > g + 25:
                px[x, y] = (r, g, max(0, int(g * 0.75)), al)
    bbox = im.getbbox()
    if bbox:
        im = im.crop(bbox)
    alpha = im.split()[3]
    rgb = im.convert("RGB")
    rgb = ImageEnhance.Color(rgb).enhance(0.88)
    rgb = ImageEnhance.Brightness(rgb).enhance(0.85)
    im = rgb.convert("RGBA")
    im.putalpha(alpha)
    im.save(out)
    print(f"keyed -> {out} ({im.size})")


async def main():
    api_key = os.getenv("EMERGENT_LLM_KEY")
    if not api_key:
        print("EMERGENT_LLM_KEY missing", file=sys.stderr)
        sys.exit(1)
    chat = (
        LlmChat(api_key=api_key, session_id="steam-mousetrap", system_message="You are an expert prop illustrator producing game asset art.")
        .with_model("gemini", "gemini-3.1-flash-image-preview")
        .with_params(modalities=["image", "text"])
    )
    text, images = await chat.send_message_multimodal_response(UserMessage(text=PROMPT))
    if not images:
        print(f"no image returned ({(text or '')[:120]})", file=sys.stderr)
        sys.exit(1)
    data = base64.b64decode(images[0]["data"])
    raw = "/app/scripts/steam-mousetrap-raw.png"
    with open(raw, "wb") as f:
        f.write(data)
    print(f"saved -> {raw} ({len(data)//1024}KB)")
    key_and_grade(raw, "/app/frontend/public/steam-mousetrap.png")


if __name__ == "__main__":
    asyncio.run(main())
