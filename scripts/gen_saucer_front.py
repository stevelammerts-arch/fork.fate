"""Front (head-on) view of the Servo-Deck mechanical saucer for the 3-step turn."""
import asyncio

from gen_critters import gen

PROMPT = (
    "A HIGHLY MECHANICAL SAUCER-SHAPED SURVEILLANCE DRONE seen PERFECTLY "
    "HEAD-ON FROM THE FRONT, symmetric front view: a thin lenticular disc "
    "seen edge-on so it reads as a slim wide lens shape, with ONE LARGE "
    "GLOWING CYAN CAMERA EYE LENS dead-center staring directly AT THE "
    "VIEWER, a ROW OF MANY SMALL BRIGHT MARKER LIGHTS (cyan and white) "
    "along the rim edge curving to both sides, TWO THIN WHIP ANTENNAS on "
    "top, hull covered in dense greebles: servo motors, piston actuators, "
    "segmented bolted armor plates, sensor pods, cable conduits. The "
    "machine is CLEAN and well-maintained, NOT rusty, NOT damaged. "
    "Photorealistic hard-surface sci-fi industrial design, gunmetal and "
    "dark steel like the side view, cinematic lighting, strong "
    "three-dimensional form, hovering with no propellers. Shown COMPLETELY "
    "ALONE, centered, filling most of the frame, on a PERFECTLY FLAT SOLID "
    "PURE MAGENTA background (#FF00FF) chroma-key color with no gradient, "
    "no shadow on the background, no text, no watermark, no border."
)

if __name__ == "__main__":
    asyncio.run(gen("cyber-saucer-mech-front", PROMPT, 240))
