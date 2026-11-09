import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  use: { baseURL: 'http://localhost:4300', browserName: 'chromium', trace: 'retain-on-failure' },
  webServer: {
    command:
      'node scripts/configure-env.mjs && node node_modules/@angular/cli/bin/ng.js serve --port=4300',
    url: 'http://localhost:4300',
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
