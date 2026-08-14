"""Generate 4 concept images for the steampunk clockwork automaton golem
that will replace the cabinet (steam-console) in the Steampunk realm.
Dormant / powered-down, matching the realm's weathered iron + brass style."""
import asyncio
import base64
import os
import sys

sys.path.insert(0, "/app/backend")
from dotenv import load_dotenv

load_dotenv("/app/backend/.env")
from emergentintegrations.llm.chat import LlmChat, UserMessage

STYLE = (
    "Photorealistic gritty steampunk style: heavily weathered dark cast iron and riveted steel plates, "
    "aged brass and copper with green patina, rust streaks, oil stains, exposed clockwork gears, "
    "copper steam pipes. The machine is POWERED OFF and DORMANT, as if sleeping: head bowed or slumped, "
    "eye lenses dark and unlit, no glowing parts, no steam, no fire. Full body visible head to toe, "
    "nothing cropped. Standing pose suitable for a scene corner. Tall portrait composition. "
    "Isolated on a plain solid white background, no floor shadow scenery, no text."
)

CONCEPTS = {
    1: "A colossal boiler-chested automaton golem: a massive round riveted boiler for a torso with dark brass "
       "pressure gauges embedded in the chest, thick copper pipes running over its shoulders like veins into its back, "
       "huge gorilla-like iron arms with exposed gear joints, small dormant chimney stacks on its back, "
       "a heavy rounded head slumped forward in sleep.",
    2: "A tall slender Victorian clockwork automaton butler-golem: elegant tarnished brass humanoid frame, "
       "an exposed glass chest panel revealing a stopped gear train and a still pendulum inside, "
       "organ-like copper pipes rising from its back, thin articulated arms hanging limp, "
       "chin resting on its chest, asleep standing upright like a shut-down sentinel.",
    3: "A hunched furnace-golem asleep on its feet: bulky asymmetric body with a dark cold furnace grate in its belly "
       "(no fire inside), one oversized piston-driven arm bigger than the other, kettle steam whistles on its shoulders, "
       "riveted iron shoulder pauldrons, copper pipework wrapped around its forearms, "
       "heavy brow head with closed eye shutters, leaning slightly as if dozing.",
    4: "A clockwork gargoyle-owl guardian golem: broad armored body of blackened iron with brass filigree, "
       "an owl-like mechanical head with closed brass eyelid shutters, folded copper-feathered mechanical wing plates "
       "on its back, thick steam pipes connecting its shoulders to a backpack boiler, clawed gauntlet hands resting "
       "at its sides, asleep and still.",
}


async def gen(idx: int, prompt: str) -> None:
    api_key = os.getenv("EMERGENT_LLM_KEY")
    chat = LlmChat(api_key=api_key, session_id=f"golem-concept-{idx}", system_message="You are an expert concept artist.")
    chat.with_model("gemini", "gemini-3.1-flash-image-preview").with_params(modalities=["image", "text"])
    msg = UserMessage(text=f"{prompt} {STYLE}")
    text, images = await chat.send_message_multimodal_response(msg)
    if not images:
        print(f"concept {idx}: NO IMAGE ({(text or '')[:120]})")
        return
    out = f"/app/frontend/public/golem-concept-{idx}.png"
    with open(out, "wb") as f:
        f.write(base64.b64decode(images[0]["data"]))
    print(f"concept {idx}: saved {out}")


async def main() -> None:
    for i, p in CONCEPTS.items():
        try:
            await gen(i, p)
        except Exception as e:  # noqa: BLE001
            print(f"concept {i}: FAILED {e}")


asyncio.run(main())
