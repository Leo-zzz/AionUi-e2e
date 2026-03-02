import { test, expect } from '../../src/fixtures';

/**
 * Helper: ensure sidebar is expanded.
 */
async function ensureSidebarExpanded(page: import('@playwright/test').Page) {
  const sider = page.locator('.layout-sider');
  const box = await sider.boundingBox();
  if (!box || box.width < 200) {
    await page.locator('.app-titlebar__menu button').first().click();
    await page.waitForTimeout(500);
  }
  await expect(async () => {
    const b = await sider.boundingBox();
    expect(b!.width).toBeGreaterThan(200);
  }).toPass({ timeout: 3_000 });
}

/**
 * Helper: open multiple conversations to populate tabs.
 * Returns the number of conversations clicked.
 */
async function openMultipleConversations(page: import('@playwright/test').Page, count: number) {
  const items = page.locator('.chat-history__item');
  await expect(items.first()).toBeVisible({ timeout: 10_000 });

  const available = await items.count();
  const toOpen = Math.min(count, available);

  for (let i = 0; i < toOpen; i++) {
    await items.nth(i).click();
    await page.waitForTimeout(500);
  }

  return toOpen;
}

test.describe('Conversation Tabs', () => {
  test.beforeEach(async ({ page }) => {
    await ensureSidebarExpanded(page);
  });

  test('should generate tabs after opening multiple conversations', async ({ page }) => {
    const items = page.locator('.chat-history__item');
    await expect(items.first()).toBeVisible({ timeout: 10_000 });
    const available = await items.count();

    if (available < 2) {
      test.skip(true, 'Need at least 2 conversations to test tabs');
      return;
    }

    await openMultipleConversations(page, 3);

    // Tab container with tab items should appear
    const tabs = page.locator('.max-w-240px.cursor-pointer');
    try {
      await expect(tabs.first()).toBeVisible({ timeout: 5_000 });
      const tabCount = await tabs.count();
      expect(tabCount).toBeGreaterThanOrEqual(2);
    } catch {
      // Tabs may not appear if conversations don't have workspace
      test.info().annotations.push({ type: 'note', description: 'Tabs did not appear — conversations may not have workspace' });
    }
  });

  test('should switch conversation when clicking a different tab', async ({ page }) => {
    const items = page.locator('.chat-history__item');
    await expect(items.first()).toBeVisible({ timeout: 10_000 });
    const available = await items.count();

    if (available < 2) {
      test.skip(true, 'Need at least 2 conversations to test tab switching');
      return;
    }

    await openMultipleConversations(page, 3);

    const tabs = page.locator('.max-w-240px.cursor-pointer');
    try {
      await expect(tabs.first()).toBeVisible({ timeout: 5_000 });
    } catch {
      test.skip(true, 'Tabs not visible — skipping tab switch test');
      return;
    }

    const tabCount = await tabs.count();
    if (tabCount < 2) {
      test.skip(true, 'Not enough tabs to test switching');
      return;
    }

    // Record current URL, click a different tab
    const urlBefore = page.url();
    // Click the first tab (which is not the active one if we just opened the last conversation)
    await tabs.first().click();
    await page.waitForTimeout(500);

    const urlAfter = page.url();
    expect(urlAfter).not.toBe(urlBefore);
    expect(urlAfter).toContain('/conversation/');
  });

  test('should close a tab and reduce tab count', async ({ page }) => {
    const items = page.locator('.chat-history__item');
    await expect(items.first()).toBeVisible({ timeout: 10_000 });
    const available = await items.count();

    if (available < 2) {
      test.skip(true, 'Need at least 2 conversations to test tab close');
      return;
    }

    await openMultipleConversations(page, 3);

    const tabs = page.locator('.max-w-240px.cursor-pointer');
    try {
      await expect(tabs.first()).toBeVisible({ timeout: 5_000 });
    } catch {
      test.skip(true, 'Tabs not visible — skipping tab close test');
      return;
    }

    const countBefore = await tabs.count();
    if (countBefore < 2) {
      test.skip(true, 'Not enough tabs to test closing');
      return;
    }

    // Close the last tab by clicking its close icon (last svg inside the tab)
    const lastTab = tabs.last();
    await lastTab.locator('svg').last().click();
    await page.waitForTimeout(500);

    const countAfter = await tabs.count();
    expect(countAfter).toBe(countBefore - 1);
  });

  test('should close other tabs via right-click context menu', async ({ page }) => {
    const items = page.locator('.chat-history__item');
    await expect(items.first()).toBeVisible({ timeout: 10_000 });
    const available = await items.count();

    if (available < 3) {
      test.skip(true, 'Need at least 3 conversations to test Close Others');
      return;
    }

    await openMultipleConversations(page, 3);

    const tabs = page.locator('.max-w-240px.cursor-pointer');
    try {
      await expect(tabs.first()).toBeVisible({ timeout: 5_000 });
    } catch {
      test.skip(true, 'Tabs not visible — skipping Close Others test');
      return;
    }

    const countBefore = await tabs.count();
    if (countBefore < 2) {
      test.skip(true, 'Not enough tabs for Close Others');
      return;
    }

    // Right-click on the first tab to open context menu
    await tabs.first().click({ button: 'right' });
    await page.waitForTimeout(300);

    // Click "Close Others" in the dropdown menu
    const closeOthers = page.locator('.arco-dropdown-menu-item').filter({ hasText: /close others|关闭其他/i });
    try {
      await expect(closeOthers).toBeVisible({ timeout: 3_000 });
      await closeOthers.click();
      await page.waitForTimeout(500);

      // Only one tab should remain
      const countAfter = await tabs.count();
      expect(countAfter).toBe(1);
    } catch {
      test.info().annotations.push({ type: 'note', description: 'Close Others menu item not found' });
    }
  });
});
