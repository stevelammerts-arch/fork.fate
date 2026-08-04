"""Generate mechanical (not worn) saucer probe variants — dense hard-surface detail."""
import asyncio

from gen_critters import gen

BASE = (
    " Side profile view, thin lenticular saucer disc silhouette, ONE LARGE "
    "GLOWING CYAN CAMERA EYE LENS at the front edge, a ROW OF MANY SMALL "
    "BRIGHT MARKER LIGHTS (cyan and white) along the rim, TWO THIN WHIP "
    "ANTENNAS on top, hovering with no propellers. The machine is CLEAN and "
    "well-maintained, NOT rusty, NOT damaged, NOT dirty. Photorealistic "
    "hard-surface sci-fi industrial design, cinematic lighting, strong "
    "three-dimensional form. Shown COMPLETELY ALONE, centered, filling most "
    "of the frame, on a PERFECTLY FLAT SOLID PURE MAGENTA background "
    "(#FF00FF) chroma-key color with no gradient, no shadow on the "
    "background, no text, no watermark, no border."
)

JOBS = {
    "cyber-saucer-mech": (
        "A HIGHLY MECHANICAL SAUCER-SHAPED SURVEILLANCE DRONE covered in "
        "dense greebles: exposed servo motors, articulated piston actuators, "
        "segmented armor plates with visible bolts, cooling vents, sensor "
        "pods, cable conduits routed neatly along the hull, small thruster "
        "nozzles under the rim." + BASE
    ),
    "cyber-saucer-turbine": (
        "A MECHANICAL SAUCER-SHAPED SURVEILLANCE DRONE with an INDUSTRIAL "
        "TURBINE aesthetic: layered concentric hull rings like a jet engine "
        "housing, visible intake vents and louvers, heavy hex bolts, "
        "gimbal-mounted sensor arms folded against the body, ribbed metal "
        "panels, glowing thruster ports." + BASE
    ),
    "cyber-saucer-gears": (
        "A MECHANICAL SAUCER-SHAPED SURVEILLANCE DRONE with PARTIALLY OPEN "
        "HULL SECTIONS revealing intricate inner machinery: gears, hydraulic "
        "lines, circuit modules and glowing power cells inside, framed by "
        "precise machined titanium panels, robotic manipulator claw folded "
        "underneath, radiator fins on the back." + BASE
    ),
}


async def main():
    for name, prompt in JOBS.items():
        await gen(name, prompt, 240)


if __name__ == "__main__":
    asyncio.run(main())
