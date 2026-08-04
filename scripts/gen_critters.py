"""Generate winter cardinal + acorn sprites (magenta-keyed, despilled)."""
import asyncio
import base64
import os
import sys

from dotenv import load_dotenv
from emergentintegrations.llm.chat import LlmChat, UserMessage
from PIL import Image
from gen_steam_mask_floor import key_alpha

load_dotenv("/app/backend/.env")

JOBS = {
    "winter-cardinal": (
        "A NORTHERN CARDINAL bird, brilliant red plumage with black face mask "
        "and orange beak, perched in profile side view facing left, crest "
        "raised, tail angled down behind it. Photorealistic, richly detailed "
        "feathers, soft winter daylight, strong three-dimensional form. Shown "
        "COMPLETELY ALONE, centered, filling most of the frame, on a PERFECTLY "
        "FLAT SOLID PURE MAGENTA background (#FF00FF) with no branch, no perch, "
        "no gradient, no shadow on the background, no text, no watermark."
    ),
    "fall-acorn": (
        "A single small ACORN with a textured brown cap and smooth tan nut, "
        "lying on its side. Photorealistic, warm autumn daylight, strong "
        "three-dimensional form. Shown COMPLETELY ALONE, centered, filling "
        "most of the frame, on a PERFECTLY FLAT SOLID PURE MAGENTA background "
        "(#FF00FF) with no gradient, no floor, no shadow on the background, "
        "no text, no watermark, no border."
    ),
}


def despill_resize(path, max_px):
    im = Image.open(path).convert("RGBA")
    px = im.load()
    w, h = im.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a and r > g and b > g:
                s = min(r - g, b - g)
                px[x, y] = (r - s, g, b - s, a)
    im.thumbnail((max_px, max_px), Image.LANCZOS)
    im.save(path, optimize=True)
    print("despilled+resized", path, im.size, os.path.getsize(path))


async def gen(name, prompt, max_px):
    chat = (
        LlmChat(api_key=os.getenv("EMERGENT_LLM_KEY"), session_id=f"critter-{name}",
                system_message="You are an expert prop artist producing game asset art.")
        .with_model("gemini", "gemini-3.1-flash-image-preview")
        .with_params(modalities=["image", "text"])
    )
    text, images = await chat.send_message_multimodal_response(UserMessage(text=prompt))
    if not images:
        print(f"{name}: no image ({(text or '')[:100]})", file=sys.stderr)
        return
    raw = f"/tmp/{name}-raw.png"
    with open(raw, "wb") as f:
        f.write(base64.b64decode(images[0]["data"]))
    out = f"/app/frontend/public/{name}.png"
    key_alpha(raw, out)
    despill_resize(out, max_px)


async def main():
    await gen("winter-cardinal", JOBS["winter-cardinal"], 200)
    await gen("fall-acorn", JOBS["fall-acorn"], 96)


if __name__ == "__main__":
    asyncio.run(main())
