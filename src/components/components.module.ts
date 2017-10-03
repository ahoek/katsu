import {IonicModule} from 'ionic-angular';
import {NgModule} from '@angular/core';
import {AnswersComponent} from './answers/answers';
import {FuriganaComponent} from './furigana/furigana';

@NgModule({
    declarations: [
        AnswersComponent,
        FuriganaComponent,
    ],
    imports: [IonicModule],
    exports: [
        AnswersComponent,
        FuriganaComponent,
    ]
})
export class ComponentsModule {}
