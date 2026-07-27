"""Generate the Spring Bloom and Autumn Fall white tee mockups using the actual
Fork·Fate app theme trees as reference images, so the shirts match the app's
own art (not a generic AI interpretation).
"""
import asyncio
import base64
import os
from pathlib import Path

from dotenv import load_dotenv

load_dotenv("/app/backend/.env")

from emergentintegrations.llm.chat import LlmChat, UserMessage, ImageContent  # noqa: E402


OUT_DIR = Path("/app/frontend/public")
MODEL = "gemini-3-pro-image-preview"

JOBS = [
    {
        "key": "spring-tree",
        "ref": "/app/frontend/public/spring-tree.png",
        "prompt": (
            "Create a professional product mockup: a plain crisp WHITE cotton crew-neck t-shirt, "
            "front-view flat lay on a soft pale-cream studio background, with a subtle natural "
            "shadow beneath the shirt. Print the reference watercolor cherry blossom tree "
            "art onto the front of the shirt, centered on the chest and extending down toward "
            "the hem, occupying about 55-60% of the shirt's front area. Preserve the original "
            "colors and delicate watercolor style of the tree (soft pink blossoms, dark trunk, "
            "drifting petals). Above the tree in a small elegant serif wordmark: 'Fork·Fate' "
            "in soft rose-pink ink. Minimalist editorial streetwear aesthetic. No mannequin, "
            "no model, no hanger, no wrinkles beyond natural fabric texture. Square 1024x1024, "
            "sharp focus, catalog-quality."
        ),
    },
    {
        "key": "fall-tree",
        "ref": "/app/frontend/public/fall-tree.png",
        "prompt": (
            "Create a professional product mockup: a plain crisp WHITE cotton crew-neck t-shirt, "
            "front-view flat lay on a soft warm-cream studio background, with a subtle natural "
            "shadow beneath the shirt. Print the reference autumn maple tree art onto the "
            "front of the shirt, centered on the chest and extending down toward the hem, "
            "occupying about 55-60% of the shirt's front area. Preserve the original colors "
            "and painterly style of the tree (burnt orange, deep amber, rust red, and mustard "
            "yellow leaves, twisted dark trunk, leaves drifting in the wind). Above the tree "
            "in a small elegant serif wordmark: 'Fork·Fate' in deep burnt-orange ink. Cozy "
            "editorial streetwear aesthetic. No mannequin, no model, no hanger, no wrinkles "
            "beyond natural fabric texture. Square 1024x1024, sharp focus, catalog-quality."
        ),
    },
]


async def gen(job):
    api_key = os.getenv("EMERGENT_LLM_KEY")
    ref_b64 = base64.b64encode(Path(job["ref"]).read_bytes()).decode("utf-8")
    chat = LlmChat(
        api_key=api_key,
        session_id=f"shop-tee-{job['key']}-v2",
        system_message="You generate high-quality product mockup images for a merchandise catalog.",
    )
    chat.with_model("gemini", MODEL).with_params(modalities=["image", "text"])

    print(f"[{job['key']}] requesting image with reference art...")
    _, images = await chat.send_message_multimodal_response(
        UserMessage(text=job["prompt"], file_contents=[ImageContent(ref_b64)])
    )
    if not images:
        raise SystemExit(f"[{job['key']}] no images returned")

    img = images[0]
    ext = "png" if "png" in img["mime_type"] else "jpg"
    out = OUT_DIR / f"merch-{job['key']}.{ext}"
    out.write_bytes(base64.b64decode(img["data"]))
    print(f"[{job['key']}] saved {out} ({out.stat().st_size:,} bytes)")


async def main():
    for j in JOBS:
        await gen(j)


if __name__ == "__main__":
    asyncio.run(main())
