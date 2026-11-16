import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { API_BASE_URL } from './app/core/api/api-base-url';
import { captureActionLink } from './app/core/session/action-link';

captureActionLink();

async function start() {
  const response = await fetch('config.json', { cache: 'no-store' });
  if (!response.ok) throw new Error('Configuración no disponible.');
  const config: unknown = await response.json();
  if (
    !config ||
    typeof config !== 'object' ||
    !('apiBaseUrl' in config) ||
    typeof config.apiBaseUrl !== 'string'
  )
    throw new Error('Configuración inválida.');
  await bootstrapApplication(App, {
    ...appConfig,
    providers: [...appConfig.providers, { provide: API_BASE_URL, useValue: config.apiBaseUrl }],
  });
}
void start().catch(() => {
  document.body.textContent = 'No se pudo iniciar FCMatch. Revisa la configuración del entorno.';
});
