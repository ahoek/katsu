import {Component} from '@angular/core';

import {NavController} from 'ionic-angular';

import {ReviewPage} from '../review/review';

@Component({
    selector: 'page-home',
    templateUrl: 'home.html'
})

export class HomePage {

    constructor(public navCtrl: NavController) {

    }

    startReview() {
        this.navCtrl.push(ReviewPage, {});
    }


}
