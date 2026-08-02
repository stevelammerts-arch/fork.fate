"""AI Fate Oracle: a short mystical one-liner about why fate chose this spot.

Lines are generated once per (place, voice, lang) and cached forever in
db.oracle_lines, so the LLM is only hit on first reveal. A daily budget
(ORACLE_DAILY_CAP, default 400 generations/day) protects the key balance;
when exhausted the endpoint returns {"line": null} and the UI simply hides.
"""
import os
import re
import asyncio
from datetime import datetime, timezone
from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from pymongo import ReturnDocument

from core import db, rate_limit, logger, EMERGENT_LLM_KEY

router = APIRouter()

ORACLE_DAILY_CAP = int(os.environ.get("ORACLE_DAILY_CAP", "400"))
_LLM_TIMEOUT = 15  # seconds

# Each theme speaks with its own voice. Seasons share the mystic register but
# get a seasonal flourish; ambiance themes stay fully in character.
_VOICES = {
    "dark": "You are the Grim Reaper of Fork·Fate — dry, gothic, darkly funny. You deal dining fates from a cursed deck.",
    "fantasy": "You are an ancient gold-hoarding dragon oracle. Restaurants are treasures in your hoard; speak of gold, flame and destiny.",
    "cyber": "You are a neon-lit cyberpunk street oracle jacked into the Fork·Fate grid. Speak in slick, electric, night-city imagery.",
    "steam": "You are a brass Victorian automaton soothsayer aboard the Fork·Fate airship. Speak of gears, steam and clockwork destiny.",
    "tiki": "You are a laid-back island spirit presiding over the Fork·Fate tiki lounge. Speak of tides, torchlight and good omens.",
    "fall": "You are a cozy autumn harvest mystic who reads fates in falling leaves and woodsmoke.",
    "winter": "You are a frost-touched winter seer who reads fates in snowfall and candlelight.",
    "spring": "You are a bright spring garden oracle who reads fates in blossoms and rain.",
    "summer": "You are a sun-drunk boardwalk fortune teller who reads fates in the tide.",
    "light": "You are a warm, witty fortune teller for Fork·Fate, the restaurant roulette.",
}

_RULES = (
    " A diner just had their fate revealed. In ONE sentence of at most 18 words,"
    " proclaim why fate chose this exact place for them tonight. Stay fully in"
    " character. Mention the place by name or clearly allude to it. No quotation"
    " marks, no emoji, no preamble, no explanation — just the proclamation."
)


class OracleAsk(BaseModel):
    place_id: str = Field(min_length=1, max_length=200)
    name: str = Field(min_length=1, max_length=140)
    cuisine: str | None = Field(default=None, max_length=80)
    category: str | None = Field(default=None, max_length=40)
    theme: str = Field(default="dark", max_length=20)
    lang: str = Field(default="en", max_length=5)


async def _reserve_daily() -> bool:
    """Count one generation against today's budget. False when exhausted."""
    day = datetime.now(timezone.utc).strftime("%Y%m%d")
    doc = await db.stats.find_one_and_update(
        {"key": f"oracle_{day}"},
        {"$inc": {"count": 1}},
        upsert=True,
        return_document=ReturnDocument.AFTER,
    )
    return doc.get("count", 1) <= ORACLE_DAILY_CAP


def _clean(text: str) -> str:
    line = text.strip().split("\n")[0].strip()
    line = line.strip('"').strip("“”„'").strip()
    line = re.sub(r"\s+", " ", line)
    return line[:240]


async def _generate(payload: OracleAsk, voice: str, lang: str) -> str | None:
    from emergentintegrations.llm.chat import LlmChat, UserMessage, TextDelta, StreamDone

    system = _VOICES[voice] + _RULES
    if lang == "es":
        system += " Respond in Spanish."
    bits = [f"Place: {payload.name}"]
    if payload.cuisine:
        bits.append(f"Cuisine/type: {payload.cuisine}")
    if payload.category and payload.category not in ("food",):
        bits.append(f"Category: {payload.category}")
    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=f"oracle-{payload.place_id}-{voice}-{lang}",
        system_message=system,
    ).with_model("openai", "gpt-5.4-mini")
    parts = []
    async for ev in chat.stream_message(UserMessage(text=". ".join(bits))):
        if isinstance(ev, TextDelta):
            parts.append(ev.content)
        elif isinstance(ev, StreamDone):
            break
    return _clean("".join(parts)) or None


@router.post("/oracle", dependencies=[Depends(rate_limit(20))])
async def fate_oracle(payload: OracleAsk):
    voice = payload.theme if payload.theme in _VOICES else "light"
    lang = "es" if payload.lang.startswith("es") else "en"
    key = {"place_id": payload.place_id, "voice": voice, "lang": lang}

    cached = await db.oracle_lines.find_one(key)
    if cached:
        return {"line": cached["line"], "cached": True}

    if not EMERGENT_LLM_KEY:
        return {"line": None}
    if not await _reserve_daily():
        logger.warning("Oracle daily cap reached (%s) — serving null", ORACLE_DAILY_CAP)
        return {"line": None}

    try:
        line = await asyncio.wait_for(_generate(payload, voice, lang), timeout=_LLM_TIMEOUT)
    except Exception as e:
        logger.warning("Oracle generation failed for %s: %s", payload.place_id, e)
        return {"line": None}
    if not line:
        return {"line": None}

    await db.oracle_lines.update_one(
        key,
        {"$setOnInsert": {**key, "line": line, "name": payload.name,
                          "created_at": datetime.now(timezone.utc).isoformat()}},
        upsert=True,
    )
    return {"line": line, "cached": False}
