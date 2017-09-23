import {Component, Input} from '@angular/core';
import {Question} from '../../models/question';

@Component({
    selector: 'answers',
    templateUrl: 'answers.html'
})
export class AnswersComponent {

    @Input() question: Question;

    constructor() {
    }
}
