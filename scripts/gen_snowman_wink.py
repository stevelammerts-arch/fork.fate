"""Generate the winking frame for the Winter snowman heist head.

Image-to-image edit of the existing head (snowman_head_raw.png, WHITE bg):
same head, but one eye closed in a cheeky wink. Both frames are then keyed
(white flood) and cropped with the SAME union bbox so they align pixel-
perfect for a brief overlay wink. Prints the new dims/AR for the JSX.
"""
import asyncio
import base64
import os

from dotenv import load_dotenv
from PIL import Image

from gen_reaper_fly import flood_key_white, trim  # noqa: F401 (trim unused; union crop below)

load_dotenv("/app/backend/.env")

PROMPT = (
    "Using this image as the exact reference, reproduce the SAME storybook "
    "snowman head IDENTICALLY — same round snowball head, same black top "
    "hat with holly, same long orange carrot nose pointing LEFT, same coal-"
    "dot smile, same painterly style, same size and position in the frame — "
    "with ONE change only: the RIGHT eye (on the right side of the face) is "
    "now CLOSED in a cheeky wink, drawn as a small curved closed-eyelid "
    "line, while the left eye stays open. PURE SOLID WHITE background "
    "(#FFFFFF), nothing else."
)


async def main():
    from emergentintegrations.llm.chat import LlmChat, UserMessage, ImageContent
    with open("/app/scripts/snowman_head_raw.png", "rb") as f:
        ref = base64.b64encode(f.read()).decode("utf-8")
    chat = LlmChat(
        api_key=os.getenv("EMERGENT_LLM_KEY"),
        session_id="snowman-head-wink",
        system_message="You are an expert character sprite artist.",
    )
    chat.with_model("gemini", "gemini-3.1-flash-image-preview").with_params(modalities=["image", "text"])
    text, images = await chat.send_message_multimodal_response(
        UserMessage(text=PROMPT, file_contents=[ImageContent(ref)])
    )
    if not images:
        print("NO IMAGE:", str(text)[:200])
        return
    with open("/app/scripts/snowman_wink_raw.png", "wb") as f:
        f.write(base64.b64decode(images[0]["data"]))

    base = flood_key_white(Image.open("/app/scripts/snowman_head_raw.png"), thresh=240)
    wink = flood_key_white(Image.open("/app/scripts/snowman_wink_raw.png"), thresh=240)
    bb, wb = base.getbbox(), wink.getbbox()
    print("base bbox", bb, "wink bbox", wb)
    pad = 6
    x0 = max(0, min(bb[0], wb[0]) - pad); y0 = max(0, min(bb[1], wb[1]) - pad)
    x1 = min(base.width, max(bb[2], wb[2]) + pad); y1 = min(base.height, max(bb[3], wb[3]) + pad)
    uw, uh = x1 - x0, y1 - y0
    base_c, wink_c = base.crop((x0, y0, x1, y1)), wink.crop((x0, y0, x1, y1))
    max_h = 220
    if uh > max_h:
        r = max_h / uh
        base_c = base_c.resize((int(uw * r), max_h), Image.LANCZOS)
        wink_c = wink_c.resize((int(uw * r), max_h), Image.LANCZOS)
    base_c.save("/app/frontend/public/snowman-head.png", optimize=True)
    wink_c.save("/app/frontend/public/snowman-head-wink.png", optimize=True)
    print("saved:", base_c.size, "| AR %.4f" % (base_c.height / base_c.width))


if __name__ == "__main__":
    asyncio.run(main())
