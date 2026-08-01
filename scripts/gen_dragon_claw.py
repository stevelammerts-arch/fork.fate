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
    "A single photorealistic dragon paw gripping a TALL PORTRAIT playing "
    "card in the center of the image. STRICT COMPOSITION — critical: the "
    "empty card-shaped hole in the middle MUST be a TALL PORTRAIT "
    "rectangle, clearly TALLER than it is wide (width to height ratio "
    "about 3:5, like a tarot card standing upright). The hole occupies "
    "roughly 42% of the canvas width and 62% of the canvas height, "
    "centered. Anatomy: ONE opposable thumb-claw on the LEFT curling "
    "around the card's LEFT edge at mid-height (hooked, short), and THREE "
    "longer finger-claws draping over the RIGHT edge of the card, evenly "
    "spaced from near the top of the card to near the bottom of the card "
    "so they span most of the card's height, each curling inward over the "
    "card face. Four claws total, ALL connected to the palm — no detached "
    "floating claws anywhere. The palm sits BEHIND the card so only the "
    "claw fingers wrap around in front. NO WRIST, NO ARM, NO FOREARM. "
    "Texture: bronze and copper-red scaled reptilian skin with molten-gold "
    "rim light along the edges. Obsidian-black pointed nails. The center "
    "tall rectangular card area must be COMPLETELY TRANSPARENT / empty. "
    "Fully transparent background (alpha channel). Aspect ratio 3:4 "
    "portrait canvas, high detail, moody cinematic lighting, no text, no "
    "watermark. The thumb tip and the three finger claw tips must reach "
    "INTO the transparent card hole so they visibly overlap the card when "
    "composited."
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
