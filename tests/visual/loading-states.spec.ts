import { test, expect } from '../../src/fixtures';

test.describe('Loading States Visual Regression', () => {
  test('should match welcome page screenshot', async ({ page }) => {
    await page.waitForSelector('.app-shell', { timeout: 30_000 });
    // Navigate to the welcome/guid page
    await page.evaluate(() => {
      window.location.hash = '#/guid';
    });
    await page.waitForTimeout(1_000);
    await expect(page).toHaveScreenshot('welcome-page.png', {
      maxDiffPixelRatio: 0.01,
    });
  });

  test('should match main layout screenshot', async ({ page }) => {
    await page.waitForSelector('.app-shell', { timeout: 30_000 });
    await page.waitForTimeout(1_000);
    await expect(page).toHaveScreenshot('main-layout.png', {
      maxDiffPixelRatio: 0.01,
    });
  });

  test('should match sidebar expanded state', async ({ page }) => {
    await page.waitForSelector('.layout-sider', { timeout: 30_000 });
    await page.waitForTimeout(500);
    await expect(page.locator('.layout-sider')).toHaveScreenshot('sidebar-expanded.png', {
      maxDiffPixelRatio: 0.01,
    });
  });

  test('should match settings page layout', async ({ page }) => {
    await page.waitForSelector('.app-shell', { timeout: 30_000 });
    // Navigate to settings
    await page.locator('.sider-footer').click();
    await page.waitForSelector('.settings-sider', { timeout: 10_000 });
    await page.waitForTimeout(500);
    await expect(page).toHaveScreenshot('settings-page.png', {
      maxDiffPixelRatio: 0.01,
    });
  });
});
