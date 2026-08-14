"""Regenerate the golem's lift + step frames using the OTHER leg
(the leg on the LEFT side of the image)."""
import asyncio
import base64
import os

from dotenv import load_dotenv

load_dotenv("/app/backend/.env")
from emergentintegrations.llm.chat import LlmChat, UserMessage, ImageContent

with open("/app/frontend/public/steam-golem-right.png", "rb") as f:
    REF = base64.b64encode(f.read()).decode("utf-8")

COMMON = (
    "Keep EVERYTHING else about this exact robot identical: same design, same bronze/brass weathered "
    "materials, same proportions, same three chimney stacks on the back, same lighting, same camera "
    "angle, same scale and position in the frame. "
    "Isolated on a plain solid white background, full body visible, nothing cropped, no text."
)

POSES = {
    "lift": (
        "Edit this sleeping steampunk automaton golem: it has WOKEN UP and is MID-STEP — head raised "
        "looking straight ahead, eye lenses glowing eerie smoky green. It lifts the leg on the LEFT SIDE "
        "OF THE IMAGE: that knee raised high with that foot OFF THE GROUND in the air, body leaning "
        "slightly forward, all its weight on the other leg (the one on the right side of the image), "
        "which stays planted in its original floor position. Arms slightly out for balance. " + COMMON
    ),
    "step": (
        "Edit this sleeping steampunk automaton golem: it has WOKEN UP — head raised looking straight "
        "ahead, eye lenses glowing eerie smoky green, and it is TAKING A STEP FORWARD with the leg on "
        "the LEFT SIDE OF THE IMAGE: that foot planted slightly forward toward the viewer, body weight "
        "shifted onto it and leaning forward, the other leg (right side of the image) trailing behind "
        "in its original floor position. " + COMMON
    ),
}


async def main() -> None:
    for name, prompt in POSES.items():
        try:
            chat = LlmChat(api_key=os.getenv("EMERGENT_LLM_KEY"), session_id=f"golem-otherleg-{name}", system_message="You are an expert sprite artist.")
            chat.with_model("gemini", "gemini-3.1-flash-image-preview").with_params(modalities=["image", "text"])
            text, images = await chat.send_message_multimodal_response(UserMessage(text=prompt, file_contents=[ImageContent(REF)]))
            if not images:
                print(f"{name}: NO IMAGE ({(text or '')[:100]})")
                continue
            with open(f"/app/scripts/golem_otherleg_{name}_raw.png", "wb") as f:
                f.write(base64.b64decode(images[0]["data"]))
            print(f"{name}: saved")
        except Exception as e:  # noqa: BLE001
            print(f"{name}: FAILED {e}")


asyncio.run(main())
