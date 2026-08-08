import { Injectable, inject } from '@angular/core';
import { RouterStateSnapshot, TitleStrategy } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';

import { PageMetaService, canonicalUrl } from './page-meta.service';

/**
 * Sets the document title and meta description from a route's
 * translation keys, and re-applies them whenever the language changes,
 * so the browser tab and search snippet follow the app language.
 *
 * The canonical follows the route too. Without it every page kept the one the
 * build put in the file it was served from, which after a client-side
 * navigation is the wrong page.
 */
@Injectable({ providedIn: 'root' })
export class TranslatedTitleStrategy extends TitleStrategy {
  private readonly page = inject(PageMetaService);
  private readonly translate = inject(TranslateService);

  private titleKey?: string;
  private descriptionKey?: string;

  constructor() {
    super();
    this.translate.onLangChange.subscribe(() => this.apply());
  }

  override updateTitle(state: RouterStateSnapshot) {
    this.titleKey = this.buildTitle(state);

    let route = state.root;
    while (route.firstChild) {
      route = route.firstChild;
    }
    this.descriptionKey = route.data['description'] ?? 'description.home';

    this.page.setCanonical(canonicalUrl(state.url));
    this.apply();
  }

  private apply() {
    if (this.titleKey !== undefined) {
      this.page.setTitle(this.translate.instant(this.titleKey) as string);
    }
    if (this.descriptionKey !== undefined) {
      this.page.setDescription(this.translate.instant(this.descriptionKey) as string);
    }
  }
}
