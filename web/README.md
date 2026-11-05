# FCMatch Web Cliente

Angular 22 + Ionic 9, TypeScript estricto, componentes standalone y detección zoneless. Aplicación independiente en el repositorio frontend.

```powershell
npm ci
npm start
```

Se abre en `http://localhost:4200/estado`. La Fase 0 muestra únicamente identidad visual, tema y estado de la API. Necesita API en `http://localhost:3000/api/v1` por defecto. Configura `PUBLIC_API_BASE_URL` en `.env` para otro entorno; `prestart` y `prebuild` generan `public/config.json` sin secretos.

`npm run check` ejecuta lint de código y colores, formato, build y dos recorridos Playwright. Instala Chromium una vez con `npx playwright install chromium`. Por defecto las pruebas consultan la API real, que debe estar iniciada. `FCMATCH_E2E_STUB_API=1` activa el contrato simulado de CI, documentado en el README principal.

Diseño y distribución: `../docs/decisiones.md`. No tiene dependencias de código por rutas relativas a otros repositorios.
