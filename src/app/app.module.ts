import {NgModule, ErrorHandler} from '@angular/core';
import {HttpClientModule} from '@angular/common/http';
import {BrowserModule} from '@angular/platform-browser';
import {IonicApp, IonicModule, IonicErrorHandler} from 'ionic-angular';
import {IonicStorageModule} from '@ionic/storage';
import {GoogleAnalytics} from '@ionic-native/google-analytics';
import {KatsuApp} from './app.component';

@NgModule({
    declarations: [
        KatsuApp,
    ],
    imports: [
        BrowserModule,
        HttpClientModule,
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
