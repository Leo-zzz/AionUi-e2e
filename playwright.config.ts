import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 60_000,
  expect: {
    timeout: 10_000,
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.01,
    },
  },
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI
    ? [['github'], ['html', { open: 'never' }], ['json', { outputFile: 'test-results/results.json' }]]
    : [['html', { open: 'on-failure' }]],

  projects: [
    {
      name: 'smoke',
      testDir: './tests/smoke',
    },
    {
      name: 'chaos',
      testDir: './tests/chaos',
    },
    {
      name: 'network',
      testDir: './tests/network',
    },
    {
      name: 'visual',
      testDir: './tests/visual',
      timeout: 30_000,
    },
  ],
});
