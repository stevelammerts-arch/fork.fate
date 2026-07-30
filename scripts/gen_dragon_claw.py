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
    "A single photorealistic dragon paw gripping a rectangular card-shaped "
    "empty area in the center of the image. STRICT anatomy — the paw has "
    "EXACTLY FOUR CLAWS TOTAL and no more: ONE opposable thumb-claw curling "
    "around the LEFT edge of the card near the middle (thumb is a bit shorter "
    "and hooked), and THREE finger-claws draping over the RIGHT edge of the "
    "card evenly spaced from top to bottom, each curling inward toward the "
    "card. Do NOT add extra fingers, do NOT add a fifth claw, do NOT add a "
    "pinky. Four claws total, no more, no less. Texture: bronze and copper-red "
    "scaled reptilian skin with subtle molten-gold rim light along the edges "
    "(matching a fire-lit red-bronze dragon in a treasure hoard cave). "
    "Obsidian-black pointed nails on every talon. The center rectangular card "
    "area (roughly 55% width, 70% height, centered) must be COMPLETELY "
    "TRANSPARENT — do not draw anything inside the card gap. No arms, no "
    "wrist, no dragon body — just the one hand cropped tightly around the "
    "card. Fully transparent background (alpha channel). Aspect ratio 3:4 "
    "portrait, high detail, moody cinematic lighting from below, no text, "
    "no watermark."
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
