import {Component, Input} from '@angular/core';
import {Question} from '../../models/question';
import {Settings} from '../../models/settings';

/**
 * Show a list of settings for the current review question
 */
@Component({
    selector: 'review-settings-list',
    templateUrl: 'review-settings-list.html'
})
export class ReviewSettingsListComponent {

    @Input('question') question: Question;
    @Input('settings') settings: Settings;

    constructor() {
    }
    
    ionViewDidLoad() {
        if (!this.settings) {
            this.settings = Settings.getDefault();
        }
    }
}
