"""Variant of the rack robot with his head STRAIGHTENED (he powers up and looks
forward during workshop events). Everything else must stay identical so the
two sprites can cross-fade in place."""
import asyncio
import base64
import io
import os

from dotenv import load_dotenv
from PIL import Image

load_dotenv("/app/backend/.env")
from emergentintegrations.llm.chat import LlmChat, UserMessage, ImageContent

# send the current sprite composited on white so the model sees the exact frame
im = Image.open("/app/frontend/public/steam-robot-rack.png").convert("RGBA")
bg = Image.new("RGBA", im.size, (255, 255, 255, 255))
bg.alpha_composite(im)
buf = io.BytesIO()
bg.convert("RGB").save(buf, format="PNG")
REF = base64.b64encode(buf.getvalue()).decode("utf-8")

PROMPT = (
    "Edit this image of a steampunk automaton robot strapped upright to an assembly rack. "
    "THE ONLY CHANGE: the robot's head is currently slumped/tilted down to the side — raise and "
    "STRAIGHTEN the head so it faces directly forward, upright and alert, with both round eye lenses "
    "level and looking straight ahead. "
    "Keep absolutely everything else pixel-identical: same body pose, same straps, same rack frame, "
    "same pulley and chains, same control panel, same tool tray, same missing right arm with exposed "
    "gears, same materials, lighting, scale and position in the frame. "
    "Plain solid white background, no text."
)


async def main() -> None:
    chat = LlmChat(api_key=os.getenv("EMERGENT_LLM_KEY"), session_id="rack-head-up", system_message="You are an expert sprite artist.")
    chat.with_model("gemini", "gemini-3.1-flash-image-preview").with_params(modalities=["image", "text"])
    text, images = await chat.send_message_multimodal_response(UserMessage(text=PROMPT, file_contents=[ImageContent(REF)]))
    if not images:
        print(f"NO IMAGE ({(text or '')[:100]})")
        return
    with open("/app/scripts/rack_headup_raw.png", "wb") as f:
        f.write(base64.b64decode(images[0]["data"]))
    print("saved /app/scripts/rack_headup_raw.png")


asyncio.run(main())
