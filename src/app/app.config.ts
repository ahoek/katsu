import { ApplicationConfig, isDevMode, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter, RouteReuseStrategy } from '@angular/router';
import { provideServiceWorker } from '@angular/service-worker';
import { provideIonicAngular, IonicRouteStrategy } from '@ionic/angular/standalone';
import { provideTranslateService } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(),
    provideIonicAngular({ mode: 'ios' }),
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideTranslateService({
      fallbackLang: 'en',
      loader: provideTranslateHttpLoader({
        prefix: 'assets/i18n/',
        suffix: '.json',
      }),
    }),
    provideServiceWorker('ngsw-worker.js', { enabled: !isDevMode() }),
  ],
};
