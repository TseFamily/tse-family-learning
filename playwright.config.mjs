import { defineConfig } from '@playwright/test';

const mobileUse = {
  browserName: 'chromium',
  viewport: { width: 390, height: 844 },
  isMobile: true,
  hasTouch: true,
  deviceScaleFactor: 3,
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/120.0.0.0 Mobile/15E148 Safari/604.1'
};

export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  webServer: {
    command: 'bun server.js',
    url: 'http://127.0.0.1:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 20_000
  },
  use: {
    baseURL: 'http://127.0.0.1:3000',
    trace: 'retain-on-failure'
  },
  projects: [
    {
      name: 'mobile-chrome-shell',
      // The shell suite keeps service workers blocked so its tests exercise
      // the app's non-blocking online path deterministically.
      testIgnore: /continuity\.spec\.mjs/,
      use: { ...mobileUse, serviceWorkers: 'block' }
    },
    {
      name: 'mobile-chrome-continuity',
      // Continuity tests must let the service worker register, install, and
      // serve cached core assets while offline.
      testMatch: /continuity\.spec\.mjs/,
      use: { ...mobileUse, serviceWorkers: 'allow' }
    }
  ]
});
