import {NgModule, ErrorHandler} from '@angular/core';
import {IonicApp, IonicModule, IonicErrorHandler} from 'ionic-angular';
import {Storage} from '@ionic/storage';

import {MyApp} from './app.component';
import {HomePage} from '../pages/home/home';
import {ReviewPage} from '../pages/review/review';

import {QuestionData} from '../providers/question-data';

@NgModule({
    declarations: [
        MyApp,
        HomePage,
        ReviewPage,
    ],
    imports: [
        IonicModule.forRoot(MyApp)
    ],
    bootstrap: [IonicApp],
    entryComponents: [
        MyApp,
        HomePage,
        ReviewPage,
    ],
    providers: [
        {provide: ErrorHandler, useClass: IonicErrorHandler},
        Storage,
        QuestionData
    ]
})
export class AppModule {}
