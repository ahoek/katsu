import {IonicModule} from 'ionic-angular';
import {NgModule} from '@angular/core';
import {AnswersComponent} from './answers/answers';
import {FuriganaComponent} from './furigana/furigana';
import {ReviewSettingsListComponent} from './review-settings-list/review-settings-list';

@NgModule({
    declarations: [
        AnswersComponent,
        FuriganaComponent,
        ReviewSettingsListComponent,
    ],
    imports: [IonicModule],
    exports: [
        AnswersComponent,
        FuriganaComponent,
        ReviewSettingsListComponent,
    ]
})
export class ComponentsModule {}
