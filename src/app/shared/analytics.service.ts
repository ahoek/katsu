import { Injectable } from '@angular/core';

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
  }
}

const GTM_ID = 'GTM-5L96Z7Z';

/**
 * Minimal Google Tag Manager wrapper
 *
 * The GTM script is injected lazily on the first tracked event.
 */
@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private initialized = false;

  trackView(pageUrl: string, screenName: string) {
    this.pushTag({
      event: 'page',
      pageName: pageUrl,
      screenName,
    });
  }

  trackEvent(category: string, action: string, label?: string, value?: number) {
    this.pushTag({
      event: 'event',
      data: {
        eventCategory: category,
        eventLabel: label,
        eventAction: action,
        eventValue: value,
      },
    });
  }

  private pushTag(tag: Record<string, unknown>) {
    this.init();
    window.dataLayer?.push(tag);
  }

  private init() {
    if (this.initialized) {
      return;
    }
    this.initialized = true;

    window.dataLayer = window.dataLayer ?? [];
    window.dataLayer.push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' });

    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtm.js?id=${GTM_ID}`;
    document.head.appendChild(script);
  }
}
