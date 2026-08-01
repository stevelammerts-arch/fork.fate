"""Generate a dragon-claw overlay PNG for the reveal card in the Dragon's Hoard theme.

Mirrors the layout of /app/frontend/public/skeleton-hand.png: transparent
background, dragon talons framing a card-shaped negative space in the middle
so a rectangular reveal card slots inside as if the beast is gripping it.

Uses Gemini Nano Banana (gemini-3.1-flash-image-preview) via emergentintegrations.
Saves the result to /app/frontend/public/dragon-claw.png.
"""
import asyncio
import base64
import os
import sys

from dotenv import load_dotenv
from emergentintegrations.llm.chat import LlmChat, UserMessage

load_dotenv("/app/backend/.env")

OUT_PATH = "/app/frontend/public/dragon-claw.png"

PROMPT = (
    "A single photorealistic dragon paw gripping a rectangular card in the "
    "center of the image. STRICT COMPOSITION — critical: paint the thumb at "
    "the FAR LEFT EDGE of the image (extending to the very left border of "
    "the canvas), and paint the three finger claws at the FAR RIGHT EDGE "
    "of the image (extending to the very right border of the canvas). The "
    "palm sits at the center. Anatomy: ONE opposable thumb-claw curling "
    "around the LEFT edge of the card (hooked, short), and THREE longer "
    "finger-claws draping over the RIGHT edge of the card evenly spaced "
    "from top to bottom, each curling inward. Four claws total. NO WRIST, "
    "NO ARM, NO FOREARM — nothing below the palm. The bottom third of the "
    "image is empty (transparent). Texture: bronze and copper-red scaled "
    "reptilian skin with molten-gold rim light along the edges. "
    "Obsidian-black pointed nails. The center rectangular card area "
    "(roughly 40% width, 65% height, centered) must be COMPLETELY "
    "TRANSPARENT. Fully transparent background (alpha channel). Aspect "
    "ratio 3:4 portrait, high detail, moody cinematic lighting, no text, "
    "no watermark. The thumb and finger claws must nearly touch the LEFT "
    "and RIGHT canvas edges respectively so that when this image is "
    "overlaid on a card, the claws extend visually past the card's edges."
)


async def main():
    api_key = os.getenv("EMERGENT_LLM_KEY")
    if not api_key:
        print("EMERGENT_LLM_KEY missing in /app/backend/.env", file=sys.stderr)
        sys.exit(1)

    chat = (
        LlmChat(api_key=api_key, session_id="dragon-claw-gen", system_message="You are an expert digital illustrator producing seamless PNG overlay assets.")
        .with_model("gemini", "gemini-3.1-flash-image-preview")
        .with_params(modalities=["image", "text"])
    )
    msg = UserMessage(text=PROMPT)
    text, images = await chat.send_message_multimodal_response(msg)
    print("model text:", (text or "")[:200])
    if not images:
        print("no images returned", file=sys.stderr)
        sys.exit(2)
    img = images[0]
    print(f"mime={img.get('mime_type')} bytes~{len(img.get('data', ''))}")
    data = base64.b64decode(img["data"])
    with open(OUT_PATH, "wb") as f:
        f.write(data)
    print(f"saved -> {OUT_PATH} ({len(data)} bytes)")


asyncio.run(main())
