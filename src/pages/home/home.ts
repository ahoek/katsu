import {Component} from '@angular/core';

import {NavController} from 'ionic-angular';

import {
  FormGroup,
  FormControl

} from '@angular/forms';

import {ReviewPage} from '../review/review';

@Component({
    selector: 'page-home',
    templateUrl: 'home.html'
})

export class HomePage {
    
    settingsForm: any;

    constructor(public navCtrl: NavController) {
        this.settingsForm = new FormGroup({
            "jlptLevel": new FormControl({value: 'N5', disabled: false})
        });
    }

    startReview() {
        this.navCtrl.push(ReviewPage, {});
    }
}
