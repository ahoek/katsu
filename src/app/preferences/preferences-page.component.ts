import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  IonBackButton,
  IonButtons,
  IonCheckbox,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonNote,
  IonSelect,
  IonSelectOption,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

import { SettingsService } from '../shared/settings.service';
import { SpeechService } from '../shared/speech.service';
import { ThemePreference, ThemeService } from '../shared/theme.service';

@Component({
  selector: 'app-preferences',
  templateUrl: './preferences-page.component.html',
  styleUrls: ['./preferences-page.component.scss'],
  imports: [
    FormsModule,
    IonBackButton,
    IonButtons,
    IonCheckbox,
    IonContent,
    IonHeader,
    IonIcon,
    IonItem,
    IonLabel,
    IonList,
    IonNote,
    IonSelect,
    IonSelectOption,
    IonTitle,
    IonToolbar,
    TranslatePipe,
  ],
})
export class PreferencesPageComponent {
  private readonly translate = inject(TranslateService);
  private readonly theme = inject(ThemeService);
  speech = inject(SpeechService);
  settings = inject(SettingsService);

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
