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
localStorage.setItem('ff_season_announced', 'beachballs-' + new Date().getFullYear());
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
    ctx, page = await make_ctx(browser, "1_parchment", "localStorage.setItem('ff_points_day', new Date().toISOString().slice(0,10)); localStorage.setItem('ff_season_announced', 'beachballs-' + new Date().getFullYear());")
    await page.goto(URL, wait_until="domcontentloaded")
    await page.wait_for_selector('[data-testid="parchment-intro"]', timeout=15000)
    await page.wait_for_timeout(4500)  # let viewers read the parchment
    await page.click('[data-testid="parchment-close"]', force=True)
    await page.wait_for_timeout(1400)  # flip + chooser entrance
    # HOLD on the realm chooser so all 11 realm tiles get their moment
    await page.wait_for_timeout(4600)
    await page.click('[data-testid="theme-welcome-option-dark"]', force=True)
    await page.wait_for_timeout(6000)  # reaper ambiance beauty shot
    await ctx.close()
    print("seg 1 done")


async def point_at(page, sel, hold_ms):
    """Flash a red arrow above the element the viewer should tap."""
    await page.evaluate(
        """(sel) => {
        if (!document.getElementById('ff-arrow-style')) {
          const st = document.createElement('style'); st.id = 'ff-arrow-style';
          st.textContent = '@keyframes ffArrowFlash {0%,100%{opacity:1;transform:translateY(0)}50%{opacity:0.15;transform:translateY(-8px)}}';
          document.head.appendChild(st);
        }
        const el = document.querySelector(sel);
        if (!el) return false;
        el.scrollIntoView({block: 'center'});
        const r = el.getBoundingClientRect();
        let a = document.getElementById('ff-promo-arrow');
        if (!a) {
          a = document.createElement('div'); a.id = 'ff-promo-arrow';
          a.style.cssText = 'position:fixed;z-index:2147483647;pointer-events:none;animation:ffArrowFlash 0.65s ease-in-out infinite;filter:drop-shadow(0 3px 8px rgba(0,0,0,0.8));';
          a.innerHTML = '<svg width="54" height="64" viewBox="0 0 54 64"><path d="M27 64 L4 34 H16 V0 H38 V34 H50 Z" fill="#E8232B" stroke="#FFFFFF" stroke-width="3"/></svg>';
          document.body.appendChild(a);
        }
        a.style.left = (r.left + r.width / 2 - 27) + 'px';
        a.style.top = (Math.max(r.top - 72, 8)) + 'px';
        a.style.display = 'block';
        return true;
      }""",
        sel,
    )
    await page.wait_for_timeout(hold_ms)
    await page.evaluate("() => { const a = document.getElementById('ff-promo-arrow'); if (a) a.style.display = 'none'; }")


async def seg_deal(browser):
    ctx, page = await make_ctx(browser, "2_deal", SEALED + "localStorage.setItem('ff_theme','dark');")
    await page.goto(URL, wait_until="domcontentloaded")
    await page.wait_for_timeout(3000)
    # GUIDED WALKTHROUGH: brisk step 1, more air on the rest; a flashing
    # arrow marks every tap target before it is pressed.
    await page.wait_for_timeout(1000)  # Step 1: What calls to you?
    await point_at(page, '[data-testid="guided-interest-food"]', 1400)
    await page.click('[data-testid="guided-interest-food"]', force=True)
    await page.wait_for_timeout(600)  # Step 2: Where are you?
    await point_at(page, '[data-testid="guided-zip-input"]', 1200)
    await page.fill('[data-testid="guided-zip-input"]', "90210")
    await page.wait_for_timeout(800)
    await point_at(page, '[data-testid="guided-location-next"]', 1400)
    await page.click('[data-testid="guided-location-next"]', force=True)
    await page.wait_for_timeout(1000)  # Step 3: pick the vibe
    await point_at(page, '[data-testid="guided-surprise-me"]', 1600)
    await page.click('[data-testid="guided-surprise-me"]', force=True)
    await page.wait_for_timeout(900)  # Step 4: the seal
    await point_at(page, '[data-testid="guided-seal-button"]', 1800)
    try:
        await page.click('[data-testid="guided-seal-button"]', force=True, timeout=4000)
    except Exception as e:
        print("seal click failed:", e)
    print("sealed; waiting for shuffle + reveal...")
    await page.wait_for_timeout(17000)  # shuffle + reveal show
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


HIDE_UI = """
body *:not(.ff-theme-scene):not(.ff-theme-scene *):not(.ff-reaper-wrap):not(.ff-reaper-wrap *) { visibility: hidden !important; }
.ff-theme-scene, .ff-theme-scene *, .ff-reaper-wrap, .ff-reaper-wrap * { visibility: visible !important; }
"""


async def seg_realm_flash(browser):
    # Clean scenery-only shots of 3 realms (UI hidden) for the quick flashes
    for name, theme in [("6_tiki", "tiki"), ("7_fairy", "fairy"), ("8_winter", "winter")]:
        ctx, page = await make_ctx(browser, name, SEALED + f"localStorage.setItem('ff_theme','{theme}');")
        await page.goto(URL, wait_until="domcontentloaded")
        await page.wait_for_timeout(1500)
        try:
            await page.get_by_text("Skip intro", exact=False).first.click(force=True, timeout=2500)
        except Exception:
            pass
        await page.add_style_tag(content=HIDE_UI)
        await page.wait_for_timeout(4000)
        await ctx.close()
        print(f"{name} done")


async def seg_sponsor(browser):
    ctx, page = await make_ctx(browser, "9_sponsor", SEALED + "localStorage.setItem('ff_theme','light');")
    await page.goto(URL, wait_until="domcontentloaded")
    await page.wait_for_timeout(2500)
    try:
        await page.get_by_text("Skip intro", exact=False).first.click(force=True, timeout=3000)
        await page.wait_for_timeout(800)
    except Exception:
        pass
    # The header sponsor button is desktop-only; unhide it for the shot so
    # the arrow has a real target (it looks native in the header)
    await page.add_style_tag(content='[data-testid="header-sponsor-link"]{display:inline-flex !important;}')
    await page.wait_for_timeout(400)
    target = '[data-testid="header-sponsor-link"]'
    if not await page.query_selector(target):
        print("no sponsor CTA found!")
        await ctx.close()
        return
    await point_at(page, target, 1500)
    await page.click(target, force=True)
    await page.wait_for_timeout(5500)  # sponsor dialog with tier picker on show
    await ctx.close()
    print("seg 9 done")


async def main():
    shutil.rmtree(OUT, ignore_errors=True)
    os.makedirs(OUT, exist_ok=True)
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        await seg_parchment(browser)
        await seg_deal(browser)
        await seg_points(browser)
        await seg_realms(browser)
        await seg_realm_flash(browser)
        await seg_sponsor(browser)
        await browser.close()
    for root, _, files in os.walk(OUT):
        for f in files:
            print(os.path.join(root, f))


asyncio.run(main())
