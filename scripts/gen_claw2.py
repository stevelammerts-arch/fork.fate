"""Generate a new dragon claw for the Dragon's Hoard heist.

The claw must GRIP A CIRCULAR VOID (pure black -> keyed transparent) so the
stolen medallion clone can ride inside the grip. Wrist runs off the bottom
edge (the claw rises from below the screen). Output:
/app/frontend/public/dragon-claw2.png plus printed grip-center fractions to
plug into DragonHeist (gripX/gripY/aspect).
"""
import asyncio
import base64
import os

from dotenv import load_dotenv
from PIL import Image

load_dotenv("/app/backend/.env")

PROMPT = (
    "Fantasy digital art: a fearsome dragon claw (one clawed hand) with deep "
    "RED scales and warm GOLD scale highlights, painted in a rich dark "
    "painterly style (NO white rim lighting, no frost, no engraving look - "
    "smooth warm ember lighting like a dark dragon's-hoard cave). It rises "
    "straight up from the bottom edge of the image, its scaled forearm "
    "running off the bottom border. The claw grips a PERFECTLY CIRCULAR "
    "empty hole: four fingers with glossy black talons curl around the top "
    "and right of the circle and a thumb supports it from the left, but the "
    "circular area inside the grip is completely EMPTY pure black (#000000) "
    "- a round void where a coin will be composited later. Do not draw "
    "anything inside that circle. PURE SOLID BLACK background everywhere "
    "around the claw."
)


def key_black(img):
    img = img.convert("RGB")
    px = img.load()
    out = img.convert("RGBA")
    opx = out.load()
    w, h = img.size
    for y in range(h):
        for x in range(w):
            r, g, b = px[x, y]
            m = max(r, g, b)
            a = 0 if m <= 28 else (int(255 * (m - 28) / 32) if m < 60 else 255)
            opx[x, y] = (r, g, b, a)
    return out


async def main():
    from emergentintegrations.llm.chat import LlmChat, UserMessage
    chat = LlmChat(
        api_key=os.getenv("EMERGENT_LLM_KEY"),
        session_id="dragon-claw-v2",
        system_message="You are an expert fantasy creature artist.",
    )
    chat.with_model("gemini", "gemini-3.1-flash-image-preview").with_params(modalities=["image", "text"])
    text, images = await chat.send_message_multimodal_response(UserMessage(text=PROMPT))
    if not images:
        print(f"NO IMAGE. text={str(text)[:200]}")
        return
    raw = base64.b64decode(images[0]["data"])
    with open("/app/scripts/dragon_claw2_raw.png", "wb") as f:
        f.write(raw)
    img = Image.open("/app/scripts/dragon_claw2_raw.png")
    print("raw size:", img.size)
    keyed = key_black(img)
    # Trim left/right/top whitespace but KEEP the bottom edge (wrist must
    # run off-screen).
    bbox = keyed.getbbox()
    if bbox:
        x0, y0, x1, y1 = bbox
        keyed = keyed.crop((max(0, x0 - 6), max(0, y0 - 6), min(keyed.width, x1 + 6), keyed.height))
    if keyed.width > 900:
        r = 900 / keyed.width
        keyed = keyed.resize((900, int(keyed.height * r)), Image.LANCZOS)
    keyed.save("/app/frontend/public/dragon-claw2.png", optimize=True)
    print("saved /app/frontend/public/dragon-claw2.png", keyed.size)

    # Locate the circular grip void: biggest fully-transparent region whose
    # 8 surrounding probes (at 1.4x its radius) are mostly opaque.
    import math
    w, h = keyed.size
    a = keyed.load()
    best = None
    for cy in range(int(h * 0.2), int(h * 0.85), 6):
        for cx in range(int(w * 0.15), int(w * 0.85), 6):
            if a[cx, cy][3] > 10:
                continue
            # grow radius while transparent
            r = 0
            while r < 260:
                r += 4
                ok = all(
                    0 <= int(cx + r * math.cos(t)) < w and 0 <= int(cy + r * math.sin(t)) < h
                    and a[int(cx + r * math.cos(t)), int(cy + r * math.sin(t))][3] <= 10
                    for t in [k * math.pi / 4 for k in range(8)]
                )
                if not ok:
                    break
            rr = r - 4
            if rr < 30:
                continue
            probes = [k * math.pi / 4 for k in range(8)]
            solid = sum(
                1 for t in probes
                if 0 <= int(cx + rr * 1.45 * math.cos(t)) < w and 0 <= int(cy + rr * 1.45 * math.sin(t)) < h
                and a[int(cx + rr * 1.45 * math.cos(t)), int(cy + rr * 1.45 * math.sin(t))][3] > 160
            )
            if solid >= 5 and (best is None or rr > best[2]):
                best = (cx, cy, rr)
    if best:
        cx, cy, rr = best
        print(f"grip void: center=({cx},{cy}) r={rr} -> gripX={cx/w:.3f} gripY={cy/h:.3f} aspect={h/w:.4f} diamFrac={2*rr/w:.3f}")
    else:
        print("no grip void found - inspect manually")


if __name__ == "__main__":
    asyncio.run(main())
