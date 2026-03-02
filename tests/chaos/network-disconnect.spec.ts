import { test, expect } from '../../src/fixtures';
import { ChatPage } from '../../src/pages/chat.page';

test.describe('Network Disconnect', () => {
  test('should handle network disconnection gracefully', async ({ page, simulateOffline }) => {
    const chatPage = new ChatPage(page);
    await chatPage.waitForAppReady();

    // Simulate network going offline
    const restore = await simulateOffline(page);

    // App should still be functional (not crash)
    await expect(page.locator('.app-shell')).toBeVisible();

    // Restore network
    await restore();
  });

  test('should show error state when API calls fail due to network', async ({
    page,
    simulateConnectionFailure,
  }) => {
    const chatPage = new ChatPage(page);
    await chatPage.waitForAppReady();

    // Block API requests
    await simulateConnectionFailure(page, '**/api/**');

    // The app should still be navigable
    await expect(page.locator('.app-shell')).toBeVisible();
    await expect(page.locator('.layout-content')).toBeVisible();
  });

  test('should recover when network is restored', async ({ page, simulateOffline }) => {
    const chatPage = new ChatPage(page);
    await chatPage.waitForAppReady();

    // Go offline
    const restore = await simulateOffline(page);
    await page.waitForTimeout(2_000);

    // Come back online
    await restore();
    await page.waitForTimeout(1_000);

    // App should be fully functional
    await expect(page.locator('.app-shell')).toBeVisible();
    await expect(page.locator('.layout-content')).toBeVisible();
  });
});
