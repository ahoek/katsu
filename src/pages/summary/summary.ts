import {Component} from '@angular/core';
import {NavController, NavParams} from 'ionic-angular';

import {ReviewPage} from '../review/review';

@Component({
    selector: 'page-summary',
    templateUrl: 'summary.html'
})
export class SummaryPage {

    // All questions from the review
    public questions: any = [];
    
    // Review delegate
    public reviewDelegate: ReviewPage;

    constructor(public navCtrl: NavController, private navParams: NavParams) {
        this.questions = this.navParams.get('questions');
        this.reviewDelegate = this.navParams.get('delegate');
    }

    /**
     * Return to a quiz question
     */
    goToQuestion(index: number) {
        this.reviewDelegate.goToQuestion(index);
        this.navCtrl.pop();
    }
}
