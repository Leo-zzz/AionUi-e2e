import { test, expect } from '../../src/fixtures';
import { ProxyMockServer } from '../../src/mocks/proxy-server';

test.describe('Proxy Conflict Scenarios', () => {
  test('should handle non-existent proxy gracefully', async ({ electronApp, page }) => {
    await page.waitForSelector('.app-shell', { timeout: 30_000 });

    // Point to a proxy that doesn't exist
    await electronApp.evaluate(async ({ session }) => {
      await session.defaultSession.setProxy({ proxyRules: 'http://127.0.0.1:19999' });
    });

    // App should remain functional (Electron falls back to direct)
    await expect(page.locator('.app-shell')).toBeVisible();
    await expect(page.locator('.layout-content')).toBeVisible();
  });

  test('should handle proxy returning wrong content type', async ({ electronApp, page }) => {
    const proxy = new ProxyMockServer({
      customResponses: { 'api.openai.com:443': 502 },
    });
    const port = await proxy.start();

    await page.waitForSelector('.app-shell', { timeout: 30_000 });

    await electronApp.evaluate(async ({ session }, url) => {
      await session.defaultSession.setProxy({ proxyRules: url });
    }, `http://127.0.0.1:${port}`);

    // App should handle the 502 from proxy gracefully
    await expect(page.locator('.app-shell')).toBeVisible();

    await proxy.stop();
  });

  test('should recover after switching from bad proxy to direct', async ({ electronApp, page }) => {
    await page.waitForSelector('.app-shell', { timeout: 30_000 });

    // Set a bad proxy
    await electronApp.evaluate(async ({ session }) => {
      await session.defaultSession.setProxy({ proxyRules: 'http://127.0.0.1:19999' });
    });

    await page.waitForTimeout(1_000);

    // Clear proxy to go direct
    await electronApp.evaluate(async ({ session }) => {
      await session.defaultSession.setProxy({ proxyRules: '' });
    });

    await page.waitForTimeout(1_000);

    // App should be fully functional
    await expect(page.locator('.app-shell')).toBeVisible();
    await expect(page.locator('.layout-content')).toBeVisible();
  });
});
