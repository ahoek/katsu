import { ApplicationConfig, isDevMode, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter, RouteReuseStrategy, TitleStrategy } from '@angular/router';
import { provideServiceWorker } from '@angular/service-worker';
import { provideIonicAngular, IonicRouteStrategy } from '@ionic/angular/standalone';
import { provideTranslateService } from '@ngx-translate/core';

import { routes } from './app.routes';
import { TranslatedTitleStrategy } from './shared/translated-title.strategy';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(),
    // md on every platform: static toolbar titles, one consistent look.
    //
    // No page transitions. The md ones read as a bug here: on the way in, the
    // entering page paints at rest for a frame before the animation drags it
    // 40px down and slides it back; on the way back, the outgoing page slides
    // down over an already-opaque new page. Every page in Katsu wears the same
    // header and column, so both look like the page scrolling by itself rather
    // than like movement between pages.
    provideIonicAngular({ mode: 'md', animated: false }),
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    { provide: TitleStrategy, useClass: TranslatedTitleStrategy },
    provideTranslateService({
      fallbackLang: 'en',
    }),
    provideServiceWorker('ngsw-worker.js', { enabled: !isDevMode() }),
  ],
};
