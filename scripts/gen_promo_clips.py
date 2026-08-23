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
        "Cinematic warm evening shot of a charming small-town restaurant "
        "street at dusk, string lights overhead, warm glowing windows with "
        "friends laughing at candlelit tables inside. By the open front "
        "door stands a hooded grim reaper with a detailed skeletal face, "
        "acting as a friendly maitre d' — he holds the door open with one "
        "skeletal hand and makes a welcoming sweeping gesture toward the "
        "warm light inside with the other, giving a slight courteous bow, "
        "as if inviting the viewer in for dinner. Warm golden light spills "
        "onto the sidewalk around him. Camera slowly dollies toward the "
        "doorway. Gentle bokeh, inviting and prosperous atmosphere, warm "
        "cinematic color grade, film grain. No text, no words, no captions, "
        "no signage with readable letters."
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
