import {Component, ViewChild} from '@angular/core';

import {NavController} from 'ionic-angular';

import {QuestionData} from '../../providers/question-data';

declare var wanakana: any;

@Component({
    selector: 'page-review',
    templateUrl: 'review.html'
})
export class ReviewPage {

    @ViewChild('slides') slides: any;

    hasAnswered: boolean = false;
    score: number = 0;

    slideOptions: any;
    public questions: Array<any>;

    wanakana: any;

    constructor(public navCtrl: NavController, public dataService: QuestionData) {
        this.slideOptions = {
            onlyExternal: true
        };
    }

    ionViewDidLoad() {
        this.dataService.load().then((data) => {
            console.log(data)
            this.questions = data;
        });
    }

    ionViewDidEnter() {
        // Add IME to answer fields
        var answers = document.getElementsByClassName("answer")
        for (var i = 0; i < answers.length; i++) {
            wanakana.bind(answers[i])
        }
    }
}
