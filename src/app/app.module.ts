import {NgModule, ErrorHandler} from '@angular/core';
import {IonicApp, IonicModule, IonicErrorHandler} from 'ionic-angular';
import {IonicStorageModule} from '@ionic/storage';
import {BrowserModule} from '@angular/platform-browser';
import {HttpModule} from '@angular/http';
import {GoogleAnalytics} from '@ionic-native/google-analytics';

import {KatsuApp} from './app.component';

@NgModule({
    declarations: [
        KatsuApp,
    ],
    imports: [
        BrowserModule,
        HttpModule,
        IonicModule.forRoot(KatsuApp, {
            mode: 'ios',
        }),
        IonicStorageModule.forRoot(),
    ],
    bootstrap: [IonicApp],
    entryComponents: [
        KatsuApp,
    ],
    providers: [
        {provide: ErrorHandler, useClass: IonicErrorHandler},
        GoogleAnalytics,
    ]
})
export class AppModule {}

