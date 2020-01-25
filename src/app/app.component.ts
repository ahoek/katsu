import { Component, Inject } from '@angular/core';
import { Platform } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { AnalyticsService } from './shared/analytics.service';
import { NavigationStart, Router} from '@angular/router';
import { Title } from '@angular/platform-browser';
import { Subscription } from 'rxjs';
import { DOCUMENT } from '@angular/common';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html'
})
export class AppComponent {
  constructor(
    private platform: Platform,
    private analytics: AnalyticsService,
    private readonly translate: TranslateService,
    public router: Router,
    private title: Title,
    @Inject(DOCUMENT) private doc: Document,
  ) {
    this.initializeApp();
  }

  onLangChange: Subscription = undefined;

  async initializeApp() {
    await this.platform.ready();

    this.translate.addLangs(['en', 'nl', 'ja']);
    this.translate.setDefaultLang('en');

    const browserLang = this.translate.getBrowserLang();
    this.translate.use(browserLang.match(/en|nl/) ? browserLang : 'en');

    this.onLangChange = this.translate.onLangChange.subscribe(() => {
      this.updateLanguage();
    });

    this.analytics.startTrackerWithId('UA-92834344-1');
    this.router.events
      .subscribe(event => {
        // Observe router and when it start navigation it will track the view
        if (event instanceof NavigationStart) {
          let title = this.title.getTitle();
          // Get title if it was sent on state
          if (this.router.getCurrentNavigation().extras.state) {
            title = this.router.getCurrentNavigation().extras.state.title;
          }
          // Pass url and page title
          this.analytics.trackView(event.url, title);
        }
      });
  }

  updateLanguage(): void {
    this.doc.documentElement.lang = this.translate.currentLang;
  }
}
