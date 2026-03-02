import { test, expect } from '../../src/fixtures';

test.describe('Settings Navigation', () => {
  test('should open settings from sidebar and see all sections', async ({ page }) => {
    // Expand sidebar
    await page.locator('.app-titlebar__menu button').first().click();
    await page.waitForTimeout(500);

    // Click "设置" in sidebar footer
    await page.locator('.sider-footer').click();
    await page.waitForTimeout(1000);
    expect(page.url()).toContain('settings');

    // Settings items should be visible in the sidebar as vertical list
    const settingsItems = page.locator('.settings-sider__item');
    await expect(settingsItems.first()).toBeVisible({ timeout: 5_000 });
    const count = await settingsItems.count();
    expect(count).toBeGreaterThanOrEqual(7);
  });

  test('should click through settings sections', async ({ page }) => {
    // Navigate to settings
    await page.evaluate(() => { window.location.hash = '#/settings/gemini'; });
    await page.waitForTimeout(1000);

    // Click "显示" (Display)
    await page.locator('.settings-sider__item').filter({ hasText: '显示' }).click();
    await page.waitForTimeout(500);
    expect(page.url()).toContain('settings/display');

    // Click "系统" (System)
    await page.locator('.settings-sider__item').filter({ hasText: '系统' }).click();
    await page.waitForTimeout(500);
    expect(page.url()).toContain('settings/system');

    // Click "关于" (About)
    await page.locator('.settings-sider__item').filter({ hasText: '关于' }).click();
    await page.waitForTimeout(500);
    expect(page.url()).toContain('settings/about');
  });

  test('should go back from settings via "返回聊天" button', async ({ page }) => {
    // Navigate to settings
    await page.evaluate(() => { window.location.hash = '#/settings/gemini'; });
    await page.waitForTimeout(1000);

    // Click "返回聊天" at bottom of settings sidebar
    await page.locator('.sider-footer').click();
    await page.waitForTimeout(500);

    expect(page.url()).not.toContain('settings');
  });
});
