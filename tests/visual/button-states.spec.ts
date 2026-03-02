import { test, expect } from '../../src/fixtures';

test.describe('Button States Visual Regression', () => {
  test('should match send button default state', async ({ page }) => {
    await page.waitForSelector('.app-shell', { timeout: 30_000 });
    // Type something to make the send button appear
    const textarea = page.locator('textarea').first();
    if (await textarea.isVisible()) {
      await textarea.fill('test message');
      await page.waitForTimeout(300);
      const sendBtn = page.locator('button.send-button-custom');
      if (await sendBtn.isVisible()) {
        await expect(sendBtn).toHaveScreenshot('send-button-default.png', {
          maxDiffPixelRatio: 0.02,
        });
      }
    }
  });

  test('should match new conversation button', async ({ page }) => {
    await page.waitForSelector('.layout-sider', { timeout: 30_000 });
    const newChatBtn = page.locator('.layout-sider-header button').first();
    if (await newChatBtn.isVisible()) {
      await expect(newChatBtn).toHaveScreenshot('new-chat-button.png', {
        maxDiffPixelRatio: 0.02,
      });
    }
  });

  test('should match settings button in sidebar footer', async ({ page }) => {
    await page.waitForSelector('.app-shell', { timeout: 30_000 });
    const settingsBtn = page.locator('.sider-footer');
    if (await settingsBtn.isVisible()) {
      await expect(settingsBtn).toHaveScreenshot('settings-footer-button.png', {
        maxDiffPixelRatio: 0.02,
      });
    }
  });

  test('should match titlebar controls', async ({ page }) => {
    await page.waitForSelector('.app-titlebar', { timeout: 30_000 });
    await expect(page.locator('.app-titlebar')).toHaveScreenshot('titlebar.png', {
      maxDiffPixelRatio: 0.02,
    });
  });
});
