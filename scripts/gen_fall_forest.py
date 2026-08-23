"""Dark fall forest background for the Fall realm makeover.

Brief: dark autumn woods with clearly DARK PATCHES between the trunks where
glowing CSS eyes will hide. Portrait mobile background, bottom-anchored.
"""
import asyncio
import base64
import os

from dotenv import load_dotenv
from emergentintegrations.llm.chat import LlmChat, UserMessage

load_dotenv("/app/backend/.env")

PROMPT = (
    "A dark moody autumn forest at night, richly detailed digital painting. "
    "Tall oak and maple trunks in near-silhouette with glowing amber, rust "
    "and crimson fall foliage catching faint cold moonlight from above. "
    "Between and behind the trunks are DEEP BLACK shadow pockets and dark "
    "hollows — large patches of pure darkness where unseen creatures could "
    "hide. A thin ground mist drifts over fallen leaves on the forest floor. "
    "A few fireflies of warm light drift in the middle distance. Bottom "
    "two-thirds is the forest, top third fades to a very dark desaturated "
    "night sky through the canopy. TALL PORTRAIT 3:4 composition suitable "
    "as a mobile app background, painterly cinematic quality, dark "
    "atmospheric color grade (deep browns, burnt orange highlights, near "
    "black shadows). No animals, no eyes, no people, no text, no watermark."
)


async def main():
    chat = (
        LlmChat(api_key=os.environ["EMERGENT_LLM_KEY"], session_id="fall-forest",
                system_message="You are an expert illustrator producing app background art.")
        .with_model("gemini", "gemini-3.1-flash-image-preview")
        .with_params(modalities=["image", "text"])
    )
    text, images = await chat.send_message_multimodal_response(UserMessage(text=PROMPT))
    if not images:
        print("NO IMAGE:", (text or "")[:300])
        return
    data = base64.b64decode(images[0]["data"])
    with open("/app/frontend/public/fall-forest-dark.png", "wb") as f:
        f.write(data)
    print("saved fall-forest-dark.png", len(data), "bytes")


asyncio.run(main())
