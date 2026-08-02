"""Generate the Fairy Gully card-back emblem: a storybook red-capped mushroom
on the card's dark green background so it blends seamlessly.
Saves /app/frontend/public/fairy-mushroom.png
"""
import asyncio
import base64
import os
import sys

from dotenv import load_dotenv
from emergentintegrations.llm.chat import LlmChat, UserMessage

load_dotenv("/app/backend/.env")

PROMPT = (
    "A single enchanting storybook red-capped mushroom (fly agaric) with "
    "white spots, plump and slightly glowing, a few tiny green moss tufts "
    "and one tiny sparkle at its base, painted in a rich fantasy "
    "illustration style. Centered, portrait composition. The ENTIRE "
    "background must be a solid uniform very dark green color hex #0A1C11 "
    "with soft vignette only — no scenery, no border, no text, no "
    "watermark. Emblem style artwork for a playing-card back."
)


async def main():
    api_key = os.getenv("EMERGENT_LLM_KEY")
    if not api_key:
        sys.exit("EMERGENT_LLM_KEY missing")
    chat = (
        LlmChat(api_key=api_key, session_id="fairy-mushroom", system_message="You are an expert fantasy illustrator.")
        .with_model("gemini", "gemini-3.1-flash-image-preview")
        .with_params(modalities=["image", "text"])
    )
    text, images = await chat.send_message_multimodal_response(UserMessage(text=PROMPT))
    if not images:
        sys.exit(f"no image returned: {(text or '')[:120]}")
    data = base64.b64decode(images[0]["data"])
    with open("/app/frontend/public/fairy-mushroom.png", "wb") as f:
        f.write(data)
    print("saved fairy-mushroom.png", len(data) // 1024, "KB")


asyncio.run(main())
