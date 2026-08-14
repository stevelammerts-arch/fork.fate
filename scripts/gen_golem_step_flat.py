"""Fix the right golem's 'step' frame: the forward (right) foot currently
plants with the toes tilted UP — regenerate with the foot FLAT on the floor."""
import asyncio
import base64
import os

from dotenv import load_dotenv

load_dotenv("/app/backend/.env")
from emergentintegrations.llm.chat import LlmChat, UserMessage, ImageContent

with open("/app/frontend/public/steam-golem-right-step.png", "rb") as f:
    REF = base64.b64encode(f.read()).decode("utf-8")

PROMPT = (
    "Edit this steampunk automaton golem mid-step image. The ONLY change: its forward "
    "(right) foot is currently planted with the TOES TILTED UPWARD off the floor — fix it so that "
    "forward foot is planted COMPLETELY FLAT on the ground, sole fully in contact with the floor, "
    "toes down and level with the heel. "
    "Keep EVERYTHING else about this exact robot identical: same pose, same head raised with glowing "
    "smoky green eye lenses, same design, same bronze/brass weathered materials, same proportions, "
    "same three chimney stacks on the back, same lighting, same camera angle, same scale and position "
    "in the frame, back foot unchanged. "
    "Isolated on a plain solid white background, full body visible, nothing cropped, no text."
)


async def main() -> None:
    chat = LlmChat(api_key=os.getenv("EMERGENT_LLM_KEY"), session_id="golem-step-flat", system_message="You are an expert sprite artist.")
    chat.with_model("gemini", "gemini-3.1-flash-image-preview").with_params(modalities=["image", "text"])
    text, images = await chat.send_message_multimodal_response(UserMessage(text=PROMPT, file_contents=[ImageContent(REF)]))
    if not images:
        print(f"NO IMAGE ({(text or '')[:100]})")
        return
    with open("/app/scripts/golem_step_flat_raw.png", "wb") as f:
        f.write(base64.b64decode(images[0]["data"]))
    print("saved /app/scripts/golem_step_flat_raw.png")


asyncio.run(main())
