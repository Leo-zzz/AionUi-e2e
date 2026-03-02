import { Page, expect, Locator } from '@playwright/test';
import { BasePage } from './base.page';

export class SidebarPage extends BasePage {
  readonly sider: Locator;
  readonly chatItems: Locator;

  constructor(page: Page) {
    super(page);
    this.sider = page.locator('.layout-sider');
    this.chatItems = page.locator('.chat-history__item');
  }

  /** Click "New Conversation" button to start a new chat */
  async newChat() {
    // The new conversation button is in the sider header area, contains a Plus icon
    await this.page.locator('.layout-sider-header button').first().click();
    await this.page.waitForTimeout(500);
  }

  /** Select a chat by its conversation ID */
  async selectChat(conversationId: string) {
    await this.page.locator(`#c-${conversationId}`).click();
  }

  /** Select a chat by its index in the list (0-based) */
  async selectChatByIndex(index: number) {
    await this.chatItems.nth(index).click();
  }

  /** Get the number of conversations in the sidebar */
  async getChatCount(): Promise<number> {
    return this.chatItems.count();
  }

  /** Get the name/title of a chat item by index */
  async getChatName(index: number): Promise<string> {
    const nameEl = this.chatItems.nth(index).locator('.chat-history__item-name');
    return (await nameEl.textContent()) ?? '';
  }

  /** Delete a chat by right-clicking and selecting delete */
  async deleteChat(index: number) {
    const item = this.chatItems.nth(index);
    // Hover to reveal the three-dot menu
    await item.hover();
    // Click the dropdown trigger (three-dot icon)
    await item.locator('[class*="icon"]').last().click();
    // Click "Delete" in the dropdown
    await this.page.locator('.arco-dropdown-menu-item').filter({ hasText: /delete/i }).click();
  }

  /** Assert the sidebar is visible and not collapsed */
  async expectSidebarExpanded() {
    await expect(this.sider).toBeVisible();
  }

  /** Assert the sidebar is collapsed */
  async expectSidebarCollapsed() {
    const width = await this.sider.evaluate((el) => el.getBoundingClientRect().width);
    expect(width).toBeLessThanOrEqual(64);
  }
}
