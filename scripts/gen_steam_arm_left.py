"""Regenerate the rack robot's unfinished FLOOR ARM as the correct LEFT arm:
lying flat, hand pointing viewer-left, palm down with the THUMB clearly
visible on the near side. Magenta-keyed to alpha like the other props."""
import asyncio
import base64
import os
import sys

from dotenv import load_dotenv
from emergentintegrations.llm.chat import LlmChat, UserMessage
from PIL import Image, ImageFilter

load_dotenv("/app/backend/.env")

PROMPT = (
    "A single unfinished steampunk ROBOT LEFT ARM lying flat on the ground, "
    "seen exactly from the side at ground level. The arm lies horizontally: "
    "the torn-open SHOULDER END is on the RIGHT of the frame with exposed "
    "brass gears, springs and loose dangling copper wires spilling out; the "
    "mechanical HAND is on the LEFT of the frame, resting palm-down on the "
    "ground with its riveted brass fingers slightly curled — and its "
    "articulated THUMB clearly visible on the near side facing the viewer, "
    "so it unmistakably reads as a LEFT hand. Segmented riveted brass "
    "plating along the forearm, an open hatch in the forearm baring inner "
    "clockwork gears, verdigris patina straps. "
    "Richly detailed steampunk digital painting, warm brass and aged-leather "
    "palette (antique gold #D9A44E highlights, dark oiled metal, copper "
    "rivets, verdigris patina), moody workshop lighting from the upper left, "
    "painterly cinematic quality. The arm is shown COMPLETELY ALONE, "
    "centered, filling most of the frame, WIDE LANDSCAPE composition, on a "
    "PERFECTLY FLAT SOLID PURE MAGENTA background (#FF00FF) with no gradient, "
    "no tray, no table, no pedestal, no floor surface, no shadow cast on the "
    "background, no text, no watermark, no border."
)


def is_magenta(rgb, tol=90):
    r, g, b = rgb[:3]
    return r > 255 - tol and b > 255 - tol and g < tol + 40


def key_alpha(src, out):
    im = Image.open(src).convert("RGBA")
    w, h = im.size
    px = im.load()
    stack = []
    for x in range(w):
        for y in (0, h - 1):
            if is_magenta(px[x, y]):
                stack.append((x, y))
    for y in range(h):
        for x in (0, w - 1):
            if is_magenta(px[x, y]):
                stack.append((x, y))
    visited = set()
    while stack:
        x, y = stack.pop()
        if (x, y) in visited or not (0 <= x < w and 0 <= y < h):
            continue
        p = px[x, y]
        if not is_magenta(p):
            continue
        visited.add((x, y))
        px[x, y] = (p[0], p[1], p[2], 0)
        stack.extend([(x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)])
    a = im.split()[3].filter(ImageFilter.GaussianBlur(1.1))
    im.putalpha(a)
    px = im.load()
    for y in range(h):
        for x in range(w):
            r, g, b, al = px[x, y]
            if al > 0 and is_magenta((r, g, b)):
                px[x, y] = (r, g, b, 0)
            elif 0 < al < 255 and r > g + 60 and b > g + 60:
                m = (r + g + b) // 3
                px[x, y] = (m, m, m, al)
            elif al > 0 and r > 225 and g > 225 and b > 225:
                # kill stray white specks outright (matches earlier cleanups)
                px[x, y] = (40, 32, 22, al)
    bbox = im.getbbox()
    if bbox:
        im = im.crop(bbox)
    im.save(out)
    print(f"keyed -> {out} ({im.size})")


async def main():
    api_key = os.getenv("EMERGENT_LLM_KEY")
    if not api_key:
        print("EMERGENT_LLM_KEY missing", file=sys.stderr)
        sys.exit(1)
    chat = (
        LlmChat(api_key=api_key, session_id="steam-arm-left", system_message="You are an expert steampunk prop illustrator producing game asset art.")
        .with_model("gemini", "gemini-3.1-flash-image-preview")
        .with_params(modalities=["image", "text"])
    )
    text, images = await chat.send_message_multimodal_response(UserMessage(text=PROMPT))
    if not images:
        print(f"no image returned ({(text or '')[:120]})", file=sys.stderr)
        sys.exit(1)
    data = base64.b64decode(images[0]["data"])
    raw = "/app/scripts/steam-arm-left-raw.png"
    with open(raw, "wb") as f:
        f.write(data)
    print(f"saved -> {raw} ({len(data)//1024}KB)")
    key_alpha(raw, "/app/frontend/public/steam-arm-left.png")


if __name__ == "__main__":
    asyncio.run(main())
