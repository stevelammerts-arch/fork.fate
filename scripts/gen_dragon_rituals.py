"""Generate Dragon's Hoard ritual props: dragon eye (closed + open) and
treasure chest (closed + open). Magenta-keyed to alpha (same pipeline)."""
import asyncio
import base64
import os
import sys

from dotenv import load_dotenv
from emergentintegrations.llm.chat import LlmChat, UserMessage
from gen_steam_mask_floor import key_alpha

load_dotenv("/app/backend/.env")

STYLE = (
    "Richly detailed fantasy painterly digital art, warm torch-lit treasure "
    "cave shading, strong three-dimensional form with clear light and "
    "shadow. Shown COMPLETELY ALONE, centered, filling most of the frame, "
    "on a PERFECTLY FLAT SOLID PURE MAGENTA background (#FF00FF) with no "
    "gradient, no floor, no shadow on the background, no text, no "
    "watermark, no border."
)

PROMPTS = {
    "eye-closed": (
        "A giant sleeping DRAGON'S CLOSED EYE seen up close and straight on, "
        "heavy scaled eyelid shut, deep crimson and dark bronze scales with "
        "ridged brow horns above, a faint warm glow seeping through the "
        "closed lid seam. WIDE LANDSCAPE composition, the eye and "
        "surrounding scales filling the frame. " + STYLE
    ),
    "eye-open": (
        "The SAME giant DRAGON'S EYE seen up close and straight on but now "
        "WIDE OPEN: a huge molten-gold reptilian eye with a narrow black "
        "vertical slit pupil, glowing amber iris with fiery veins, wet "
        "glassy reflection, surrounded by the same crimson and dark bronze "
        "scales and ridged brow horns. WIDE LANDSCAPE composition, the eye "
        "and surrounding scales filling the frame. " + STYLE
    ),
    "chest-closed": (
        "An old iron-banded wooden TREASURE CHEST, CLOSED, viewed straight "
        "on, dark oak with riveted tarnished iron straps and a big heavy "
        "iron PADLOCK on the front hasp, a few gold coins spilled at its "
        "base and gold coin edges peeking from under the lid seam. " + STYLE
    ),
    "chest-open": (
        "The SAME old iron-banded wooden TREASURE CHEST viewed straight on "
        "but with the lid thrown WIDE OPEN and the broken padlock hanging "
        "loose, OVERFLOWING with glowing gold coins, goblets and gems "
        "spilling over the front edge, warm golden light blazing up from "
        "inside the chest. " + STYLE
    ),
}


async def gen(name, prompt):
    chat = (
        LlmChat(api_key=os.getenv("EMERGENT_LLM_KEY"), session_id=f"hoard-{name}",
                system_message="You are an expert prop artist producing game asset art.")
        .with_model("gemini", "gemini-3.1-flash-image-preview")
        .with_params(modalities=["image", "text"])
    )
    text, images = await chat.send_message_multimodal_response(UserMessage(text=prompt))
    if not images:
        print(f"{name}: no image ({(text or '')[:100]})", file=sys.stderr)
        return
    raw = f"/app/frontend/public/hoard-{name}-raw.png"
    with open(raw, "wb") as f:
        f.write(base64.b64decode(images[0]["data"]))
    key_alpha(raw, f"/app/frontend/public/hoard-{name}.png")
    print(f"saved hoard-{name}.png")


async def main():
    for name, prompt in PROMPTS.items():
        await gen(name, prompt)


if __name__ == "__main__":
    asyncio.run(main())
