import { test, expect, type Page } from '@playwright/test';
import { fork, type ChildProcess } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { randomBytes } from 'node:crypto';
import { readFileSync } from 'node:fs';

// Optional cross-repository acceptance: an explicit backend checkout path, never application imports.
// All tokens/mail stay in parent/child process memory; no traces, HAR or storage-state artifacts.
const runner = process.env['FCMATCH_E2E_API_RUNNER'];
const mobile =
  (JSON.parse(readFileSync('package.json', 'utf8')) as { name: string }).name === 'fcmatch-mobile';
const prefix = `e2e_${randomBytes(10).toString('hex')}`;
const address = `${prefix}_account@fcmatch.test`;
const newAddress = `${prefix}_changed@fcmatch.test`;
const username = `u_${prefix.slice(4)}`;
const password = '  frase de prueba 🏆  ';
const changedPassword = 'otra frase de prueba 🌙';
type Mail = { type: 'mail'; email: string; path: string; token: string };
const messages: Mail[] = [];
let child: ChildProcess | undefined;
test.use({ trace: 'off', video: 'off', screenshot: 'off' });

test.describe('Aceptación con API/PostgreSQL/SMTP/S3 reales', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: mobile ? 390 : 1280, height: mobile ? 844 : 900 });
  });
  test.skip(
    !runner,
    'Requiere FCMATCH_E2E_API_RUNNER y servicios locales; no se sustituye por mocks.',
  );
  test.beforeAll(async () => {
    const file = resolve(runner!);
    child = fork(file, [], {
      cwd: dirname(dirname(file)),
      execArgv: ['--env-file=.env', '--import', 'tsx'],
      env: { ...process.env, NODE_ENV: 'test', FCMATCH_E2E_RUN_ID: prefix },
      stdio: ['ignore', 'ignore', 'ignore', 'ipc'],
    });
    await new Promise<void>((resolveReady, reject) => {
      const timer = setTimeout(
        () => reject(new Error('No se inició la API de aceptación.')),
        25000,
      );
      child!.on('message', (value: unknown) => {
        if (!value || typeof value !== 'object' || !('type' in value)) return;
        if (value.type === 'ready') {
          clearTimeout(timer);
          resolveReady();
        }
        if (value.type === 'mail') messages.push(value as Mail);
      });
      child!.once('exit', () => {
        clearTimeout(timer);
        reject(new Error('La API de aceptación finalizó antes de estar disponible.'));
      });
    });
  });
  test.afterAll(async () => {
    if (!child?.connected) return;
    await new Promise<void>((resolveClosed, reject) => {
      const timer = setTimeout(
        () => reject(new Error('No se confirmó la limpieza de fixtures.')),
        20000,
      );
      child!.on('message', (value: unknown) => {
        if (value && typeof value === 'object' && 'type' in value && value.type === 'cleaned') {
          clearTimeout(timer);
          resolveClosed();
        }
      });
      child!.send('stop');
    });
  });

  async function fill(page: Page, label: string, value: string) {
    await page.getByLabel(label, { exact: true }).fill(value);
  }
  async function login(page: Page, email = address, secret = password) {
    await page.goto('/iniciar-sesion');
    await fill(page, 'Correo', email);
    await fill(page, 'Contraseña', secret);
    await page.getByRole('button', { name: 'Entrar', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Mi perfil', exact: true })).toBeVisible();
  }
  async function openMail(page: Page, email: string, path: string) {
    await expect
      .poll(() => messages.filter((m) => m.email === email && m.path === path).length, {
        timeout: 10000,
        message: 'Debe llegar un correo local del flujo.',
      })
      .toBeGreaterThan(0);
    const mail = messages.filter((m) => m.email === email && m.path === path).at(-1)!;
    // Direct navigation is deliberate; the browser strips the fragment before fetching configuration.
    await page.goto(`/${mail.path}#token=${mail.token}`);
    await expect(page).not.toHaveURL(/#token=/);
  }

  test('registro → verificación → acceso → perfil/foto/búsqueda → correo → sesiones → contraseña', async ({
    page,
    context,
    browser,
  }) => {
    test.setTimeout(120000);
    await page.goto('/registro');
    await fill(page, 'Usuario', username);
    await fill(page, 'Correo', address);
    await fill(page, 'Contraseña', password);
    await page.getByRole('button', { name: 'Crear cuenta', exact: true }).click();
    await expect(page.getByRole('status')).toContainText('La recepción no está garantizada.', {
      timeout: 10000,
    });
    await openMail(page, address, 'verificar-correo');
    await page.getByRole('button', { name: 'Verificar correo', exact: true }).click();
    await expect(page.getByRole('status')).toHaveText('Correo verificado.');
    await login(page);
    await expect(page.locator('.public-id')).toHaveText(/^[1-9][0-9]{7}$/);
    const publicNumber = (await page.locator('.public-id').textContent())!.trim();
    const publicResponse = await page.request.get(
      `http://localhost:3006/api/v1/users/${publicNumber}`,
      {
        headers: { Accept: 'application/vnd.fcmatch.identity.v2+json' },
      },
    );
    expect(publicResponse.ok()).toBe(true);
    const legacyId = (await publicResponse.json()).publicId as string;
    await expect(page.locator('app-profile-page main')).not.toContainText(legacyId);
    await expect(
      page.getByRole('heading', { name: 'Mi perfil', exact: true }).locator('..'),
    ).toContainText(address);
    const cookie = (await context.cookies('http://localhost:3006/api/v1/auth/refresh')).find((c) =>
      c.name.startsWith('fcmatch_refresh_'),
    );
    expect(cookie?.httpOnly).toBe(true);
    expect(cookie?.sameSite).toBe('Strict');
    expect(cookie?.path).toBe('/api/v1/auth');
    await page.getByRole('link', { name: 'Editar perfil', exact: true }).click();
    await fill(page, 'Liga (opcional)', 'Liga de prueba');
    await page.getByRole('button', { name: 'Guardar cambios', exact: true }).click();
    await expect(page.getByRole('status')).toHaveText('Cambios guardados.');
    await expect(page.locator('app-account-form-page .public-id')).toHaveText(publicNumber);
    await page.locator('input[type="file"]').setInputFiles({
      name: 'synthetic.png',
      mimeType: 'image/png',
      buffer: Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAIAAAD8GO2jAAAACXBIWXMAAAPoAAAD6AG1e1JrAAAAOUlEQVRIie3WywkAMBBCwaj995wqAjkM7F1Y/LyT7ukdAvWicVEEbaoi2rQGJyazqGLAq9BxX9P1BYyfGAH0O1s4AAAAAElFTkSuQmCC',
        'base64',
      ),
    });
    await expect(page.getByRole('status')).toHaveText('Foto actualizada.');
    await page.getByRole('button', { name: 'Quitar foto', exact: true }).click();
    await expect(page.getByRole('status')).toHaveText('Foto eliminada.');
    await page.goto('/buscar');
    await fill(page, 'Usuario', username);
    await page.getByRole('button', { name: 'Buscar', exact: true }).click();
    await page.getByRole('link', { name: `Ver perfil de ${username}` }).click();
    await expect(page).toHaveURL(new RegExp(`/usuarios/${publicNumber}$`));
    await expect(
      page.locator('fc-profile-details').getByRole('heading', { name: username, exact: true }),
    ).toBeVisible();
    const publicUrl = page.url();
    const guest = await browser.newContext();
    const guestPage = await guest.newPage();
    await guestPage.goto(publicUrl);
    await expect(
      guestPage.locator('fc-profile-details').getByRole('heading', { name: username, exact: true }),
    ).toBeVisible();
    await expect(
      guestPage.getByRole('heading', { name: 'Perfil', exact: true }).locator('..'),
    ).not.toContainText(address);
    await guestPage.goto(new URL(`/usuarios/${legacyId}`, publicUrl).href);
    await expect(guestPage.locator('.public-id')).toHaveText(publicNumber);
    await expect(guestPage.locator('main')).not.toContainText(legacyId);
    await guestPage.setViewportSize({ width: 320, height: 844 });
    await expect(guestPage.getByRole('link', { name: 'Inicio de FCMatch' })).toBeVisible();
    for (const action of ['Iniciar sesión', 'Crear cuenta', 'Activar tema claro']) {
      const box = await guestPage
        .getByRole(action === 'Activar tema claro' ? 'button' : 'link', {
          name: action,
          exact: true,
        })
        .boundingBox();
      expect(box!.x).toBeGreaterThanOrEqual(0);
      expect(box!.x + box!.width).toBeLessThanOrEqual(321);
    }
    await guest.close();
    await page.goto('/buscar');
    await page.locator('ion-segment-button[value="id"]').click();
    await fill(page, 'ID público', publicNumber);
    await page.getByRole('button', { name: 'Buscar', exact: true }).click();
    await page.getByRole('link', { name: `Ver perfil de ${username}` }).click();
    await expect(page.locator('.public-id')).toHaveText(publicNumber);
    await page.goto('/cambiar-correo');
    await fill(page, 'Nuevo correo', newAddress);
    await fill(page, 'Contraseña actual', password);
    await page.getByRole('button', { name: 'Enviar enlace', exact: true }).click();
    await expect(page.getByRole('status')).toContainText('La recepción no está garantizada.', {
      timeout: 10000,
    });
    await expect(
      page.getByRole('heading', { name: 'Cambiar correo', exact: true }).locator('..'),
    ).toContainText(address);
    await openMail(page, newAddress, 'confirmar-cambio-correo');
    await expect(page.getByRole('button', { name: 'Confirmar cambio', exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Confirmar cambio', exact: true }).click();
    await expect(page.getByRole('status')).toHaveText('Correo actualizado.');
    await page.goto('/perfil');
    await expect(
      page.getByRole('heading', { name: 'Mi perfil', exact: true }).locator('..'),
    ).toContainText(newAddress);
    const sibling = await context.newPage();
    await Promise.all([page.reload(), sibling.goto(new URL('/perfil', page.url()).href)]);
    await expect(page.getByRole('heading', { name: 'Mi perfil', exact: true })).toBeVisible();
    await expect(sibling.getByRole('heading', { name: 'Mi perfil', exact: true })).toBeVisible();
    await page.goto('/ajustes');
    await page.getByRole('button', { name: 'Cerrar todas las sesiones', exact: true }).click();
    await page.getByRole('button', { name: 'Cerrar todas', exact: true }).click();
    await expect(page).toHaveURL(/iniciar-sesion$/);
    await expect(sibling).toHaveURL(/iniciar-sesion$/);
    await sibling.close();
    await login(page, newAddress);
    await page.goto('/cambiar-contrasena');
    await fill(page, 'Contraseña actual', password);
    await fill(page, 'Nueva contraseña', changedPassword);
    await fill(page, 'Repetir contraseña', changedPassword);
    await page.getByRole('button', { name: 'Guardar contraseña', exact: true }).click();
    await expect(page).toHaveURL(/iniciar-sesion$/);
    await login(page, newAddress, changedPassword);
    const storage = await page.evaluate(() => ({
      local: Object.keys(localStorage),
      session: Object.keys(sessionStorage),
    }));
    expect(storage.local.filter((k) => k !== 'fcmatch-theme')).toEqual([]);
    expect(storage.session).toEqual([]);
    await page.goto('/ajustes');
    await page.getByRole('button', { name: 'Cerrar sesión', exact: true }).click();
    await expect(page).toHaveURL(/iniciar-sesion$/);
  });

  test('recuperación y restablecimiento reales sin iniciar sesión automáticamente', async ({
    page,
  }) => {
    test.setTimeout(120000);
    const email = `${prefix}_reset@fcmatch.test`;
    await page.goto('/registro');
    await fill(page, 'Usuario', `${username}_r`);
    await fill(page, 'Correo', email);
    await fill(page, 'Contraseña', password);
    await page.getByRole('button', { name: 'Crear cuenta', exact: true }).click();
    await expect(page.getByRole('status')).toContainText('La recepción no está garantizada.', {
      timeout: 10000,
    });
    await openMail(page, email, 'verificar-correo');
    await page.getByRole('button', { name: 'Verificar correo', exact: true }).click();
    await expect(page.getByRole('status')).toHaveText('Correo verificado.');
    // Another request to the same identity must respect the real 60-second mail cooldown.
    // Use a fresh UI registration whose first verification is aged by real elapsed test execution.
    // No clocks/limits are modified and the production API has no test bypass.
    await page.waitForTimeout(61000);
    await page.goto('/recuperar-contrasena');
    await fill(page, 'Correo', email);
    await page.getByRole('button', { name: 'Enviar enlace', exact: true }).click();
    await expect(page.getByRole('status')).toContainText('La recepción no está garantizada.', {
      timeout: 10000,
    });
    await openMail(page, email, 'restablecer-contrasena');
    await fill(page, 'Nueva contraseña', changedPassword);
    await fill(page, 'Repetir contraseña', changedPassword);
    await page.getByRole('button', { name: 'Guardar contraseña', exact: true }).click();
    await expect(page.getByRole('status')).toHaveText('Contraseña actualizada.');
    await expect(page).toHaveURL(/restablecer-contrasena$/);
    await login(page, email, changedPassword);
  });
});
