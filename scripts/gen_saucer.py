"""Generate a thin saucer probe with an eye lens and rim running-lights."""
import asyncio

from gen_critters import gen

PROMPT = (
    "A REALISTIC FUTURISTIC THIN SAUCER-SHAPED SURVEILLANCE DRONE, side "
    "profile view, sleek flat lenticular disc body in matte gunmetal and "
    "chrome, ONE LARGE GLOWING CYAN CAMERA EYE LENS mounted at the front "
    "center of the disc edge, a ROW OF MANY SMALL BRIGHT MARKER LIGHTS "
    "(cyan and white running lights) spaced evenly along the saucer's rim "
    "edge, subtle panel lines on the hull, faint under-glow thrusters "
    "beneath, hovering with no propellers. Photorealistic sci-fi "
    "industrial design, cinematic lighting, strong three-dimensional form, "
    "blade-runner style. Shown COMPLETELY ALONE, centered, filling most of "
    "the frame, on a PERFECTLY FLAT SOLID PURE MAGENTA background "
    "(#FF00FF) with no gradient, no shadow on the background, no text, no "
    "watermark, no border."
)

if __name__ == "__main__":
    asyncio.run(gen("cyber-saucer", PROMPT, 240))
