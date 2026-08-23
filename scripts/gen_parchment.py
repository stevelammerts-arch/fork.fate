"""Parchment field-guide background for the first-run intro screen.

User brief: old-fashioned piece of parchment paper with ink drawings of things
found in the app around the edges (reaper, dragon, gears, tiki mug, fairy,
bats, fork & dice...), clean center for overlaid guide text.

Same Nano Banana pipeline as the fairy/reaper assets.
Saves /app/frontend/public/guide-parchment.png
"""
import asyncio
import base64
import os

from dotenv import load_dotenv
from emergentintegrations.llm.chat import LlmChat, UserMessage

load_dotenv("/app/backend/.env")

PROMPT = (
    "A single sheet of aged antique parchment paper, photographed straight-on, "
    "filling the entire frame edge to edge. Warm cream-tan aged paper with "
    "darkened burnt-looking deckled edges, subtle creases, foxing stains and a "
    "faint vertical center fold. Around the OUTER BORDER of the parchment, "
    "small hand-drawn sepia ink sketches in an old naturalist field-journal "
    "style, evenly spaced like margin doodles: a hooded grim reaper with a "
    "lantern, a curled dragon, brass clockwork gears, a carved tiki mug, a "
    "tiny fairy with wings, three flying bats, a dinner fork crossed with a "
    "knife, a pair of dice, a steaming coffee cup, a snowflake, a maple leaf, "
    "a cherry blossom sprig, a magic 8-ball, a treasure chest, a trophy cup. "
    "The CENTER of the parchment is CLEAN EMPTY aged paper with no drawings, "
    "reserved for text. TALL PORTRAIT 3:4 composition. Absolutely no text, no "
    "letters, no words, no watermark, muted sepia ink on parchment only."
)


async def main():
    chat = (
        LlmChat(
            api_key=os.environ["EMERGENT_LLM_KEY"],
            session_id="parchment-guide",
            system_message="You are an expert illustrator producing app art.",
        )
        .with_model("gemini", "gemini-3.1-flash-image-preview")
        .with_params(modalities=["image", "text"])
    )
    text, images = await chat.send_message_multimodal_response(UserMessage(text=PROMPT))
    if not images:
        print("NO IMAGE:", (text or "")[:400])
        return
    raw = base64.b64decode(images[0]["data"])
    out = "/app/frontend/public/guide-parchment.png"
    with open(out, "wb") as f:
        f.write(raw)
    print("saved", out, len(raw), "bytes")


asyncio.run(main())
