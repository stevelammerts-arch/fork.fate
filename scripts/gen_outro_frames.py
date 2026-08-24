"""Outro build frames:
  outro_f2.png — reaper AND held plate removed (empty candlelit hall)
  outro_f3.png — same empty hall but the plate resting flat on the table
"""
import asyncio
import base64
import os

from dotenv import load_dotenv
from emergentintegrations.llm.chat import LlmChat, UserMessage, ImageContent

load_dotenv("/app/backend/.env")

EDITS = {
    "outro_f2.png": (
        "Edit this image: completely REMOVE the grim reaper and the plate of "
        "food he is holding. Show the empty candlelit gothic hall behind "
        "where he sat — empty chair space, the long wooden table in front "
        "with the two ornate tarot cards still lying on it. Keep the "
        "candles, stained glass window, lighting, colors and art style "
        "EXACTLY identical. Same image dimensions. No text, no watermark."
    ),
    "outro_f3.png": (
        "Edit this image: REMOVE the grim reaper entirely, and place the "
        "white plate of gourmet food resting FLAT on the wooden table in "
        "the center between the two tarot cards, seen from this same "
        "camera angle, steam subtly rising. The empty candlelit gothic "
        "hall behind. Keep the candles, stained glass window, lighting, "
        "colors and art style EXACTLY identical. Same image dimensions. "
        "No text, no watermark."
    ),
}


async def run(name, prompt):
    with open("/app/scripts/outro_f1.png", "rb") as f:
        ref = base64.b64encode(f.read()).decode()
    chat = (
        LlmChat(api_key=os.environ["EMERGENT_LLM_KEY"], session_id=f"outro-{name}",
                system_message="You are an expert film compositor editing frames.")
        .with_model("gemini", "gemini-3.1-flash-image-preview")
        .with_params(modalities=["image", "text"])
    )
    text, images = await chat.send_message_multimodal_response(
        UserMessage(text=prompt, file_contents=[ImageContent(ref)])
    )
    if not images:
        print(name, "NO IMAGE:", (text or "")[:200])
        return
    with open(f"/app/scripts/{name}", "wb") as f:
        f.write(base64.b64decode(images[0]["data"]))
    print("saved", name)


async def main():
    for n, p in EDITS.items():
        await run(n, p)


asyncio.run(main())
