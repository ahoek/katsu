import {Component, ViewChild} from '@angular/core';
import {Platform, Nav} from 'ionic-angular';
import {StatusBar} from '@ionic-native/status-bar';
import {SplashScreen} from '@ionic-native/splash-screen';
import {Keyboard} from '@ionic-native/keyboard';
import {GoogleAnalytics} from '@ionic-native/google-analytics';
import { TranslateService } from '@ngx-translate/core';

@Component({
    templateUrl: 'app.html',
    providers: [
        Keyboard,        
        SplashScreen,
        StatusBar,
    ],
})
export class KatsuApp {
    rootPage = 'HomePage';
    @ViewChild(Nav) nav: Nav;

    constructor(
        public platform: Platform, 
        private splash: SplashScreen,
        private statusBar: StatusBar,
        private keyboard: Keyboard,
        private google: GoogleAnalytics,
        private translate: TranslateService,
    ) {
        this.platform.ready().then(() => {
            this.statusBar.styleDefault();
            this.splash.hide();
            this.keyboard.disableScroll(true);

            translate.addLangs(["en", "nl"]);
            translate.setDefaultLang('en');

            let browserLang = translate.getBrowserLang();
            translate.use(browserLang.match(/en|nl/) ? browserLang : 'en');


            // google
            return this.google.startTrackerWithId('UA-92834344-1')
                .then(() => {
                    console.log('Google analytics is ready now');
                    return this.google.enableUncaughtExceptionReporting(true);
                }).then((_success) => {
                    console.log('startTrackerWithId success');
                }).catch((_error) => {
                    console.log('enableUncaughtExceptionReporting', _error);
                });
        });
    }
}
