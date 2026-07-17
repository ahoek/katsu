import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonRouterLink,
  IonTitle,
  IonToolbar,
  NavController,
} from '@ionic/angular/standalone';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

import { QuestionDataService } from '../review/question-data.service';
import { Question } from '../models/question';
import { AnswersComponent } from '../components/answers/answers.component';

@Component({
  selector: 'app-summary',
  templateUrl: './summary-page.component.html',
  styleUrls: ['./summary-page.component.scss'],
  imports: [
    RouterLink,
    IonRouterLink,
    IonButton,
    IonButtons,
    IonContent,
    IonHeader,
    IonIcon,
    IonItem,
    IonLabel,
    IonList,
    IonTitle,
    IonToolbar,
    TranslatePipe,
    AnswersComponent,
  ],
})
export class SummaryPageComponent {
  navCtrl = inject(NavController);
  private questionService = inject(QuestionDataService);
  private readonly translate = inject(TranslateService);


  questions: Question[];

  summaryText = '';

  constructor() {
    this.questions = this.questionService.questions();
    this.questionService.resetAnsweredStatus();
    this.setSummaryText();
  }

  setSummaryText() {
    this.summaryText = this.translate.instant('summary.text', {
      correct: this.questionService.getTotalCorrect(),
      total: this.questions.length,
    }) as string;
  }

  /**
   * Return to a review question
   */
  goToQuestion(index: number) {
    this.questionService.index.set(index);
    this.navCtrl.navigateBack('/review');
  }
}
