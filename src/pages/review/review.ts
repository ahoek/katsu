import {Component, ViewChild} from '@angular/core';
import {NavController, NavParams, Slides} from 'ionic-angular';

import {QuestionData} from '../../providers/question-data';
import {Question} from '../../models/question';

declare var wanakana: any;

@Component({
    selector: 'page-review',
    templateUrl: 'review.html'
})
export class ReviewPage {

    @ViewChild('slides') slides: Slides;

    public questions: any = [];

    public settings: any;

    wanakana: any;

    constructor(public navCtrl: NavController, public dataService: QuestionData, private navParams: NavParams) {
        this.settings = this.navParams.get('settings');
    }

    ionViewDidLoad() {
        this.dataService.load(this.settings).then(questions => {
            this.questions = questions;
            console.log("Loaded", this.questions);
        });
    }

    ionViewDidEnter() {
        // Add IME to answer fields
        const answers = document.getElementsByClassName("answerInput")
        for (let i = 0; i < answers.length; i++) {
            wanakana.bind(answers[i]);
        }

        // Focus on the first slide
        this.focusSlide(0);
    }

    focusSlide(index: number) {
        const answerInput = document.getElementById('answer' + (index + 1));
        if (answerInput) {
            const input = answerInput.querySelector('input');
            let delay = index === 1 ? 40 : 0;
            setTimeout(() => {
                input.focus();
            }, delay);
        }
    }

    slideChanged() {
        const index = this.slides.getActiveIndex();
        if (index < this.questions.length) {
            this.focusSlide(index);
        }
    }

    nextSlide() {
        this.slides.slideNext(90);
    }

    /**
     * Check the given answer
     * 
     * If correct, give good styling, and go to next question after 1 sec.
     * If incorrect, give 'bad' styling and show the correct answer.
     */
    checkAnswer(question: Question) {
        let questionAnsweredEarlier = false;

        // If an answer is already given, go to the next slide directly.
        if (question.style) {
            questionAnsweredEarlier = true;
        }

        if (question.givenAnswer) {
            // Convert romaji to kana
            question.givenAnswer = wanakana.toKana(question.givenAnswer);
        }

        // @todo check for multiple correct answers
        if (
            wanakana.toHiragana(question.answer) == question.givenAnswer
            ||
            wanakana.toHiragana(wanakana.toRomaji(question.answer)) == question.givenAnswer
        ) {
            question.style = 'correct';
        } else {
            question.style = 'incorrect';
        }

        if (questionAnsweredEarlier) {
            this.nextSlide();
        }
    }
}
