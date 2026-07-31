import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  IonBackButton,
  IonButtons,
  IonCheckbox,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonList,
  IonSelect,
  IonSelectOption,
  IonToolbar,
} from '@ionic/angular/standalone';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

import { SettingsService } from '../../app/shared/settings.service';
import { ThemePreference, ThemeService } from '../../app/shared/theme.service';
import { installKanjiTranslations } from '../i18n/kanji-translations';
import { KanjiViewService } from '../kanji-view.service';

/**
 * The kanji section's options. Theme and language are the app's own settings
 * surfaced here - stored through the same service the preferences page uses,
 * so changing them in either place changes them everywhere. Only the pad
 * annotations are the feature's own.
 */
@Component({
  selector: 'app-kanji-options-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: 'kanji-options-page.component.html',
  styleUrls: ['kanji-options-page.component.scss'],
  imports: [
    FormsModule,
    IonBackButton,
    IonButtons,
    IonCheckbox,
    IonContent,
    IonHeader,
    IonIcon,
    IonItem,
    IonList,
    IonSelect,
    IonSelectOption,
    IonToolbar,
    TranslatePipe,
  ],
})
export class KanjiOptionsPageComponent {
  private readonly theme = inject(ThemeService);
  private readonly translate = inject(TranslateService);

  protected readonly settings = inject(SettingsService);
  protected readonly view = inject(KanjiViewService);

  constructor() {
    installKanjiTranslations(this.translate);
  }

  setTheme(theme: ThemePreference): void {
    this.settings.theme = theme;
    this.theme.apply(theme);
    this.settings.store();
  }

  setLanguage(language: string): void {
    this.settings.language = language;
    this.translate.use(language);
    this.settings.store();
  }
}
