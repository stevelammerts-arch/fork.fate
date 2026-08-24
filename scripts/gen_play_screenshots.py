"""Capture fresh Play Store phone screenshots at 1080x1920 (540x960 @2x).
Raw captures -> /app/scripts/play_shots/raw/*.png (composed by
compose_play_screenshots.py afterwards).
"""
import asyncio
import os
import shutil
from playwright.async_api import async_playwright

URL = os.popen("grep REACT_APP_BACKEND_URL /app/frontend/.env | cut -d '=' -f2").read().strip()
RAW = "/app/scripts/play_shots/raw"

SUPPRESS = """
localStorage.setItem('ff_beta_dismissed_v2','1');
localStorage.setItem('ff_install_help_snooze', String(Date.now() + 86400000));
localStorage.setItem('ff_install_nudged','1');
localStorage.setItem('ff_points_day', new Date().toISOString().slice(0,10));
localStorage.setItem('ff_season_announced', 'beachballs-' + new Date().getFullYear());
"""
SEALED = SUPPRESS + """
localStorage.setItem('ff_guide_seen','1');
localStorage.setItem('ff_theme_chosen','1');
localStorage.setItem('ff_theme_hint_seen','1');
"""


async def skip_guided(page):
    for _ in range(3):
        try:
            btn = page.get_by_text("Skip intro")
            if await btn.count():
                await btn.first.click(force=True)
                await asyncio.sleep(1.2)
            else:
                return
        except Exception:
            await asyncio.sleep(1)


async def shot(browser, name, init, actions=None, settle=3.0):
    ctx = await browser.new_context(
        viewport={"width": 540, "height": 960}, device_scale_factor=2,
        is_mobile=True, has_touch=True,
    )
    await ctx.add_init_script(init)
    page = await ctx.new_page()
    await page.goto(URL, wait_until="domcontentloaded", timeout=45000)
    await asyncio.sleep(2.5)
    if actions:
        await actions(page)
    await asyncio.sleep(settle)
    await page.screenshot(path=f"{RAW}/{name}.png")
    await ctx.close()
    print(name, "done")


async def main():
    shutil.rmtree("/app/scripts/play_shots", ignore_errors=True)
    os.makedirs(RAW, exist_ok=True)
    async with async_playwright() as p:
        browser = await p.chromium.launch(
            headless=True,
            executable_path="/usr/bin/google-chrome",
            args=["--no-sandbox", "--disable-dev-shm-usage"],
        )

        # 1) Reaper hero
        await shot(browser, "1_hero", SEALED + "localStorage.setItem('ff_theme','dark');",
                   actions=skip_guided, settle=4)

        # 2) Realm chooser (guide already seen, no realm chosen)
        await shot(browser, "2_realms", SUPPRESS + "localStorage.setItem('ff_guide_seen','1');",
                   settle=4)

        # 3) Parchment field guide (fresh visitor)
        await shot(browser, "3_guide", SUPPRESS, settle=3.5)

        # 4) Reveal card after a spin (dark realm)
        async def reveal(page):
            await skip_guided(page)
            await page.get_by_test_id("zip-input").fill("10001")
            await asyncio.sleep(0.5)
            await page.evaluate("document.querySelector('[data-testid=\"spin-roulette-button\"]').click()")
            await asyncio.sleep(9)
            await skip_guided(page)
            for _ in range(2):
                try:
                    closed = await page.get_by_text("Closed right now").count()
                except Exception:
                    closed = 0
                if not closed:
                    break
                await page.evaluate("document.querySelector('[data-testid=\"respin-button\"]')?.click()")
                await asyncio.sleep(9)
            try:
                await page.get_by_test_id("theme-flourish").scroll_into_view_if_needed(timeout=4000)
            except Exception:
                pass
        await shot(browser, "4_reveal", SEALED + "localStorage.setItem('ff_theme','dark');",
                   actions=reveal, settle=1.5)

        # 5) Fate Points dialog (coffee shop, 585 pts)
        async def points(page):
            await skip_guided(page)
            pill = page.locator('[data-testid="fate-points-btn"]').first
            await pill.scroll_into_view_if_needed()
            await asyncio.sleep(1)
            await pill.click(force=True)
        await shot(browser, "5_points", SEALED + "localStorage.setItem('ff_theme','light');localStorage.setItem('ff_points','585');",
                   actions=points, settle=2.5)

        # 6) Dragon's Hoard
        await shot(browser, "6_dragon", SEALED + "localStorage.setItem('ff_theme','fantasy');",
                   actions=skip_guided, settle=4.5)

        # 7) Fall forest
        await shot(browser, "7_fall", SEALED + "localStorage.setItem('ff_theme','fall');",
                   actions=skip_guided, settle=4.5)

        # 8) Coffee Shop
        await shot(browser, "8_coffee", SEALED + "localStorage.setItem('ff_theme','light');",
                   actions=skip_guided, settle=3.5)

        await browser.close()


asyncio.run(main())
