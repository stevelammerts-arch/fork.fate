"""Generate additional stealth drone design variants (magenta-keyed)."""
import asyncio

from gen_critters import gen

BASE = (
    " Photorealistic sci-fi industrial design, cinematic lighting, strong "
    "three-dimensional form, blade-runner style. Shown COMPLETELY ALONE, "
    "centered, filling most of the frame, on a PERFECTLY FLAT SOLID PURE "
    "MAGENTA background (#FF00FF) with no gradient, no shadow on the "
    "background, no text, no watermark, no border."
)

DESIGNS = {
    "cyber-stealth-manta": (
        "A REALISTIC FUTURISTIC STEALTH DRONE shaped like a MANTA RAY, "
        "side profile view facing left, smooth curved matte gunmetal body "
        "with swept-down wing edges, a row of small glowing CYAN sensor "
        "lights along its leading edge, subtle panel lines, twin rear "
        "vector thrusters with faint cyan glow, hovering with no "
        "propellers." + BASE
    ),
    "cyber-stealth-dart": (
        "A REALISTIC FUTURISTIC STEALTH INTERCEPTOR DRONE, side profile "
        "view facing left, long slim dart-shaped fuselage in dark "
        "iridescent black with sharp chined edges, a narrow glowing CYAN "
        "visor strip across the nose, small canard fins near the front and "
        "a tall single tail fin, rear ion engine with cyan exhaust glow, "
        "hovering with no propellers." + BASE
    ),
    "cyber-stealth-fork": (
        "A REALISTIC FUTURISTIC STEALTH RECON DRONE with a FORKED twin-prow "
        "front like a catamaran, side profile view facing left, faceted "
        "matte black stealth panels with exposed gunmetal framework, one "
        "glowing CYAN scanner eye set between the prongs, low flat "
        "silhouette, rear thruster array with faint cyan glow, hovering "
        "with no propellers." + BASE
    ),
}


async def main():
    for name, prompt in DESIGNS.items():
        await gen(name, prompt, 220)


if __name__ == "__main__":
    asyncio.run(main())
