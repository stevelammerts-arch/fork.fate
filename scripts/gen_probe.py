"""Generate a futuristic cyberspace probe drone sprite (magenta-keyed)."""
import asyncio

from gen_critters import gen

PROMPT = (
    "A REALISTIC FUTURISTIC SURVEILLANCE PROBE DRONE in side profile view, "
    "sleek gunmetal and chrome pod-shaped body with layered panel lines, a "
    "single large glowing CYAN camera lens eye on the front, small cyan "
    "accent lights and thruster vents underneath, hovering with no visible "
    "propellers. Photorealistic sci-fi industrial design, cinematic "
    "lighting, strong three-dimensional form, blade-runner style. Shown "
    "COMPLETELY ALONE, centered, filling most of the frame, on a PERFECTLY "
    "FLAT SOLID PURE MAGENTA background (#FF00FF) with no gradient, no "
    "shadow on the background, no text, no watermark, no border."
)

if __name__ == "__main__":
    asyncio.run(gen("cyber-probe", PROMPT, 220))
