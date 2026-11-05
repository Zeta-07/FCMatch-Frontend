import { test, expect } from '@playwright/test';

// CI de cada cliente es independiente. En local, por defecto, se usa la API real.
if (process.env['FCMATCH_E2E_STUB_API'] === '1') {
  test.beforeEach(async ({ context }) => {
    await context.route('**/api/v1/health', (route) =>
      route.fulfill({
        json: { status: 'ok', service: 'fcmatch-api', database: 'connected' },
      }),
    );
  });
}

test('cliente real conecta con API/PostgreSQL y conserva tema en escritorio y móvil', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.getByRole('status')).toHaveText('API y PostgreSQL conectados.');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  const logo = page.getByRole('img', { name: 'FCMatch', exact: true });
  await expect(logo).toBeVisible();
  expect(await logo.evaluate((image) => (image as HTMLImageElement).naturalWidth)).toBeGreaterThan(
    0,
  );
  await page.getByRole('button', { name: 'Alternar tema' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  const lightBackground = await page
    .locator('ion-content')
    .evaluate((element) =>
      getComputedStyle(element).getPropertyValue('--ion-background-color').trim(),
    );
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await page.screenshot({ path: 'test-results/infra-light-desktop.png', fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByRole('status')).toHaveText('API y PostgreSQL conectados.');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await page.getByRole('button', { name: 'Alternar tema' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  const darkBackground = await page
    .locator('ion-content')
    .evaluate((element) =>
      getComputedStyle(element).getPropertyValue('--ion-background-color').trim(),
    );
  expect(lightBackground).not.toBe(darkBackground);
  await page.screenshot({ path: 'test-results/infra-dark-mobile.png', fullPage: true });
  expect(errors).toEqual([]);
});

test('muestra error real si la API está inaccesible y permite reintentar', async ({ page }) => {
  await page.route('**/api/v1/health', (route) => route.abort());
  await page.goto('/');
  await expect(page.getByRole('status')).toHaveText('No se pudo conectar con la API.');
  await page.unroute('**/api/v1/health');
  await page.getByRole('button', { name: 'Comprobar conexión' }).click();
  await expect(page.getByRole('status')).toHaveText('API y PostgreSQL conectados.');
});
