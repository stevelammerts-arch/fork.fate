"""Card art: a tiki warrior in the same chibi style as the heist tiki men,
front-facing for the shuffle card back + fate card. -> /app/frontend/public/tiki-guy-card.png"""
import asyncio

from gen_tiki_man import gen, STYLE

PROMPT = STYLE + (
    "paint ONE tiki warrior standing FRONT-FACING in a proud, slightly "
    "menacing-but-comical pose: feet planted wide, one hand raising a "
    "burning torch, the other resting on a carved wooden spear, big fierce "
    "carved skull grin with glowing ember eyes. Full body, facing the "
    "viewer. PURE SOLID BLACK background (#000000), no scenery, centered "
    "with clear black space all around."
)


async def main():
    await gen("tiki-guy-card", PROMPT, "/app/frontend/public/tiki-guy-card.png", "/app/scripts/tiki_card_raw.png", max_h=560)


if __name__ == "__main__":
    asyncio.run(main())
