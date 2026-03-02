import { test, expect } from '../../src/fixtures';

/**
 * Helper: ensure sidebar is expanded (width > 200).
 * If collapsed, click the toggle button in the titlebar.
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

test.describe('History List', () => {
  test.beforeEach(async ({ page }) => {
    await ensureSidebarExpanded(page);
  });

  test('should show history conversations in sidebar', async ({ page }) => {
    const items = page.locator('.chat-history__item');
    // There must be at least one conversation from real userData
    await expect(items.first()).toBeVisible({ timeout: 10_000 });
    const count = await items.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should switch conversation when clicking a history item', async ({ page }) => {
    const items = page.locator('.chat-history__item');
    await expect(items.first()).toBeVisible({ timeout: 10_000 });

    const initialUrl = page.url();

    // Click the first history item
    await items.first().click();
    await page.waitForTimeout(500);

    // URL should change to /conversation/:id
    expect(page.url()).toContain('/conversation/');

    // The clicked item should become active
    await expect(items.first()).toHaveClass(/!bg-active|active/);
  });

  test('should rename a conversation via inline edit', async ({ page }) => {
    const items = page.locator('.chat-history__item');
    await expect(items.first()).toBeVisible({ timeout: 10_000 });

    const row = items.first();
    const originalName = await row.locator('.chat-history__item-name').textContent() ?? '';

    // Hover to reveal action buttons
    await row.hover();
    await page.waitForTimeout(300);

    // Click edit button (first span.flex-center in the row)
    await row.locator('span.flex-center').first().click();
    await page.waitForTimeout(300);

    // The inline editor should appear
    const editor = page.locator('.chat-history__item-editor');
    await expect(editor).toBeVisible({ timeout: 3_000 });

    // Clear and type new name
    const newName = `Renamed-${Date.now()}`;
    await editor.fill(newName);
    await editor.press('Enter');
    await page.waitForTimeout(500);

    // Verify name updated
    const updatedName = await row.locator('.chat-history__item-name').textContent() ?? '';
    expect(updatedName).toContain(newName);

    // Restore original name
    await row.hover();
    await page.waitForTimeout(300);
    await row.locator('span.flex-center').first().click();
    await page.waitForTimeout(300);
    const editorRestore = page.locator('.chat-history__item-editor');
    await editorRestore.fill(originalName);
    await editorRestore.press('Enter');
    await page.waitForTimeout(500);
  });

  test('should cancel rename on Escape', async ({ page }) => {
    const items = page.locator('.chat-history__item');
    await expect(items.first()).toBeVisible({ timeout: 10_000 });

    const row = items.first();
    const originalName = await row.locator('.chat-history__item-name').textContent() ?? '';

    // Hover → click edit
    await row.hover();
    await page.waitForTimeout(300);
    await row.locator('span.flex-center').first().click();
    await page.waitForTimeout(300);

    const editor = page.locator('.chat-history__item-editor');
    await expect(editor).toBeVisible({ timeout: 3_000 });

    // Type something then press Escape
    await editor.fill('ShouldNotSave');
    await editor.press('Escape');
    await page.waitForTimeout(500);

    // Name should remain unchanged
    const nameAfterCancel = await row.locator('.chat-history__item-name').textContent() ?? '';
    expect(nameAfterCancel).toBe(originalName);
  });

  test('should cancel delete via Popconfirm', async ({ page }) => {
    const items = page.locator('.chat-history__item');
    await expect(items.first()).toBeVisible({ timeout: 10_000 });

    const countBefore = await items.count();
    const row = items.first();

    // Hover → click delete button (last span.flex-center)
    await row.hover();
    await page.waitForTimeout(300);
    await row.locator('span.flex-center').last().click();
    await page.waitForTimeout(300);

    // Popconfirm should appear — click Cancel
    const cancelBtn = page.locator('.arco-popconfirm-btn').locator('button').first();
    await expect(cancelBtn).toBeVisible({ timeout: 3_000 });
    await cancelBtn.click();
    await page.waitForTimeout(500);

    // Count should remain the same
    const countAfter = await items.count();
    expect(countAfter).toBe(countBefore);
  });

  test('should delete a conversation via Popconfirm', async ({ page }) => {
    const items = page.locator('.chat-history__item');
    await expect(items.first()).toBeVisible({ timeout: 10_000 });

    const countBefore = await items.count();
    // Use last item to avoid disturbing other tests
    const row = items.last();
    const deletedName = await row.locator('.chat-history__item-name').textContent() ?? '';

    // Hover → click delete button
    await row.hover();
    await page.waitForTimeout(300);
    await row.locator('span.flex-center').last().click();
    await page.waitForTimeout(300);

    // Popconfirm should appear — click OK / Confirm (last button)
    const confirmBtn = page.locator('.arco-popconfirm-btn').locator('button').last();
    await expect(confirmBtn).toBeVisible({ timeout: 3_000 });
    await confirmBtn.click();
    await page.waitForTimeout(1000);

    // Count should decrease by 1
    const countAfter = await items.count();
    expect(countAfter).toBe(countBefore - 1);
  });
});
