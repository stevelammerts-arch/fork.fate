"""Generate the Fall owl heist sprites: a big owl swooping LEFT with talons
reaching to snatch the medallion. Two wing frames on pure black, keyed and
union-cropped together so they align pixel-perfect for a flap crossfade:
  1. wings UP   -> /app/frontend/public/owl-fly-1.png
  2. wings DOWN -> /app/frontend/public/owl-fly-2.png
Prints dims + AR for the JSX constants.
"""
import asyncio
import base64
import os

from dotenv import load_dotenv
from PIL import Image

from gen_snowman import flood_key

load_dotenv("/app/backend/.env")

STYLE = (
    "A majestic painterly storybook GREAT HORNED OWL in full flight, rich "
    "autumn tones — warm brown and russet feathers with cream barring, "
    "amber eyes, ear tufts — "
)

FRAME1 = STYLE + (
    "side profile flying to the LEFT, both broad wings raised HIGH above "
    "its back mid-upstroke, tail fanned, and BOTH taloned feet lowered and "
    "reaching forward-down with talons OPEN wide, ready to grab something "
    "below and ahead of it. Full body. PURE SOLID BLACK background "
    "(#000000), no scenery, no moon, no branches. Centered with clear "
    "black space all around."
)

FRAME2 = STYLE + (
    "side profile flying to the LEFT, both broad wings swept DOWN below "
    "its body mid-downstroke, tail fanned, and BOTH taloned feet lowered "
    "and reaching forward-down with talons OPEN wide, ready to grab "
    "something below and ahead of it — same owl, same size, same position "
    "and same feet pose as a matching animation frame. Full body. PURE "
    "SOLID BLACK background (#000000), no scenery, no moon, no branches. "
    "Centered with clear black space all around."
)


async def gen_raw(session_id: str, prompt: str, raw_path: str, ref_b64=None):
    from emergentintegrations.llm.chat import LlmChat, UserMessage, ImageContent
    chat = LlmChat(
        api_key=os.getenv("EMERGENT_LLM_KEY"),
        session_id=session_id,
        system_message="You are an expert character sprite artist.",
    )
    chat.with_model("gemini", "gemini-3.1-flash-image-preview").with_params(modalities=["image", "text"])
    msg = UserMessage(text=prompt, file_contents=[ImageContent(ref_b64)]) if ref_b64 else UserMessage(text=prompt)
    text, images = await chat.send_message_multimodal_response(msg)
    if not images:
        print(f"{session_id}: NO IMAGE. text={str(text)[:200]}")
        return False
    with open(raw_path, "wb") as f:
        f.write(base64.b64decode(images[0]["data"]))
    return True


async def main():
    if not await gen_raw("owl-fly-1", FRAME1, "/app/scripts/owl_fly1_raw.png"):
        return
    # frame 2 uses frame 1 as the style/size reference for consistency
    with open("/app/scripts/owl_fly1_raw.png", "rb") as f:
        ref = base64.b64encode(f.read()).decode("utf-8")
    if not await gen_raw("owl-fly-2", "Using this image as the exact character reference, paint the SAME owl as a matching animation frame: " + FRAME2, "/app/scripts/owl_fly2_raw.png", ref):
        return
    f1 = flood_key(Image.open("/app/scripts/owl_fly1_raw.png"))
    f2 = flood_key(Image.open("/app/scripts/owl_fly2_raw.png"))
    b1, b2 = f1.getbbox(), f2.getbbox()
    print("f1 bbox", b1, "f2 bbox", b2)
    pad = 6
    x0 = max(0, min(b1[0], b2[0]) - pad); y0 = max(0, min(b1[1], b2[1]) - pad)
    x1 = min(f1.width, max(b1[2], b2[2]) + pad); y1 = min(f1.height, max(b1[3], b2[3]) + pad)
    uw, uh = x1 - x0, y1 - y0
    c1, c2 = f1.crop((x0, y0, x1, y1)), f2.crop((x0, y0, x1, y1))
    max_h = 340
    if uh > max_h:
        r = max_h / uh
        c1 = c1.resize((int(uw * r), max_h), Image.LANCZOS)
        c2 = c2.resize((int(uw * r), max_h), Image.LANCZOS)
    c1.save("/app/frontend/public/owl-fly-1.png", optimize=True)
    c2.save("/app/frontend/public/owl-fly-2.png", optimize=True)
    print("saved:", c1.size, "| AR %.4f" % (c1.height / c1.width))


if __name__ == "__main__":
    asyncio.run(main())
