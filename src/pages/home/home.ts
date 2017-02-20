import {Component} from '@angular/core';
import {NavController} from 'ionic-angular';

import {ReviewPage} from '../review/review';

@Component({
    selector: 'page-home',
    templateUrl: 'home.html'
})

export class HomePage {

    settingsForm: any;

    settings: any;

    constructor(public navCtrl: NavController) {
        this.settings = {
            jlptLevel: 'n5',
            normal: true,
            leaveOutSuru: true,
            polite: true,
            plain: true,
            positive: true,
            negative: true,
        };
    }

    /**
     * Start the reviews with the correct settings
     */
    startReview() {
        // Save the settings in storage
        
        
        this.navCtrl.push(ReviewPage, {settings: this.settings});
    }
}
