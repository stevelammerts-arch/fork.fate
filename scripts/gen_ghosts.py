"""Generate two tattered spectral ghost sprites for the Reaper GhostRise
flourish (magenta-keyed to alpha), matching the user's reference style."""
import asyncio
import base64
import os
import sys

from dotenv import load_dotenv
from emergentintegrations.llm.chat import LlmChat, UserMessage
from gen_steam_mask_floor import key_alpha

load_dotenv("/app/backend/.env")

STYLE = (
    "Dark haunting painterly digital art with ink-splatter texture, "
    "monochrome white / gray / near-black palette, ragged tattered edges "
    "dissolving into wisps of smoke and dripping ink at the bottom. Full "
    "figure shown COMPLETELY ALONE, centered, filling most of the frame, "
    "TALL PORTRAIT composition, on a PERFECTLY FLAT SOLID PURE MAGENTA "
    "background (#FF00FF) with no gradient, no floor, no shadow on the "
    "background, no text, no watermark, no border."
)

PROMPTS = {
    "ghost-1": (
        "A terrifying SHEET GHOST wraith: a flowing white burial shroud "
        "draped over a gaunt figure, two hollow BLACK EYE SOCKETS and a "
        "dark skeletal nose-and-mouth stain on the fabric face, black ink "
        "bleeding down the shroud like tears, one ragged shadowy clawed "
        "hand reaching out, the sheet swirling and trailing off to one "
        "side into torn windswept streamers. " + STYLE
    ),
    "ghost-2": (
        "A tall faceless HOODED PHANTOM: a spectral figure fully shrouded "
        "in a long tattered gray-blue veil, the hood hanging low over a "
        "pitch-black void where the face should be, long draped sleeves, "
        "the robe streaking downward into translucent mist and shredded "
        "wisps at the base as if the ghost is evaporating. " + STYLE
    ),
}


async def gen(name, prompt):
    chat = (
        LlmChat(api_key=os.getenv("EMERGENT_LLM_KEY"), session_id=f"reaper-{name}",
                system_message="You are an expert prop artist producing game asset art.")
        .with_model("gemini", "gemini-3.1-flash-image-preview")
        .with_params(modalities=["image", "text"])
    )
    text, images = await chat.send_message_multimodal_response(UserMessage(text=prompt))
    if not images:
        print(f"{name}: no image ({(text or '')[:100]})", file=sys.stderr)
        return
    raw = f"/app/frontend/public/reaper-{name}-raw.png"
    with open(raw, "wb") as f:
        f.write(base64.b64decode(images[0]["data"]))
    key_alpha(raw, f"/app/frontend/public/reaper-{name}.png")
    print(f"saved reaper-{name}.png")


async def main():
    for name, prompt in PROMPTS.items():
        await gen(name, prompt)


if __name__ == "__main__":
    asyncio.run(main())
