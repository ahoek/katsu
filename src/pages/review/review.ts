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

    public questions: Array<any>;

    wanakana: any;

    constructor(public navCtrl: NavController, public dataService: QuestionData) {

    }

    ionViewDidLoad() {
        var settings = {};
        
        this.dataService.load(settings).then((data) => {
            console.log(data);
            this.questions = data;
        });
    }

    ionViewDidEnter() {
        // Add IME to answer fields
        var answers = document.getElementsByClassName("answerInput")
        for (var i = 0; i < answers.length; i++) {
            wanakana.bind(answers[i]);
        }
    }

    nextSlide() {
        this.slides.slideNext();
    }

    /**
     * Check the given answer
     * 
     * If correct, give good styling, and go to next question after 1 sec.
     * If incorrect, give 'bad' styling and show the correct answer
     */
    checkAnswer(question: any) {
        // @todo check for multiple correct answers
        console.log(wanakana.toHiragana(question.answer), wanakana.toKana(question.givenAnswer), wanakana.toHiragana(wanakana.toRomaji(question.answer)));
        if (
            wanakana.toHiragana(question.answer) == wanakana.toKana(question.givenAnswer)
            ||
            wanakana.toHiragana(wanakana.toRomaji(question.answer)) == wanakana.toKana(question.givenAnswer)
        ) {
            question.style = 'correct';
            setTimeout(() => {
                this.nextSlide();
            }, 1000);
        } else {
            question.style = 'incorrect';
            // @todo Wait for user input to go on
            setTimeout(() => {
                this.nextSlide();
            }, 5000);
        }
    }
}
