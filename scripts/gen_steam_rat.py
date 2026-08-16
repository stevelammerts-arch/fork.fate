"""Generate a tiny workshop rat sprite (side view, mid-scurry) for the
steampunk floor corner. Keyed from the sampled corner color (the model often
returns muted magenta instead of pure #FF00FF)."""
import asyncio
import base64
import os
import sys

from dotenv import load_dotenv
from emergentintegrations.llm.chat import LlmChat, UserMessage
from PIL import Image, ImageEnhance, ImageFilter

load_dotenv("/app/backend/.env")

PROMPT = (
    "A small scruffy grey-brown RAT in mid-scurry, full side view, running "
    "to the RIGHT: body stretched low to the ground, front and hind legs "
    "extended mid-stride, long thin bald tail trailing straight behind, "
    "small rounded ears, whiskers, tiny beady dark eye. Slightly grimy "
    "workshop rat with dusty matted fur, dark muted palette suited to a "
    "dim steampunk factory, painterly digital art. The rat is shown "
    "COMPLETELY ALONE, centered, filling most of the frame, WIDE LANDSCAPE "
    "composition, on a PERFECTLY FLAT SOLID PURE MAGENTA background "
    "(#FF00FF) with no gradient, no shadow cast on the background, no "
    "floor, no text, no watermark, no border."
)


def key_alpha(src, out):
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
            elif al < 255 and r > g + 45 and b > g + 30:
                m = (r + g + b) // 3
                px[x, y] = (m, m, m, al)
    bbox = im.getbbox()
    if bbox:
        im = im.crop(bbox)
    # sink into the dim room
    alpha = im.split()[3]
    rgb = im.convert("RGB")
    rgb = ImageEnhance.Color(rgb).enhance(0.8)
    rgb = ImageEnhance.Brightness(rgb).enhance(0.8)
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
        LlmChat(api_key=api_key, session_id="steam-rat", system_message="You are an expert creature sprite illustrator producing game asset art.")
        .with_model("gemini", "gemini-3.1-flash-image-preview")
        .with_params(modalities=["image", "text"])
    )
    text, images = await chat.send_message_multimodal_response(UserMessage(text=PROMPT))
    if not images:
        print(f"no image returned ({(text or '')[:120]})", file=sys.stderr)
        sys.exit(1)
    data = base64.b64decode(images[0]["data"])
    raw = "/app/scripts/steam-rat-raw.png"
    with open(raw, "wb") as f:
        f.write(data)
    print(f"saved -> {raw} ({len(data)//1024}KB)")
    key_alpha(raw, "/app/frontend/public/steam-rat.png")


if __name__ == "__main__":
    asyncio.run(main())
