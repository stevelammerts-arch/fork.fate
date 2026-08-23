"""Fresh WIDE fall forest: trees genuinely FAR AWAY across a clearing."""
import asyncio
import base64
import os

from dotenv import load_dotenv
from emergentintegrations.llm.chat import LlmChat, UserMessage

load_dotenv("/app/backend/.env")

PROMPT = (
    "A dark autumn night panorama, WIDE LANDSCAPE 16:9, richly detailed "
    "painterly digital painting. Viewpoint from the edge of a wide misty "
    "clearing covered in fallen leaves: the forest sits FAR IN THE DISTANCE "
    "— a low treeline of small faraway oaks and maples occupying only the "
    "lower quarter of the frame, their amber and rust foliage barely catching "
    "cold moonlight. Large expanse of dark night sky above with a glowing "
    "crescent moon and faint stars. The distant treeline has DEEP BLACK gaps "
    "and hollows between the tree clusters where unseen creatures could "
    "hide. Thin ground mist rolls across the clearing, a few fireflies "
    "drift in the middle distance. Strong sense of depth and distance, "
    "atmospheric haze softening the faraway trees, dark cinematic color "
    "grade (deep browns, burnt orange, near-black shadows). No animals, no "
    "eyes, no people, no text, no watermark."
)


async def main():
    chat = (
        LlmChat(api_key=os.environ["EMERGENT_LLM_KEY"], session_id="fall-forest-wide-v2",
                system_message="You are an expert illustrator producing app background art.")
        .with_model("gemini", "gemini-3.1-flash-image-preview")
        .with_params(modalities=["image", "text"])
    )
    text, images = await chat.send_message_multimodal_response(UserMessage(text=PROMPT))
    if not images:
        print("NO IMAGE:", (text or "")[:300])
        return
    with open("/app/frontend/public/fall-forest-dark-wide.png", "wb") as f:
        f.write(base64.b64decode(images[0]["data"]))
    print("saved fall-forest-dark-wide.png")


asyncio.run(main())
