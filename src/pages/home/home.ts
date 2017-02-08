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
    
    settings: any;

    constructor(public navCtrl: NavController) {
        this.settings = {
            jlptLevel: 'n5'
        }
        
        this.settingsForm = new FormGroup({
            "jlptLevel": new FormControl({value: this.settings.jlptLevel, disabled: false})
        });
    }

    startReview() {
        this.navCtrl.push(ReviewPage, this.settings);
    }
}
