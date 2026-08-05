"""Realistic snow globe with a snowman inside, for the Winter rare ritual."""
import asyncio

from gen_critters import gen

PROMPT = (
    "A REALISTIC SNOW GLOBE photographed straight on: a perfect clear glass "
    "sphere sitting on a carved dark wooden base with snowflake engravings. "
    "INSIDE the globe stands a cheerful classic SNOWMAN — three stacked snow "
    "balls, carrot nose, coal eyes and smile, red scarf, twig stick arms — "
    "on a mound of snow, with a tiny snow-covered pine tree beside him. A "
    "few snowflakes rest on the snow inside. Soft glass reflections and "
    "highlights on the sphere, cozy warm rim light, photorealistic studio "
    "product shot, crisp detail. Shown COMPLETELY ALONE, centered, filling "
    "most of the frame, on a PERFECTLY FLAT SOLID PURE MAGENTA background "
    "(#FF00FF) chroma-key color with no gradient, no shadow on the "
    "background, no text, no watermark, no border."
)

if __name__ == "__main__":
    asyncio.run(gen("snow-globe", PROMPT, 480))
