import { test, expect } from '../../src/fixtures';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const responsesDir = resolve(__dirname, '../../src/mocks/responses');

test.describe('API Error Responses', () => {
  test('should handle 401 Unauthorized error', async ({ page, mockApiResponse }) => {
    await page.waitForSelector('.app-shell', { timeout: 30_000 });

    const errorBody = readFileSync(resolve(responsesDir, 'chat-error-401.json'), 'utf-8');
    await mockApiResponse(page, '**/v1/chat/completions', {
      status: 401,
      body: errorBody,
      contentType: 'application/json',
    });

    // App should display the error gracefully, not crash
    await expect(page.locator('.app-shell')).toBeVisible();
  });

  test('should handle 429 Rate Limit error', async ({ page, mockApiResponse }) => {
    await page.waitForSelector('.app-shell', { timeout: 30_000 });

    const errorBody = readFileSync(resolve(responsesDir, 'chat-error-429.json'), 'utf-8');
    await mockApiResponse(page, '**/v1/chat/completions', {
      status: 429,
      body: errorBody,
      contentType: 'application/json',
    });

    // App should remain functional
    await expect(page.locator('.app-shell')).toBeVisible();
    await expect(page.locator('.layout-content')).toBeVisible();
  });

  test('should handle 500 Internal Server Error', async ({ page, mockApiResponse }) => {
    await page.waitForSelector('.app-shell', { timeout: 30_000 });

    const errorBody = readFileSync(resolve(responsesDir, 'chat-error-500.json'), 'utf-8');
    await mockApiResponse(page, '**/v1/chat/completions', {
      status: 500,
      body: errorBody,
      contentType: 'application/json',
    });

    // App should remain functional
    await expect(page.locator('.app-shell')).toBeVisible();
    await expect(page.locator('.layout-content')).toBeVisible();
  });

  test('should handle empty response body', async ({ page, mockApiResponse }) => {
    await page.waitForSelector('.app-shell', { timeout: 30_000 });

    await mockApiResponse(page, '**/v1/chat/completions', {
      status: 200,
      body: '',
      contentType: 'application/json',
    });

    await expect(page.locator('.app-shell')).toBeVisible();
  });

  test('should handle malformed JSON response', async ({ page, mockApiResponse }) => {
    await page.waitForSelector('.app-shell', { timeout: 30_000 });

    await mockApiResponse(page, '**/v1/chat/completions', {
      status: 200,
      body: '{"broken json',
      contentType: 'application/json',
    });

    await expect(page.locator('.app-shell')).toBeVisible();
  });
});
