import {Component, ViewChild} from '@angular/core';
import {Platform, Nav} from 'ionic-angular';
import {StatusBar} from '@ionic-native/status-bar';
import {SplashScreen} from '@ionic-native/splash-screen';
import {Keyboard} from '@ionic-native/keyboard';
import {HomePage} from '../pages/home/home';
import {GoogleAnalytics} from '@ionic-native/google-analytics';

@Component({
    templateUrl: 'app.html',
    providers: [Keyboard],
})
export class KatsuApp {
    rootPage = HomePage;
    @ViewChild(Nav) nav: Nav;

    constructor(
        public platform: Platform, 
        private splash: SplashScreen,
        private statusBar: StatusBar,
        private keyboard: Keyboard,
        private google: GoogleAnalytics
    ) {
        this.platform.ready().then(() => {
            // Okay, so the platform is ready and our plugins are available.
            // Here you can do any higher level native things you might need.
            this.statusBar.styleDefault();
            //this.statusBar.hide();
            this.splash.hide();
            this.keyboard.disableScroll(true);

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
