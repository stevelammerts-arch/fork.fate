"""Generate alternative cyber probe designs (magenta-keyed)."""
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
    "cyber-probe-orb": (
        "A REALISTIC FUTURISTIC SPHERICAL SURVEILLANCE ORB DRONE, floating "
        "chrome and matte-black sphere with a single large glowing CYAN "
        "camera eye, a thin rotating sensor ring around its equator, small "
        "antenna stubs and under-glow thrusters, hovering with no "
        "propellers." + BASE
    ),
    "cyber-probe-wedge": (
        "A REALISTIC FUTURISTIC ANGULAR STEALTH RECON DRONE in side profile "
        "view facing left, sharp wedge-shaped matte gunmetal body with "
        "faceted stealth panels, twin CYAN glowing slit sensors on the "
        "nose, small folded winglets and vector thrusters at the rear, "
        "hovering with no propellers." + BASE
    ),
    "cyber-probe-ring": (
        "A REALISTIC FUTURISTIC HOVER PROBE built around a vertical ring "
        "gyroscope: an outer chrome ring frame with a floating central "
        "sensor core suspended inside, the core has one glowing CYAN lens, "
        "cyan energy filaments between core and ring, hovering with no "
        "propellers, side profile view." + BASE
    ),
}


async def main():
    for name, prompt in DESIGNS.items():
        await gen(name, prompt, 220)


if __name__ == "__main__":
    asyncio.run(main())
