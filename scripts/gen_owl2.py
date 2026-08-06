"""Regenerate ONLY frame 2 of the owl (wings swept DOWN) and re-align both
frames with a fresh union crop."""
import asyncio
import base64
import os

from dotenv import load_dotenv
from PIL import Image

from gen_snowman import flood_key

load_dotenv("/app/backend/.env")

PROMPT = (
    "Using this image as the exact character reference, paint the SAME "
    "great horned owl as the NEXT animation frame of its wingbeat: "
    "IDENTICAL owl, identical size, identical position in the frame, "
    "identical lowered open talons reaching forward-down — but with BOTH "
    "WINGS SWEPT FULLY DOWNWARD, wingtips pointing DOWN below its belly at "
    "the bottom of the downstroke (the wings must clearly point down, NOT "
    "up). Side profile flying LEFT. PURE SOLID BLACK background (#000000), "
    "no scenery. Centered."
)


async def main():
    from emergentintegrations.llm.chat import LlmChat, UserMessage, ImageContent
    with open("/app/scripts/owl_fly1_raw.png", "rb") as f:
        ref = base64.b64encode(f.read()).decode("utf-8")
    chat = LlmChat(
        api_key=os.getenv("EMERGENT_LLM_KEY"),
        session_id="owl-fly-2b",
        system_message="You are an expert character sprite artist.",
    )
    chat.with_model("gemini", "gemini-3.1-flash-image-preview").with_params(modalities=["image", "text"])
    text, images = await chat.send_message_multimodal_response(
        UserMessage(text=PROMPT, file_contents=[ImageContent(ref)])
    )
    if not images:
        print("NO IMAGE:", str(text)[:200])
        return
    with open("/app/scripts/owl_fly2_raw.png", "wb") as f:
        f.write(base64.b64decode(images[0]["data"]))
    f1 = flood_key(Image.open("/app/scripts/owl_fly1_raw.png"))
    f2 = flood_key(Image.open("/app/scripts/owl_fly2_raw.png"))
    b1, b2 = f1.getbbox(), f2.getbbox()
    print("f1 bbox", b1, "f2 bbox", b2)
    pad = 6
    x0 = max(0, min(b1[0], b2[0]) - pad); y0 = max(0, min(b1[1], b2[1]) - pad)
    x1 = min(f1.width, max(b1[2], b2[2]) + pad); y1 = min(f1.height, max(b1[3], b2[3]) + pad)
    uw, uh = x1 - x0, y1 - y0
    c1, c2 = f1.crop((x0, y0, x1, y1)), f2.crop((x0, y0, x1, y1))
    max_h = 340
    if uh > max_h:
        r = max_h / uh
        c1 = c1.resize((int(uw * r), max_h), Image.LANCZOS)
        c2 = c2.resize((int(uw * r), max_h), Image.LANCZOS)
    c1.save("/app/frontend/public/owl-fly-1.png", optimize=True)
    c2.save("/app/frontend/public/owl-fly-2.png", optimize=True)
    print("saved:", c1.size, "| AR %.4f" % (c1.height / c1.width))


if __name__ == "__main__":
    asyncio.run(main())
