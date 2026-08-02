"""Capture App Store / Play Store phone screenshots at 1290x2796 (iPhone 6.7",
430x932 CSS px @3x) using the system Chrome. Writes to
/app/frontend/public/store-assets/screenshot-N-*.png
"""
import asyncio
import os
from playwright.async_api import async_playwright

URL = os.popen("grep REACT_APP_BACKEND_URL /app/frontend/.env | cut -d '=' -f2").read().strip()
OUT = "/app/frontend/public/store-assets"


async def skip_guided(page):
    """The guided ritual overlay shows on every page load — dismiss it hard."""
    for _ in range(3):
        try:
            btn = page.get_by_text("Skip intro")
            if await btn.count():
                await btn.first.click(force=True)
                await asyncio.sleep(1.2)
                if not await page.get_by_text("Skip intro").count():
                    return
            else:
                return
        except Exception:
            await asyncio.sleep(1)


async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(
            executable_path="/usr/bin/google-chrome",
            args=["--no-sandbox", "--disable-dev-shm-usage"],
        )
        ctx = await browser.new_context(
            viewport={"width": 430, "height": 932},
            device_scale_factor=3,
            is_mobile=True,
            has_touch=True,
            user_agent="Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
        )
        page = await ctx.new_page()

        # 1) Realm chooser (fresh visitor)
        await page.goto(URL, wait_until="networkidle", timeout=45000)
        await page.evaluate("localStorage.clear()")
        # Suppress promo banners/toasts that would clutter store screenshots
        await page.evaluate("""() => {
            localStorage.setItem('ff_beta_dismissed_v2', '1');
            localStorage.setItem('ff_install_help_snooze', String(Date.now() + 86400000));
            localStorage.setItem('ff_install_nudged', '1');
        }""")
        await page.reload(wait_until="networkidle")
        await asyncio.sleep(2.5)
        await page.screenshot(path=f"{OUT}/screenshot-1-realms.png")
        print("1: realm chooser")

        # 2) Home hero (Reaper) after entering
        await page.get_by_test_id("theme-welcome-option-dark").click(force=True)
        await asyncio.sleep(3)  # let the peek finish
        await page.get_by_test_id("theme-welcome-continue").click(force=True)
        await skip_guided(page)
        await asyncio.sleep(2)
        await page.screenshot(path=f"{OUT}/screenshot-2-home.png")
        print("2: home hero")

        # 3) Reveal card after a deal (ZIP 10001); reroll past closed spots
        await skip_guided(page)
        await page.get_by_test_id("zip-input").fill("10001")
        await asyncio.sleep(0.5)
        # JS-dispatched click: coordinate clicks can race the page's auto-scroll
        # and land on the header's "Guided" button, re-opening the ritual.
        await page.evaluate("document.querySelector('[data-testid=\"spin-roulette-button\"]').click()")
        await asyncio.sleep(9)  # shuffle animation + reveal
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
        # Frame the reveal card nicely
        try:
            await page.get_by_test_id("theme-flourish").scroll_into_view_if_needed(timeout=4000)
        except Exception:
            pass
        await asyncio.sleep(1)
        await page.screenshot(path=f"{OUT}/screenshot-3-reveal.png")
        print("3: reveal")

        # 4) Coffee Shop theme
        await page.evaluate("localStorage.setItem('ff_theme','light')")
        await page.reload(wait_until="networkidle")
        await skip_guided(page)  # guided ritual shows on every load
        await asyncio.sleep(2.5)
        await page.screenshot(path=f"{OUT}/screenshot-4-coffee.png")
        print("4: coffee shop")

        await browser.close()


asyncio.run(main())
