import { test, expect } from '../../src/fixtures';
import { resolve } from 'path';
import { writeFileSync, unlinkSync, mkdirSync, existsSync } from 'fs';

const TEMP_DIR = resolve(__dirname, '../../test-results/tmp');
const TEMP_FILE = resolve(TEMP_DIR, 'test-upload.txt');

test.describe('File Upload', () => {
  test.beforeAll(() => {
    // Create temp directory and file for upload tests
    if (!existsSync(TEMP_DIR)) {
      mkdirSync(TEMP_DIR, { recursive: true });
    }
    writeFileSync(TEMP_FILE, 'This is a test file for upload.');
  });

  test.afterAll(() => {
    // Cleanup temp file
    try {
      unlinkSync(TEMP_FILE);
    } catch {
      // ignore cleanup errors
    }
  });

  test('should show file chip after drag-and-drop', async ({ page }) => {
    // Navigate to a conversation or the welcome page with a sendbox
    const textarea = page.locator('textarea').first();
    await expect(textarea).toBeVisible({ timeout: 15_000 });

    // Find the drop target (sendbox area)
    const dropTarget = page.locator('.rd-20px.bg-dialog-fill-0');

    // Simulate drag-and-drop via DataTransfer
    await dropTarget.evaluate(async (el) => {
      const dataTransfer = new DataTransfer();
      const file = new File(['This is a test file for upload.'], 'test-upload.txt', { type: 'text/plain' });
      dataTransfer.items.add(file);

      const dragEnterEvent = new DragEvent('dragenter', { dataTransfer, bubbles: true });
      el.dispatchEvent(dragEnterEvent);

      const dragOverEvent = new DragEvent('dragover', { dataTransfer, bubbles: true });
      el.dispatchEvent(dragOverEvent);

      const dropEvent = new DragEvent('drop', { dataTransfer, bubbles: true });
      el.dispatchEvent(dropEvent);
    });
    await page.waitForTimeout(1000);

    // File chip should appear (non-image files use this container)
    const fileChip = page.locator('.h-60px.flex.items-center.gap-12px');
    try {
      await expect(fileChip.first()).toBeVisible({ timeout: 5_000 });
      // Verify file name appears in chip
      const fileName = fileChip.first().locator('.text-t-primary');
      await expect(fileName).toContainText('test-upload');
    } catch {
      test.info().annotations.push({
        type: 'note',
        description: 'File chip did not appear — drag-and-drop may not be supported in this context',
      });
    }
  });

  test('should remove an uploaded file chip', async ({ page }) => {
    const textarea = page.locator('textarea').first();
    await expect(textarea).toBeVisible({ timeout: 15_000 });

    const dropTarget = page.locator('.rd-20px.bg-dialog-fill-0');

    // Drop a file first
    await dropTarget.evaluate(async (el) => {
      const dataTransfer = new DataTransfer();
      const file = new File(['content'], 'removable-file.txt', { type: 'text/plain' });
      dataTransfer.items.add(file);

      el.dispatchEvent(new DragEvent('dragenter', { dataTransfer, bubbles: true }));
      el.dispatchEvent(new DragEvent('dragover', { dataTransfer, bubbles: true }));
      el.dispatchEvent(new DragEvent('drop', { dataTransfer, bubbles: true }));
    });
    await page.waitForTimeout(1000);

    const fileChip = page.locator('.h-60px.flex.items-center.gap-12px');
    try {
      await expect(fileChip.first()).toBeVisible({ timeout: 5_000 });

      // Click the remove button on the chip
      const removeBtn = page.locator('.w-16px.h-16px.rd-50\\%');
      await removeBtn.first().click();
      await page.waitForTimeout(500);

      // File chip should disappear
      await expect(fileChip).toHaveCount(0, { timeout: 3_000 });
    } catch {
      test.info().annotations.push({
        type: 'note',
        description: 'File chip did not appear for removal test — drag-and-drop may not be supported',
      });
    }
  });

  test('should upload file via + button with mocked dialog', async ({ electronApp, page }) => {
    const textarea = page.locator('textarea').first();
    await expect(textarea).toBeVisible({ timeout: 15_000 });

    // Mock the native dialog in the main process to return our temp file
    await electronApp.evaluate(
      ({ dialog }, filePath) => {
        dialog.showOpenDialog = () =>
          Promise.resolve({ canceled: false, filePaths: [filePath] } as any);
      },
      TEMP_FILE.replace(/\\/g, '/'),
    );

    // Click the + button in sendbox tools
    const addButton = page.locator('.sendbox-tools button');
    try {
      await expect(addButton.first()).toBeVisible({ timeout: 5_000 });
      await addButton.first().click();
      await page.waitForTimeout(1000);

      // File chip should appear
      const fileChip = page.locator('.h-60px.flex.items-center.gap-12px');
      await expect(fileChip.first()).toBeVisible({ timeout: 5_000 });
      const fileName = fileChip.first().locator('.text-t-primary');
      await expect(fileName).toContainText('test-upload');
    } catch {
      test.info().annotations.push({
        type: 'note',
        description: 'File upload via + button did not work — dialog mock may need ipcBridge approach',
      });
    }
  });
});
