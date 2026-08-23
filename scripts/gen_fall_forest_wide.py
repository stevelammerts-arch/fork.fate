"""Landscape variant of the dark fall forest (phones held sideways)."""
import asyncio
import base64
import os

from dotenv import load_dotenv
from emergentintegrations.llm.chat import LlmChat, UserMessage

load_dotenv("/app/backend/.env")

PROMPT = (
    "A dark moody autumn forest at night, richly detailed digital painting, "
    "WIDE LANDSCAPE 16:9 panorama. A row of tall oak and maple trunks in "
    "near-silhouette spread across the frame with glowing amber, rust and "
    "crimson fall foliage catching faint cold moonlight. Between and behind "
    "the trunks are DEEP BLACK shadow pockets and dark hollows — large "
    "patches of pure darkness where unseen creatures could hide, spaced "
    "across the whole width. A thin ground mist drifts over fallen leaves "
    "on the forest floor. A few fireflies of warm light drift in the middle "
    "distance. A crescent moon glows through the canopy near the top. "
    "Painterly cinematic quality, dark atmospheric color grade (deep "
    "browns, burnt orange highlights, near black shadows). No animals, no "
    "eyes, no people, no text, no watermark."
)


async def main():
    chat = (
        LlmChat(api_key=os.environ["EMERGENT_LLM_KEY"], session_id="fall-forest-wide",
                system_message="You are an expert illustrator producing app background art.")
        .with_model("gemini", "gemini-3.1-flash-image-preview")
        .with_params(modalities=["image", "text"])
    )
    text, images = await chat.send_message_multimodal_response(UserMessage(text=PROMPT))
    if not images:
        print("NO IMAGE:", (text or "")[:300])
        return
    data = base64.b64decode(images[0]["data"])
    with open("/app/frontend/public/fall-forest-dark-wide.png", "wb") as f:
        f.write(data)
    print("saved fall-forest-dark-wide.png", len(data), "bytes")


asyncio.run(main())
