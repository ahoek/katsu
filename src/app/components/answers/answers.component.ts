import { Component, Input } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

import { ExplanationStep, Question } from '../../models/question';
import { FuriganaComponent } from '../furigana/furigana.component';

/**
 * The correct answer(s) to a question, with rule-based steps explaining
 * how the answer is formed.
 */
@Component({
  selector: 'app-answers',
  templateUrl: './answers.component.html',
  styleUrls: ['./answers.component.scss'],
  imports: [FuriganaComponent, TranslatePipe],
})
export class AnswersComponent {
  @Input() question!: Question;

  /** Hide the grammar explanation (e.g. in compact listings) */
  @Input() showExplanation = true;

  get steps(): ExplanationStep[] {
    return this.question.explanationSteps();
  }
}
