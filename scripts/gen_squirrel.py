"""Generate a small realistic squirrel sprite for the fall scene (magenta-keyed).
Writes to /tmp first; copied into /app/frontend/public after the deploy window."""
import asyncio
import base64
import os
import sys

from dotenv import load_dotenv
from emergentintegrations.llm.chat import LlmChat, UserMessage
from gen_steam_mask_floor import key_alpha

load_dotenv("/app/backend/.env")

PROMPT = (
    "A small WILD GRAY-BROWN SQUIRREL in profile side view facing right, "
    "running pose with body stretched low to the ground and big bushy tail "
    "curved up behind it. Photorealistic, richly detailed fur, warm autumn "
    "daylight, strong three-dimensional form. Shown COMPLETELY ALONE, "
    "centered, filling most of the frame, on a PERFECTLY FLAT SOLID PURE "
    "MAGENTA background (#FF00FF) with no gradient, no floor, no shadow on "
    "the background, no text, no watermark, no border."
)


async def main():
    chat = (
        LlmChat(api_key=os.getenv("EMERGENT_LLM_KEY"), session_id="fall-squirrel",
                system_message="You are an expert prop artist producing game asset art.")
        .with_model("gemini", "gemini-3.1-flash-image-preview")
        .with_params(modalities=["image", "text"])
    )
    text, images = await chat.send_message_multimodal_response(UserMessage(text=PROMPT))
    if not images:
        print(f"squirrel: no image ({(text or '')[:100]})", file=sys.stderr)
        return
    raw = "/tmp/fall-squirrel-raw.png"
    with open(raw, "wb") as f:
        f.write(base64.b64decode(images[0]["data"]))
    key_alpha(raw, "/tmp/fall-squirrel.png")
    print("saved /tmp/fall-squirrel.png")


if __name__ == "__main__":
    asyncio.run(main())
