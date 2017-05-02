import {NgModule, ErrorHandler} from '@angular/core';
import {IonicApp, IonicModule, IonicErrorHandler} from 'ionic-angular';
import {IonicStorageModule} from '@ionic/storage';
import {BrowserModule} from '@angular/platform-browser';
import {HttpModule} from '@angular/http';
import {GoogleAnalytics} from '@ionic-native/google-analytics';
import {SplashScreen} from '@ionic-native/splash-screen';
import {StatusBar} from '@ionic-native/status-bar';

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
        BrowserModule,
        HttpModule,
        IonicModule.forRoot(KatsuApp, {
            mode: 'ios',
            //statusbarPadding: false,
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
        QuestionData,
        GoogleAnalytics,
        SplashScreen,
        StatusBar,
    ]
})
export class AppModule {}
