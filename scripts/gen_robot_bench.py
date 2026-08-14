"""Workbench prop: a smaller robot of the golems' design family lying
partially assembled/disassembled on a heavy work table."""
import asyncio
import base64
import os

from dotenv import load_dotenv

load_dotenv("/app/backend/.env")
from emergentintegrations.llm.chat import LlmChat, UserMessage, ImageContent

with open("/app/frontend/public/steam-golem-right.png", "rb") as f:
    REF = base64.b64encode(f.read()).decode("utf-8")

PROMPT = (
    "Using the attached robot as the design family reference, create a heavy weathered iron WORK TABLE "
    "with a SMALLER robot of the same bronze/brass steampunk design lying on its back on the table, "
    "PARTIALLY DISASSEMBLED mid-build: chest plate open showing gears and pipes inside, one arm detached "
    "and lying beside it, its head resting separately on the table with dark unlit eye lenses, scattered "
    "cogs, wrenches and rivets around it, a dangling chain hoist above one end. Waist-high table, "
    "straight-on side view, one single prop. Photorealistic gritty steampunk: weathered dark cast iron, "
    "aged brass/copper with green patina, rust, oil stains. A couple of small indicator lamps on a side "
    "panel are lit warm amber. Isolated on a plain solid white background, whole object visible, "
    "no people, no text."
)


async def main() -> None:
    chat = LlmChat(api_key=os.getenv("EMERGENT_LLM_KEY"), session_id="robot-bench", system_message="You are an expert prop concept artist.")
    chat.with_model("gemini", "gemini-3.1-flash-image-preview").with_params(modalities=["image", "text"])
    text, images = await chat.send_message_multimodal_response(UserMessage(text=PROMPT, file_contents=[ImageContent(REF)]))
    if not images:
        print(f"NO IMAGE ({(text or '')[:100]})")
        return
    with open("/app/frontend/public/robot-bench.png", "wb") as f:
        f.write(base64.b64decode(images[0]["data"]))
    print("saved robot-bench.png")


asyncio.run(main())
