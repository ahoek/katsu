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
import { CreditComponent } from '../components/credit/credit.component';

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
    CreditComponent,
  ],
})
export class SummaryPageComponent {
  navCtrl = inject(NavController);
  private questionService = inject(QuestionDataService);
  private readonly translate = inject(TranslateService);


  // Answered questions with their original index, so the summary can skip
  // unanswered/skipped questions yet still navigate back to the right one.
  items: { question: Question; index: number }[];

  summaryText = '';

  constructor() {
    const all = this.questionService.questions();
    // Drop the final question if it was never answered — that is the one
    // on screen when the user tapped Stop. Earlier empty ones were skipped
    // on purpose and stay in the list.
    const lastUnanswered = all.length > 0
      && !all[all.length - 1].givenAnswer
      && all[all.length - 1].correct === undefined;
    const shown = lastUnanswered ? all.slice(0, -1) : all;
    this.items = shown.map((question, index) => ({ question, index }));
    this.questionService.resetAnsweredStatus();
    this.setSummaryText();
  }

  setSummaryText() {
    const answered = this.items.filter(item => item.question.givenAnswer);
    const correct = answered.filter(item => item.question.correct === true).length;
    this.summaryText = this.translate.instant('summary.text', {
      correct,
      total: answered.length,
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
