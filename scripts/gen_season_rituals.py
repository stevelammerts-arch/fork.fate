"""Generate seasonal ritual props: fall leaf pile, spring cherry blossom
(bud + bloom), summer watermelon (whole + split). Magenta-keyed to alpha."""
import asyncio
import base64
import os
import sys

from dotenv import load_dotenv
from emergentintegrations.llm.chat import LlmChat, UserMessage
from gen_steam_mask_floor import key_alpha

load_dotenv("/app/backend/.env")

STYLE = (
    "Photorealistic, richly detailed, natural lighting, strong "
    "three-dimensional form with clear light and shadow. Shown COMPLETELY "
    "ALONE, centered, filling most of the frame, on a PERFECTLY FLAT SOLID "
    "PURE MAGENTA background (#FF00FF) with no gradient, no floor, no "
    "shadow on the background, no text, no watermark, no border."
)

PROMPTS = {
    "fall-leafpile": (
        "A big fluffy PILE OF AUTUMN LEAVES viewed straight on: heaped "
        "crisp maple and oak leaves in vivid orange, russet red, amber and "
        "golden yellow, some leaves curling at the edges, a few stray "
        "leaves at the sides. WIDE mound composition wider than it is "
        "tall. " + STYLE
    ),
    "spring-bud": (
        "A single CHERRY BLOSSOM BRANCH viewed straight on with tightly "
        "CLOSED pink flower BUDS: dark slender branch, several plump "
        "unopened sakura buds with deep pink sepals, one or two tiny "
        "leaves. TALL PORTRAIT composition. " + STYLE
    ),
    "spring-bloom": (
        "The SAME single CHERRY BLOSSOM BRANCH viewed straight on but now "
        "in FULL BLOOM: the same dark slender branch covered in wide-open "
        "five-petal pale pink sakura blossoms with delicate stamens, soft "
        "and lush, one or two tiny leaves. TALL PORTRAIT composition. "
        + STYLE
    ),
    "summer-melon-whole": (
        "A WHOLE WATERMELON viewed straight on: glossy deep green rind "
        "with darker jagged stripes, sitting slightly angled, plump and "
        "ripe with a small curly stem. " + STYLE
    ),
    "summer-melon-split": (
        "The SAME WATERMELON viewed straight on but SMASHED OPEN into two "
        "big halves leaning apart: juicy vivid red-pink flesh with black "
        "seeds, chunks and juice splashing outward between the halves, "
        "glossy green rind outside. " + STYLE
    ),
}


async def gen(name, prompt):
    chat = (
        LlmChat(api_key=os.getenv("EMERGENT_LLM_KEY"), session_id=f"season-{name}",
                system_message="You are an expert prop artist producing game asset art.")
        .with_model("gemini", "gemini-3.1-flash-image-preview")
        .with_params(modalities=["image", "text"])
    )
    text, images = await chat.send_message_multimodal_response(UserMessage(text=prompt))
    if not images:
        print(f"{name}: no image ({(text or '')[:100]})", file=sys.stderr)
        return
    raw = f"/app/frontend/public/season-{name}-raw.png"
    with open(raw, "wb") as f:
        f.write(base64.b64decode(images[0]["data"]))
    key_alpha(raw, f"/app/frontend/public/season-{name}.png")
    print(f"saved season-{name}.png")


async def main():
    for name, prompt in PROMPTS.items():
        await gen(name, prompt)


if __name__ == "__main__":
    asyncio.run(main())
