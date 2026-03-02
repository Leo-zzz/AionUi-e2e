import { Page, expect, Locator } from '@playwright/test';
import { BasePage } from './base.page';

export class ChatPage extends BasePage {
  readonly sendBox: Locator;
  readonly sendButton: Locator;
  readonly stopButton: Locator;
  readonly messageList: Locator;

  constructor(page: Page) {
    super(page);
    this.sendBox = page.locator('.layout-content textarea');
    this.sendButton = page.locator('button.send-button-custom');
    this.stopButton = page.locator('button.bg-animate');
    this.messageList = page.locator('.message-item');
  }

  /** Type and send a message */
  async sendMessage(text: string) {
    await this.sendBox.fill(text);
    await this.sendButton.click();
  }

  /** Wait for an assistant response to appear */
  async waitForResponse(timeout = 30_000) {
    await this.page.waitForSelector('.message-item.justify-start', { timeout });
  }

  /** Get the text of the last message in the list */
  async getLastMessage(): Promise<string> {
    const messages = this.page.locator('.message-item');
    const last = messages.last();
    return (await last.textContent()) ?? '';
  }

  /** Get the last user message */
  async getLastUserMessage(): Promise<string> {
    const userMessages = this.page.locator('.message-item.justify-end');
    const last = userMessages.last();
    return (await last.textContent()) ?? '';
  }

  /** Get the last assistant message */
  async getLastAssistantMessage(): Promise<string> {
    const assistantMessages = this.page.locator('.message-item.justify-start');
    const last = assistantMessages.last();
    return (await last.textContent()) ?? '';
  }

  /** Check if the stop button is visible (streaming in progress) */
  async isStreaming(): Promise<boolean> {
    return this.stopButton.isVisible();
  }

  /** Stop the current streaming response */
  async stopStreaming() {
    await this.stopButton.click();
  }

  /** Get the total number of messages */
  async getMessageCount(): Promise<number> {
    return this.messageList.count();
  }

  /** Assert the send box is enabled and ready */
  async expectSendBoxReady() {
    await expect(this.sendBox).toBeVisible();
    await expect(this.sendButton).toBeVisible();
  }

  /** Wait for streaming to finish (stop button disappears) */
  async waitForStreamingComplete(timeout = 30_000) {
    await this.stopButton.waitFor({ state: 'hidden', timeout });
  }
}
