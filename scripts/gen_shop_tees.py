"""One-off script to (re)generate the Spring Bloom white tee mockup for the shop.

Requires EMERGENT_LLM_KEY in /app/backend/.env. Run: python3 /app/scripts/gen_shop_tees.py
"""
import asyncio
import base64
import os
from pathlib import Path

from dotenv import load_dotenv

load_dotenv("/app/backend/.env")

from emergentintegrations.llm.chat import LlmChat, UserMessage  # noqa: E402


OUT_DIR = Path("/app/frontend/public")
MODEL = "gemini-3-pro-image-preview"

PROMPTS = {
    "spring-petals": (
        "Product mockup, front-view flat lay of a plain crisp white cotton crew-neck t-shirt "
        "on a soft pale-cream studio background, professional studio photography, subtle "
        "natural shadow beneath the shirt. Centered chest print: a delicate scattering of "
        "cherry blossom petals cascading down the front of the shirt, watercolor style, "
        "soft pink and blush tones with a few pale pink almost-white petals, small graceful "
        "arrangement occupying about 40% of the shirt's front area with petals appearing to "
        "drift diagonally. Above the petals in a small, elegant serif wordmark: 'Fork·Fate' "
        "in soft rose-pink ink. Minimalist, editorial, high-end streetwear brand aesthetic. "
        "No mannequin, no model, no hanger, no wrinkles beyond natural fabric texture. "
        "Square 1024x1024, sharp focus, catalog-quality."
    ),
}


async def gen(key: str, prompt: str) -> None:
    api_key = os.getenv("EMERGENT_LLM_KEY")
    if not api_key:
        raise SystemExit("EMERGENT_LLM_KEY missing from /app/backend/.env")

    chat = LlmChat(
        api_key=api_key,
        session_id=f"shop-tee-{key}",
        system_message="You generate high-quality product mockup images for a merchandise catalog.",
    )
    chat.with_model("gemini", MODEL).with_params(modalities=["image", "text"])

    print(f"[{key}] requesting image...")
    _, images = await chat.send_message_multimodal_response(UserMessage(text=prompt))
    if not images:
        raise SystemExit(f"[{key}] no images returned")

    img = images[0]
    ext = "png" if "png" in img["mime_type"] else "jpg"
    out = OUT_DIR / f"merch-{key}.{ext}"
    out.write_bytes(base64.b64decode(img["data"]))
    print(f"[{key}] saved {out} ({out.stat().st_size:,} bytes)")


async def main() -> None:
    for key, prompt in PROMPTS.items():
        await gen(key, prompt)


if __name__ == "__main__":
    asyncio.run(main())
