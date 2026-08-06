"""Two alternate Tiki Man surf variants for the user to choose from."""
import asyncio

from gen_tiki_man import gen, STYLE

PROMPT_B = STYLE + (
    "paint ONE tiki man who looks DANGEROUS BUT FUNNY: fierce carved skull "
    "mask with angry brows and GLOWING EMBER EYES, tall crown headdress — "
    "but he's surfing like a goofball: wild flailing 'about to wipe out' "
    "stance, one arm windmilling, tongue sticking out of the skull grin, "
    "knees knocked together, board kicking up white spray on a curling "
    "turquoise wave. Full body, side profile facing RIGHT. PURE SOLID BLACK "
    "background (#000000) — no scenery besides the wave under the board. "
    "Centered with clear black space all around."
)

PROMPT_C = STYLE + (
    "paint ONE tiki man who looks DANGEROUS BUT FUNNY: menacing skull mask "
    "with GLOWING EMBER EYES and a fierce scowl, brandishing his wooden "
    "spear overhead mid-battle-cry — while surfing in a ridiculous "
    "exaggerated deep squat, grass skirt flapping, one leg comically high, "
    "carving across a small wave on a dark carved tribal surfboard with "
    "white foam spray. Full body, side profile facing RIGHT. PURE SOLID "
    "BLACK background (#000000) — no scenery besides the wave under the "
    "board. Centered with clear black space all around."
)


async def main():
    await gen("tiki-surf-b", PROMPT_B, "/app/scripts/tiki_surf_b.png", "/app/scripts/tiki_surf_b_raw.png")
    await gen("tiki-surf-c", PROMPT_C, "/app/scripts/tiki_surf_c.png", "/app/scripts/tiki_surf_c_raw.png")


if __name__ == "__main__":
    asyncio.run(main())
