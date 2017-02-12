import {Component, ViewChild} from '@angular/core';

import {NavController, NavParams} from 'ionic-angular';

import {QuestionData} from '../../providers/question-data';
import {Question} from '../../models/question';

declare var wanakana: any;

@Component({
    selector: 'page-review',
    templateUrl: 'review.html'
})
export class ReviewPage {

    @ViewChild('slides') slides: any;

    public questions?: any;

    public jlptLevel: String;

    wanakana: any;

    constructor(public navCtrl: NavController, public dataService: QuestionData, private navParams: NavParams) {
        this.jlptLevel = this.navParams.get('jlptLevel');
        console.log(this.jlptLevel)
    }

    ionViewDidLoad() {
        console.log("Loading questions of level " + this.jlptLevel + ".")
        this.dataService.load(this.jlptLevel).then(questions => {
            this.questions = questions;
            console.log("Loaded", this.questions);
        });
    }

    ionViewDidEnter() {
        // Add IME to answer fields
        let answers = document.getElementsByClassName("answerInput")
        for (let i = 0; i < answers.length; i++) {
            wanakana.bind(answers[i]);
        }
    }

    nextSlide() {
        // @todo Focus on the next input field
        this.slides.slideNext();
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
