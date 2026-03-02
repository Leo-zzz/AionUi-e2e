import { test, expect } from '../../src/fixtures';

test.describe('Basic Chat Interaction', () => {
  test('should type a message and see send button', async ({ page }) => {
    const textarea = page.locator('textarea').first();
    await expect(textarea).toBeVisible({ timeout: 15_000 });

    // Click into textarea and type
    await textarea.click();
    await textarea.fill('Hello, this is a test message');
    await expect(textarea).toHaveValue('Hello, this is a test message');

    // Send button should be visible
    await expect(page.locator('button.send-button-custom')).toBeVisible();
  });

  test('should open sidebar and click new conversation', async ({ page }) => {
    const sider = page.locator('.layout-sider');

    // Check if sidebar is already expanded; if not, toggle it
    const box = await sider.boundingBox();
    if (!box || box.width < 200) {
      await page.locator('.app-titlebar__menu button').first().click();
      await page.waitForTimeout(500);
    }

    // Sidebar should now be expanded (width > 200)
    await expect(async () => {
      const b = await sider.boundingBox();
      expect(b!.width).toBeGreaterThan(200);
    }).toPass({ timeout: 3_000 });

    // Click "新对话" button (text-based selector — works in both mobile/desktop)
    await page.locator('.layout-sider-content').getByText('新对话').click();
    await page.waitForTimeout(500);
    expect(page.url()).toContain('#/guid');

    // Settings button ("设置") should be visible in sidebar footer
    await expect(page.locator('.sider-footer')).toBeVisible();
  });
});
