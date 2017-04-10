import {NgModule, ErrorHandler} from '@angular/core';
import {IonicApp, IonicModule, IonicErrorHandler} from 'ionic-angular';
import {IonicStorageModule} from '@ionic/storage';

import {KatsuApp} from './app.component';
import {HomePage} from '../pages/home/home';
import {ReviewPage} from '../pages/review/review';
import {SummaryPage} from '../pages/summary/summary';
import {InformationPage} from '../pages/information/information';

import {QuestionData} from '../providers/question-data';

@NgModule({
    declarations: [
        KatsuApp,
        HomePage,
        ReviewPage,
        SummaryPage,
        InformationPage,
    ],
    imports: [
        IonicModule.forRoot(KatsuApp, {
            mode: 'ios',
        }),
        IonicStorageModule.forRoot()
    ],
    bootstrap: [IonicApp],
    entryComponents: [
        KatsuApp,
        HomePage,
        ReviewPage,
        SummaryPage,
        InformationPage,
    ],
    providers: [
        {provide: ErrorHandler, useClass: IonicErrorHandler},
        QuestionData
    ]
})
export class AppModule {}
