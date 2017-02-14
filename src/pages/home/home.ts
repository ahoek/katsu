import {Component, Input} from '@angular/core';
import {Validators, FormBuilder, FormGroup } from '@angular/forms';

import {NavController} from 'ionic-angular';
import {Storage} from '@ionic/storage';

import {ReviewPage} from '../review/review';

@Component({
    selector: 'page-home',
    templateUrl: 'home.html'
})

export class HomePage {

    settingsForm: FormGroup;

    settings: any;
    
    private storage: Storage;

    constructor(public navCtrl: NavController, storage: Storage, public formBuilder: FormBuilder) {
        this.storage = storage;
        
        // Default settings
        this.settings = {
            jlptLevel: 'n5',
            normal: true,
            leaveOutSuru: true,
            politeness: {
                polite: true,
                plain: true
            },
            posNeg: {
                positive: true,
                negative: true,
            }
        }
        
        this.storage.get('settings').then((settingsJson) => {
            console.log('Settings', settingsJson);
            if (settingsJson) {
                console.log('Settings loaded');
                this.settings = JSON.parse(settingsJson);
            } else {
                console.log('default settings stored')
                this.storage.set('settings', JSON.stringify(this.settings));
            }
        });
        
        this.settingsForm = formBuilder.group({
            normal: [this.settings.normal],
            leaveOutSuru: [''],
            polite: [''],
            plain: [''],
            affirmative: [''],
            negative: [''],
            jlptLevel: ['']
        });
        
        this.settingsForm.valueChanges.subscribe(data => {
            console.log('Form changes', data, this.settings, this.settingsForm);
            this.storage.set('settings', JSON.stringify(this.settings))
                .then((stored) => console.log(stored));
        });
    }
    

    startReview() {
        this.navCtrl.push(ReviewPage, {settings: this.settings});
    }
}
