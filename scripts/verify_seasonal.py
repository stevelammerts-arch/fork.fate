import asyncio
from playwright.async_api import async_playwright

URL = "https://web-fate-launch.preview.emergentagent.com"
EXE = "/pw-browsers/chromium_headless_shell-1208/chrome-linux/headless_shell"


async def force(page, theme, variant, clear_seen=False):
    await page.goto(URL, wait_until="domcontentloaded")
    await page.evaluate(f"""() => {{
        {'localStorage.removeItem("ff_rituals_seen");' if clear_seen else ''}
        localStorage.setItem('ff_theme', '{theme}');
        localStorage.setItem('ff_theme_chosen', '1');
        localStorage.setItem('ff_theme_hint_seen', '1');
        localStorage.setItem('ff_muted', '1');
        localStorage.setItem('ff_deal_taps', '9');
        localStorage.setItem('ff_rare_at', '10');
        localStorage.setItem('ff_rare_force', '{variant}');
    }}""")
    await page.reload(wait_until="networkidle")
    await page.wait_for_timeout(1500)
    skip = page.locator('[data-testid="guided-skip"]')
    if await skip.count() > 0:
        try:
            await skip.first.click(force=True, timeout=3000)
            await page.wait_for_timeout(800)
        except Exception:
            pass
    await page.locator('[data-testid="spin-roulette-button"]').first.click(force=True, timeout=5000)
    await page.wait_for_timeout(2500)


async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(executable_path=EXE)
        page = await browser.new_page(viewport={"width": 390, "height": 800})
        errors = []
        page.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)

        # 1) LEAF PILE (fall) — first-time -> toast
        await force(page, "fall", "leaves", clear_seen=True)
        print("leafpile cover:", await page.locator('[data-testid="leafpile-cover"]').count())
        await page.screenshot(path="/tmp/s_leaf_start.png")
        for _ in range(4):
            await page.locator('[data-testid="leafpile-cover"]').click(force=True)
            await page.wait_for_timeout(300)
        await page.wait_for_timeout(1300)
        print("leafpile done:", await page.locator('[data-testid="leafpile-done"]').count())
        await page.wait_for_timeout(2200)
        print("leafpile unmounted:", await page.locator('[data-testid="leafpile-cover"]').count() == 0)
        await page.wait_for_timeout(800)
        toast = await page.locator("text=New fate witnessed!").count()
        print("witnessed toast shown:", toast)
        await page.screenshot(path="/tmp/s_leaf_toast.png")

        # button layout: respin + dare beside reaction bar (no scroll)
        rb = await page.locator('[data-testid="respin-button"]').bounding_box()
        rx = await page.locator('[data-testid="reaction-up"]').bounding_box()
        print("respin box:", rb and {k: round(v) for k, v in rb.items()})
        print("reaction box:", rx and {k: round(v) for k, v in rx.items()})
        if rb and rx:
            print("same-region row (respin left of/near reactions):", rb["y"] < rx["y"] + 80 and rb["x"] < rx["x"])

        # 2) CHERRY BLOOM (spring)
        await force(page, "spring", "bloom")
        print("bloom cover:", await page.locator('[data-testid="bloom-cover"]').count())
        await page.screenshot(path="/tmp/s_bloom_bud.png")
        for _ in range(3):
            await page.locator('[data-testid="bloom-cover"]').click(force=True)
            await page.wait_for_timeout(300)
        await page.wait_for_timeout(1600)
        print("bloom done:", await page.locator('[data-testid="bloom-done"]').count())
        await page.screenshot(path="/tmp/s_bloom_open.png")
        await page.wait_for_timeout(2200)
        print("bloom unmounted:", await page.locator('[data-testid="bloom-cover"]').count() == 0)

        # 3) MELON SMASH (summer)
        await force(page, "summer", "melon")
        print("melon cover:", await page.locator('[data-testid="melon-cover"]').count())
        await page.screenshot(path="/tmp/s_melon_whole.png")
        for _ in range(3):
            await page.locator('[data-testid="melon-cover"]').click(force=True)
            await page.wait_for_timeout(280)
        await page.wait_for_timeout(1500)
        print("melon done:", await page.locator('[data-testid="melon-done"]').count())
        await page.screenshot(path="/tmp/s_melon_split.png")
        await page.wait_for_timeout(2200)
        print("melon unmounted:", await page.locator('[data-testid="melon-cover"]').count() == 0)

        # 4) collection page shows 18 + new cards unlocked
        await page.goto(URL + "/rituals", wait_until="networkidle")
        await page.wait_for_timeout(1000)
        prog = (await page.locator('[data-testid="rituals-progress"]').inner_text()).replace("\n", " ")
        print("progress:", prog)
        for k in ["leaves", "bloom", "melon"]:
            print(f"card {k}:", await page.locator(f'[data-testid="ritual-name-{k}"]').inner_text())

        # 5) fall flourish mounts on a normal fall deal + audio 200
        await page.goto(URL, wait_until="domcontentloaded")
        await page.evaluate("""() => {
            localStorage.setItem('ff_theme', 'fall');
            localStorage.setItem('ff_deal_taps', '0');
            localStorage.setItem('ff_rare_at', '100');
            localStorage.removeItem('ff_rare_force');
        }""")
        await page.reload(wait_until="networkidle")
        await page.wait_for_timeout(1500)
        await page.locator('[data-testid="spin-roulette-button"]').first.click(force=True, timeout=5000)
        seen = 0
        for _ in range(24):
            await page.wait_for_timeout(500)
            seen = max(seen, await page.locator('[data-flourish="fall"]').count())
            if seen:
                break
        print("fall flourish mounted:", seen)

        errs = [e for e in errors if "favicon" not in e]
        print("console errors:", errs[:4] if errs else "NONE")
        await browser.close()

asyncio.run(main())
