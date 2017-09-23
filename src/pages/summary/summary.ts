import {Component} from '@angular/core';
import {NavController, NavParams, Platform} from 'ionic-angular';
import {GoogleAnalytics} from '@ionic-native/google-analytics';

import {ReviewPage} from '../review/review';
import {Question} from '../../models/question';
import {IonicPage} from 'ionic-angular';

@IonicPage()
@Component({
    selector: 'page-summary',
    templateUrl: 'summary.html'
})
export class SummaryPage {

    // All questions from the review
    public questions: Question[] = [];
    
    // Review delegate
    public reviewDelegate: ReviewPage;

    constructor(
        public navCtrl: NavController, 
        public platform: Platform,
        private navParams: NavParams,
        private google: GoogleAnalytics
    ) {
        this.questions = this.navParams.get('questions');
        this.reviewDelegate = this.navParams.get('delegate');
    }
    
    ionViewDidLoad() {
        this.platform.ready().then(() => {
            this.google.trackView('Summary Page');
        });         
    }

    /**
     * Return to a review question
     */
    goToQuestion(index: number) {
        this.reviewDelegate.goToQuestion(index);
        this.navCtrl.pop();
    }
}
