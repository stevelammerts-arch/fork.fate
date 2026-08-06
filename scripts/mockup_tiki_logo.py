"""Mock up the Tiki Lounge logo: the FF medallion re-imagined as a carved
dark koa-wood tiki disc. Uses the gold crest as the composition reference.
Preview saved to /app/scripts/tiki_logo_mock.png (transparent, keyed)."""
import asyncio
import base64
import os

from dotenv import load_dotenv
from PIL import Image

from gen_tiki_man import flood_key, trim

load_dotenv("/app/backend/.env")

PROMPT = (
    "Using this gold medallion as the exact composition reference, re-carve "
    "it as a TIKI medallion: a perfectly circular disc of dark koa wood, the "
    "same central crest design CHISELED into the wood in deep relief, the "
    "rim ringed with small carved tiki-mask faces and tribal zigzag "
    "patterns, two tiny carved torch flames at the top sides. Warm brown "
    "wood tones with subtle faded TEAL and BURNT-ORANGE painted accents "
    "rubbed into the carvings, warm torchlight highlights. Painterly, "
    "matching a dark tiki lounge. PURE SOLID BLACK background (#000000), "
    "medallion centered with clear black space around it."
)


async def main():
    from emergentintegrations.llm.chat import LlmChat, UserMessage, ImageContent
    with open("/app/frontend/public/logo-crest-gold.png", "rb") as f:
        ref = base64.b64encode(f.read()).decode("utf-8")
    chat = LlmChat(
        api_key=os.getenv("EMERGENT_LLM_KEY"),
        session_id="tiki-logo-mock",
        system_message="You are an expert ornament and logo artist.",
    )
    chat.with_model("gemini", "gemini-3.1-flash-image-preview").with_params(modalities=["image", "text"])
    text, images = await chat.send_message_multimodal_response(
        UserMessage(text=PROMPT, file_contents=[ImageContent(ref)])
    )
    if not images:
        print(f"NO IMAGE. text={str(text)[:200]}")
        return
    with open("/app/scripts/tiki_logo_raw.png", "wb") as f:
        f.write(base64.b64decode(images[0]["data"]))
    disc = trim(flood_key(Image.open("/app/scripts/tiki_logo_raw.png")), pad=8)
    if disc.width > 900:
        r = 900 / disc.width
        disc = disc.resize((900, max(1, int(disc.height * r))), Image.LANCZOS)
    disc.save("/app/scripts/tiki_logo_mock.png", optimize=True)
    print("saved /app/scripts/tiki_logo_mock.png", disc.size)


if __name__ == "__main__":
    asyncio.run(main())
