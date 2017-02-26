import {Component} from '@angular/core';
import {NavController, NavParams} from 'ionic-angular';

@Component({
    selector: 'page-summary',
    templateUrl: 'summary.html'
})
export class SummaryPage {

    public questions: any = [];

    constructor(public navCtrl: NavController, private navParams: NavParams) {
        this.questions = this.navParams.get('questions');
    }

    goToQuestion(index: number) {
        this.navCtrl.pop();
    }
}
