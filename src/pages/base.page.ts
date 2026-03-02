import { Page, expect } from '@playwright/test';

export class BasePage {
  constructor(protected page: Page) {}

  /** Wait for the app shell to fully render */
  async waitForAppReady() {
    await this.page.waitForSelector('.app-shell', { timeout: 30_000 });
  }

  /** Wait for the main content area to be visible */
  async waitForContent() {
    await this.page.waitForSelector('.layout-content', { timeout: 15_000 });
  }

  /** Take a full-page screenshot with a descriptive name */
  async takeScreenshot(name: string) {
    return this.page.screenshot({ path: `test-results/screenshots/${name}.png`, fullPage: true });
  }

  /** Assert the page title bar is visible */
  async expectTitleBarVisible() {
    await expect(this.page.locator('.app-titlebar')).toBeVisible();
  }

  /** Get the current hash route */
  async getCurrentRoute(): Promise<string> {
    const url = this.page.url();
    const hash = new URL(url).hash;
    return hash.replace('#', '') || '/';
  }
}
