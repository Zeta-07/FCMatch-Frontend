import { test, expect, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';

// Deterministic UI/transport checks against an explicitly intercepted contract, not API acceptance.
const mobile =
  (JSON.parse(readFileSync('package.json', 'utf8')) as { name: string }).name === 'fcmatch-mobile';
const id = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
const profile = {
  publicId: id,
  username: 'JugadorDemo',
  leagueName: 'Liga Demo',
  avatar: null,
  statistics: null,
  history: [],
};
const own = { profile, email: 'jugador@example.com', emailVerifiedAt: '2026-11-13T00:00:00Z' };
const proof = () => ({
  csrfToken: 'synthetic-csrf-proof',
  csrfExpiresAt: new Date(Date.now() + 3600000).toISOString(),
});
const grant = () => ({
  ...proof(),
  accessToken: 'synthetic.access.token',
  tokenType: 'Bearer',
  expiresIn: 900,
  sessionExpiresAt: new Date(Date.now() + 86400000).toISOString(),
});
const syntheticToken = 's'.repeat(43);
const forbidden =
  /REV[234]|Plataforma Oficial de Competición|Tu comunidad|Tu competición|Panel de control atlético|Cifrado de extremo a extremo|grado bancario|Identidad Deportiva Verificada|Seguridad de la cuenta|Protegida|Modo oscuro activo|Formulario de búsqueda|Coincidencia con/i;

test.beforeEach(async ({ context }) => {
  await context.route('**/api/v1/**', async (route) => {
    const req = route.request();
    const url = new URL(req.url());
    const headers = {
      'Access-Control-Allow-Origin': req.headers()['origin'] ?? '',
      'Access-Control-Allow-Credentials': 'true',
    };
    const send = (json: unknown, status = 200) => route.fulfill({ status, json, headers });
    if (req.method() === 'OPTIONS')
      return route.fulfill({
        status: 204,
        headers: {
          ...headers,
          'Access-Control-Allow-Headers': 'authorization,content-type,x-csrf-token',
          'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE',
        },
      });
    if (url.pathname.endsWith('/health'))
      return send({ status: 'ok', service: 'fcmatch-api', database: 'connected' });
    if (url.pathname.endsWith('/csrf')) return send(proof());
    if (url.pathname.endsWith('/login') || url.pathname.endsWith('/refresh')) return send(grant());
    if (url.pathname === '/api/v1/users')
      return send({
        items: url.searchParams.get('search') === 'zz' ? [] : [profile],
        nextCursor: null,
      });
    if (
      url.pathname === '/api/v1/users/me' ||
      url.pathname.endsWith('/email-change/confirm') ||
      (url.pathname.endsWith('/avatar') && req.method() === 'PUT')
    )
      return send(own);
    if (url.pathname === `/api/v1/users/${id}`) return send(profile);
    if (/\/(register|resend-verification|forgot-password|email-change)$/.test(url.pathname))
      return send(
        {
          message:
            'Si la solicitud es válida, recibirás instrucciones. Si no llegan, podrás solicitar un nuevo envío.',
        },
        202,
      );
    return route.fulfill({ status: 204, headers });
  });
});

async function field(page: Page, name: string, value: string) {
  await page.getByLabel(name, { exact: true }).fill(value);
}
const flows = [
  ['acceso', '/iniciar-sesion', 'Iniciar sesión'],
  ['registro', '/registro', 'Crear cuenta'],
  ['verificacion', `/verificar-correo#token=${syntheticToken}`, 'Verificar correo'],
  ['recuperacion', '/recuperar-contrasena', 'Recuperar contraseña'],
  ['restablecer', `/restablecer-contrasena#token=${syntheticToken}`, 'Restablecer contraseña'],
  ['cambiar-contrasena', '/cambiar-contrasena', 'Cambiar contraseña'],
  ['mi-perfil', '/perfil', 'Mi perfil'],
  ['editar-perfil', '/editar-perfil', 'Editar perfil'],
  ['busqueda', '/buscar', 'Buscar usuarios'],
  ['perfil-publico', `/usuarios/${id}`, 'Perfil'],
  ['ajustes', '/ajustes', 'Ajustes'],
  ['cambiar-correo', '/cambiar-correo', 'Cambiar correo'],
  ['confirmar-correo', `/confirmar-cambio-correo#token=${syntheticToken}`, 'Confirmar correo'],
];

for (const theme of ['dark', 'light'])
  for (const [flow, path, title] of flows) {
    test(`${flow}: ${mobile ? 'móvil' : 'web'} ${theme}, contenido mínimo y vista completa`, async ({
      page,
    }) => {
      const errors: string[] = [];
      page.on('pageerror', (error) => errors.push(error.message));
      await page.setViewportSize({ width: mobile ? 390 : 1280, height: mobile ? 844 : 900 });
      await page.addInitScript((value) => localStorage.setItem('fcmatch-theme', value), theme);
      await page.goto(path);
      await expect(page.getByRole('heading', { level: 1, name: title, exact: true })).toBeVisible();
      await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
      await expect(page.getByRole('status').filter({ hasText: 'Cargando' })).toHaveCount(0);
      if (flow === 'mi-perfil' || flow === 'perfil-publico')
        await expect(
          page.getByRole('heading', { level: 2, name: 'JugadorDemo', exact: true }),
        ).toBeVisible();
      if (flow === 'editar-perfil')
        await expect(page.getByLabel('Usuario', { exact: true })).toHaveValue('JugadorDemo');
      if (flow === 'cambiar-correo' || flow === 'cambiar-contrasena')
        await expect(page.getByLabel('Contraseña actual', { exact: true })).toBeVisible();
      await expect(page.locator('body')).not.toContainText(forbidden);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      const overflow = await page
        .locator('main')
        .evaluate((el) => el.scrollWidth > el.clientWidth + 1);
      expect(overflow).toBe(false);
      expect(await page.locator('meta[name="viewport"]').getAttribute('content')).not.toMatch(
        /user-scalable=no|maximum-scale=1/,
      );
      if (flow === 'perfil-publico') {
        await expect(page.locator('main')).not.toContainText('jugador@example.com');
        await expect(page.locator('main')).not.toContainText('Privado');
      }
      await page.screenshot({ path: `test-results/identity-${flow}-${theme}.png`, fullPage: true });
      expect(errors).toEqual([]);
    });
  }

test('registro: Unicode por caracteres, sin composición, CSRF y una sola mutación', async ({
  page,
}) => {
  await page.goto('/registro');
  await field(page, 'Usuario', 'JugadorDemo');
  await field(page, 'Correo', 'jugador@example.com');
  await field(page, 'Contraseña', 'a'.repeat(11));
  await page.getByRole('button', { name: 'Crear cuenta', exact: true }).click();
  await expect(page.getByText('Usa entre 12 y 128 caracteres.', { exact: true })).toBeVisible();
  await field(page, 'Contraseña', '🏆'.repeat(12));
  const request = page.waitForRequest((req) => req.url().endsWith('/auth/register'));
  await page.getByRole('button', { name: 'Crear cuenta', exact: true }).click();
  const sent = await request;
  expect(sent.postDataJSON().password).toBe('🏆'.repeat(12));
  expect(sent.headers()['x-csrf-token']).toBe('synthetic-csrf-proof');
  await expect(page.getByRole('status')).toContainText('La recepción no está garantizada.');
  const storage = await page.evaluate(() => ({
    local: Object.keys(localStorage),
    session: Object.keys(sessionStorage),
  }));
  expect(storage.local.filter((key) => key !== 'fcmatch-theme')).toEqual([]);
  expect(storage.session).toEqual([]);
});

test('enlace: retira el secreto antes de la configuración, no confirma por GET y requiere acción', async ({
  page,
}) => {
  let mutations = 0;
  const leaks: string[] = [];
  page.on('request', (req) => {
    if (
      req.url().includes(syntheticToken) ||
      (req.headers()['referer'] ?? '').includes(syntheticToken)
    )
      leaks.push(req.method());
    if (req.url().endsWith('/auth/verify-email')) mutations++;
  });
  await page.goto(`/verificar-correo#token=${syntheticToken}`);
  await expect(page.getByRole('heading', { name: 'Verificar correo', exact: true })).toBeVisible();
  expect(page.url()).not.toContain('#');
  expect(mutations).toBe(0);
  await page.getByRole('button', { name: 'Verificar correo', exact: true }).click();
  await expect(page.getByRole('status')).toHaveText('Correo verificado.');
  expect(mutations).toBe(1);
  expect(leaks).toEqual([]);
});

test('búsqueda: vacío, error de red, reintento manual y perfil sin correo', async ({ page }) => {
  await page.goto('/buscar');
  await field(page, 'Usuario', 'zz');
  await page.getByRole('button', { name: 'Buscar', exact: true }).click();
  await expect(page.getByRole('status')).toHaveText('Sin resultados.');
  await page.route('**/api/v1/users?*', (route) => route.abort());
  await field(page, 'Usuario', 'Ju');
  await page.getByRole('button', { name: 'Buscar', exact: true }).click();
  await expect(page.locator('fc-feedback [role="alert"]')).toContainText('No se pudo conectar.');
  await page.unroute('**/api/v1/users?*');
  await page.getByRole('button', { name: 'Buscar', exact: true }).click();
  await page.getByRole('link', { name: 'Ver perfil de JugadorDemo' }).click();
  await expect(page.getByRole('heading', { name: 'Perfil', exact: true })).toBeVisible();
  await expect(
    page
      .locator('app-profile-page')
      .filter({ has: page.getByRole('heading', { name: 'Perfil', exact: true }) }),
  ).not.toContainText('jugador@example.com');
});

test('sesiones: confirmación cerrada inicialmente, cancelable y cierre explícito', async ({
  page,
}) => {
  await page.goto('/ajustes');
  await expect(page.getByRole('alertdialog')).toHaveCount(0);
  await page.getByRole('button', { name: 'Cerrar todas las sesiones', exact: true }).click();
  await expect(page.getByRole('alertdialog')).toBeVisible();
  await page.getByRole('button', { name: 'Cancelar', exact: true }).click();
  await expect(page.getByRole('alertdialog')).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Ajustes', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Cerrar todas las sesiones', exact: true }).click();
  await page
    .getByRole('alertdialog')
    .getByRole('button', { name: 'Cerrar todas', exact: true })
    .click();
  await expect(page).toHaveURL(/iniciar-sesion$/);
});

test('mutación fallida no se reintenta y conserva un mensaje breve de error', async ({ page }) => {
  let requests = 0;
  await page.route('**/api/v1/auth/register', (route) => {
    requests++;
    return route.abort();
  });
  await page.goto('/registro');
  await field(page, 'Usuario', 'JugadorDemo');
  await field(page, 'Correo', 'jugador@example.com');
  await field(page, 'Contraseña', 'a'.repeat(12));
  await page.getByRole('button', { name: 'Crear cuenta', exact: true }).click();
  await expect(page.locator('fc-feedback [role="alert"]')).toContainText('No se pudo conectar.');
  expect(requests).toBe(1);
});

test('contraseña: acepta 128 caracteres Unicode y rechaza 129 sin truncar', async ({ page }) => {
  await page.goto('/registro');
  await field(page, 'Usuario', 'JugadorDemo');
  await field(page, 'Correo', 'jugador@example.com');
  await field(page, 'Contraseña', '🏆'.repeat(129));
  await page.getByRole('button', { name: 'Crear cuenta', exact: true }).click();
  await expect(page.getByText('Usa entre 12 y 128 caracteres.', { exact: true })).toBeVisible();
  await field(page, 'Contraseña', '🏆'.repeat(128));
  const request = page.waitForRequest((req) => req.url().endsWith('/auth/register'));
  await page.getByRole('button', { name: 'Crear cuenta', exact: true }).click();
  expect((await request).postDataJSON().password).toHaveLength(256);
  await expect(page.getByRole('status')).toContainText('La recepción no está garantizada.');
});

test('accesibilidad: foco en título, errores asociados y mostrar/ocultar en español', async ({
  page,
}) => {
  await page.goto('/registro');
  await expect(page.getByRole('heading', { name: 'Crear cuenta', exact: true })).toBeFocused();
  await page.getByRole('button', { name: 'Crear cuenta', exact: true }).click();
  await expect(page.getByLabel('Usuario', { exact: true })).toHaveAttribute('aria-invalid', 'true');
  const description = await page
    .getByLabel('Usuario', { exact: true })
    .getAttribute('aria-describedby');
  expect(description).toBeTruthy();
  await expect(page.locator(`#${description}`)).toHaveText('Usa 3–30 letras, números o _.');
  await field(page, 'Contraseña', 'frase de prueba');
  await page.getByRole('button', { name: 'Mostrar contraseña', exact: true }).click();
  await expect(page.getByLabel('Contraseña', { exact: true })).toHaveAttribute('type', 'text');
  await page.getByRole('button', { name: 'Ocultar contraseña', exact: true }).click();
  await expect(page.getByLabel('Contraseña', { exact: true })).toHaveAttribute('type', 'password');
});

test('sesión: renovación fallida no se repite automáticamente', async ({ page }) => {
  let refreshes = 0;
  await page.route('**/api/v1/auth/refresh', (route) => {
    refreshes++;
    return route.abort();
  });
  await page.goto('/perfil');
  await expect(page).toHaveURL(/iniciar-sesion$/);
  await page.getByRole('link', { name: 'Inicio de FCMatch', exact: true }).click();
  await expect(page).toHaveURL(/iniciar-sesion$/);
  expect(refreshes).toBe(1);
});

test('sesión: un 401 retira datos propios y solicita acceso sin reintentar la operación', async ({
  page,
}) => {
  let reads = 0;
  await page.route('**/api/v1/users/me', (route) => {
    reads++;
    return route.fulfill({
      status: 401,
      json: { error: { code: 'UNAUTHENTICATED', message: 'No se pudo autenticar.', details: [] } },
      headers: {
        'Access-Control-Allow-Origin': route.request().headers()['origin'] ?? '',
        'Access-Control-Allow-Credentials': 'true',
      },
    });
  });
  await page.goto('/perfil');
  await expect(page).toHaveURL(/iniciar-sesion$/);
  expect(reads).toBe(1);
  await expect(page.locator('app-profile-page')).not.toContainText('jugador@example.com');
});

test('apariencia: controles sincronizados y páginas cacheadas conservan el tema', async ({
  page,
}) => {
  await page.goto('/ajustes');
  await page.locator('main fc-theme-toggle').getByRole('button').click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  for (const toggle of await page.locator('fc-theme-toggle:visible').all())
    await expect(toggle).toContainText('Usar tema oscuro');
  await page.getByRole('link', { name: 'Inicio de FCMatch', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Mi perfil', exact: true })).toBeVisible();
  await page
    .locator('app-profile-page')
    .getByRole('button', { name: 'Alternar tema', exact: true })
    .click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});

test('perfil público: escape de texto y ausencia de Bearer', async ({ page }) => {
  let bearer = '';
  await page.route(`**/api/v1/users/${id}`, (route) => {
    bearer = route.request().headers()['authorization'] ?? '';
    return route.fulfill({
      json: { ...profile, username: '<img src=x onerror=alert(1)>' },
      headers: {
        'Access-Control-Allow-Origin': route.request().headers()['origin'] ?? '',
        'Access-Control-Allow-Credentials': 'true',
      },
    });
  });
  await page.goto(`/usuarios/${id}`);
  await expect(
    page.getByRole('heading', { name: '<img src=x onerror=alert(1)>', exact: true }),
  ).toBeVisible();
  expect(bearer).toBe('');
  await expect(page.locator('main img')).toHaveCount(0);
});

for (const theme of ['dark', 'light'])
  test(`responsivo y contraste ${theme}: 320 px y ampliación CSS al 200 %`, async ({ page }) => {
    await page.addInitScript((value) => localStorage.setItem('fcmatch-theme', value), theme);
    await page.setViewportSize({ width: 320, height: 844 });
    await page.goto('/registro');
    await expect(page.getByRole('heading', { name: 'Crear cuenta', exact: true })).toBeVisible();
    expect(await page.locator('main').evaluate((e) => e.scrollWidth <= e.clientWidth + 1)).toBe(
      true,
    );
    const ratios = await page.evaluate(() => {
      const css = getComputedStyle(document.documentElement);
      const lum = (name: string) => {
        const el = document.createElement('span');
        el.style.color = css.getPropertyValue(name);
        document.body.append(el);
        const rgb = getComputedStyle(el)
          .color.match(/\d+(?:\.\d+)?/g)!
          .slice(0, 3)
          .map(Number);
        el.remove();
        const v = rgb.map((c) =>
          c / 255 <= 0.04045 ? c / 255 / 12.92 : ((c / 255 + 0.055) / 1.055) ** 2.4,
        );
        return v[0] * 0.2126 + v[1] * 0.7152 + v[2] * 0.0722;
      };
      const ratio = (a: string, b: string) => {
        const x = lum(a),
          y = lum(b);
        return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
      };
      return [
        ratio('--text-primary', '--bg-surface'),
        ratio('--text-secondary', '--bg-surface'),
        ratio('--color-on-primary', '--button-background'),
        ratio('--border-color', '--bg-surface'),
      ];
    });
    expect(ratios[0]).toBeGreaterThanOrEqual(4.5);
    expect(ratios[1]).toBeGreaterThanOrEqual(4.5);
    expect(ratios[2]).toBeGreaterThanOrEqual(4.5);
    expect(ratios[3]).toBeGreaterThanOrEqual(3);
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.evaluate(() => {
      document.documentElement.style.zoom = '2';
    });
    expect(await page.locator('main').evaluate((e) => e.scrollWidth <= e.clientWidth + 1)).toBe(
      true,
    );
    await page.screenshot({ path: `test-results/identity-zoom-${theme}.png`, fullPage: true });
  });
