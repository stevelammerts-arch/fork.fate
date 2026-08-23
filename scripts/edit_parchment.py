"""Edit the parchment: replace the DUPLICATE bottom-right crossed fork &
knife doodle with a frothy beer mug sketch (pub crawls!). Keeps everything
else identical.
"""
import asyncio
import base64
import os

from dotenv import load_dotenv
from emergentintegrations.llm.chat import LlmChat, UserMessage, ImageContent

load_dotenv("/app/backend/.env")

PROMPT = (
    "Edit this aged parchment image. In the BOTTOM-RIGHT corner there are two "
    "similar hand-drawn crossed fork-and-knife sketches stacked vertically. "
    "Replace ONLY the LOWER one (the bottom-right corner drawing) with a "
    "hand-drawn sepia ink sketch of a frothy beer mug / tankard with foam, in "
    "the exact same old naturalist field-journal ink style and same size. "
    "Keep every other drawing, stain, crease and the paper texture EXACTLY "
    "identical. No text, no words, no watermark."
)


async def main():
    with open("/app/frontend/public/guide-parchment.png", "rb") as f:
        ref = base64.b64encode(f.read()).decode()
    chat = (
        LlmChat(api_key=os.environ["EMERGENT_LLM_KEY"], session_id="parchment-edit",
                system_message="You are an expert illustrator editing app art.")
        .with_model("gemini", "gemini-3.1-flash-image-preview")
        .with_params(modalities=["image", "text"])
    )
    text, images = await chat.send_message_multimodal_response(
        UserMessage(text=PROMPT, file_contents=[ImageContent(ref)])
    )
    if not images:
        print("NO IMAGE:", (text or "")[:300])
        return
    data = base64.b64decode(images[0]["data"])
    with open("/app/frontend/public/guide-parchment-v2.png", "wb") as f:
        f.write(data)
    print("saved guide-parchment-v2.png", len(data), "bytes")


asyncio.run(main())
