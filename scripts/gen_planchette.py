"""Generate a realistic ouija planchette prop (top-down, magenta-keyed to alpha)."""
import asyncio
import base64
import os
import sys

from dotenv import load_dotenv
from emergentintegrations.llm.chat import LlmChat, UserMessage
from gen_steam_mask_floor import key_alpha

load_dotenv("/app/backend/.env")

PROMPT = (
    "An antique wooden OUIJA PLANCHETTE viewed from DIRECTLY ABOVE (perfect "
    "top-down view), classic heart / teardrop shape with the pointed tip "
    "facing UP, aged dark walnut wood with worn varnish, scratches and deep "
    "grain, a round CLEAR GLASS LENS window near the pointed tip rimmed in "
    "tarnished brass, three small brass feet visible at the edges. "
    "Richly detailed gothic painterly digital art, moody candlelit shading, "
    "strong three-dimensional form with clear light and shadow. Shown "
    "COMPLETELY ALONE, centered, filling most of the frame, on a PERFECTLY "
    "FLAT SOLID PURE MAGENTA background (#FF00FF) with no gradient, no "
    "floor, no shadow on the background, no text, no watermark, no border."
)


async def main():
    chat = (
        LlmChat(api_key=os.getenv("EMERGENT_LLM_KEY"), session_id="reaper-planchette",
                system_message="You are an expert prop artist producing game asset art.")
        .with_model("gemini", "gemini-3.1-flash-image-preview")
        .with_params(modalities=["image", "text"])
    )
    text, images = await chat.send_message_multimodal_response(UserMessage(text=PROMPT))
    if not images:
        print(f"planchette: no image ({(text or '')[:100]})", file=sys.stderr)
        return
    raw = "/app/frontend/public/reaper-planchette-raw.png"
    with open(raw, "wb") as f:
        f.write(base64.b64decode(images[0]["data"]))
    key_alpha(raw, "/app/frontend/public/reaper-planchette.png")
    print("saved /app/frontend/public/reaper-planchette.png")


if __name__ == "__main__":
    asyncio.run(main())
