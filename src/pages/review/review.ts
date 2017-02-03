import {Component} from '@angular/core';

import {NavController} from 'ionic-angular';

@Component({
    selector: 'page-review',
    templateUrl: 'review.html'
})
export class ReviewPage {

    public words: Array<String>;
    
    constructor(public navCtrl: NavController) {

    }
    
    ionViewDidLoad(){
        this.words = [
            '行く',
            '遊ぶ',
            '貸す',
        ]
    }
}
