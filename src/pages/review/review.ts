import {Component, ViewChild} from '@angular/core';
import {NavController, NavParams, Platform} from 'ionic-angular';
import {GoogleAnalytics} from '@ionic-native/google-analytics';
import {Keyboard} from '@ionic-native/keyboard';
import * as wanakana from 'wanakana/lib/wanakana.js';

import {QuestionData} from '../../providers/question-data';
import {Question} from '../../models/question';
import {Settings} from '../../models/settings';
import {SummaryPage} from '../summary/summary';

@Component({
    selector: 'page-review',
    templateUrl: 'review.html',
    providers: [Keyboard],
})
export class ReviewPage {
    @ViewChild('answerInput') answerInput: any;

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
        this.settings = this.navParams.get('settings');
        this.questions[0] = new Question();
    }

    ionViewDidLoad() {
        this.dataService.load(this.settings).then(questions => {
            this.questions = questions;
            console.log('Loaded', this.questions);
            this.goToQuestion(0);
        });
        
        this.platform.ready().then(() => {
            this.google.trackView('Review Page');
        });
    }

    ionViewDidEnter() {
        // Add IME to answer field
        const answers = document.getElementsByClassName('answerInput');
        for (let i = 0; i < answers.length; i++) {
            wanakana.bind(answers[i]);
        }

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
        this.navCtrl.push(SummaryPage, {questions: this.questions, delegate: this});
    }

    /**
     * Check the given answer
     * 
     * If correct, give good styling, and go to next question after 1 sec.
     * If incorrect, give 'bad' styling and show the correct answer.
     */
    checkAnswer(question: Question) {
        // @todo What to do for empty answer?
        
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
}
