import {Component} from '@angular/core';

import {NavController} from 'ionic-angular';

declare var wanakana: any;

@Component({
    selector: 'page-review',
    templateUrl: 'review.html'
})
export class ReviewPage {

    public words: Array<String>;
    wanakana: any;

    constructor(public navCtrl: NavController) {
    }

    ionViewDidLoad() {
        this.words = [
            '行く',
            '遊ぶ',
            '貸す',
        ]
    }

    ionViewDidEnter() {
        var answers = document.getElementsByClassName("answer")
        for (var i = 0; i < answers.length; i++) {
            wanakana.bind(answers[i])
        }
    }
}
