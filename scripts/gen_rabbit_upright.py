#!/usr/bin/env python3
"""Generate the upright 'sitting up' rabbit frame with Nano Banana, using the
existing side-profile rabbit as the reference so fur/color match, then key
the white background to transparency."""
import asyncio
import base64
import os
import sys
from dotenv import load_dotenv

load_dotenv("/app/backend/.env")

from emergentintegrations.llm.chat import LlmChat, UserMessage, ImageContent  # noqa: E402


async def main():
    with open("/app/frontend/public/spring-rabbit.png", "rb") as f:
        ref_b64 = base64.b64encode(f.read()).decode("utf-8")

    chat = LlmChat(
        api_key=os.getenv("EMERGENT_LLM_KEY"),
        session_id="rabbit-upright-sprite",
        system_message="You are an expert wildlife sprite artist.",
    )
    chat.with_model("gemini", "gemini-3.1-flash-image-preview").with_params(modalities=["image", "text"])

    msg = UserMessage(
        text=(
            "Using the exact same rabbit from this reference photo (same fur colors, "
            "same breed, same photorealistic style), create a full-body image of it "
            "STANDING FULLY UPRIGHT on its hind legs like an alert prairie-dog pose: "
            "body vertical, head up, ears tall and erect, front paws tucked against its "
            "chest, facing the camera directly. Whole rabbit visible including hind feet. "
            "Centered on a PURE WHITE background, no shadow, no other objects."
        ),
        file_contents=[ImageContent(ref_b64)],
    )
    text, images = await chat.send_message_multimodal_response(msg)
    print("text:", (text or "")[:120])
    if not images:
        print("NO IMAGE RETURNED")
        sys.exit(1)
    raw = base64.b64decode(images[0]["data"])
    with open("/tmp/rabbit_up_raw.png", "wb") as f:
        f.write(raw)
    print("saved /tmp/rabbit_up_raw.png", len(raw), "bytes")


asyncio.run(main())
