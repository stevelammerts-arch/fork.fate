#!/usr/bin/env python3
"""Two more squirrel frames for the ambient fall squirrel's realistic gallop:
a standing-on-all-fours pose and a mid-bound gathered pose (rear legs in)."""
import asyncio
import base64
import os
from dotenv import load_dotenv

load_dotenv("/app/backend/.env")

from emergentintegrations.llm.chat import LlmChat, UserMessage, ImageContent  # noqa: E402

POSES = {
    "stand": (
        "same squirrel now STANDING STILL on all four legs, legs straight beneath it, "
        "head raised and alert looking forward, bushy tail held up in an S-curve behind it"
    ),
    "bound": (
        "same squirrel captured MID-GALLOP in the gathered phase of its bounding run: back "
        "arched high, REAR LEGS TUCKED FORWARD IN UNDER ITS BODY close to its front paws, "
        "body compressed like a spring, bushy tail streaming behind"
    ),
}

async def gen(pose, desc):
    with open("/app/frontend/public/fall-squirrel.png", "rb") as f:
        ref_b64 = base64.b64encode(f.read()).decode("utf-8")
    chat = LlmChat(
        api_key=os.getenv("EMERGENT_LLM_KEY"),
        session_id=f"squirrel2-{pose}",
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
