"""Two more waist-high steampunk work station options (4 and 5)."""
import asyncio
import base64
import os

from dotenv import load_dotenv

load_dotenv("/app/backend/.env")
from emergentintegrations.llm.chat import LlmChat, UserMessage

STYLE = (
    "Photorealistic gritty steampunk style: heavily weathered dark cast iron frame, aged brass and "
    "copper with green patina, rust streaks, oil stains, rivets. WAIST-HIGH free-standing work station "
    "console (about hip height on a person), straight-on view, ONE single object only, suitable as a "
    "scene prop. Some small indicator lamp buttons are LIT (warm amber and red glowing bulbs). "
    "Isolated on a plain solid white background, whole object visible, no people, no text."
)

STATIONS = {
    4: "An alchemist analysis bench: brass-framed rack of glass vials and a small bubbling alembic on "
       "top, a sloped front panel with rotary knobs, flip switches and glowing indicator lamps, a "
       "magnifying lens on an articulated arm, small drawers underneath.",
    5: "A difference-engine calculating station: exposed rotating brass number drums and gear trains "
       "behind a glass panel on top, rows of typewriter-style keys and lever switches on the front, "
       "a column of blinking indicator lamps on one side, a hand crank on the other.",
}


async def main() -> None:
    for i, desc in STATIONS.items():
        try:
            chat = LlmChat(api_key=os.getenv("EMERGENT_LLM_KEY"), session_id=f"workstation-{i}", system_message="You are an expert prop concept artist.")
            chat.with_model("gemini", "gemini-3.1-flash-image-preview").with_params(modalities=["image", "text"])
            text, images = await chat.send_message_multimodal_response(UserMessage(text=f"{desc} {STYLE}"))
            if not images:
                print(f"station {i}: NO IMAGE ({(text or '')[:80]})")
                continue
            with open(f"/app/frontend/public/workstation-{i}.png", "wb") as f:
                f.write(base64.b64decode(images[0]["data"]))
            print(f"station {i}: saved")
        except Exception as e:  # noqa: BLE001
            print(f"station {i}: FAILED {e}")


asyncio.run(main())
