import {Component} from '@angular/core';
import {NavController, NavParams} from 'ionic-angular';

import {QuestionData} from '../../providers/question-data';
import {Question} from '../../models/question';
import {SummaryPage} from '../summary/summary';

declare var wanakana: any;

@Component({
    selector: 'page-review',
    templateUrl: 'review.html'
})
export class ReviewPage {

    public questions: any = [];

    public settings: any;
    
    public index: number = 0;

    wanakana: any;

    constructor(public navCtrl: NavController, public dataService: QuestionData, private navParams: NavParams) {
        this.settings = this.navParams.get('settings');
        this.questions[0] = new Question();
    }

    ionViewDidLoad() {
        console.log('didLoad')
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
    }

    nextQuestion() {
        if (this.index < this.questions.length - 1) {  
            this.index++;
        } else {
            this.showSummary();
        }
    }
    
    goToQuestion(index: number) {
        this.index = index;
    }
    
    showSummary() {
        this.navCtrl.push(SummaryPage, {questions: this.questions});
    }

    /**
     * Check the given answer
     * 
     * If correct, give good styling, and go to next question after 1 sec.
     * If incorrect, give 'bad' styling and show the correct answer.
     */
    checkAnswer(question: Question) {
        question.checkAnswer();
 
        // If an answer is already given, go to the next slide directly.
        if (question.answered === true) {
            this.nextQuestion();
            return;
        }
        
        question.answered = true;
    }
}
