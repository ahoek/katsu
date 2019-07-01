import { Component } from '@angular/core';
import { Platform } from '@ionic/angular';
import { StatusBar } from '@ionic-native/status-bar/ngx';
import { TranslateService } from '@ngx-translate/core';
import { GoogleAnalytics } from '@ionic-native/google-analytics/ngx';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html'
})
export class AppComponent {
  constructor(
    private platform: Platform,
    private statusBar: StatusBar,
    private google: GoogleAnalytics,
    private readonly translate: TranslateService,
  ) {
    this.initializeApp();
  }

  async initializeApp() {
    await this.platform.ready();

    // this.statusBar.styleDefault();

    this.translate.addLangs(['en', 'nl', 'ja']);
    this.translate.setDefaultLang('en');

    const browserLang = this.translate.getBrowserLang();
    this.translate.use(browserLang.match(/en|nl/) ? browserLang : 'en');

    this.google.startTrackerWithId('UA-92834344-1')
      .then(() => {
        return this.google.enableUncaughtExceptionReporting(true);
      })
      .then((success) => {
        console.log('startTrackerWithId success');
      })
      .catch((error) => {
        console.error('enableUncaughtExceptionReporting', error);
      });
  }
}
