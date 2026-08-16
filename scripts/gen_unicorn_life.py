"""Unicorn life: AI-edit two patches of the fairy gully painting — head
lowered ('bob') and muzzle turned ('shake') — then feather + gain-match so
they crossfade invisibly over the base art, exactly like the fairy wings."""
import asyncio
import base64
import os
import sys
from io import BytesIO

import numpy as np
from dotenv import load_dotenv
from emergentintegrations.llm.chat import LlmChat, UserMessage, ImageContent
from PIL import Image

load_dotenv("/app/backend/.env")

ART = "/app/frontend/public/fairy-gully.png"
RECT = (250, 380, 460, 600)  # unicorn patch in art px (210x220)

EDITS = [
    ("shake-r", "The unicorn has TURNED ITS MUZZLE slightly AWAY from the viewer, head swung a little to ITS RIGHT side mid head-shake, showing a touch more of the left side of its face and mane. "),
]

PROMPT_BASE = (
    "Repaint the attached fantasy painting crop EXACTLY as it is — identical "
    "style, colors, lighting, flowers, trees, mist and composition, same "
    "exact framing and size — with ONE change only: {change}"
    "Everything else must stay pixel-identical. No text, no border, no "
    "watermark, keep the exact same aspect ratio."
)


async def main():
    api_key = os.getenv("EMERGENT_LLM_KEY")
    crop = Image.open(ART).convert("RGB").crop(RECT)
    up = crop.resize((crop.size[0] * 3, crop.size[1] * 3), Image.LANCZOS)
    buf = BytesIO(); up.save(buf, "PNG")
    crop_b64 = base64.b64encode(buf.getvalue()).decode()
    base_arr = np.asarray(crop, dtype=float)

    for name, change in EDITS:
        chat = (
            LlmChat(api_key=api_key, session_id=f"uni-{name}", system_message="You are an expert digital painter making frame-perfect animation variants.")
            .with_model("gemini", "gemini-3.1-flash-image-preview")
            .with_params(modalities=["image", "text"])
        )
        msg = UserMessage(text=PROMPT_BASE.format(change=change), file_contents=[ImageContent(image_base64=crop_b64)])
        text, images = await chat.send_message_multimodal_response(msg)
        if not images:
            print(f"{name}: no image ({(text or '')[:80]})", file=sys.stderr)
            continue
        out = Image.open(BytesIO(base64.b64decode(images[0]["data"]))).convert("RGB")
        out = out.resize(crop.size, Image.LANCZOS)
        arr = np.asarray(out, dtype=float)
        # gain-match to the base crop so no square tint shows
        gain = base_arr.mean(axis=(0, 1)) / arr.mean(axis=(0, 1))
        arr = np.clip(arr * gain, 0, 255)
        h, w = arr.shape[:2]
        yy, xx = np.mgrid[0:h, 0:w]
        ramp = np.minimum.reduce([
            np.clip(yy / 44, 0, 1), np.clip((h - 1 - yy) / 44, 0, 1),
            np.clip(xx / 44, 0, 1), np.clip((w - 1 - xx) / 44, 0, 1),
        ])
        rgba = np.dstack([arr, ramp * 255]).astype("uint8")
        Image.fromarray(rgba, "RGBA").save(f"/app/frontend/public/fairy-uni-{name}.png")
        print(f"{name}: saved ({w}x{h}), gain {gain.round(3)}")


if __name__ == "__main__":
    asyncio.run(main())
