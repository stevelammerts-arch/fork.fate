"""Sora 2 cinematic clips for the Fork-Fate promo video (portrait 9:16).

intro: the Reaper deals fate at a candlelit table - cards become food.
outro: warm local restaurant at dusk - the sponsor-benefit closer.
"""
import os
from dotenv import load_dotenv
from emergentintegrations.llm.openai.video_generation import OpenAIVideoGeneration

# The proxy API accepts 720x1280 portrait for sora-2 but the client's
# allow-list predates it — extend it.
OpenAIVideoGeneration.SIZES["720x1280"] = {"width": 720, "height": 1280}

load_dotenv("/app/backend/.env")

CLIPS = {
    "/app/scripts/promo_outro.mp4": (
        "Cinematic moody shot inside a candlelit gothic dining hall at "
        "night, same scene continuing: a hooded grim reaper with a detailed "
        "skeletal face sits at the head of a long wooden dinner table. The "
        "reaper SLOWLY FADES AWAY, dissolving into thin wisps of dark smoke "
        "until he has completely vanished from the chair. Just as he "
        "disappears, a gourmet plate of steaming food DROPS onto the wooden "
        "table from above and lands with a loud metallic CLANG, rattling "
        "briefly before settling, steam rising from the food. The clang of "
        "the plate is clearly audible. Candle flames flicker, dust motes "
        "drift in the light beams. Dark cinematic color grade with deep "
        "reds and golds, static camera. No text, no words, no captions."
    ),
}

for path, prompt in CLIPS.items():
    print("generating", path)
    gen = OpenAIVideoGeneration(api_key=os.environ["EMERGENT_LLM_KEY"])
    video = gen.text_to_video(prompt=prompt, model="sora-2", size="720x1280", duration=8, max_wait_time=900)
    if video:
        gen.save_video(video, path)
        print("saved", path, len(video), "bytes")
    else:
        print("FAILED", path)
