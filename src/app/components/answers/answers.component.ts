import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { IonIcon } from '@ionic/angular/standalone';
import { TranslatePipe } from '@ngx-translate/core';

import { ExplanationStep, Question } from '../../models/question';
import { FuriganaComponent } from '../furigana/furigana.component';

// Unique ids so the disclosure button can point at its own steps list,
// also on the summary, which renders many of these at once.
let nextId = 0;

/**
 * The correct answer(s) to a question, with rule-based steps explaining
 * how the answer is formed.
 */
@Component({
  selector: 'app-answers',
  templateUrl: './answers.component.html',
  styleUrls: ['./answers.component.scss'],
  imports: [IonIcon, FuriganaComponent, TranslatePipe],
})
export class AnswersComponent implements OnChanges {
  @Input() question!: Question;

  /** Hide the grammar explanation (e.g. in compact listings) */
  @Input() showExplanation = true;

  readonly stepsId = `answer-steps-${nextId++}`;

  // Closed by default: it keeps the answer visible on a screen filled by the
  // keyboard, and keeps the summary scannable.
  explanationVisible = false;

  get steps(): ExplanationStep[] {
    return this.question.explanationSteps();
  }

  ngOnChanges(changes: SimpleChanges) {
    // A new question starts closed again
    if (changes['question']) {
      this.explanationVisible = false;
    }
  }

  toggleExplanation() {
    this.explanationVisible = !this.explanationVisible;
  }
}
