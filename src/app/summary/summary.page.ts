import { Component, OnInit } from '@angular/core';
import { NavController, Platform } from '@ionic/angular';
import { QuestionDataService } from '../review/question-data.service';
import { Question } from '../models/question';
import { GoogleAnalytics } from '@ionic-native/google-analytics/ngx';

@Component({
  selector: 'app-summary',
  templateUrl: './summary.page.html',
  styleUrls: ['./summary.page.scss'],
})
export class SummaryPage implements OnInit {

  questions: Question[];

  constructor(
    public navCtrl: NavController,
    public platform: Platform,
    private questionService: QuestionDataService,
    private google: GoogleAnalytics
  ) {
    this.questions = this.questionService.questions;
  }

  ngOnInit() {
    this.platform.ready().then(() => {
      this.google.trackView('Summary Page');
    });
  }

  /**
   * Return to a review question
   */
  goToQuestion(index: number) {
    this.questionService.index = index;
    this.navCtrl.navigateBack('/review');
  }
}
