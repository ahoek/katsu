import {Component} from '@angular/core';
import {NavController, Platform} from 'ionic-angular';
import {Storage} from '@ionic/storage';
import {GoogleAnalytics} from '@ionic-native/google-analytics';

import {SettingsService} from '../../providers/settings.service';
import {IonicPage} from 'ionic-angular';
import {TranslateService} from "@ngx-translate/core";
import {SpeechService} from "../../providers/speech.service";

@IonicPage()
@Component({
    selector: 'page-home',
    templateUrl: 'home.html'
})

export class HomePage {

    settings: any;

    constructor(
        public navCtrl: NavController, 
        private storage: Storage,
        public platform: Platform,
        private google: GoogleAnalytics,
        private translate: TranslateService,
        public speech: SpeechService,
    ) {
        // Default settings
        this.settings = SettingsService.getDefault();

        this.storage.get('settings').then(settingsJson => {
            if (settingsJson) {
                this.settings = Object.assign(this.settings, JSON.parse(settingsJson));
                if (this.settings.language) {
                    this.setLanguage(this.settings.language);
                }
                if (this.settings.voice) {
                    this.speech.setVoiceByName(this.settings.voice);
                }
            } else {
                this.storage.set('settings', JSON.stringify(this.settings));
            }
        });
    }

    ionViewDidEnter() {
        this.platform.ready().then(() => {
            this.google.trackView('Home Page');
        });
    }
    
    /**
     * Start the reviews with the correct settings
     */
    startReview() {
        // Save the settings in storage
        this.storage.set('settings', JSON.stringify(this.settings));
        this.navCtrl.push('ReviewPage', {settings: this.settings});
        
        this.platform.ready().then(() => {
            this.google.trackEvent('Review', 'start', '', 1);
        });        
    }

    /**
     * Go to information page
     */
    showInformation() {
        this.navCtrl.push('InformationPage');
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
