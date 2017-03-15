import {Component} from '@angular/core';

import {NavController} from 'ionic-angular';
import {Storage} from '@ionic/storage';

import {ReviewPage} from '../review/review';
import {Settings} from '../../models/settings';
import {InformationPage} from '../information/information';

@Component({
    selector: 'page-home',
    templateUrl: 'home.html'
})

export class HomePage {

    settings: any;

    private storage: Storage;

    constructor(public navCtrl: NavController, storage: Storage) {
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

    /**
     * Start the reviews with the correct settings
     */
    startReview() {
        // Save the settings in storage
        this.storage.set('settings', JSON.stringify(this.settings));
        this.navCtrl.push(ReviewPage, {settings: this.settings});
    }
    
    /**
     * Go to information page
     */
    showInformation() {
        this.navCtrl.push(InformationPage);
    }
}
