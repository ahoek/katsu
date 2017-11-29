import {Component, ViewChild, ElementRef} from '@angular/core';
import {NavController, NavParams, Platform} from 'ionic-angular';
import {GoogleAnalytics} from '@ionic-native/google-analytics';
import {Keyboard} from '@ionic-native/keyboard';
import * as wanakana from 'wanakana/lib/wanakana.esm.js';

import {QuestionData} from '../../providers/question-data';
import {Question} from '../../models/question';
import {Settings} from '../../models/settings';
import {IonicPage} from 'ionic-angular';

@IonicPage()
@Component({
    selector: 'page-review',
    templateUrl: 'review.html',
    providers: [Keyboard, QuestionData],
})
export class ReviewPage {
    @ViewChild('answerInput') answerInput: any;
    @ViewChild('answerInputNative', {read: ElementRef}) answerInputNative: ElementRef;

    public questions: Question[] = [];

    public settings: Settings;

    public index: number = 0;

    constructor(
        public navCtrl: NavController,
        public dataService: QuestionData,
        public platform: Platform,
        private navParams: NavParams,
        private keyboard: Keyboard,
        private google: GoogleAnalytics
    ) {
        this.settings = this.navParams.get('settings') || Settings.getDefault();
        this.questions[0] = new Question();
    }

    ionViewDidLoad() {
        this.dataService.load(this.settings).then(questions => {
            if (questions.length > 0) {
                this.questions = questions;
            }
            console.log('Loaded questions', this.questions);
            this.goToQuestion(this.index);
        });

        this.platform.ready().then(() => {
            this.google.trackView('Review Page');
        });
    }

    ionViewDidEnter() {
        // Add IME to answer field
        wanakana.bind(this.answerInputNative.nativeElement.firstElementChild);
        this.focusAnswerField();
    }

    focusAnswerField() {
        setTimeout(() => {
            this.keyboard.show(); // Android
            this.answerInput.setFocus();
        }, 250);
    }

    nextQuestion() {
        if (this.index < this.questions.length - 1) {
            this.goToQuestion(this.index + 1);
        } else {
            this.keyboard.close();
            this.showSummary();
        }
    }

    goToQuestion(index: number) {
        this.index = index;

        this.platform.ready().then(() => {
            this.google.trackEvent('Question', 'show', this.questions[this.index].type, 1);
        });
    }

    showSummary() {
        this.navCtrl.push('SummaryPage', {questions: this.questions, delegate: this});
    }

    /**
     * Check the given answer
     * 
     * If correct, give good styling.
     * If incorrect, give 'bad' styling and show the correct answer.
     */
    checkAnswer(question: Question) {
        question.checkAnswer();

        // If an answer is already given, go to the next question directly.
        if (question.answered === true) {
            this.nextQuestion();
            return;
        }

        question.answered = true;

        this.platform.ready().then(() => {
            this.google.trackEvent('Question', 'answer-check', question.correct ? 'correct' : 'incorrect', 1);
        });
    }

    public classNames(): any {
        return {
            'correct': this.questions[this.index].correct === true,
            'incorrect': this.questions[this.index].correct === false
        }
    }
    
    /**
     * Get the word to ask the conjugation
     */
    public currentQuestion(): Question {
        const question = this.questions[this.index];
        if (!question) {
            return;
        }
        
        if (question.isOfType('na-adjective') && !this.settings.reverse) {
            question.word += 'な';
            question.reading += 'な';
        }
        
        return question;
    }
}
