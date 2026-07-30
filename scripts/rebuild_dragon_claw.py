"""Rebuild the user-approved dragon-claw layout as a transparent PNG.

The customer-assets pipeline re-encoded the user's screenshot to JPEG (mode
RGB, no alpha), so we can't just save it. Instead, we send the reference
image to Nano Banana and ask it to recreate the same composition on a fully
transparent background — matching claws, colors and positions.
"""
import asyncio
import base64
import os
import sys

from dotenv import load_dotenv
from emergentintegrations.llm.chat import LlmChat, UserMessage, ImageContent

load_dotenv("/app/backend/.env")

SRC_REF = "/tmp/user_claw.jpeg"
OUT = "/app/frontend/public/dragon-claw.png"

PROMPT = (
    "Recreate this reference dragon-claw image EXACTLY as shown — same "
    "number and placement of claws, same bronze/copper scaled dragon skin, "
    "same obsidian-black talons, same lighting, same composition — but "
    "with these strict changes:\n"
    "1) The background must be COMPLETELY TRANSPARENT (alpha channel PNG). "
    "The gray checker pattern in the reference is NOT part of the image — "
    "it just represents transparency. Do not draw any checker pattern.\n"
    "2) The rectangular card area in the middle must be COMPLETELY "
    "TRANSPARENT — do not draw anything inside the card gap.\n"
    "3) Keep the same claws: one thumb curling around the LEFT edge of the "
    "card, plus fingers/talons draping over the top and right side. Do not "
    "add or remove claws — match the reference exactly.\n"
    "4) The dragon forearm at the bottom of the image should also remain "
    "visible below the card, same as reference.\n"
    "Output: transparent PNG, aspect ratio 3:4 portrait, same size and "
    "composition as the reference. No text, no watermark, no checker pattern."
)


async def main():
    api_key = os.getenv("EMERGENT_LLM_KEY")
    if not api_key:
        sys.exit("EMERGENT_LLM_KEY missing")
    with open(SRC_REF, "rb") as f:
        image_b64 = base64.b64encode(f.read()).decode("utf-8")

    chat = (
        LlmChat(api_key=api_key, session_id="dragon-claw-rebuild",
                system_message="You are an expert photo editor producing seamless PNG overlay assets with alpha transparency.")
        .with_model("gemini", "gemini-3.1-flash-image-preview")
        .with_params(modalities=["image", "text"])
    )
    msg = UserMessage(text=PROMPT, file_contents=[ImageContent(image_b64)])
    text, images = await chat.send_message_multimodal_response(msg)
    print("text:", (text or "")[:200])
    if not images:
        sys.exit("no images returned")
    data = base64.b64decode(images[0]["data"])
    with open(OUT, "wb") as f:
        f.write(data)
    print(f"saved -> {OUT} ({len(data)} bytes)")


asyncio.run(main())
