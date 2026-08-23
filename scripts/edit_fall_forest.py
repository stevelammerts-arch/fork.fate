"""Perspective fix: pull the forest camera BACK so background trees read
smaller/more distant (both orientations), keeping style + dark pockets.
Overwrites fall-forest-dark.png / fall-forest-dark-wide.png in place.
"""
import asyncio
import base64
import os

from dotenv import load_dotenv
from emergentintegrations.llm.chat import LlmChat, UserMessage, ImageContent

load_dotenv("/app/backend/.env")

EDIT = (
    "Edit this dark autumn forest painting: make ALL the trees noticeably "
    "SMALLER and MORE DISTANT — as if the camera stepped back about 40 "
    "meters — so the trunks are roughly HALF their current apparent size, "
    "with more open misty foreground of fallen leaves at the bottom and "
    "more visible night sky above the canopy. KEEP: the same painterly "
    "style, dark color grade, the crescent moon, the fireflies, the ground "
    "mist, and especially the large DEEP BLACK shadow pockets between the "
    "trees. No animals, no eyes, no people, no text, no watermark."
)

FILES = ["fall-forest-dark.png", "fall-forest-dark-wide.png"]


async def run(name):
    path = f"/app/frontend/public/{name}"
    with open(path, "rb") as f:
        ref = base64.b64encode(f.read()).decode()
    chat = (
        LlmChat(api_key=os.environ["EMERGENT_LLM_KEY"], session_id=f"forest-edit-{name}",
                system_message="You are an expert illustrator editing app background art.")
        .with_model("gemini", "gemini-3.1-flash-image-preview")
        .with_params(modalities=["image", "text"])
    )
    text, images = await chat.send_message_multimodal_response(
        UserMessage(text=EDIT, file_contents=[ImageContent(ref)])
    )
    if not images:
        print(name, "NO IMAGE:", (text or "")[:200])
        return
    data = base64.b64decode(images[0]["data"])
    with open(path, "wb") as f:
        f.write(data)
    print("saved", name, len(data), "bytes")


async def main():
    for n in FILES:
        await run(n)


asyncio.run(main())
