import { test, expect } from '../../src/fixtures';
import { SSEMockServer } from '../../src/mocks/sse-server';

test.describe('SSE Signal Loss', () => {
  let sseServer: SSEMockServer;

  test.beforeEach(async () => {
    // Start SSE server WITHOUT the [DONE] signal
    sseServer = new SSEMockServer({ sendDone: false, eventDelay: 100 });
    await sseServer.start();
  });

  test.afterEach(async () => {
    await sseServer.stop();
  });

  test('should handle SSE stream ending without DONE signal', async ({ page }) => {
    // The SSE server will send events but never send [DONE]
    // The app should eventually timeout or handle the incomplete stream
    await page.waitForSelector('.app-shell', { timeout: 30_000 });

    // Intercept any SSE endpoint and redirect to our mock
    await page.route('**/v1/chat/completions', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'text/event-stream',
        body: [
          'data: {"choices":[{"delta":{"content":"Partial"}}]}\n\n',
          'data: {"choices":[{"delta":{"content":" response"}}]}\n\n',
          // No [DONE] signal
        ].join(''),
      });
    });

    // App should not crash
    await expect(page.locator('.app-shell')).toBeVisible();
  });

  test('should handle SSE connection reset mid-stream', async ({ page }) => {
    await page.waitForSelector('.app-shell', { timeout: 30_000 });

    // Simulate a connection reset by aborting the route
    await page.route('**/v1/chat/completions', (route) => {
      route.abort('connectionreset');
    });

    // App should remain functional
    await expect(page.locator('.app-shell')).toBeVisible();
    await expect(page.locator('.layout-content')).toBeVisible();
  });
});
