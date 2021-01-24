import { Component } from '@angular/core';
import { NavController, Platform } from '@ionic/angular';
import { QuestionDataService } from '../review/question-data.service';
import { Question } from '../models/question';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-summary',
  templateUrl: './summary-page.component.html',
  styleUrls: ['./summary-page.component.scss'],
})
export class SummaryPageComponent {

  questions: Question[];

  summaryText = '';

  constructor(
    public navCtrl: NavController,
    public platform: Platform,
    private questionService: QuestionDataService,
    private readonly translate: TranslateService,
  ) {
    this.questions = this.questionService.questions;
    this.questionService.resetAnsweredStatus();
    this.setSummaryText();
  }

  setSummaryText() {
    this.summaryText = this.translate.instant('summary.text', {
      correct: this.questionService.getTotalCorrect(),
      total: this.questions.length,
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
