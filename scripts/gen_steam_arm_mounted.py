"""Generate the arm in its MOUNTED pose: intact, vertical, hanging at rest —
clean shoulder pauldron at top (no torn gears facing forward), matching the
rack robot's own arm style via image reference."""
import asyncio
import base64
import os
import sys

from dotenv import load_dotenv
from emergentintegrations.llm.chat import LlmChat, UserMessage, ImageContent
from PIL import Image, ImageEnhance, ImageFilter

load_dotenv("/app/backend/.env")

PROMPT = (
    "Look at the attached steampunk robot game sprite. Paint HIS OTHER ARM "
    "as a separate standalone sprite in EXACTLY the same art style, colours "
    "and construction as the arm he already has: same chunky segmented "
    "riveted plating, same dark aged bronze with rust and grime, same "
    "verdigris green patina straps, same rounded shoulder pauldron, thick "
    "cylindrical forearm and blocky segmented fingers. CRITICAL: the new arm "
    "must have IDENTICAL PROPORTIONS to his existing arm — the forearm "
    "gauntlet just as THICK, WIDE and bulky, the same massive industrial "
    "heft, never slimmer or more elegant. "
    "This time paint the arm INTACT and WHOLE, in the exact hanging-at-rest "
    "pose it would have while MOUNTED on his shoulder: perfectly VERTICAL, "
    "seen straight from the front, the rounded shoulder pauldron CLEAN and "
    "COMPLETE at the TOP (no torn parts, no exposed gears, no loose wires "
    "anywhere), upper arm and forearm hanging straight down, relaxed "
    "half-curled fingers at the BOTTOM. TALL PORTRAIT composition, the arm "
    "shown COMPLETELY ALONE, centered, filling most of the frame height, on "
    "a PERFECTLY FLAT SOLID PURE MAGENTA background (#FF00FF) with no "
    "gradient, no shadow on the background, no floor, no text, no watermark, "
    "no border."
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
    a = im.split()[3].filter(ImageFilter.GaussianBlur(1.1))
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
                px[x, y] = (r, g, max(0, int(g * 0.75)), al)  # magenta despill
            elif r > 225 and g > 225 and b > 225:
                px[x, y] = (40, 32, 22, al)
    bbox = im.getbbox()
    if bbox:
        im = im.crop(bbox)
    alpha = im.split()[3]
    rgb = im.convert("RGB")
    rgb = ImageEnhance.Color(rgb).enhance(0.92)
    rgb = ImageEnhance.Brightness(rgb).enhance(0.94)
    im = rgb.convert("RGBA")
    im.putalpha(alpha)
    im.save(out)
    print(f"keyed -> {out} ({im.size})")


async def main():
    api_key = os.getenv("EMERGENT_LLM_KEY")
    if not api_key:
        print("EMERGENT_LLM_KEY missing", file=sys.stderr)
        sys.exit(1)
    with open("/app/frontend/public/steam-robot-rack.png", "rb") as f:
        robot_b64 = base64.b64encode(f.read()).decode()
    chat = (
        LlmChat(api_key=api_key, session_id="steam-arm-mounted", system_message="You are an expert steampunk prop illustrator producing game asset art.")
        .with_model("gemini", "gemini-3.1-flash-image-preview")
        .with_params(modalities=["image", "text"])
    )
    msg = UserMessage(text=PROMPT, file_contents=[ImageContent(image_base64=robot_b64)])
    text, images = await chat.send_message_multimodal_response(msg)
    if not images:
        print(f"no image returned ({(text or '')[:120]})", file=sys.stderr)
        sys.exit(1)
    data = base64.b64decode(images[0]["data"])
    raw = "/app/scripts/steam-arm-mounted-raw.png"
    with open(raw, "wb") as f:
        f.write(data)
    print(f"saved -> {raw} ({len(data)//1024}KB)")
    key_and_grade(raw, "/app/frontend/public/steam-arm-mounted.png")


if __name__ == "__main__":
    asyncio.run(main())
