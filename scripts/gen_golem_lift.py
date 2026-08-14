"""Generate the mid-step 'lift' frame for the right golem's awakening walk:
right knee raised in the air, body leaning forward, before the foot plants."""
import asyncio
import base64
import os

from dotenv import load_dotenv

load_dotenv("/app/backend/.env")
from emergentintegrations.llm.chat import LlmChat, UserMessage, ImageContent

with open("/app/frontend/public/steam-golem-right.png", "rb") as f:
    REF = base64.b64encode(f.read()).decode("utf-8")

PROMPT = (
    "Edit this sleeping steampunk automaton golem: it has WOKEN UP and is MID-STEP — head raised "
    "looking straight ahead, eye lenses glowing eerie smoky green, its RIGHT knee lifted high with the "
    "right foot OFF THE GROUND in the air, body leaning slightly forward with weight on the left leg, "
    "arms slightly out for balance. "
    "Keep EVERYTHING else about this exact robot identical: same design, same bronze/brass weathered "
    "materials, same proportions, same three chimney stacks on the back, same lighting, same camera "
    "angle, same scale and position in the frame, left foot in the same floor position. "
    "Isolated on a plain solid white background, full body visible, nothing cropped, no text."
)


async def main() -> None:
    chat = LlmChat(api_key=os.getenv("EMERGENT_LLM_KEY"), session_id="golem-wake-lift", system_message="You are an expert sprite artist.")
    chat.with_model("gemini", "gemini-3.1-flash-image-preview").with_params(modalities=["image", "text"])
    text, images = await chat.send_message_multimodal_response(UserMessage(text=PROMPT, file_contents=[ImageContent(REF)]))
    if not images:
        print(f"NO IMAGE ({(text or '')[:100]})")
        return
    with open("/app/scripts/golem_wake_lift_raw.png", "wb") as f:
        f.write(base64.b64decode(images[0]["data"]))
    print("saved /app/scripts/golem_wake_lift_raw.png")


asyncio.run(main())
