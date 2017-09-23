import {IonicModule} from 'ionic-angular';
import {NgModule} from '@angular/core';
import {AnswersComponent} from './answers/answers';
@NgModule({
    declarations: [
        AnswersComponent,
    ],
    imports: [IonicModule],
    exports: [
        AnswersComponent,
    ]
})
export class ComponentsModule {}
