import { defineConfig } from '@playwright/test';

const port = Number(process.env['FCMATCH_E2E_PORT'] ?? '4300');

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  use: { baseURL: `http://localhost:${port}`, browserName: 'chromium', trace: 'off' },
  webServer: {
    command: `node scripts/configure-env.mjs && node node_modules/@angular/cli/bin/ng.js serve --port=${port}`,
    url: `http://localhost:${port}`,
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
