import {Component} from '@angular/core';

import {NavController} from 'ionic-angular';

declare var wanakana: any;

@Component({
    selector: 'page-review',
    templateUrl: 'review.html'
})
export class ReviewPage {

    public questions: Array<any>;

    wanakana: any;
    slideOptions: any;

    constructor(public navCtrl: NavController) {
        this.slideOptions = {
            onlyExternal: true
        };
    }

    ionViewDidLoad() {
        // Simple data model for te-form
        // The data will come from the Jisho api eventually
        this.questions = [
            {
                dictionary: '行く',
                furigana: 'いく',
                meaning: 'to go',
                answer: 'いって',
            },
            {
                dictionary: '遊ぶ',
                furigana: 'あそぶ',
                meaning: 'to play',
                answer: 'あそんで',
            },
            {
                dictionary: '貸す',
                furigana: 'かす',
                meaning: 'to lend',
                answer: 'かして',
            },
        ]
    }

    ionViewDidEnter() {
        // Add IME to answer fields
        var answers = document.getElementsByClassName("answer")
        for (var i = 0; i < answers.length; i++) {
            wanakana.bind(answers[i])
        }
    }
}
