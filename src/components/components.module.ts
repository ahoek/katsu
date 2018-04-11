import {IonicModule} from 'ionic-angular';
import {NgModule} from '@angular/core';
import {AnswersComponent} from './answers/answers';
import {FuriganaComponent} from './furigana/furigana';
import {ReviewSettingsListComponent} from './review-settings-list/review-settings-list';
import {TranslateModule} from "@ngx-translate/core";

@NgModule({
    declarations: [
        AnswersComponent,
        FuriganaComponent,
        ReviewSettingsListComponent,
    ],
    imports: [
        IonicModule,
        TranslateModule,
    ],
    exports: [
        AnswersComponent,
        FuriganaComponent,
        ReviewSettingsListComponent,
        TranslateModule,
    ]
})
export class ComponentsModule {}
