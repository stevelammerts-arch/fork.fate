"""Generate the rack robot's detached, unfinished arm lying on the workshop
floor — matches the strapped assembly-rack robot it belongs to."""
import asyncio
import base64
import os

from dotenv import load_dotenv

load_dotenv("/app/backend/.env")
from emergentintegrations.llm.chat import LlmChat, UserMessage, ImageContent

with open("/app/frontend/public/steam-robot-rack.png", "rb") as f:
    REF = base64.b64encode(f.read()).decode("utf-8")

PROMPT = (
    "Using this steampunk automaton robot as the exact style reference, create its DETACHED, "
    "UNFINISHED RIGHT ARM lying flat on the ground, viewed from the side at eye level. "
    "The arm matches the robot's design perfectly: same weathered bronze/brass riveted armor plates, "
    "same segmented mechanical fingers as the robot's other hand. It is clearly UNFINISHED and mid-assembly: "
    "the shoulder end is open, exposing brass gears, springs and a few loose copper wires sticking out; "
    "one forearm plate is missing showing the inner clockwork skeleton. "
    "The arm lies horizontally, resting on the floor, gentle contact shadow beneath it. "
    "Isolated on a plain solid white background, whole arm visible, nothing cropped, no text, "
    "photorealistic render matching the reference robot's materials and lighting."
)


async def main() -> None:
    chat = LlmChat(api_key=os.getenv("EMERGENT_LLM_KEY"), session_id="rack-arm-floor", system_message="You are an expert sprite artist.")
    chat.with_model("gemini", "gemini-3.1-flash-image-preview").with_params(modalities=["image", "text"])
    text, images = await chat.send_message_multimodal_response(UserMessage(text=PROMPT, file_contents=[ImageContent(REF)]))
    if not images:
        print(f"NO IMAGE ({(text or '')[:100]})")
        return
    with open("/app/scripts/rack_arm_raw.png", "wb") as f:
        f.write(base64.b64decode(images[0]["data"]))
    print("saved /app/scripts/rack_arm_raw.png")


asyncio.run(main())
