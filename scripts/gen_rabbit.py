"""Generate a tiny realistic rabbit sprite for the spring scene (magenta-keyed)."""
import asyncio
import base64
import os
import sys

from dotenv import load_dotenv
from emergentintegrations.llm.chat import LlmChat, UserMessage
from gen_steam_mask_floor import key_alpha

load_dotenv("/app/backend/.env")

PROMPT = (
    "A small cute WILD RABBIT in profile side view facing right, mid-hop "
    "pose with front paws tucked and hind legs extended, soft brown-gray "
    "fur with a white cotton tail and upright ears. Photorealistic, "
    "richly detailed fur, natural spring daylight, strong three-dimensional "
    "form. Shown COMPLETELY ALONE, centered, filling most of the frame, on "
    "a PERFECTLY FLAT SOLID PURE MAGENTA background (#FF00FF) with no "
    "gradient, no floor, no shadow on the background, no text, no "
    "watermark, no border."
)


async def main():
    chat = (
        LlmChat(api_key=os.getenv("EMERGENT_LLM_KEY"), session_id="spring-rabbit",
                system_message="You are an expert prop artist producing game asset art.")
        .with_model("gemini", "gemini-3.1-flash-image-preview")
        .with_params(modalities=["image", "text"])
    )
    text, images = await chat.send_message_multimodal_response(UserMessage(text=PROMPT))
    if not images:
        print(f"rabbit: no image ({(text or '')[:100]})", file=sys.stderr)
        return
    raw = "/app/frontend/public/spring-rabbit-raw.png"
    with open(raw, "wb") as f:
        f.write(base64.b64decode(images[0]["data"]))
    key_alpha(raw, "/app/frontend/public/spring-rabbit.png")
    print("saved /app/frontend/public/spring-rabbit.png")


if __name__ == "__main__":
    asyncio.run(main())
