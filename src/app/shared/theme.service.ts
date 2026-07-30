import { DOCUMENT, Injectable, inject } from '@angular/core';

export type ThemePreference = 'auto' | 'light' | 'dark';

/**
 * Applies the user's theme preference by toggling classes on <html>.
 * With no class, the OS color scheme decides (see theme/variables.scss).
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly doc = inject(DOCUMENT);

  apply(theme: ThemePreference) {
    const root = this.doc.documentElement;
    root.classList.toggle('theme-dark', theme === 'dark');
    root.classList.toggle('theme-light', theme === 'light');
    this.applyThemeColor(theme);
  }

  // Keep the browser chrome on the canvas colour when the user
  // overrides the OS scheme; on auto the media metas decide.
  private applyThemeColor(theme: ThemePreference) {
    const light = '#ebebec';
    const dark = '#131300';
    const metas = this.doc.querySelectorAll('meta[name="theme-color"]');
    metas.forEach((meta, i) => {
      const auto = i === 0 ? light : dark;
      meta.setAttribute('content', theme === 'auto' ? auto : theme === 'dark' ? dark : light);
    });
  }
}
