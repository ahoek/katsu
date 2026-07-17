import { Component, Input } from '@angular/core';

import { Question } from '../../models/question';
import { FuriganaComponent } from '../furigana/furigana.component';

@Component({
  selector: 'app-answers',
  templateUrl: './answers.component.html',
  styleUrls: ['./answers.component.scss'],
  imports: [FuriganaComponent],
})
export class AnswersComponent {
  @Input() question!: Question;
}
