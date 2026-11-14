import { test, expect, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';

// Deterministic UI/transport checks against an explicitly intercepted contract, not API acceptance.
const mobile =
  (JSON.parse(readFileSync('package.json', 'utf8')) as { name: string }).name === 'fcmatch-mobile';
const id = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
const publicNumber = '12345678';
const profile = {
  publicId: id,
  publicNumber,
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
        items: url.searchParams.get('query') === 'zz' ? [] : [profile],
        nextCursor: null,
      });
    if (
      url.pathname === '/api/v1/users/me' ||
      url.pathname.endsWith('/email-change/confirm') ||
      (url.pathname.endsWith('/avatar') && req.method() === 'PUT')
    )
      return send(own);
    if (url.pathname === `/api/v1/users/${id}` || url.pathname === `/api/v1/users/${publicNumber}`)
      return send(profile);
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
  await field(page, 'Usuario o ID público', 'zz');
  await page.getByRole('button', { name: 'Buscar', exact: true }).click();
  await expect(page.getByRole('status')).toHaveText('Sin resultados.');
  await page.route('**/api/v1/users?*', (route) => route.abort());
  await field(page, 'Usuario o ID público', 'Ju');
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
  await expect(page.locator('main fc-theme-toggle')).toHaveCount(0);
  await expect(page.locator('fc-theme-toggle:visible')).toHaveCount(1);
  await page.getByRole('button', { name: 'Activar tema claro' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  for (const toggle of await page.locator('fc-theme-toggle:visible').all())
    await expect(toggle.getByRole('button')).toHaveAccessibleName('Activar tema oscuro');
  await page.getByRole('link', { name: 'Inicio de FCMatch', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Mi perfil', exact: true })).toBeVisible();
  await page
    .locator('app-profile-page')
    .getByRole('button', { name: 'Activar tema oscuro', exact: true })
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

test('ID numérico: único ID visible, copia, enlace numérico y negociación explícita', async ({
  page,
  context,
}) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  const negotiated = page.waitForRequest((req) => req.url().endsWith('/users/me'));
  await page.goto('/perfil');
  expect((await negotiated).headers()['accept']).toBe('application/vnd.fcmatch.identity.v2+json');
  await expect(page.locator('.public-id')).toHaveText(publicNumber);
  await expect(page.locator('main')).not.toContainText(id);
  await page.getByRole('button', { name: 'Copiar ID' }).click();
  await expect(page.getByRole('status')).toHaveText('ID copiado.');
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(publicNumber);
  await page.goto('/buscar');
  await expect(page.locator('ion-segment')).toHaveCount(0);
  await field(page, 'Usuario o ID público', publicNumber);
  const exact = page.waitForRequest((req) => req.url().includes(`query=${publicNumber}`));
  await page.getByRole('button', { name: 'Buscar', exact: true }).click();
  expect(new URL((await exact).url()).searchParams.has('search')).toBe(false);
  await page.getByRole('link', { name: 'Ver perfil de JugadorDemo' }).click();
  await expect(page).toHaveURL(new RegExp(`/usuarios/${publicNumber}$`));
  await expect(page.locator('app-profile-page .public-id')).toHaveText(publicNumber);
  await expect(page.locator('app-profile-page main')).not.toContainText(id);
});

test('búsqueda unificada manual: Enter, Tú y paginación de la consulta enviada', async ({
  page,
}) => {
  const requests: URL[] = [];
  await page.route('**/api/v1/users?*', async (route) => {
    const url = new URL(route.request().url());
    requests.push(url);
    await route.fulfill({
      json: {
        items: [profile],
        nextCursor: url.searchParams.has('cursor') ? null : 'synthetic-cursor',
      },
    });
  });
  await page.goto('/buscar');
  await field(page, 'Usuario o ID público', 'Ju');
  await page.getByLabel('Usuario o ID público', { exact: true }).press('Tab');
  expect(requests).toHaveLength(0);
  await expect(page.locator('ion-segment')).toHaveCount(0);
  await page.getByLabel('Usuario o ID público', { exact: true }).press('Enter');
  await expect(page.locator('app-search-page h2')).toHaveText('JugadorDemo · Tú');
  expect(requests).toHaveLength(1);
  expect(requests[0].searchParams.get('query')).toBe('Ju');
  await field(page, 'Usuario o ID público', 'Otro');
  expect(requests).toHaveLength(1);
  await page.getByRole('button', { name: 'Cargar más', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Cargar más', exact: true })).toHaveCount(0);
  expect(requests[1].searchParams.get('query')).toBe('Ju');
  expect(requests[1].searchParams.get('cursor')).toBe('synthetic-cursor');
  await expect(page.locator('app-search-page h2')).toHaveCount(1);
  await page.getByRole('button', { name: 'Buscar', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Cargar más', exact: true })).toBeVisible();
  expect(requests[2].searchParams.get('query')).toBe('Otro');
  expect(requests[2].searchParams.has('cursor')).toBe(false);
  await page.goto('/perfil');
  await expect(page.locator('app-profile-page .actions')).toHaveText('Editar perfil');
  await expect(page.locator('app-profile-page .profile-empty h2')).toHaveText([
    'Estadísticas',
    'Historial',
  ]);
});

for (const theme of ['dark', 'light']) {
  for (const width of mobile ? [390] : [320, 768, 1280]) {
    test(`volver del perfil conserva búsqueda, páginas y desplazamiento ${theme} ${width}px`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 700 });
      await page.addInitScript((value) => localStorage.setItem('fcmatch-theme', value), theme);
      const rows = Array.from({ length: 24 }, (_, i) => ({
        ...profile,
        username: `Jugador${i}`,
        publicNumber: String(12345000 + i),
      }));
      const queries: URL[] = [];
      await page.route('**/api/v1/users?*', (route) => {
        const url = new URL(route.request().url());
        queries.push(url);
        return route.fulfill({
          json: {
            items: url.searchParams.has('cursor') ? rows.slice(20) : rows.slice(0, 20),
            nextCursor:
              url.searchParams.get('cursor') === 'page-three'
                ? null
                : url.searchParams.has('cursor')
                  ? 'page-three'
                  : 'page-two',
          },
        });
      });
      await page.route('**/api/v1/users/12345*', (route) =>
        route.fulfill({
          json: rows.find((row) => route.request().url().endsWith(row.publicNumber)),
        }),
      );
      await page.goto('/buscar');
      await field(page, 'Usuario o ID público', 'Ju');
      await page.getByLabel('Usuario o ID público', { exact: true }).press('Enter');
      await page.getByRole('button', { name: 'Cargar más', exact: true }).click();
      await expect(page.locator('app-search-page ion-item')).toHaveCount(24);
      await field(page, 'Usuario o ID público', 'Borrador');
      const link = page.getByRole('link', { name: 'Ver perfil de Jugador12', exact: true });
      await link.scrollIntoViewIfNeeded();
      const content = page.locator('app-search-page ion-content');
      const top = await content.evaluate(
        async (el) =>
          (
            await (
              el as HTMLElement & { getScrollElement(): Promise<HTMLElement> }
            ).getScrollElement()
          ).scrollTop,
      );
      expect(top).toBeGreaterThan(100);
      await expect
        .poll(() =>
          content.evaluate((el) => (el as HTMLElement & { scrollEvents: boolean }).scrollEvents),
        )
        .toBe(true);
      await link.click();
      await expect(page.locator('app-profile-page .public-id')).toHaveText(rows[12].publicNumber);
      await expect(page.locator('app-search-page')).toBeHidden();
      const back = page
        .locator('app-profile-page ion-header')
        .getByRole('button', { name: 'Volver', exact: true });
      await expect(back).toBeVisible();
      const backBox = await back.boundingBox();
      expect(backBox!.width).toBeGreaterThanOrEqual(44);
      expect(backBox!.height).toBeGreaterThanOrEqual(44);
      expect(backBox!.x).toBeGreaterThanOrEqual(0);
      expect(backBox!.x + backBox!.width).toBeLessThanOrEqual(width);
      await page.screenshot({ path: `test-results/search-profile-back-${theme}-${width}.png` });
      await back.click();
      await expect(page).toHaveURL(/\/buscar$/);
      await expect(page.locator('app-search-page ion-item')).toHaveCount(24);
      await expect(page.getByLabel('Usuario o ID público', { exact: true })).toHaveValue(
        'Borrador',
      );
      await expect
        .poll(() =>
          content.evaluate(
            async (el) =>
              (
                await (
                  el as HTMLElement & { getScrollElement(): Promise<HTMLElement> }
                ).getScrollElement()
              ).scrollTop,
          ),
        )
        .toBeGreaterThan(top - 5);
      expect(queries).toHaveLength(2);
      expect(queries[1].searchParams.get('query')).toBe('Ju');
      const restoredTop = await content.evaluate(
        async (el) =>
          (
            await (
              el as HTMLElement & { getScrollElement(): Promise<HTMLElement> }
            ).getScrollElement()
          ).scrollTop,
      );
      expect(Math.abs(restoredTop - top)).toBeLessThanOrEqual(5);
      await page.getByRole('button', { name: 'Cargar más', exact: true }).click();
      await expect(page.getByRole('button', { name: 'Cargar más', exact: true })).toHaveCount(0);
      expect(queries[2].searchParams.get('cursor')).toBe('page-three');
      expect(queries[2].searchParams.get('query')).toBe('Ju');
      await page.getByRole('link', { name: 'Ver perfil de Jugador12', exact: true }).click();
      await page.goBack();
      await expect(page.locator('app-search-page ion-item')).toHaveCount(24);
      expect(queries).toHaveLength(3);
      await page.goto('/perfil');
      await expect(
        page
          .locator('app-profile-page ion-header')
          .getByRole('button', { name: 'Volver', exact: true }),
      ).toHaveCount(0);
    });
  }

  test(`editar perfil: ancho útil y ausencia de desbordamiento ${theme}`, async ({ page }) => {
    await page.addInitScript((value) => localStorage.setItem('fcmatch-theme', value), theme);
    for (const width of [320, 360, 390, 768]) {
      await page.setViewportSize({ width, height: 844 });
      await page.goto('/editar-perfil');
      await expect(page.getByLabel('Usuario', { exact: true })).toHaveValue('JugadorDemo');
      const shell = page.locator('app-account-form-page main');
      expect(await shell.evaluate((el) => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
      const input = await page.getByLabel('Usuario', { exact: true }).boundingBox();
      expect(input!.x).toBeGreaterThanOrEqual(0);
      expect(input!.x + input!.width).toBeLessThanOrEqual(width);
      if (mobile) {
        const field = await page.locator('app-account-form-page ion-input').first().boundingBox();
        expect(field!.width).toBeGreaterThanOrEqual(width - 50);
      }
      await expect(
        page.getByRole('button', { name: 'Guardar cambios', exact: true }),
      ).toBeEnabled();
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({
      path: `test-results/profile-editor-width-${theme}.png`,
      fullPage: true,
    });
  });
}

for (const theme of ['dark', 'light'])
  test(`búsqueda: contraste efectivo de controles ${theme}`, async ({ page }) => {
    await page.addInitScript((value) => localStorage.setItem('fcmatch-theme', value), theme);
    await page.route('**/api/v1/users?*', (route) =>
      route.fulfill({ json: { items: [profile], nextCursor: 'synthetic-cursor' } }),
    );
    await page.goto('/buscar');
    await field(page, 'Usuario o ID público', 'Ju');
    await page.getByRole('button', { name: 'Buscar', exact: true }).click();
    await expect(page.locator('app-search-page h2')).toContainText('Tú');
    const controls = page.locator('app-search-page button:visible, app-search-page input:visible');
    const count = await controls.count();
    expect(count).toBeGreaterThanOrEqual(3);
    for (const control of await controls.all()) {
      const ratio = await control.evaluate((el) => {
        const lum = (color: string) => {
          const rgb = color
            .match(/[\d.]+/g)!
            .slice(0, 3)
            .map(Number);
          const channels = rgb.map((v) =>
            v / 255 <= 0.04045 ? v / 255 / 12.92 : ((v / 255 + 0.055) / 1.055) ** 2.4,
          );
          return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
        };
        let ancestor: Element | null = el;
        let background = '';
        while (ancestor) {
          const value = getComputedStyle(ancestor).backgroundColor;
          if (value !== 'rgba(0, 0, 0, 0)' && value !== 'transparent') {
            background = value;
            break;
          }
          ancestor = ancestor.parentElement ?? (ancestor.getRootNode() as ShadowRoot).host ?? null;
        }
        if (!background) {
          const sample = document.createElement('span');
          sample.style.color = 'var(--bg-primary)';
          document.body.append(sample);
          background = getComputedStyle(sample).color;
          sample.remove();
        }
        const a = lum(getComputedStyle(el).color),
          b = lum(background);
        return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
      });
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    }
  });

for (const theme of ['dark', 'light'])
  test(`cabecera y navegación accesibles ${theme}: teclado, estado y reflujo`, async ({ page }) => {
    await page.addInitScript((value) => localStorage.setItem('fcmatch-theme', value), theme);
    for (const width of [320, 390, 768, 1280]) {
      await page.setViewportSize({ width, height: 844 });
      await page.goto('/ajustes');
      const toggle = page.locator('app-settings-page fc-theme-toggle').getByRole('button');
      await expect(toggle).toHaveAccessibleName(
        theme === 'dark' ? 'Activar tema claro' : 'Activar tema oscuro',
      );
      await expect(toggle).toHaveAttribute(
        'aria-description',
        `Tema actual: ${theme === 'dark' ? 'oscuro' : 'claro'}`,
      );
      await expect(page.locator('app-settings-page fc-theme-toggle ion-icon')).toHaveAttribute(
        'aria-hidden',
        'true',
      );
      await expect(page.locator('main fc-theme-toggle')).toHaveCount(0);
      const box = await toggle.boundingBox();
      expect(box!.width).toBeGreaterThanOrEqual(44);
      expect(box!.height).toBeGreaterThanOrEqual(44);
      expect(box!.x + box!.width).toBeLessThanOrEqual(width + 1);
      expect(
        await page.locator('ion-header').evaluate((el) => el.scrollWidth <= el.clientWidth + 1),
      ).toBe(true);
      if (!mobile)
        await expect(
          page.getByRole('navigation', { name: 'Principal' }).locator('[aria-current="page"]'),
        ).toHaveText('Ajustes');
      await toggle.focus();
      await page.keyboard.press('Enter');
      await expect(page.locator('html')).toHaveAttribute(
        'data-theme',
        theme === 'dark' ? 'light' : 'dark',
      );
      await page.keyboard.press('Space');
      await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
    }
  });

for (const theme of ['dark', 'light'])
  test(`responsivo y contraste ${theme}: 320 px y ampliación CSS al 200 %`, async ({ page }) => {
    await page.addInitScript((value) => localStorage.setItem('fcmatch-theme', value), theme);
    await page.setViewportSize({ width: 320, height: 844 });
    await page.goto('/registro');
    await expect(page.getByRole('heading', { name: 'Crear cuenta', exact: true })).toBeVisible();
    const actualControl = await page
      .locator('ion-input')
      .first()
      .evaluate((el) => {
        const style = getComputedStyle(el);
        const root = getComputedStyle(document.documentElement);
        return {
          border: style.getPropertyValue('--border-color').trim(),
          expected: root.getPropertyValue('--border-color').trim(),
          radius: style.getPropertyValue('--border-radius').trim(),
          font: style.fontFamily,
        };
      });
    expect(actualControl.border).toBe(actualControl.expected);
    expect(actualControl.radius).toBe('0.75rem');
    expect(actualControl.font).toContain('system-ui');
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
    const actionContrast = await page.evaluate(() => {
      const css = getComputedStyle(document.documentElement);
      const luminance = (color: string) => {
        const sample = document.createElement('span');
        sample.style.color = color;
        document.body.append(sample);
        const rgb = getComputedStyle(sample)
          .color.match(/\d+(?:\.\d+)?/g)!
          .slice(0, 3)
          .map(Number);
        sample.remove();
        const v = rgb.map((c) =>
          c / 255 <= 0.04045 ? c / 255 / 12.92 : ((c / 255 + 0.055) / 1.055) ** 2.4,
        );
        return v[0] * 0.2126 + v[1] * 0.7152 + v[2] * 0.0722;
      };
      const ratio = (a: string, b: string) => {
        const x = luminance(a),
          y = luminance(b);
        return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
      };
      return [
        ratio(css.getPropertyValue('--nav-active'), css.getPropertyValue('--bg-subtle')),
        ratio(css.getPropertyValue('--action-danger'), css.getPropertyValue('--bg-surface')),
      ];
    });
    expect(actionContrast.every((ratio) => ratio >= 4.5)).toBe(true);
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.evaluate(() => {
      document.documentElement.style.zoom = '2';
    });
    expect(await page.locator('main').evaluate((e) => e.scrollWidth <= e.clientWidth + 1)).toBe(
      true,
    );
    await page.screenshot({ path: `test-results/identity-zoom-${theme}.png`, fullPage: true });
  });
