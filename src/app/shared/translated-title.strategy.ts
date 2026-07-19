import { Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { RouterStateSnapshot, TitleStrategy } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';

/**
 * Sets the document title and meta description from a route's
 * translation keys, and re-applies them whenever the language changes,
 * so the browser tab and search snippet follow the app language.
 */
@Injectable({ providedIn: 'root' })
export class TranslatedTitleStrategy extends TitleStrategy {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
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

    this.apply();
  }

  private apply() {
    if (this.titleKey !== undefined) {
      this.title.setTitle(this.translate.instant(this.titleKey) as string);
    }
    if (this.descriptionKey !== undefined) {
      this.meta.updateTag({
        name: 'description',
        content: this.translate.instant(this.descriptionKey) as string,
      });
    }
  }
}
