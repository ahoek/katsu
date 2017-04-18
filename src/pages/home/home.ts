import {Component} from '@angular/core';
import {NavController, Platform} from 'ionic-angular';
import {Storage} from '@ionic/storage';
import {GoogleAnalytics} from 'ionic-native';

import {ReviewPage} from '../review/review';
import {Settings} from '../../models/settings';
import {InformationPage} from '../information/information';

@Component({
    selector: 'page-home',
    templateUrl: 'home.html'
})

export class HomePage {

    settings: any;

    constructor(
        public navCtrl: NavController, 
        private storage: Storage,
        public platform: Platform
    ) {
        this.storage = storage;

        // Default settings
        this.settings = Settings.getDefault();

        this.storage.get('settings').then((settingsJson) => {
            if (settingsJson) {
                this.settings = JSON.parse(settingsJson);
            } else {
                this.storage.set('settings', JSON.stringify(this.settings));
            }
        });
    }
    
    ionViewDidEnter() {
        this.platform.ready().then(() => {
            GoogleAnalytics.trackView('Home Page');
        });
    }
    
    /**
     * Start the reviews with the correct settings
     */
    startReview() {
        // Save the settings in storage
        this.storage.set('settings', JSON.stringify(this.settings));
        this.navCtrl.push(ReviewPage, {settings: this.settings});
        
        this.platform.ready().then(() => {
            GoogleAnalytics.trackEvent('Review', 'start', '', 1);
        });        
    }

    /**
     * Go to information page
     */
    showInformation() {
        this.navCtrl.push(InformationPage);
    }
}
