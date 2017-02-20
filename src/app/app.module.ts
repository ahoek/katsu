import {NgModule, ErrorHandler} from '@angular/core';
import {IonicApp, IonicModule, IonicErrorHandler} from 'ionic-angular';
import {Storage} from '@ionic/storage';

import {KetsuApp} from './app.component';
import {HomePage} from '../pages/home/home';
import {ReviewPage} from '../pages/review/review';

import {QuestionData} from '../providers/question-data';

@NgModule({
    declarations: [
        KetsuApp,
        HomePage,
        ReviewPage,
    ],
    imports: [
        IonicModule.forRoot(KetsuApp, {
            backButtonText: 'Stop',
        }, {}
        )],
    bootstrap: [IonicApp],
    entryComponents: [
        KetsuApp,
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
