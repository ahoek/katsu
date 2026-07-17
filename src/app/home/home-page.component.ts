import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  IonButton,
  IonButtons,
  IonCheckbox,
  IonCol,
  IonContent,
  IonFooter,
  IonGrid,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonListHeader,
  IonNote,
  IonRouterLink,
  IonRow,
  IonSelect,
  IonSelectOption,
  IonTitle,
  IonToolbar,
  NavController,
} from '@ionic/angular/standalone';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

import { SettingsService } from '../shared/settings.service';
import { SpeechService } from '../shared/speech.service';
import { AnalyticsService } from '../shared/analytics.service';

@Component({
  selector: 'app-home',
  templateUrl: 'home-page.component.html',
  styleUrls: ['home-page.component.scss'],
  imports: [
    FormsModule,
    RouterLink,
    IonRouterLink,
    IonButton,
    IonButtons,
    IonCheckbox,
    IonCol,
    IonContent,
    IonFooter,
    IonGrid,
    IonHeader,
    IonIcon,
    IonItem,
    IonLabel,
    IonList,
    IonListHeader,
    IonNote,
    IonRow,
    IonSelect,
    IonSelectOption,
    IonTitle,
    IonToolbar,
    TranslatePipe,
  ],
})
export class HomePageComponent implements OnInit {
  navCtrl = inject(NavController);
  private analytics = inject(AnalyticsService);
  private translate = inject(TranslateService);
  speech = inject(SpeechService);
  settings = inject(SettingsService);


  async ngOnInit() {
    // Default settings
    await this.settings.userSettings();

    if (this.settings.language !== this.translate.getCurrentLang()) {
      this.setLanguage(this.settings.language);
    }
    if (this.settings.voice) {
      this.speech.setVoiceByName(this.settings.voice);
    }
  }

  /**
   * Start the reviews with the correct settings
   */
  startReview() {
    this.settings.store();
    this.navCtrl.navigateForward('/review');
    this.analytics.trackEvent('Review', 'start', '', 1);
  }

  setLanguage(language: string) {
    this.settings.language = language;
    this.translate.use(this.settings.language);
  }

  setVoice(name: string) {
    this.settings.voice = name;
    this.speech.setVoiceByName(name);
  }
}
