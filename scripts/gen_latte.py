"""Top-down latte cup for the cafe rare ritual (plain crema; the FF logo is
overlaid in cream via CSS mask so it can be stirred away)."""
import asyncio

from gen_critters import gen

PROMPT = (
    "A REALISTIC CERAMIC COFFEE CUP OF LATTE seen PERFECTLY FROM DIRECTLY "
    "ABOVE (top-down view): white ceramic cup on a matching white saucer "
    "with a small spoon resting on the saucer edge, the cup filled with "
    "coffee showing a SMOOTH UNIFORM CARAMEL-BROWN CREMA SURFACE with a "
    "thin ring of white microfoam around the inner rim — NO latte art, no "
    "pattern on the crema, just smooth crema. Photorealistic cafe product "
    "shot, soft window light, crisp detail. Shown COMPLETELY ALONE, "
    "centered, filling most of the frame, on a PERFECTLY FLAT SOLID PURE "
    "MAGENTA background (#FF00FF) chroma-key color with no gradient, no "
    "shadow on the background, no text, no watermark, no border."
)

if __name__ == "__main__":
    asyncio.run(gen("latte-cup", PROMPT, 480))
