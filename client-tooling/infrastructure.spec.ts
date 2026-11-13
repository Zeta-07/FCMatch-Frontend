import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

const packageName = (JSON.parse(readFileSync('package.json', 'utf8')) as { name: string }).name;
const infrastructurePath = packageName === 'fcmatch-admin' ? '/sistema' : '/estado';

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
  await page.goto(infrastructurePath);
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

test('logo y favicon siguen el tema al alternar y recargar sin deformar los originales', async ({
  page,
}) => {
  await page.goto(infrastructurePath);
  for (const width of [1280, 390]) {
    await page.setViewportSize({ width, height: 844 });
    for (const theme of ['dark', 'light', 'dark']) {
      if ((await page.locator('html').getAttribute('data-theme')) !== theme) {
        await page.getByRole('button', { name: 'Alternar tema' }).click();
      }
      const source = `assets/branding/${theme === 'light' ? 'Logo.png' : 'Logo-modo-oscuro.png'}`;
      for (const reload of [false, true]) {
        if (reload) await page.reload();
        await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
        const logo = page.getByRole('img', { name: 'FCMatch', exact: true });
        await expect(logo).toHaveCount(1);
        await expect(logo).toBeVisible();
        await expect(logo).toHaveAttribute('src', source);
        await expect(page.locator('link[rel="icon"]')).toHaveAttribute('href', source);
        await expect
          .poll(() => logo.evaluate((image) => (image as HTMLImageElement).naturalWidth))
          .toBe(2752);
        const dimensions = await logo.evaluate((element) => {
          const image = element as HTMLImageElement;
          return {
            height: image.naturalHeight,
            ratio: image.getBoundingClientRect().width / image.getBoundingClientRect().height,
          };
        });
        expect(dimensions.height).toBe(1536);
        expect(dimensions.ratio).toBeCloseTo(2752 / 1536, 2);
      }
      await page.screenshot({ path: `test-results/logo-${theme}-${width}.png`, fullPage: true });
    }
  }
});

test('muestra error real si la API está inaccesible y permite reintentar', async ({ page }) => {
  await page.route('**/api/v1/health', (route) => route.abort());
  await page.goto(infrastructurePath);
  await expect(page.getByRole('status')).toHaveText('No se pudo conectar con la API.');
  await page.unroute('**/api/v1/health');
  await page.getByRole('button', { name: 'Comprobar conexión' }).click();
  await expect(page.getByRole('status')).toHaveText('API y PostgreSQL conectados.');
});
