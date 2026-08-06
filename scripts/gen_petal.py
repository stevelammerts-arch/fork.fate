"""Generate a realistic single pink cherry blossom petal sprite.
-> /app/frontend/public/petal-pink.png (small, keyed from black)
"""
import asyncio
import base64
import os

from dotenv import load_dotenv
from PIL import Image

from gen_snowman import flood_key, trim

load_dotenv("/app/backend/.env")

PROMPT = (
    "One single REALISTIC cherry blossom petal, seen from above: a soft "
    "rosy-pink sakura petal with a delicate notch at its tip, gently cupped "
    "and slightly curled, translucent with fine natural veining, fading to "
    "a paler blush white toward the base, soft natural light. JUST ONE "
    "petal, no flower, no stem, no leaves. PURE SOLID BLACK background "
    "(#000000). Centered with clear black space all around."
)


async def main():
    from emergentintegrations.llm.chat import LlmChat, UserMessage
    chat = LlmChat(
        api_key=os.getenv("EMERGENT_LLM_KEY"),
        session_id="petal-pink",
        system_message="You are an expert botanical illustrator.",
    )
    chat.with_model("gemini", "gemini-3.1-flash-image-preview").with_params(modalities=["image", "text"])
    text, images = await chat.send_message_multimodal_response(UserMessage(text=PROMPT))
    if not images:
        print("NO IMAGE:", str(text)[:200])
        return
    with open("/app/scripts/petal_pink_raw.png", "wb") as f:
        f.write(base64.b64decode(images[0]["data"]))
    sprite = trim(flood_key(Image.open("/app/scripts/petal_pink_raw.png")))
    max_h = 96
    if sprite.height > max_h:
        r = max_h / sprite.height
        sprite = sprite.resize((max(1, int(sprite.width * r)), max_h), Image.LANCZOS)
    sprite.save("/app/frontend/public/petal-pink.png", optimize=True)
    print("saved", sprite.size)


if __name__ == "__main__":
    asyncio.run(main())
