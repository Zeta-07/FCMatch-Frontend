import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideIonicAngular } from '@ionic/angular';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { identityInterceptor } from './core/api/identity-api';
import { CLIENT_PLATFORM } from './shared/identity/client-platform';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideIonicAngular(),
    provideHttpClient(withInterceptors([identityInterceptor])),
    { provide: CLIENT_PLATFORM, useValue: 'web' },
    provideRouter(routes),
  ],
};
