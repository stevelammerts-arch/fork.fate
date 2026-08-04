"""Generate a painterly tropical island volcano for the VolcanoReveal ritual.
Magenta-keyed to alpha (same pipeline as steampunk props)."""
import asyncio
import base64
import os
import sys

from dotenv import load_dotenv
from emergentintegrations.llm.chat import LlmChat, UserMessage
from gen_steam_mask_floor import key_alpha

load_dotenv("/app/backend/.env")

PROMPT = (
    "A dramatic tropical island VOLCANO at night, viewed from the base looking "
    "up, richly detailed painterly digital art. Steep dark volcanic rock cone "
    "with rugged ridges, deep shadowed crevices and layered lava rock texture, "
    "the crater rim at the top glowing hot orange-red from within, faint "
    "ember light spilling down the upper ridges, a few silhouetted palm "
    "fronds at the very bottom corners for scale, subtle warm rim lighting. "
    "Strong three-dimensional form with clear light and shadow. The volcano "
    "is shown COMPLETELY ALONE, centered, filling most of the frame, on a "
    "PERFECTLY FLAT SOLID PURE MAGENTA background (#FF00FF) with no gradient, "
    "no sky, no stars, no smoke plume, no text, no watermark, no border."
)


async def main():
    chat = (
        LlmChat(api_key=os.getenv("EMERGENT_LLM_KEY"), session_id="tiki-volcano",
                system_message="You are an expert environment artist producing game asset art.")
        .with_model("gemini", "gemini-3.1-flash-image-preview")
        .with_params(modalities=["image", "text"])
    )
    text, images = await chat.send_message_multimodal_response(UserMessage(text=PROMPT))
    if not images:
        print(f"no image returned ({(text or '')[:120]})", file=sys.stderr)
        sys.exit(1)
    raw = "/app/frontend/public/tiki-volcano-raw.png"
    with open(raw, "wb") as f:
        f.write(base64.b64decode(images[0]["data"]))
    print(f"saved -> {raw}")
    key_alpha(raw, "/app/frontend/public/tiki-volcano.png")


if __name__ == "__main__":
    asyncio.run(main())
