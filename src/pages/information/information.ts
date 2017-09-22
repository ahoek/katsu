/**
 * Information page 
 */

import {Component} from '@angular/core';
import {NavController, Platform} from 'ionic-angular';
import {GoogleAnalytics} from '@ionic-native/google-analytics';
import {IonicPage} from 'ionic-angular';

@IonicPage()
@Component({
    selector: 'page-information',
    templateUrl: 'information.html'
})
export class InformationPage {

    constructor(
        public navCtrl: NavController,
        public platform: Platform,
        private google: GoogleAnalytics,
    ) {

    }

    ionViewDidLoad() {
        console.log('ionViewDidLoad InformationPage');
        this.platform.ready().then(() => {
            this.google.trackView('Information Page');
        });
    }
}
