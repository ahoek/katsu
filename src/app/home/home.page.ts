import { Component, OnInit } from '@angular/core';
import { SettingsService } from '../shared/settings.service';
import { NavController, Platform } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { SpeechService } from '../shared/speech.service';
import { AnalyticsService } from '../shared/analytics.service';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage implements OnInit {
  constructor(
    public navCtrl: NavController,
    public platform: Platform,
    private analytics: AnalyticsService,
    private translate: TranslateService,
    public speech: SpeechService,
    public settings: SettingsService,
  ) {
  }

  async ngOnInit() {
    // Default settings
    await this.settings.userSettings();

    if (this.settings.language !== this.translate.currentLang) {
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
    // Save the settings in storage
    this.settings.store();

    // this.navCtrl.push('ReviewPage', {settings: this.settings});
    this.navCtrl.navigateForward('/review');

    this.platform.ready().then(() => {
      this.analytics.trackEvent('Review', 'start', '', 1);
    });
  }

  setLanguage(language) {
    this.settings.language = language;
    this.translate.use(this.settings.language);
  }

  setVoice(name: string) {
    this.settings.voice = name;
    this.speech.setVoiceByName(name);
  }
}
