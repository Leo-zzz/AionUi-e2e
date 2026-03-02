import { test as base, Page } from '@playwright/test';

export type NetworkFixtures = {
  /** Block all outbound network requests to simulate offline */
  simulateOffline: (page: Page) => Promise<() => Promise<void>>;
  /** Intercept API routes and return custom responses */
  mockApiResponse: (
    page: Page,
    urlPattern: string,
    response: { status?: number; body?: string; contentType?: string },
  ) => Promise<void>;
  /** Abort specific routes to simulate connection failures */
  simulateConnectionFailure: (page: Page, urlPattern: string) => Promise<void>;
};

export const networkFixture = base.extend<NetworkFixtures>({
  simulateOffline: async ({}, use) => {
    const handler = async (page: Page) => {
      await page.route('**/*', (route) => route.abort('connectionfailed'));
      return async () => {
        await page.unrouteAll({ behavior: 'ignoreErrors' });
      };
    };
    await use(handler);
  },

  mockApiResponse: async ({}, use) => {
    const handler = async (
      page: Page,
      urlPattern: string,
      response: { status?: number; body?: string; contentType?: string },
    ) => {
      await page.route(urlPattern, (route) =>
        route.fulfill({
          status: response.status ?? 200,
          contentType: response.contentType ?? 'application/json',
          body: response.body ?? '{}',
        }),
      );
    };
    await use(handler);
  },

  simulateConnectionFailure: async ({}, use) => {
    const handler = async (page: Page, urlPattern: string) => {
      await page.route(urlPattern, (route) => route.abort('connectionfailed'));
    };
    await use(handler);
  },
});
