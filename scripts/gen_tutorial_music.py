"""One-off: generate the promo-video tutorial music bed with Fal Lyria 2
through the Emergent Universal Key proxy (queue inference only, no Platform APIs).
Output: /app/scripts/tutorial_music.wav (~30s instrumental).
"""
import os
import sys
import time
from urllib.parse import urlparse

import requests
from dotenv import load_dotenv

load_dotenv("/app/backend/.env")

EMERGENT_LLM_KEY = os.environ["EMERGENT_LLM_KEY"]
# NB: this client supports Fal queue inference through the Emergent proxy only,
# not Fal Platform APIs.
BASE = os.environ.get("INTEGRATION_PROXY_URL", "https://integrations.emergentagent.com").rstrip("/")
CONTROL = f"{BASE}/api/v1/fal"
QUEUE_BASE = f"{CONTROL}/queue"
H = {"Authorization": f"Bearer {EMERGENT_LLM_KEY}", "Content-Type": "application/json"}

PROMPT = (
    "Playful dark-whimsical instrumental tutorial music: light pizzicato strings, "
    "celesta and soft woodwinds over a gentle swing rhythm, curious and mischievous "
    "mood like a friendly haunted tavern, medium tempo, warm and inviting, loopable, "
    "no vocals"
)


def trusted(url: str) -> str:
    c, q = urlparse(url), urlparse(QUEUE_BASE)
    assert c.scheme == q.scheme and c.netloc == q.netloc and c.path.startswith(q.path.rstrip("/") + "/"), \
        f"untrusted queue url: {url}"
    return url


def main():
    sub = requests.post(
        f"{CONTROL}/proxy",
        headers={**H, "X-Fal-Target-Url": "https://queue.fal.run/fal-ai/lyria2"},
        json={"prompt": PROMPT, "negative_prompt": "vocals, harsh noise, distortion, low quality"},
        timeout=60,
    )
    if sub.status_code == 402:
        sys.exit("Insufficient Universal Key credits")
    sub.raise_for_status()
    body = sub.json()
    status_url, response_url = trusted(body["status_url"]), trusted(body["response_url"])
    deadline = time.monotonic() + 600
    while time.monotonic() < deadline:
        st = requests.get(status_url, headers=H, timeout=30)
        st.raise_for_status()
        s = (st.json().get("status") or "").upper()
        print("status:", s, flush=True)
        if s in ("COMPLETED", "OK"):
            res = requests.get(response_url, headers=H, timeout=60)
            res.raise_for_status()
            audio_url = res.json()["audio"]["url"]
            wav = requests.get(audio_url, timeout=120)
            wav.raise_for_status()
            out = "/app/scripts/tutorial_music.wav"
            open(out, "wb").write(wav.content)
            print("saved", out, len(wav.content), "bytes")
            return
        if s in ("FAILED", "CANCELLED", "CANCELED", "ERROR"):
            sys.exit(f"generation failed: {s}")
        time.sleep(3)
    sys.exit("timed out")


if __name__ == "__main__":
    main()
