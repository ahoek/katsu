import { DOCUMENT, Injectable, inject } from '@angular/core';

// Under this height the review screen tightens its spacing; roughly what an
// on-screen keyboard leaves of a phone screen.
const SHORT_VIEWPORT = 480;

/**
 * Publishes the height that is actually visible, keyboard included.
 *
 * Safari does not implement `interactive-widget`, so its keyboard shrinks
 * only the visual viewport: the layout keeps its full height, the lower part
 * of it ends up behind the keyboard, and the browser scrolls the page to
 * reveal the focused field. Sizing the app to the visible height instead
 * leaves it nothing to scroll.
 */
@Injectable({ providedIn: 'root' })
export class ViewportService {
  private readonly doc = inject(DOCUMENT);

  start() {
    const viewport = this.doc.defaultView?.visualViewport;
    if (!viewport) {
      return;
    }

    const apply = () => {
      const root = this.doc.documentElement;
      const height = Math.round(viewport.height);
      root.style.setProperty('--app-visible-height', `${height}px`);
      root.classList.toggle('app-short-viewport', height < SHORT_VIEWPORT);
    };

    viewport.addEventListener('resize', apply);
    apply();
  }
}
