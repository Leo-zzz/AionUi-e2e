import { test, expect } from '../../src/fixtures';

test.describe('App Launch', () => {
  test('should launch and show welcome page with full UI', async ({ electronApp, page }) => {
    // Verify window exists
    expect(electronApp.windows().length).toBeGreaterThanOrEqual(1);

    // Verify the app shell rendered
    await expect(page.locator('.app-shell')).toBeVisible();

    // Verify titlebar with AionUi branding
    await expect(page.locator('.app-titlebar')).toBeVisible();
    await expect(page.locator('.app-titlebar__brand')).toBeVisible();

    // Verify main content area
    await expect(page.locator('.layout-content')).toBeVisible();

    // Verify window controls (minimize, maximize, close)
    await expect(page.locator('.app-window-controls')).toBeVisible();

    // Should be on the welcome/guid page
    expect(page.url()).toContain('#/guid');
  });
});
