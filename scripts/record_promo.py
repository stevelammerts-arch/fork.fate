"""Record real app footage segments for the promo video (540x960 -> 9:16).

Segments (separate contexts -> separate webm files in /app/scripts/promo_rec):
  1_parchment: first-run parchment guide -> flip -> realm chooser -> Reaper
  2_deal:      zip in, Deal pressed -> shuffle -> fate revealed
  3_points:    Fate Points dialog -> redeem -> cashier coupon
  4_realms:    Dragon's Hoard then Cyberscape ambiance beauty shots
"""
import asyncio
import os
import shutil
from playwright.async_api import async_playwright

URL = "https://web-fate-launch.preview.emergentagent.com"
OUT = "/app/scripts/promo_rec"
SEALED = """
localStorage.setItem('ff_guide_seen','1');
localStorage.setItem('ff_theme_chosen','1');
localStorage.setItem('ff_theme_hint_seen','1');
localStorage.setItem('ff_points_day', new Date().toISOString().slice(0,10));
"""


async def make_ctx(browser, name, init=None):
    ctx = await browser.new_context(
        viewport={"width": 540, "height": 960},
        record_video_dir=f"{OUT}/{name}",
        record_video_size={"width": 540, "height": 960},
    )
    if init:
        await ctx.add_init_script(init)
    page = await ctx.new_page()
    return ctx, page


async def seg_parchment(browser):
    ctx, page = await make_ctx(browser, "1_parchment", "localStorage.setItem('ff_points_day', new Date().toISOString().slice(0,10));")
    await page.goto(URL, wait_until="domcontentloaded")
    await page.wait_for_selector('[data-testid="parchment-intro"]', timeout=15000)
    await page.wait_for_timeout(4500)  # let viewers read the parchment
    await page.click('[data-testid="parchment-close"]', force=True)
    await page.wait_for_timeout(1800)  # flip + chooser entrance
    await page.click('[data-testid="theme-welcome-option-dark"]', force=True)
    await page.wait_for_timeout(7000)  # reaper ambiance beauty shot
    await ctx.close()
    print("seg 1 done")


async def seg_deal(browser):
    ctx, page = await make_ctx(browser, "2_deal", SEALED + "localStorage.setItem('ff_theme','dark');")
    await page.goto(URL, wait_until="domcontentloaded")
    await page.wait_for_timeout(3000)
    try:
        await page.get_by_text("Skip intro", exact=False).first.click(force=True, timeout=3000)
        await page.wait_for_timeout(800)
    except Exception:
        pass
    try:
        await page.fill('[data-testid="zip-input"]', "90210")
        await page.wait_for_timeout(700)
    except Exception as e:
        print("zip fill failed:", e)
    btn = page.locator('[data-testid="spin-roulette-button"]').first
    await btn.scroll_into_view_if_needed()
    await page.wait_for_timeout(600)
    await btn.click(force=True)
    print("deal clicked; waiting for reveal...")
    await page.wait_for_timeout(16000)  # shuffle + reveal show
    await ctx.close()
    print("seg 2 done")


async def seg_points(browser):
    ctx, page = await make_ctx(browser, "3_points", SEALED + "localStorage.setItem('ff_theme','light');localStorage.setItem('ff_points','585');")
    await page.goto(URL, wait_until="domcontentloaded")
    await page.wait_for_timeout(2500)
    try:
        await page.get_by_text("Skip intro", exact=False).first.click(force=True, timeout=3000)
        await page.wait_for_timeout(800)
    except Exception:
        pass
    pill = page.locator('[data-testid="fate-points-btn"]').first
    await pill.scroll_into_view_if_needed()
    await page.wait_for_timeout(1200)
    await pill.click(force=True)
    await page.wait_for_timeout(2600)  # dialog beauty shot
    await page.click('[data-testid="rewards-redeem-neon-noodle"]', force=True)
    await page.wait_for_timeout(500)
    await page.click('[data-testid="rewards-redeem-neon-noodle"]', force=True)
    await page.wait_for_timeout(3500)  # cashier coupon shot
    await ctx.close()
    print("seg 3 done")


async def seg_realms(browser):
    for name, theme in [("4_dragon", "fantasy"), ("5_cyber", "cyber")]:
        ctx, page = await make_ctx(browser, name, SEALED + f"localStorage.setItem('ff_theme','{theme}');")
        await page.goto(URL, wait_until="domcontentloaded")
        await page.wait_for_timeout(1500)
        try:
            await page.get_by_text("Skip intro", exact=False).first.click(force=True, timeout=2500)
        except Exception:
            pass
        await page.wait_for_timeout(5500)
        await ctx.close()
        print(f"{name} done")


async def main():
    shutil.rmtree(OUT, ignore_errors=True)
    os.makedirs(OUT, exist_ok=True)
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        await seg_parchment(browser)
        await seg_deal(browser)
        await seg_points(browser)
        await seg_realms(browser)
        await browser.close()
    for root, _, files in os.walk(OUT):
        for f in files:
            print(os.path.join(root, f))


asyncio.run(main())
