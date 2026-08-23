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
    "/app/scripts/promo_intro.mp4": (
        "Cinematic moody shot inside a candlelit gothic dining hall at night. "
        "A hooded grim reaper sits at the head of a long wooden dinner table "
        "with three large ornate tarot cards lying face down in front of him. "
        "His skeletal hand hovers over the cards, then he decisively picks up "
        "ONE card and holds it up as it glows with warm golden light. He "
        "tilts his head and his shoulders shake in a low sinister chuckle, "
        "jaw subtly moving, eye sockets glinting with amusement. Soft low "
        "evil chuckle audible. Candle flames flicker, dust motes drift in "
        "the light beams. Dark cinematic color grade with deep reds and "
        "golds, slow camera push-in, film grain. No text, no words, no "
        "captions."
    ),
    "/app/scripts/promo_outro.mp4": (
        "Cinematic warm evening shot of a charming small-town restaurant "
        "street at dusk. Glowing warm windows of a cozy local restaurant, "
        "friends laughing at a candlelit table inside seen through the glass, "
        "a waiter delivering steaming plates. Camera slowly dollies toward "
        "the inviting doorway as warm golden light spills onto the sidewalk. "
        "String lights overhead, gentle bokeh, inviting and prosperous "
        "atmosphere, warm cinematic color grade, film grain. No text, no "
        "words, no captions, no signage with readable letters."
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
