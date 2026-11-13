import { defineConfig } from '@playwright/test';

const port = Number(process.env['FCMATCH_E2E_PORT'] ?? '4300');

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  // El primer arranque de Vite compila dependencias Ionic bajo demanda.
  expect: { timeout: 15000 },
  use: { baseURL: `http://localhost:${port}`, browserName: 'chromium', trace: 'off' },
  webServer: {
    // Los servidores de revisión (4200/8100) pueden usar el mismo checkout.
    // Evitar el optimizador/HMR de Vite compartido durante la aceptación.
    command: `node scripts/configure-env.mjs && node node_modules/@angular/cli/bin/ng.js serve --port=${port} --prebundle=false --hmr=false`,
    url: `http://localhost:${port}`,
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
