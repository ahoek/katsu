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
  }
}
