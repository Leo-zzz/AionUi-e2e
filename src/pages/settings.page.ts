import { Page, expect, Locator } from '@playwright/test';
import { BasePage } from './base.page';

export class SettingsPage extends BasePage {
  readonly settingsItems: Locator;

  constructor(page: Page) {
    super(page);
    this.settingsItems = page.locator('.settings-sider__item');
  }

  /** Open settings by clicking the settings icon in the sidebar footer */
  async openSettings() {
    await this.page.locator('.sider-footer').click();
    await this.page.waitForSelector('.settings-sider', { timeout: 10_000 });
  }

  /** Navigate to a specific settings section by path */
  async navigateTo(section: 'gemini' | 'model' | 'agent' | 'tools' | 'display' | 'webui' | 'system' | 'about') {
    // Click the settings item that navigates to the section
    const item = this.settingsItems.filter({ hasText: new RegExp(section, 'i') });
    // Fallback: navigate by route directly
    if ((await item.count()) === 0) {
      await this.page.evaluate((s) => {
        window.location.hash = `#/settings/${s}`;
      }, section);
    } else {
      await item.first().click();
    }
    await this.page.waitForTimeout(500);
  }

  /** Assert the settings sidebar is visible */
  async expectSettingsSiderVisible() {
    await expect(this.page.locator('.settings-sider')).toBeVisible();
  }

  /** Assert a specific settings section is loaded (content area changes) */
  async expectSectionLoaded() {
    await expect(this.page.locator('.layout-content')).toBeVisible();
  }

  /** Go back from settings to the main view */
  async goBack() {
    // Click the back arrow in the sidebar footer
    await this.page.locator('.sider-footer').click();
  }
}
