"""Focused Playwright checks for sponsor pricing copy regression.

Bug: public pages still showed $29/month after sponsor price dropped to $19/month.
This file mirrors the browser-automation script used by the testing agent.
"""

async def run(page):
    await page.set_viewport_size({"width": 1920, "height": 1080})
    await page.goto("https://web-fate-launch.preview.emergentagent.com", wait_until="networkidle")

    if await page.get_by_test_id("guided-skip").is_visible():
        await page.get_by_test_id("guided-skip").click(force=True)
        await page.wait_for_timeout(500)

    await page.get_by_test_id("feature-business-band").scroll_into_view_if_needed()
    feature_text = await page.get_by_test_id("feature-business-band").inner_text()
    assert "$19" in feature_text and "$190" in feature_text
    assert "$29" in feature_text and "$290" in feature_text  # intentional strikethrough discount indicators
    assert "Save $38/yr" in feature_text
    assert "Save $58" not in feature_text

    await page.get_by_test_id("sponsorship-cta").scroll_into_view_if_needed()
    bottom_text = await page.get_by_test_id("sponsorship-cta").inner_text()
    assert "$19/month" in bottom_text
    assert "$29/month" not in bottom_text

    await page.get_by_test_id("sponsorship-cta").get_by_test_id("become-sponsor-button").click(force=True)
    await page.wait_for_timeout(500)
    dialog = page.get_by_test_id("sponsor-dialog")
    monthly_text = await page.get_by_test_id("sponsor-plan-monthly").inner_text()
    yearly_text = await page.get_by_test_id("sponsor-plan-yearly").inner_text()
    note_text = await page.get_by_test_id("sponsor-plan-note").inner_text()
    assert "$19" in monthly_text and "$29" in monthly_text
    assert "$190" in yearly_text and "$290" in yearly_text and "Save $38/yr" in yearly_text
    assert "Save $58" not in yearly_text
    assert "Free first month, then $19/month · cancel anytime" in note_text
    assert "$29/month" not in note_text

    await page.get_by_test_id("sponsor-plan-yearly").click(force=True)
    await page.wait_for_timeout(300)
    yearly_note = await page.get_by_test_id("sponsor-plan-note").inner_text()
    assert "Billed $190 today, then annually · cancel anytime" in yearly_note
    assert "$290" not in yearly_note

    await page.keyboard.press("Escape")
    await page.wait_for_timeout(300)
    await page.get_by_test_id("lang-es").click(force=True)
    await page.wait_for_timeout(500)
    await page.get_by_test_id("feature-business-band").scroll_into_view_if_needed()
    spanish_feature_text = await page.get_by_test_id("feature-business-band").inner_text()
    assert "Ahorra $38/año" in spanish_feature_text
    assert "Ahorra $58" not in spanish_feature_text
    await page.get_by_test_id("feature-business-cta").click(force=True)
    await page.wait_for_timeout(500)
    spanish_note = await page.get_by_test_id("sponsor-plan-note").inner_text()
    assert "Primer mes gratis, luego $19/mes" in spanish_note
    assert "$29/mes" not in spanish_note

    await page.goto("https://web-fate-launch.preview.emergentagent.com/terms", wait_until="networkidle")
    terms_text = await page.get_by_test_id("legal-page-terms").inner_text()
    assert "$19/month or $190/year" in terms_text
    assert "$29/month" not in terms_text