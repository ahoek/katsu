import {Component} from '@angular/core';
import {NavController, Platform} from 'ionic-angular';
import {GoogleAnalytics} from 'ionic-native';

/**
 * Information page 
 */
@Component({
    selector: 'page-information',
    templateUrl: 'information.html'
})
export class InformationPage {

    constructor(
        public navCtrl: NavController,
        public platform: Platform
    ) {
        
    }

    ionViewDidLoad() {
        console.log('ionViewDidLoad InformationPage');
        this.platform.ready().then(() => {
            GoogleAnalytics.trackView('Information Page');
        });         
    }
}
