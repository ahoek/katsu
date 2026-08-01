import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  IonButtons,
  IonBackButton,
  IonCheckbox,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonListHeader,
  IonNote,
  IonSelect,
  IonSelectOption,
  IonToolbar,
} from '@ionic/angular/standalone';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { todayOutline } from 'ionicons/icons';

import { KanjiPaceService } from '../../kanji/kanji-pace.service';
import { KanjiViewService } from '../../kanji/kanji-view.service';
import { CAP_CHOICES } from '../../kanji/srs/daily';
import { ARROW_POINTS } from '../../kanji/stroke/direction';
import { SettingsService } from '../shared/settings.service';
import { SpeechService } from '../shared/speech.service';
import { ThemePreference, ThemeService } from '../shared/theme.service';

@Component({
  selector: 'app-preferences',
  templateUrl: './preferences-page.component.html',
  styleUrls: ['./preferences-page.component.scss'],
  imports: [
    FormsModule,
    IonButtons,
    IonBackButton,
    IonCheckbox,
    IonContent,
    IonHeader,
    IonIcon,
    IonItem,
    IonLabel,
    IonList,
    IonListHeader,
    IonNote,
    IonSelect,
    IonSelectOption,
    IonToolbar,
    TranslatePipe,
  ],
})
export class PreferencesPageComponent {
  private readonly translate = inject(TranslateService);
  private readonly theme = inject(ThemeService);
  speech = inject(SpeechService);
  settings = inject(SettingsService);
  // The kanji trainer's own switches, shown here so every option has one home.
  view = inject(KanjiViewService);
  pace = inject(KanjiPaceService);

  readonly capChoices = CAP_CHOICES;

  /** The pad's arrowhead, so the switch shows the thing it switches. */
  readonly arrowPoints = ARROW_POINTS;

  constructor() {
    // Registered here rather than with the app's own icons, so this page can
    // gain a row without touching the root component.
    addIcons({ todayOutline });
  }

  store() {
    this.settings.store();
  }

  setTheme(theme: ThemePreference) {
    this.settings.theme = theme;
    this.theme.apply(theme);
    this.store();
  }

  setLanguage(language: string) {
    this.settings.language = language;
    this.translate.use(language);
    this.store();
  }

  setVoice(name: string) {
    this.settings.voice = name;
    this.speech.setVoiceByName(name);
    this.store();
  }
}
