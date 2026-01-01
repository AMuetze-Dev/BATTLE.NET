import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E Test Configuration
 *
 * Battle.Net Quiz Platform E2E Testing Setup
 *
 * Run tests:
 * - npm run test:e2e           - Run all tests
 * - npm run test:e2e:headed    - Run with browser visible
 * - npm run test:e2e:debug     - Debug mode
 * - npm run test:e2e:ui        - Interactive UI mode
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['list'],
  ],

  /* Shared settings for all tests */
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
    /* Increase timeouts for WebSocket tests */
    actionTimeout: 10000,
    navigationTimeout: 15000,
  },

  /* Global timeout for each test */
  timeout: 60000,

  /* Expect timeout */
  expect: {
    timeout: 10000,
  },

  projects: [
    /* Primary browser - Chrome */
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    /* Firefox for cross-browser testing */
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },

    /* Safari for cross-browser testing */
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },

    /* Mobile Chrome */
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },

    /* Mobile Safari */
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 12'] },
    },
  ],

  /* Local dev server */
  webServer: {
    command: 'npm start',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
