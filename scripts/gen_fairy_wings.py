"""Generate wing-flap overlay frames for the Fairy Gully background.

Sends /app/frontend/public/fairy-gully.png (896x1200) to Nano Banana twice:
frame "up" = wings raised in an upstroke, frame "down" = wings mid-downstroke.
Everything else must stay identical. Each result is resized back to 896x1200,
cropped to the fairy region and given feathered alpha edges so the patch
blends invisibly over the original painting.

Crop rect (image px): configurable below. Outputs:
  /app/frontend/public/fairy-wings-up.png
  /app/frontend/public/fairy-wings-down.png
  /app/scripts/fairy_full_up.png / fairy_full_down.png (full frames, for QA)
"""
import asyncio
import base64
import os
import sys

from dotenv import load_dotenv
from PIL import Image

load_dotenv("/app/backend/.env")

SRC = "/app/frontend/public/fairy-gully.png"
NAT_W, NAT_H = 896, 1200
# Generous rect around both fairies incl. full wing sweep room. Right edge =
# artwork edge (896) so no painted wing tips peek out beyond the patch.
RECT = (450, 380, 896, 830)  # x0, y0, x1, y1
FEATHER = 26  # px of linear alpha fade at each interior edge


def feathered_crop(full: Image.Image, name: str) -> None:
    x0, y0, x1, y1 = RECT
    crop = full.crop(RECT).convert("RGBA")
    w, h = crop.size
    alpha = Image.new("L", (w, h), 255)
    px = alpha.load()
    for y in range(h):
        for x in range(w):
            ds = []  # only feather edges that sit INSIDE the artwork
            if x0 > 0: ds.append(x)
            if x1 < NAT_W: ds.append(w - 1 - x)
            if y0 > 0: ds.append(y)
            if y1 < NAT_H: ds.append(h - 1 - y)
            d = min(ds)
            if d < FEATHER:
                px[x, y] = int(255 * d / FEATHER)
    crop.putalpha(alpha)
    out = f"/app/frontend/public/fairy-wings-{name}.png"
    crop.save(out, optimize=True)
    print(f"saved {out} {crop.size}")

FRAMES = {
    "up": (
        "Edit this fantasy painting. Keep EVERYTHING exactly identical - the "
        "composition, colors, lighting, the tree face, unicorn, mushrooms, "
        "flowers, butterflies, and both fairies' bodies, faces, hair, clothing "
        "and poses must not change at all. ONLY change: both fairies' large "
        "translucent iridescent wings should be RAISED HIGH in an upward "
        "wing-flap upstroke position, swept up above their shoulders. Same "
        "iridescent wing style and colors, just a different wing position."
    ),
    "down": (
        "Edit this fantasy painting. Treat it as a photocopy: every pixel must "
        "stay exactly identical - composition, colors, lighting, tree face, "
        "unicorn, mushrooms, flowers, butterflies. Both fairies' FACES, hair, "
        "head angle, bodies, arms, legs, clothing and flying poses must be "
        "pixel-identical to the original, do not redraw or rotate them. ONLY "
        "their large translucent iridescent wings change: sweep the wings "
        "DOWNWARD in a mid-downstroke flap, angled low behind their backs. "
        "Same iridescent wing style and colors, only the wing angle differs."
    ),
}


async def gen(name: str, prompt: str) -> None:
    from emergentintegrations.llm.chat import LlmChat, UserMessage, ImageContent

    with open(SRC, "rb") as f:
        src_b64 = base64.b64encode(f.read()).decode("utf-8")
    chat = LlmChat(
        api_key=os.getenv("EMERGENT_LLM_KEY"),
        session_id=f"fairy-wings-{name}",
        system_message="You are an expert digital painting editor.",
    )
    chat.with_model("gemini", "gemini-3.1-flash-image-preview").with_params(modalities=["image", "text"])
    text, images = await chat.send_message_multimodal_response(
        UserMessage(text=prompt, file_contents=[ImageContent(src_b64)])
    )
    if not images:
        print(f"FRAME {name}: NO IMAGE RETURNED. text={str(text)[:200]}")
        return
    raw = base64.b64decode(images[0]["data"])
    tmp = f"/app/scripts/fairy_full_{name}.png"
    with open(tmp, "wb") as f:
        f.write(raw)
    full = Image.open(tmp).convert("RGB")
    if full.size != (NAT_W, NAT_H):
        print(f"FRAME {name}: resizing {full.size} -> {(NAT_W, NAT_H)}")
        full = full.resize((NAT_W, NAT_H), Image.LANCZOS)
        full.save(tmp)
    feathered_crop(full, name)
    print(f"FRAME {name}: done")


async def main():
    which = sys.argv[1:] or list(FRAMES)
    for name in which:
        await gen(name, FRAMES[name])


if __name__ == "__main__":
    asyncio.run(main())
