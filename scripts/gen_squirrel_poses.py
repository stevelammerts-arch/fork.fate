#!/usr/bin/env python3
"""Generate extra squirrel poses with Nano Banana, using the existing
fall-squirrel.png as the exact style reference, for the Winter Stash heist
(rabbit-style multi-pose motion treatment)."""
import asyncio
import base64
import os
from dotenv import load_dotenv

load_dotenv("/app/backend/.env")

from emergentintegrations.llm.chat import LlmChat, UserMessage, ImageContent  # noqa: E402

POSES = {
    "sit": (
        "same squirrel now CROUCHED SITTING on all fours at rest, body compact, "
        "bushy tail curled up over its back in an S-curve, head up looking forward"
    ),
    "up": (
        "same squirrel now STANDING UPRIGHT on its hind legs, alert, front paws "
        "held together at its chest, bushy tail curled up behind it, head turned "
        "slightly as if looking around nervously"
    ),
    "hold": (
        "same squirrel now STANDING UPRIGHT on its hind legs HOLDING A SINGLE "
        "BROWN ACORN in its front paws at its chest, bushy tail curled up behind "
        "it, cheeks slightly puffed"
    ),
}

async def gen(pose, desc):
    with open("/app/frontend/public/fall-squirrel.png", "rb") as f:
        ref_b64 = base64.b64encode(f.read()).decode("utf-8")
    chat = LlmChat(
        api_key=os.getenv("EMERGENT_LLM_KEY"),
        session_id=f"squirrel-{pose}",
        system_message="You are an expert wildlife photo compositor.",
    )
    chat.with_model("gemini", "gemini-3.1-flash-image-preview").with_params(modalities=["image", "text"])
    text = (
        "Using this photorealistic grey-brown squirrel as the EXACT style and species reference "
        f"(same animal, same fur colours, same photographic realism), create: {desc}. "
        "STRICT: full side profile view FACING RIGHT, whole animal visible, centered on a PURE WHITE "
        "background, no shadow, no ground, no leaves, no other objects."
    )
    msg = UserMessage(text=text, file_contents=[ImageContent(ref_b64)])
    _, images = await chat.send_message_multimodal_response(msg)
    if not images:
        print(pose, "NO IMAGE")
        return
    raw = base64.b64decode(images[0]["data"])
    out = f"/tmp/squirrel_{pose}_raw.png"
    with open(out, "wb") as f:
        f.write(raw)
    print("saved", out, len(raw))

async def main():
    for pose, desc in POSES.items():
        await gen(pose, desc)

asyncio.run(main())
