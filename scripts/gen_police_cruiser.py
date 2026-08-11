#!/usr/bin/env python3
"""Generate the cyber police cruiser sprite with Nano Banana, using the
existing spinner SUV as the style reference so it matches the scene's
vehicles. Then key the white background to transparency (edge flood fill)."""
import asyncio
import base64
import os
import sys
from dotenv import load_dotenv

load_dotenv("/app/backend/.env")

from emergentintegrations.llm.chat import LlmChat, UserMessage, ImageContent  # noqa: E402

FACING = sys.argv[1] if len(sys.argv) > 1 else "right"
OUT = f"/tmp/police_raw_{FACING}.png"

async def main():
    ref_path = "/tmp/police_keyed_right.png" if FACING == "left" and os.path.exists("/tmp/police_keyed_right.png") else "/app/frontend/public/cyber-spinner-suv.png"
    with open(ref_path, "rb") as f:
        ref_b64 = base64.b64encode(f.read()).decode("utf-8")

    chat = LlmChat(
        api_key=os.getenv("EMERGENT_LLM_KEY"),
        session_id=f"cyber-police-{FACING}",
        system_message="You are an expert cyberpunk vehicle concept artist.",
    )
    chat.with_model("gemini", "gemini-3.1-flash-image-preview").with_params(modalities=["image", "text"])

    if FACING == "right":
        text = (
            "Using this cyberpunk hover SUV as the exact style reference (same rendering style, "
            "same glowing cyan hover pods instead of wheels, same neon edge lighting), create a "
            "FUTURISTIC POLICE CRUISER version: classic black-and-white police livery — black hood, "
            "roof and rear, white front doors — with the unit number \"07\" in large black digits on "
            "the white front door and the word POLICE in white letters on the black rear quarter panel. "
            "Two small round emergency beacons (one red, one blue) mounted above the windshield. "
            "STRICT: full side profile view facing RIGHT, whole vehicle visible, hovering with glowing "
            "cyan pods beneath, centered on a PURE WHITE background, no shadow, no ground, no other objects."
        )
    else:
        text = (
            "This is a cyberpunk police hover cruiser facing right. Create the EXACT same vehicle "
            "(identical black-and-white livery, identical unit number 07 on the white front door reading "
            "normally left-to-right, identical POLICE lettering reading normally, same red and blue round "
            "beacons above the windshield, same glowing cyan hover pods) but as a full side profile view "
            "facing LEFT instead. The lettering must NOT be mirrored — it must read normally. "
            "Centered on a PURE WHITE background, no shadow, no ground, no other objects."
        )

    msg = UserMessage(text=text, file_contents=[ImageContent(ref_b64)])
    text_out, images = await chat.send_message_multimodal_response(msg)
    print("text:", (text_out or "")[:120])
    if not images:
        print("NO IMAGE RETURNED")
        sys.exit(1)
    raw = base64.b64decode(images[0]["data"])
    with open(OUT, "wb") as f:
        f.write(raw)
    print("saved", OUT, len(raw), "bytes")

asyncio.run(main())
