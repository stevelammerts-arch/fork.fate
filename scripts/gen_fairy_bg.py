"""Mock up two Fairy Forest Gully theme background images.

User brief: green textures, teen/adult female fairies (two max), living trees
with faces, mushroom rings, will-o'-wisps, butterflies, maybe a distant unicorn.

Uses Gemini Nano Banana via emergentintegrations (same pipeline as the
dragon-claw and reaper assets). Saves to /app/frontend/public/fairy-bg-mock{1,2}.png
"""
import asyncio
import base64
import os
import sys

from dotenv import load_dotenv
from emergentintegrations.llm.chat import LlmChat, UserMessage

load_dotenv("/app/backend/.env")

STYLE = (
    "Richly detailed digital fantasy painting. PRIMARY palette: lush emerald "
    "and moss greens with layered green textures (moss, ferns, leaf canopy, "
    "lichen). ACCENTS: vibrant rainbow-like jewel colors bursting from "
    "clusters of wildflowers (violet, magenta, sapphire blue, orange, "
    "golden yellow, coral red), iridescent butterfly wings, colorful "
    "mushroom caps and prismatic fairy wing shimmer — saturated and "
    "glowing against the deep greens. Dappled magical light, "
    "storybook-enchanted atmosphere, painterly cinematic quality, TALL "
    "PORTRAIT 3:4 composition suitable as a mobile app hero background "
    "with soft focus room near the middle for overlaid text, no text, no "
    "watermark, no borders."
)

PROMPTS = {
    "fairy-bg-mock3.png": (
        "A misty emerald forest gully at twilight. TWO young adult female "
        "fairies with glowing gossamer wings, modestly dressed in woodland "
        "attire, hover playfully over a ring of white-capped mushrooms on "
        "the mossy gully floor. A gnarled living willow tree with a gentle "
        "smiling face in its trunk arches over a winding stream. Swarms of "
        "teal will-o'-wisps drift through the mist, iridescent butterflies "
        "glimmer in the foreground, and far in the hazy background a white "
        "unicorn grazes in a shaft of silvery light, small and distant. "
        "Vivid rainbow flowers (magenta foxgloves, sapphire bluebells, "
        "golden buttercups, coral poppies, violet asters) light up the "
        "stream banks against deep layered green textures. " + STYLE
    ),
    "fairy-bg-mock4.png": (
        "A deep mossy fairy gully under twilight mist. TWO graceful adult "
        "female fairies with luminous prismatic wings, modestly dressed in "
        "leaf-woven clothing, one kneeling beside a mushroom ring touching "
        "a glowing bloom, the other flying just above her. An ancient "
        "living beech tree with a serene motherly face in the bark rises "
        "on the right, roots wrapped in moss. Blue-green will-o'-wisps "
        "float along a dark reflective stream, rainbow butterflies dance "
        "in the foreground, and a distant white unicorn stands on a misty "
        "rise between the trees. Bursts of jewel-toned wildflowers — "
        "violet, magenta, blue, orange, gold — glow against the layered "
        "emerald greens. " + STYLE
    ),
    "fairy-bg-mock5.png": (
        "An enchanted twilight gully thick with mist and green magic. TWO "
        "teen female fairies with shimmering translucent wings, modestly "
        "dressed in woodland attire, fly side by side along a mossy stream "
        "bank, trailing sparkles. A towering living willow with a wise old "
        "face in its trunk bends over the water on the left, its hanging "
        "branches dotted with tiny lights. A wide fairy ring of "
        "white-and-red mushrooms circles the mossy foreground, "
        "will-o'-wisps swirl upward like embers of blue-green light, "
        "iridescent butterflies scatter, and deep in the misty background "
        "a white unicorn with a faint glowing horn watches from between "
        "mossy trunks. Rainbow wildflower drifts — sapphire, magenta, "
        "gold, coral, violet — spill down the banks against rich layered "
        "greens. " + STYLE
    ),
}


async def gen(name, prompt):
    api_key = os.getenv("EMERGENT_LLM_KEY")
    if not api_key:
        print("EMERGENT_LLM_KEY missing", file=sys.stderr)
        sys.exit(1)
    chat = (
        LlmChat(api_key=api_key, session_id=f"fairy-bg-{name}", system_message="You are an expert fantasy illustrator producing app background art.")
        .with_model("gemini", "gemini-3.1-flash-image-preview")
        .with_params(modalities=["image", "text"])
    )
    text, images = await chat.send_message_multimodal_response(UserMessage(text=prompt))
    if not images:
        print(f"{name}: no image returned ({(text or '')[:120]})", file=sys.stderr)
        return
    data = base64.b64decode(images[0]["data"])
    path = f"/app/frontend/public/{name}"
    with open(path, "wb") as f:
        f.write(data)
    print(f"saved -> {path} ({len(data)//1024}KB)")


async def main():
    for name, prompt in PROMPTS.items():
        await gen(name, prompt)


asyncio.run(main())
