import {NgModule, ErrorHandler} from '@angular/core';
import {IonicApp, IonicModule, IonicErrorHandler} from 'ionic-angular';
import {Storage} from '@ionic/storage';

import {KatsuApp} from './app.component';
import {HomePage} from '../pages/home/home';
import {ReviewPage} from '../pages/review/review';
import {SummaryPage} from '../pages/summary/summary';

import {QuestionData} from '../providers/question-data';

@NgModule({
    declarations: [
        KatsuApp,
        HomePage,
        ReviewPage,
        SummaryPage,
    ],
    imports: [
        IonicModule.forRoot(KatsuApp, {
            backButtonText: 'Stop',
        }, {}
        )],
    bootstrap: [IonicApp],
    entryComponents: [
        KatsuApp,
        HomePage,
        ReviewPage,
        SummaryPage,
    ],
    providers: [
        {provide: ErrorHandler, useClass: IonicErrorHandler},
        Storage,
        QuestionData
    ]
})
export class AppModule {}
