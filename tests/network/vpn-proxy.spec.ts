import { test, expect } from '../../src/fixtures';
import { ProxyMockServer } from '../../src/mocks/proxy-server';
import { SettingsPage } from '../../src/pages/settings.page';

test.describe('VPN Proxy Scenarios', () => {
  let proxyServer: ProxyMockServer;

  test.beforeEach(async () => {
    proxyServer = new ProxyMockServer();
    await proxyServer.start();
  });

  test.afterEach(async () => {
    await proxyServer.stop();
  });

  test('should connect through a proxy server', async ({ electronApp, page }) => {
    await page.waitForSelector('.app-shell', { timeout: 30_000 });

    // Set proxy on the Electron session
    const proxyUrl = proxyServer.getUrl();
    await electronApp.evaluate(async ({ session }, url) => {
      await session.defaultSession.setProxy({ proxyRules: url });
    }, proxyUrl);

    // App should still function with proxy configured
    await expect(page.locator('.app-shell')).toBeVisible();
    await expect(page.locator('.layout-content')).toBeVisible();
  });

  test('should handle proxy authentication failure', async ({ electronApp, page }) => {
    await page.waitForSelector('.app-shell', { timeout: 30_000 });

    // Configure a proxy that rejects connections
    const rejectProxy = new ProxyMockServer({ rejectConnections: true });
    const port = await rejectProxy.start();
    const proxyUrl = `http://127.0.0.1:${port}`;

    await electronApp.evaluate(async ({ session }, url) => {
      await session.defaultSession.setProxy({ proxyRules: url });
    }, proxyUrl);

    // App should still be visible (graceful degradation)
    await expect(page.locator('.app-shell')).toBeVisible();

    await rejectProxy.stop();
  });

  test('should clear proxy settings', async ({ electronApp, page }) => {
    await page.waitForSelector('.app-shell', { timeout: 30_000 });

    // Set then clear proxy
    const proxyUrl = proxyServer.getUrl();
    await electronApp.evaluate(async ({ session }, url) => {
      await session.defaultSession.setProxy({ proxyRules: url });
    }, proxyUrl);

    await electronApp.evaluate(async ({ session }) => {
      await session.defaultSession.setProxy({ proxyRules: '' });
    });

    // App should work normally after proxy cleared
    await expect(page.locator('.app-shell')).toBeVisible();
  });
});
