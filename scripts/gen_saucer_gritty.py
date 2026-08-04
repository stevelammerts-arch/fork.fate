"""Generate gritty, weathered saucer probe variants (less sleek, more used-future)."""
import asyncio

from gen_critters import gen

BASE = (
    " Side profile view, thin lenticular saucer disc body, ONE LARGE GLOWING "
    "CYAN CAMERA EYE LENS at the front edge, a ROW OF MANY SMALL BRIGHT "
    "MARKER LIGHTS (cyan and white) along the rim, TWO THIN WHIP ANTENNAS "
    "sticking up from the top hull, hovering with no propellers. "
    "Photorealistic used-future sci-fi industrial design, cinematic "
    "lighting, strong three-dimensional form. Shown COMPLETELY ALONE, "
    "centered, filling most of the frame, on a PERFECTLY FLAT SOLID PURE "
    "MAGENTA background (#FF00FF) with no gradient, no shadow on the "
    "background, no text, no watermark, no border."
)

JOBS = {
    "cyber-saucer-rust": (
        "A GRITTY BATTLE-WORN SAUCER-SHAPED SURVEILLANCE DRONE, heavily "
        "weathered hull with RUST STREAKS, chipped olive-drab and gunmetal "
        "paint, mismatched riveted armor panels, scorch marks and deep "
        "scratches, oil stains dripping from panel seams." + BASE
    ),
    "cyber-saucer-scrap": (
        "A GRITTY JUNKYARD-BUILT SAUCER-SHAPED SURVEILLANCE DRONE, hull "
        "cobbled together from mismatched scrap metal plates welded with "
        "rough visible weld seams, EXPOSED WIRING and cables hanging from an "
        "open panel, dented rim, grease smudges, duct-tape patch repairs." + BASE
    ),
    "cyber-saucer-mil": (
        "A GRITTY MILITARY-GRADE SAUCER-SHAPED SURVEILLANCE DRONE, heavy "
        "matte-black armored hull with thick bolted plating, worn yellow "
        "hazard stripes on the rim, stenciled unit markings, carbon scoring "
        "around vents, grimy weather-beaten finish, exposed hydraulic "
        "actuators." + BASE
    ),
}


async def main():
    for name, prompt in JOBS.items():
        await gen(name, prompt, 240)


if __name__ == "__main__":
    asyncio.run(main())
