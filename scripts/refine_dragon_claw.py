"""Refine the dragon-claw asset by editing the previously-generated PNG:
remove the topmost claw and the visible arm/wrist so we end up with exactly
4 claws (1 thumb + 3 fingers) framing the card gap.
"""
import asyncio
import base64
import os
import sys

from dotenv import load_dotenv
from emergentintegrations.llm.chat import LlmChat, UserMessage, ImageContent

load_dotenv("/app/backend/.env")

SRC = "/app/frontend/public/dragon-claw.png"
OUT = "/app/frontend/public/dragon-claw.png"

EDIT_PROMPT = (
    "Edit this dragon-claw image. Keep the overall style, colors, textures and "
    "the transparent card-shaped gap in the center exactly the same. Make "
    "these changes:\n"
    "1) REMOVE the topmost claw that is curling over the very top of the "
    "card. It should not be there.\n"
    "2) REMOVE the entire dragon arm / wrist / forearm at the bottom of the "
    "image below the card — the arm should not be visible. The bottom of the "
    "image should be fully transparent below the card.\n"
    "3) KEEP the single thumb claw on the LEFT side of the card (curling "
    "around the left edge).\n"
    "4) KEEP the three finger claws on the RIGHT side of the card, evenly "
    "spaced from top to bottom.\n"
    "Result: exactly FOUR claws total (1 thumb on left + 3 fingers on right). "
    "Everything else (the transparent card gap, the bronze/copper scaled skin "
    "texture, the obsidian talons, the moody lighting) stays identical. "
    "Transparent background."
)


async def main():
    api_key = os.getenv("EMERGENT_LLM_KEY")
    if not api_key:
        sys.exit("EMERGENT_LLM_KEY missing")

    with open(SRC, "rb") as f:
        image_b64 = base64.b64encode(f.read()).decode("utf-8")

    chat = (
        LlmChat(api_key=api_key, session_id="dragon-claw-refine",
                system_message="You are an expert photo editor producing seamless PNG overlay assets with alpha transparency.")
        .with_model("gemini", "gemini-3.1-flash-image-preview")
        .with_params(modalities=["image", "text"])
    )
    msg = UserMessage(text=EDIT_PROMPT, file_contents=[ImageContent(image_b64)])
    text, images = await chat.send_message_multimodal_response(msg)
    print("text:", (text or "")[:200])
    if not images:
        sys.exit("no images returned")
    data = base64.b64decode(images[0]["data"])
    with open(OUT, "wb") as f:
        f.write(data)
    print(f"saved -> {OUT} ({len(data)} bytes)")


asyncio.run(main())
