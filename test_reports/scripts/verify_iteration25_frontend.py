"""Focused Playwright verification for Passport ZIP/destination mutual exclusion.

Run with: python /app/test_reports/scripts/verify_iteration25_frontend.py
"""
import asyncio

from playwright.async_api import async_playwright


URL = "https://web-fate-launch.preview.emergentagent.com"


async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page(viewport={"width": 1920, "height": 1080})
        try:
            await page.goto(URL, wait_until="domcontentloaded", timeout=10000)
            await page.wait_for_timeout(1500)

            skip = page.get_by_test_id("guided-skip")
            if await skip.count() > 0 and await skip.first.is_visible():
                await skip.first.click(force=True)
                await page.wait_for_timeout(500)

            await page.get_by_test_id("passport-mode-toggle").scroll_into_view_if_needed()
            await page.get_by_test_id("passport-mode-toggle").click(force=True)
            await page.wait_for_timeout(800)

            destination = page.get_by_test_id("passport-setup-destination")
            zip_input = page.get_by_test_id("passport-setup-zip")
            await destination.wait_for(state="visible", timeout=10000)
            await zip_input.wait_for(state="visible", timeout=10000)

            await destination.fill("Omaha Nebraska")
            assert await destination.input_value() == "Omaha Nebraska"

            await zip_input.fill("90210")
            await page.wait_for_timeout(500)
            assert await zip_input.input_value() == "90210"
            assert await destination.input_value() == "", "Destination did not clear after ZIP entry"

            await destination.fill("Omaha Nebraska")
            await page.wait_for_timeout(500)
            assert await destination.input_value() == "Omaha Nebraska"
            assert await zip_input.input_value() == "", "ZIP did not clear after destination entry"

            print("PASS: Passport ZIP/destination mutual exclusion is symmetric")
        finally:
            await browser.close()


if __name__ == "__main__":
    asyncio.run(main())