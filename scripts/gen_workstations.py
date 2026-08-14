"""Generate 3 waist-high steampunk work station props (dials, knobs, lit
buttons, switches) matching the realm's weathered iron + brass style."""
import asyncio
import base64
import os

from dotenv import load_dotenv

load_dotenv("/app/backend/.env")
from emergentintegrations.llm.chat import LlmChat, UserMessage

STYLE = (
    "Photorealistic gritty steampunk style: heavily weathered dark cast iron frame, aged brass and "
    "copper with green patina, rust streaks, oil stains, rivets. WAIST-HIGH free-standing work station "
    "console (about hip height on a person), straight-on side view suitable as a scene prop. Some small "
    "indicator lamp buttons are LIT (warm amber and red glowing bulbs). Isolated on a plain solid white "
    "background, whole object visible, no people, no text."
)

STATIONS = {
    1: "A brass boiler-gauge console: sloped top panel with rows of round pressure dials of different "
       "sizes, big red mushroom buttons, brass toggle switches, a small side crank handle, pipes running "
       "into the floor.",
    2: "A telegraph switchboard desk: upright back panel with a bank of flip switches and small glowing "
       "indicator lamps, dangling patch cables plugged into brass sockets, rotary knobs along the front "
       "edge, an angled brass key on the desktop.",
    3: "A valve-control pedestal: a large red hand-wheel valve mounted on top, an angled gauge cluster "
       "with three dials, a column of colored indicator lamps, heavy lever switches on the sides, thick "
       "copper pipes entering its base.",
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
