"""Generate two hanging steampunk props: a plague doctor mask and brass goggles.

Rendered on a solid magenta backdrop, then chroma-keyed to true alpha
(flood-fill from the edges) so they can dangle from the swaying roof cables
in the steampunk scene. Saves to /app/frontend/public/steam-{mask,goggles}.png
"""
import asyncio
import base64
import os
import sys

from dotenv import load_dotenv
from emergentintegrations.llm.chat import LlmChat, UserMessage
from PIL import Image, ImageFilter

load_dotenv("/app/backend/.env")

STYLE = (
    "Richly detailed steampunk digital painting, warm brass and aged-leather "
    "palette (antique gold #D9A44E highlights, dark oiled leather, copper "
    "rivets, verdigris patina), moody workshop lighting from the upper left, "
    "painterly cinematic quality matching a Victorian industrial scene. "
    "The object is shown COMPLETELY ALONE, centered, filling most of the "
    "frame, on a PERFECTLY FLAT SOLID PURE MAGENTA background (#FF00FF) with "
    "no gradient, no shadow cast on the background, no floor, no table, no "
    "text, no watermark, no border."
)

PROMPTS = {
    "steam-mask-raw.png": (
        "A single antique steampunk PLAGUE DOCTOR MASK hanging straight down "
        "from a small brass hook at the top of the frame, viewed from the "
        "front and slightly angled. Long curved bird-like beak of dark "
        "stitched leather with brass rivet seams, round glass eye lenses "
        "rimmed in tarnished brass, small copper breathing filters on the "
        "beak sides, worn leather straps dangling loosely. " + STYLE
    ),
    "steam-goggles-raw.png": (
        "A single pair of antique steampunk AVIATOR GOGGLES hanging straight "
        "down by their worn leather strap from a small brass hook at the top "
        "of the frame. Two round brass-rimmed lenses with smoky green glass, "
        "one lens fitted with a flip-up magnifying loupe on a tiny hinge, "
        "copper rivets and stitched leather padding, the strap forming a "
        "loose loop above the lenses. " + STYLE
    ),
}


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
    # Soften key edges + kill magenta fringe
    a = im.split()[3].filter(ImageFilter.GaussianBlur(1.1))
    im.putalpha(a)
    px = im.load()
    for y in range(h):
        for x in range(w):
            r, g, b, al = px[x, y]
            if al > 0 and is_magenta((r, g, b)):
                px[x, y] = (r, g, b, 0)  # enclosed magenta pockets (strap loops)
            elif 0 < al < 255 and r > g + 60 and b > g + 60:
                m = (r + g + b) // 3
                px[x, y] = (m, m, m, al)
    # Crop to content
    bbox = im.getbbox()
    if bbox:
        im = im.crop(bbox)
    im.save(out)
    print(f"keyed -> {out} ({im.size})")


async def gen(name, prompt):
    api_key = os.getenv("EMERGENT_LLM_KEY")
    if not api_key:
        print("EMERGENT_LLM_KEY missing", file=sys.stderr)
        sys.exit(1)
    chat = (
        LlmChat(api_key=api_key, session_id=f"steam-prop-{name}", system_message="You are an expert steampunk prop illustrator producing game asset art.")
        .with_model("gemini", "gemini-3.1-flash-image-preview")
        .with_params(modalities=["image", "text"])
    )
    text, images = await chat.send_message_multimodal_response(UserMessage(text=prompt))
    if not images:
        print(f"{name}: no image returned ({(text or '')[:120]})", file=sys.stderr)
        return None
    data = base64.b64decode(images[0]["data"])
    path = f"/app/frontend/public/{name}"
    with open(path, "wb") as f:
        f.write(data)
    print(f"saved -> {path} ({len(data)//1024}KB)")
    return path


async def main():
    for name, prompt in PROMPTS.items():
        raw = await gen(name, prompt)
        if raw:
            key_alpha(raw, raw.replace("-raw", ""))


asyncio.run(main())
