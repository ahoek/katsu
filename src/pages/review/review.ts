import {Component, ViewChild} from '@angular/core';
import {NavController, NavParams} from 'ionic-angular';

import {QuestionData} from '../../providers/question-data';
import {Question} from '../../models/question';
import {SummaryPage} from '../summary/summary';

@Component({
    selector: 'page-review',
    templateUrl: 'review.html'
})
export class ReviewPage {
    @ViewChild('answerInput') answerInput: any;

    public questions: any = [];

    public settings: any;

    public index: number = 0;

    constructor(
        public navCtrl: NavController,
        public dataService: QuestionData,
        private navParams: NavParams
    ) {
        this.settings = this.navParams.get('settings');
        this.questions[0] = new Question();
    }

    ionViewDidLoad() {
        this.dataService.load(this.settings).then(questions => {
            this.questions = questions;
            console.log("Loaded", this.questions);
        });
    }

    ionViewDidEnter() {
        // Add IME to answer field
        const answers = document.getElementsByClassName("answerInput")
        for (let i = 0; i < answers.length; i++) {
            wanakana.bind(answers[i]);
        }

        this.focusAnswerField();
    }

    focusAnswerField() {
        setTimeout(() => {
            this.answerInput.setFocus();
        }, 150);
    }

    nextQuestion() {
        if (this.index < this.questions.length - 1) {
            this.goToQuestion(this.index + 1);
        } else {
            this.showSummary();
        }
    }

    goToQuestion(index: number) {
        this.index = index;

        this.focusAnswerField();
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
    }
}
