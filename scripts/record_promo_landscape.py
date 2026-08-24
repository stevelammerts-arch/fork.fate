"""Record DESKTOP (16:9) app footage for the sponsor-deck landscape promo.

Segments (separate contexts -> webm files in /app/scripts/promo_rec_l):
  1_parchment: parchment guide -> realm chooser -> Reaper realm
  2_deal:      guided walkthrough -> shuffle -> reveal -> arrow at scratch-off
  3_points:    Fate Points dialog -> redeem -> cashier coupon
  4_dragon:    Dragon's Hoard beauty shot
  6_tiki/7_fairy: scenery-only flashes
  9_sponsor:   Become a Sponsor dialog, long dwell + slow scroll (tiers/pricing)
"""
import asyncio
import os
import shutil
from playwright.async_api import async_playwright

URL = "https://web-fate-launch.preview.emergentagent.com"
OUT = "/app/scripts/promo_rec_l"
SEALED = """
localStorage.setItem('ff_guide_seen','1');
localStorage.setItem('ff_theme_chosen','1');
localStorage.setItem('ff_theme_hint_seen','1');
localStorage.setItem('ff_points_day', new Date().toISOString().slice(0,10));
localStorage.setItem('ff_season_announced', 'beachballs-' + new Date().getFullYear());
"""


async def make_ctx(browser, name, init=None):
    ctx = await browser.new_context(
        viewport={"width": 1280, "height": 720},
        record_video_dir=f"{OUT}/{name}",
        record_video_size={"width": 1280, "height": 720},
    )
    if init:
        await ctx.add_init_script(init)
    page = await ctx.new_page()
    return ctx, page


async def point_at(page, sel, hold_ms):
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


async def skip_intro(page, t=3000):
    try:
        await page.get_by_text("Skip intro", exact=False).first.click(force=True, timeout=t)
        await page.wait_for_timeout(800)
    except Exception:
        pass


async def seg_parchment(browser):
    ctx, page = await make_ctx(browser, "1_parchment", "localStorage.setItem('ff_points_day', new Date().toISOString().slice(0,10)); localStorage.setItem('ff_season_announced', 'beachballs-' + new Date().getFullYear());")
    await page.goto(URL, wait_until="domcontentloaded")
    await page.wait_for_selector('[data-testid="parchment-intro"]', timeout=15000)
    await page.wait_for_timeout(4500)
    await page.click('[data-testid="parchment-close"]', force=True)
    await page.wait_for_timeout(1400)
    await page.wait_for_timeout(4600)  # hold on the realm chooser
    await page.click('[data-testid="theme-welcome-option-dark"]', force=True)
    await page.wait_for_timeout(6000)  # reaper beauty shot
    await ctx.close()
    print("seg 1 done")


async def seg_deal(browser):
    ctx, page = await make_ctx(browser, "2_deal", SEALED + "localStorage.setItem('ff_theme','dark');")
    await page.goto(URL, wait_until="domcontentloaded")
    await page.wait_for_timeout(3000)
    await page.wait_for_timeout(1000)
    await point_at(page, '[data-testid="guided-interest-food"]', 1400)
    await page.click('[data-testid="guided-interest-food"]', force=True)
    await page.wait_for_timeout(600)
    await point_at(page, '[data-testid="guided-zip-input"]', 1200)
    await page.fill('[data-testid="guided-zip-input"]', "90210")
    await page.wait_for_timeout(800)
    await point_at(page, '[data-testid="guided-location-next"]', 1400)
    await page.click('[data-testid="guided-location-next"]', force=True)
    await page.wait_for_timeout(1000)
    await point_at(page, '[data-testid="guided-surprise-me"]', 1600)
    await page.click('[data-testid="guided-surprise-me"]', force=True)
    await page.wait_for_timeout(900)
    await point_at(page, '[data-testid="guided-seal-button"]', 1800)
    try:
        await page.click('[data-testid="guided-seal-button"]', force=True, timeout=4000)
    except Exception as e:
        print("seal click failed:", e)
    print("sealed; waiting for shuffle + reveal...")
    await page.wait_for_timeout(13500)  # shuffle + reveal show
    try:
        await point_at(page, '[data-testid="coupon-scratch-cover"]', 3500)
    except Exception as e:
        print("scratch arrow failed:", e)
        await page.wait_for_timeout(3500)
    await ctx.close()
    print("seg 2 done")


async def seg_points(browser):
    ctx, page = await make_ctx(browser, "3_points", SEALED + "localStorage.setItem('ff_theme','light');localStorage.setItem('ff_points','585');")
    await page.goto(URL, wait_until="domcontentloaded")
    await page.wait_for_timeout(2500)
    await skip_intro(page)
    pill = page.locator('[data-testid="fate-points-btn"]').first
    await pill.scroll_into_view_if_needed()
    await page.wait_for_timeout(1200)
    await pill.click(force=True)
    await page.wait_for_timeout(2600)
    await page.click('[data-testid="rewards-redeem-neon-noodle"]', force=True)
    await page.wait_for_timeout(500)
    await page.click('[data-testid="rewards-redeem-neon-noodle"]', force=True)
    await page.wait_for_timeout(3500)  # cashier coupon shot
    await ctx.close()
    print("seg 3 done")


HIDE_UI = """
body *:not(.ff-theme-scene):not(.ff-theme-scene *):not(.ff-reaper-wrap):not(.ff-reaper-wrap *) { visibility: hidden !important; }
.ff-theme-scene, .ff-theme-scene *, .ff-reaper-wrap, .ff-reaper-wrap * { visibility: visible !important; }
"""


async def seg_realms(browser):
    ctx, page = await make_ctx(browser, "4_dragon", SEALED + "localStorage.setItem('ff_theme','fantasy');")
    await page.goto(URL, wait_until="domcontentloaded")
    await page.wait_for_timeout(1500)
    await skip_intro(page, 2500)
    await page.wait_for_timeout(5500)
    await ctx.close()
    print("4_dragon done")
    for name, theme in [("6_tiki", "tiki"), ("7_fairy", "fairy")]:
        ctx, page = await make_ctx(browser, name, SEALED + f"localStorage.setItem('ff_theme','{theme}');")
        await page.goto(URL, wait_until="domcontentloaded")
        await page.wait_for_timeout(1500)
        await skip_intro(page, 2500)
        await page.add_style_tag(content=HIDE_UI)
        await page.wait_for_timeout(4000)
        await ctx.close()
        print(f"{name} done")


async def seg_sponsor(browser):
    ctx, page = await make_ctx(browser, "9_sponsor", SEALED + "localStorage.setItem('ff_theme','light');")
    await page.goto(URL, wait_until="domcontentloaded")
    await page.wait_for_timeout(2500)
    await skip_intro(page)
    await page.add_style_tag(content='[data-testid="header-sponsor-link"]{display:inline-flex !important;}')
    await page.wait_for_timeout(400)
    target = '[data-testid="header-sponsor-link"]'
    if not await page.query_selector(target):
        print("no sponsor CTA found!")
        await ctx.close()
        return
    await point_at(page, target, 1500)
    await page.click(target, force=True)
    await page.wait_for_timeout(4500)  # tier picker dwell
    # slow scroll through the dialog: pricing -> form -> photo upload
    await page.evaluate("""() => {
        const dlg = document.querySelector('[role=dialog]');
        if (!dlg) return;
        const sc = [...dlg.querySelectorAll('*')].find(e => e.scrollHeight > e.clientHeight + 40) || dlg;
        let y = 0; const iv = setInterval(() => { y += 6; sc.scrollTop = y; if (y > 900) clearInterval(iv); }, 16);
    }""")
    await page.wait_for_timeout(3500)
    await page.wait_for_timeout(3000)  # settle on the lower form
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
        await seg_sponsor(browser)
        await browser.close()
    for root, _, files in os.walk(OUT):
        for f in files:
            print(os.path.join(root, f))


asyncio.run(main())
