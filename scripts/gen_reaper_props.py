"""Generate painterly Reaper ritual props: coffin (closed + open) and a candle.
Magenta-keyed to alpha (same pipeline as steampunk props)."""
import asyncio
import base64
import os
import sys

from dotenv import load_dotenv
from emergentintegrations.llm.chat import LlmChat, UserMessage
from gen_steam_mask_floor import key_alpha

load_dotenv("/app/backend/.env")

STYLE = (
    "Richly detailed gothic painterly digital art, aged dark wood with worn "
    "carvings, moody candlelit shading, strong three-dimensional form with "
    "clear light and shadow. Shown COMPLETELY ALONE, centered, filling most "
    "of the frame, on a PERFECTLY FLAT SOLID PURE MAGENTA background "
    "(#FF00FF) with no gradient, no floor, no shadow on the background, "
    "no text, no watermark, no border."
)

PROMPTS = {
    "coffin-closed": (
        "An old wooden COFFIN standing upright, viewed straight on, tall "
        "hexagonal toe-pincher shape, dark aged oak planks with iron nails "
        "and a tarnished brass cross mounted on the closed lid, scuffed "
        "edges and deep wood grain. TALL PORTRAIT composition. " + STYLE
    ),
    "coffin-open": (
        "The SAME old wooden toe-pincher COFFIN standing upright viewed "
        "straight on, but with its lid swung open to the left side revealing "
        "the empty interior glowing with eerie ghostly GREEN soul-light from "
        "within, tattered dark lining, the open lid visible at an angle on "
        "the left with its brass cross. TALL PORTRAIT composition. " + STYLE
    ),
    "candle": (
        "A single old melted PILLAR CANDLE, cream-colored wax with heavy "
        "drips running down the sides, sitting in a small tarnished brass "
        "holder, NO FLAME — the wick is visible and unlit, slightly crooked "
        "with age. TALL PORTRAIT composition. " + STYLE
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


async def main():
    for name, prompt in PROMPTS.items():
        await gen(name, prompt)


if __name__ == "__main__":
    asyncio.run(main())

# Tiki mug rides in this batch too (saved as tiki-mug.png)
TIKI_PROMPT = (
    "A carved wooden TIKI COCKTAIL MUG with a fierce traditional carved "
    "face — heavy brows, big oval eyes, bared zigzag teeth — rich koa wood "
    "tones with deep carved grooves, a bright orange tropical drink visible "
    "at the rim, garnished with a fresh lime wheel and a pink straw. "
    "Richly detailed painterly digital art, warm tropical bar lighting, "
    "strong three-dimensional form. Shown COMPLETELY ALONE, centered, "
    "filling most of the frame, TALL PORTRAIT composition, on a PERFECTLY "
    "FLAT SOLID PURE MAGENTA background (#FF00FF) with no gradient, no "
    "floor, no shadow on the background, no text, no watermark, no border."
)
