"""Regenerate the floor arm to MATCH the rack robot's own arm style, by
passing the robot sprite as an image reference to Nano Banana. Output is
mirrored in post so it reads as his LEFT arm (thumb toward viewer)."""
import asyncio
import base64
import os
import sys

from dotenv import load_dotenv
from emergentintegrations.llm.chat import LlmChat, UserMessage, ImageContent
from PIL import Image, ImageEnhance, ImageFilter

load_dotenv("/app/backend/.env")

PROMPT = (
    "Look at the attached steampunk robot game sprite. Paint HIS OTHER ARM as "
    "a separate detached prop, in EXACTLY the same art style, colours and "
    "construction as the arm he already has: the same chunky segmented "
    "riveted plating, the same dark aged bronze with rust and grime, the "
    "same verdigris green patina straps, the same rounded shoulder pauldron "
    "and thick cylindrical forearm and blocky segmented fingers. "
    "The detached arm lies flat on the ground, seen exactly from the side at "
    "ground level, lying horizontally: the HAND is on the LEFT of the frame "
    "resting palm-down with fingers slightly curled and the THUMB clearly "
    "visible on the near side facing the viewer; the SHOULDER END is on the "
    "RIGHT of the frame, torn open with exposed gears, springs and loose "
    "dangling copper wires spilling out where it ripped off the robot. "
    "The arm is shown COMPLETELY ALONE, centered, filling most of the frame, "
    "WIDE LANDSCAPE composition, on a PERFECTLY FLAT SOLID PURE MAGENTA "
    "background (#FF00FF) with no gradient, no tray, no table, no floor "
    "surface, no shadow cast on the background, no text, no watermark, "
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
            elif al < 255 and r > g + 45 and b > g + 30:
                m = (r + g + b) // 3
                px[x, y] = (m, m, m, al)
            elif r > 225 and g > 225 and b > 225:
                px[x, y] = (40, 32, 22, al)
    bbox = im.getbbox()
    if bbox:
        im = im.crop(bbox)
    # MIRROR: hand-left + near thumb = right arm; the flip makes it his LEFT
    im = im.transpose(Image.FLIP_LEFT_RIGHT)
    # gentle sink into the room light (style already matches the robot)
    alpha = im.split()[3]
    rgb = im.convert("RGB")
    rgb = ImageEnhance.Color(rgb).enhance(0.92)
    rgb = ImageEnhance.Brightness(rgb).enhance(0.94)
    im = rgb.convert("RGBA")
    im.putalpha(alpha)
    im.save(out)
    print(f"keyed+flipped -> {out} ({im.size})")


async def main():
    api_key = os.getenv("EMERGENT_LLM_KEY")
    if not api_key:
        print("EMERGENT_LLM_KEY missing", file=sys.stderr)
        sys.exit(1)
    with open("/app/frontend/public/steam-robot-rack.png", "rb") as f:
        robot_b64 = base64.b64encode(f.read()).decode()
    chat = (
        LlmChat(api_key=api_key, session_id="steam-arm-match", system_message="You are an expert steampunk prop illustrator producing game asset art.")
        .with_model("gemini", "gemini-3.1-flash-image-preview")
        .with_params(modalities=["image", "text"])
    )
    msg = UserMessage(text=PROMPT, file_contents=[ImageContent(image_base64=robot_b64)])
    text, images = await chat.send_message_multimodal_response(msg)
    if not images:
        print(f"no image returned ({(text or '')[:120]})", file=sys.stderr)
        sys.exit(1)
    data = base64.b64decode(images[0]["data"])
    raw = "/app/scripts/steam-arm-match-raw.png"
    with open(raw, "wb") as f:
        f.write(data)
    print(f"saved -> {raw} ({len(data)//1024}KB)")
    key_and_grade(raw, "/app/frontend/public/steam-arm-left.png")


if __name__ == "__main__":
    asyncio.run(main())
