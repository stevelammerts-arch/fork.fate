"""Scarecrow wave frame: same scarecrow, one arm raised waving.
Overlaid on the base frame periodically for a friendly wave.
Saves /app/frontend/public/fall-scarecrow-wave.png
"""
import asyncio
import base64
import os

from dotenv import load_dotenv
from emergentintegrations.llm.chat import LlmChat, UserMessage, ImageContent

load_dotenv("/app/backend/.env")

EDIT = (
    "Edit this scarecrow character image: raise its RIGHT arm (viewer's "
    "left side) up off the crossbar into a friendly WAVING pose — arm bent "
    "upward at the elbow, gloved hand open, clearly waving hello. Keep "
    "EVERYTHING else absolutely identical: same pose, same head, same "
    "clothes, same colors, same lighting, same art style, same position in "
    "frame, same image dimensions, and keep the background fully "
    "TRANSPARENT. No text, no watermark."
)


async def main():
    with open("/app/frontend/public/fall-scarecrow.png", "rb") as f:
        ref = base64.b64encode(f.read()).decode()
    chat = (
        LlmChat(api_key=os.environ["EMERGENT_LLM_KEY"], session_id="scarecrow-wave",
                system_message="You are an expert illustrator editing game sprites.")
        .with_model("gemini", "gemini-3.1-flash-image-preview")
        .with_params(modalities=["image", "text"])
    )
    text, images = await chat.send_message_multimodal_response(
        UserMessage(text=EDIT, file_contents=[ImageContent(ref)])
    )
    if not images:
        print("NO IMAGE:", (text or "")[:200])
        return
    data = base64.b64decode(images[0]["data"])
    with open("/app/frontend/public/fall-scarecrow-wave.png", "wb") as f:
        f.write(data)
    print("saved fall-scarecrow-wave.png", len(data), "bytes")


asyncio.run(main())
