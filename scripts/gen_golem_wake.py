"""Generate two pose variants of the right steampunk golem (Boiler colossus)
for the rare 'awakening' ambient event: (A) head raised, eyes glowing smoky
green; (B) same but taking a step forward with his right leg.
Edits reference the existing in-game sprite so the design stays identical."""
import asyncio
import base64
import os
import sys

from dotenv import load_dotenv

load_dotenv("/app/backend/.env")
from emergentintegrations.llm.chat import LlmChat, UserMessage, ImageContent

with open("/app/frontend/public/steam-golem-right.png", "rb") as f:
    REF = base64.b64encode(f.read()).decode("utf-8")

COMMON = (
    "Keep EVERYTHING else about this exact robot identical: same design, same bronze/brass "
    "weathered materials, same proportions, same three chimney stacks on the back, same lighting, "
    "same camera angle, same scale and position in the frame, feet in the same floor position. "
    "Isolated on a plain solid white background, full body visible, nothing cropped, no text."
)

POSES = {
    "awake": (
        "Edit this sleeping steampunk automaton golem so it has WOKEN UP: raise its head to look "
        "straight ahead (chin up, no longer slumped), and make its two eye lenses glow an eerie "
        "smoky green with a soft green haze around them. " + COMMON
    ),
    "step": (
        "Edit this steampunk automaton golem: head raised looking straight ahead, eye lenses glowing "
        "eerie smoky green, and it is TAKING A STEP FORWARD with its RIGHT leg — right leg lifted and "
        "planted slightly forward, body weight shifted, left leg back. " + COMMON
    ),
}


async def gen(name: str, prompt: str) -> None:
    chat = LlmChat(api_key=os.getenv("EMERGENT_LLM_KEY"), session_id=f"golem-wake-{name}", system_message="You are an expert sprite artist.")
    chat.with_model("gemini", "gemini-3.1-flash-image-preview").with_params(modalities=["image", "text"])
    msg = UserMessage(text=prompt, file_contents=[ImageContent(REF)])
    text, images = await chat.send_message_multimodal_response(msg)
    if not images:
        print(f"{name}: NO IMAGE ({(text or '')[:100]})")
        return
    out = f"/app/scripts/golem_wake_{name}_raw.png"
    with open(out, "wb") as f:
        f.write(base64.b64decode(images[0]["data"]))
    print(f"{name}: saved {out}")


async def main() -> None:
    for k, p in POSES.items():
        try:
            await gen(k, p)
        except Exception as e:  # noqa: BLE001
            print(f"{k}: FAILED {e}")


asyncio.run(main())
