import {Component, ViewChild, Renderer, ElementRef} from '@angular/core';

import {NavController, NavParams} from 'ionic-angular';

import {QuestionData} from '../../providers/question-data';

declare var wanakana: any;

@Component({
    selector: 'page-review',
    templateUrl: 'review.html'
})
export class ReviewPage {

    @ViewChild('slides') slides: any;

    public questions: Array<any>;
    
    public jlptLevel: String;

    wanakana: any;
    
    constructor(public navCtrl: NavController, public dataService: QuestionData, private navParams: NavParams) {
        this.jlptLevel = navParams.get('jlptLevel');
        console.log(this.jlptLevel)
    }

    ionViewDidLoad() {
        console.log("Loading questions of level " + this.jlptLevel + ".")
        this.dataService.load(this.jlptLevel).then(data => {
            this.questions = data;
            console.log("Loaded", this.questions);
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
        question.givenAnswer = wanakana.toKana(question.givenAnswer);
        
        // @todo check for multiple correct answers
        console.log(wanakana.toHiragana(question.answer), question.givenAnswer, wanakana.toHiragana(wanakana.toRomaji(question.answer)));
        if (
            wanakana.toHiragana(question.answer) == question.givenAnswer
            ||
            wanakana.toHiragana(wanakana.toRomaji(question.answer)) == question.givenAnswer
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
