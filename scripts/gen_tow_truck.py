#!/usr/bin/env python3
"""Generate the cyber hover TOW TRUCK sprite with Nano Banana, using the keyed
police cruiser as the style reference so it matches the scene's vehicles.
Key the white background afterwards with key_police.py."""
import asyncio
import base64
import os
from dotenv import load_dotenv

load_dotenv("/app/backend/.env")

from emergentintegrations.llm.chat import LlmChat, UserMessage, ImageContent  # noqa: E402

OUT = "/tmp/tow_raw_left.png"

async def main():
    with open("/app/frontend/public/cyber-police-left.png", "rb") as f:
        ref_b64 = base64.b64encode(f.read()).decode("utf-8")

    chat = LlmChat(
        api_key=os.getenv("EMERGENT_LLM_KEY"),
        session_id="cyber-tow-left",
        system_message="You are an expert cyberpunk vehicle concept artist.",
    )
    chat.with_model("gemini", "gemini-3.1-flash-image-preview").with_params(modalities=["image", "text"])

    text = (
        "Using this cyberpunk hover police cruiser as the exact style reference (same rendering "
        "style, same glowing cyan hover pods instead of wheels, same neon edge lighting), create a "
        "FUTURISTIC HOVER TOW TRUCK: a chunky industrial wrecker truck with a short cab at the front "
        "and an open flatbed rear with a small crane arm / tow boom at the back, hazard-yellow and "
        "dark grey paint with black chevron warning stripes on the rear, a small amber warning beacon "
        "on the cab roof, the word TOW in black letters on the cab door. "
        "STRICT: full side profile view facing LEFT, whole vehicle visible, hovering with glowing "
        "cyan pods beneath, centered on a PURE WHITE background, no shadow, no ground, no other objects, "
        "no tow cable, nothing attached to the boom."
    )

    msg = UserMessage(text=text, file_contents=[ImageContent(ref_b64)])
    text_out, images = await chat.send_message_multimodal_response(msg)
    print("text:", (text_out or "")[:120])
    if not images:
        print("NO IMAGE RETURNED")
        raise SystemExit(1)
    raw = base64.b64decode(images[0]["data"])
    with open(OUT, "wb") as f:
        f.write(raw)
    print("saved", OUT, len(raw), "bytes")

asyncio.run(main())
