import { Injectable, inject } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterStateSnapshot, TitleStrategy } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';

/**
 * Sets the document title from a route's translation key and re-applies
 * it whenever the language changes, so the browser tab is translated
 * throughout the app.
 */
@Injectable({ providedIn: 'root' })
export class TranslatedTitleStrategy extends TitleStrategy {
  private readonly title = inject(Title);
  private readonly translate = inject(TranslateService);

  private currentKey?: string;

  constructor() {
    super();
    this.translate.onLangChange.subscribe(() => this.apply());
  }

  override updateTitle(state: RouterStateSnapshot) {
    this.currentKey = this.buildTitle(state);
    this.apply();
  }

  private apply() {
    if (this.currentKey === undefined) {
      return;
    }
    this.title.setTitle(this.translate.instant(this.currentKey) as string);
  }
}
