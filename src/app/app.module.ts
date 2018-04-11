import {NgModule, ErrorHandler} from '@angular/core';
import {HttpClient, HttpClientModule} from '@angular/common/http';
import {BrowserModule} from '@angular/platform-browser';
import {IonicApp, IonicModule, IonicErrorHandler} from 'ionic-angular';
import {IonicStorageModule} from '@ionic/storage';
import {GoogleAnalytics} from '@ionic-native/google-analytics';
import { TranslateModule, TranslateLoader } from "@ngx-translate/core";
import { TranslateHttpLoader } from "@ngx-translate/http-loader";
import {KatsuApp} from './app.component';

export function HttpLoaderFactory(httpClient: HttpClient) {
    return new TranslateHttpLoader(httpClient, "../assets/i18n/", ".json");
}

@NgModule({
    declarations: [
        KatsuApp,
    ],
    imports: [
        BrowserModule,
        HttpClientModule,
        TranslateModule.forRoot({
            loader: {
                provide: TranslateLoader,
                useFactory: HttpLoaderFactory,
                deps: [HttpClient]
            }
        }),
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
