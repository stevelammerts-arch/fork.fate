import asyncio
import json
from pathlib import Path
from playwright.async_api import async_playwright, TimeoutError as PlaywrightTimeoutError

FRONTEND_URL = "https://web-fate-launch.preview.emergentagent.com/"
THEMES = ["summer", "dark", "winter", "tiki"]
EXPECTED = {
    "summer": ["/shuffle-seagulls.wav", "/card-deal.wav"],
    "dark": ["/reveal-voice-v5.mp3", "/card-deal.wav"],
    "winter": ["/shuffle-winter.wav", "/card-deal.wav"],
    "tiki": ["/reveal-drums-groove.wav", "/card-deal.wav"],
}
FORBIDDEN = "/card-riffle.wav"
OUT = Path("/app/test_reports/shuffle_audio_iteration20_results.json")

INIT_SCRIPT = r"""
(() => {
  const NativeAudio = window.Audio;
  window.__audioEvents = [];
  window.__audioConstructed = [];
  function record(type, src, extra) {
    const s = String(src || '');
    window.__audioEvents.push(Object.assign({ type, src: s, time: Date.now() }, extra || {}));
  }
  window.Audio = function(src) {
    const audio = new NativeAudio(src);
    const resolved = audio.currentSrc || audio.src || src || '';
    window.__audioConstructed.push(String(resolved));
    record('construct', resolved);
    const nativePlay = audio.play.bind(audio);
    audio.play = function() {
      record('play', audio.currentSrc || audio.src || resolved, { loop: !!audio.loop, volume: audio.volume });
      return nativePlay().catch((e) => {
        record('play-rejected', audio.currentSrc || audio.src || resolved, { message: String(e && e.message || e) });
      });
    };
    const nativeLoad = audio.load.bind(audio);
    audio.load = function() {
      record('load', audio.currentSrc || audio.src || resolved, { loop: !!audio.loop, volume: audio.volume });
      return nativeLoad();
    };
    return audio;
  };
  window.Audio.prototype = NativeAudio.prototype;
  Object.setPrototypeOf(window.Audio, NativeAudio);
})();
"""

async def run_theme(browser, theme):
    context = await browser.new_context(
        viewport={"width": 390, "height": 844},
        is_mobile=True,
        has_touch=True,
        user_agent="Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
    )
    page = await context.new_page()
    console = []
    responses = []
    page.on("console", lambda msg: console.append({"type": msg.type, "text": msg.text}))
    page.on("response", lambda resp: responses.append({"url": resp.url, "status": resp.status}) if "/api/places/search" in resp.url else None)
    await page.add_init_script(INIT_SCRIPT)
    await page.add_init_script(f"""
      try {{
        localStorage.setItem('ff_theme', {json.dumps(theme)});
        localStorage.setItem('ff_muted', '0');
      }} catch(e) {{}}
    """)
    result = {"theme": theme, "ok": False, "errors": [], "audio_events": [], "api_responses": responses, "console_errors": []}
    try:
        await page.goto(FRONTEND_URL, wait_until="domcontentloaded", timeout=60000)
        await page.wait_for_timeout(1000)
        # Force values again after load in case app scripts read storage early.
        await page.evaluate("""(theme) => { localStorage.setItem('ff_theme', theme); localStorage.setItem('ff_muted','0'); }""", theme)
        # If default current theme was already read before storage was applied, use visible theme menu fallback.
        await page.reload(wait_until="domcontentloaded", timeout=60000)
        await page.wait_for_timeout(1200)

        skip = page.locator('[data-testid="guided-skip"]')
        if await skip.count():
            await skip.first.click(timeout=10000)
            await page.wait_for_timeout(500)
        else:
            result["errors"].append("guided skip button not found")

        zip_input = page.locator('[data-testid="zip-input"]')
        await zip_input.wait_for(state="visible", timeout=20000)
        await zip_input.fill("10001")
        await page.wait_for_timeout(300)

        spin = page.locator('[data-testid="spin-roulette-button"]')
        await spin.wait_for(state="visible", timeout=20000)
        await spin.click()

        # Verify the in-flow visual shuffle popup/card appears before final reveal.
        try:
            await page.locator('[data-testid="shuffle-popup"]').wait_for(state="visible", timeout=15000)
            result["shuffle_popup_seen"] = True
            popup_text_1 = await page.locator('[data-testid="shuffle-popup"]').inner_text(timeout=3000)
            await page.wait_for_timeout(900)
            popup_text_2 = await page.locator('[data-testid="shuffle-popup"]').inner_text(timeout=3000)
            result["shuffle_popup_text_samples"] = [popup_text_1, popup_text_2]
        except PlaywrightTimeoutError:
            result["shuffle_popup_seen"] = False
            result["errors"].append("shuffle popup was not observed")

        await page.locator('[data-testid="spin-result-card"]').wait_for(state="visible", timeout=30000)
        result["result_card_seen"] = True
        result["result_card_text"] = (await page.locator('[data-testid="spin-result-card"]').inner_text(timeout=5000))[:500]
        await page.wait_for_timeout(500)
        events = await page.evaluate("window.__audioEvents || []")
        result["audio_events"] = events
        srcs = [e.get("src", "") for e in events if e.get("type") in ("construct", "play", "load", "play-rejected")]
        result["audio_srcs"] = srcs
        result["played_srcs"] = [e.get("src", "") for e in events if e.get("type") in ("play", "play-rejected")]
        result["forbidden_present"] = any(FORBIDDEN in s for s in srcs)
        expected = EXPECTED[theme]
        result["expected_present"] = {exp: any(exp in s for s in srcs) for exp in expected}
        result["console_errors"] = [c for c in console if c["type"] in ("error", "warning")]
        result["ok"] = (not result["forbidden_present"] and all(result["expected_present"].values()) and result.get("shuffle_popup_seen") and result.get("result_card_seen"))
    except Exception as e:
        result["errors"].append(repr(e))
        try:
            result["audio_events"] = await page.evaluate("window.__audioEvents || []")
        except Exception:
            pass
        result["console_errors"] = [c for c in console if c["type"] in ("error", "warning")]
    finally:
        await context.close()
    return result

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True, args=["--autoplay-policy=no-user-gesture-required"])
        results = []
        for theme in THEMES:
            print(f"Testing theme: {theme}")
            r = await run_theme(browser, theme)
            print(json.dumps({"theme": theme, "ok": r["ok"], "forbidden_present": r.get("forbidden_present"), "expected_present": r.get("expected_present"), "errors": r.get("errors")}, indent=2))
            results.append(r)
        await browser.close()
    summary = {
        "frontend_url": FRONTEND_URL,
        "themes": THEMES,
        "forbidden": FORBIDDEN,
        "all_ok": all(r["ok"] for r in results),
        "results": results,
    }
    OUT.write_text(json.dumps(summary, indent=2))
    if not summary["all_ok"]:
        raise SystemExit(1)

if __name__ == "__main__":
    asyncio.run(main())
