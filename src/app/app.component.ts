import { Component, DOCUMENT, inject } from '@angular/core';
import { NavigationStart, Router } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { TranslateService } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import {
  arrowBack,
  arrowForward,
  barcodeOutline,
  bonfireOutline,
  briefcaseOutline,
  chatboxEllipsesOutline,
  checkmarkCircle,
  closeCircle,
  codeDownloadOutline,
  codeWorkingOutline,
  flagOutline,
  hammerOutline,
  happyOutline,
  heartOutline,
  languageOutline,
  logInOutline,
  logoPaypal,
  megaphoneOutline,
  playBackOutline,
  playForwardOutline,
  sadOutline,
  shirtOutline,
  shuffle,
  shuffleOutline,
  trendingUp,
  volumeHighOutline,
  walkOutline,
} from 'ionicons/icons';

import { AnalyticsService } from './shared/analytics.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent {
  private readonly analytics = inject(AnalyticsService);
  private readonly translate = inject(TranslateService);
  private readonly router = inject(Router);
  private readonly title = inject(Title);
  private readonly doc = inject(DOCUMENT);

  constructor() {
    addIcons({
      arrowBack, arrowForward, barcodeOutline, bonfireOutline, briefcaseOutline,
      chatboxEllipsesOutline, checkmarkCircle, closeCircle, codeDownloadOutline,
      codeWorkingOutline, flagOutline, hammerOutline, happyOutline, heartOutline,
      languageOutline, logInOutline, logoPaypal, megaphoneOutline, playBackOutline,
      playForwardOutline, sadOutline, shirtOutline, shuffle, shuffleOutline,
      trendingUp, volumeHighOutline, walkOutline,
    });
    this.initializeApp();
  }

  initializeApp() {
    this.translate.addLangs(['en', 'nl', 'ja']);

    const browserLang = (navigator.language || 'en').split('-')[0];
    this.translate.use(['en', 'nl'].includes(browserLang) ? browserLang : 'en');

    this.translate.onLangChange.subscribe(() => {
      this.updateLanguage();
    });

    this.router.events.subscribe(event => {
      // Observe router and when it starts navigation, track the view
      if (event instanceof NavigationStart) {
        let title = this.title.getTitle();
        const currentNav = this.router.getCurrentNavigation();
        // Get title if it was sent on state
        if (currentNav && currentNav.extras.state) {
          title = currentNav.extras.state['title'];
        }
        // Pass url and page title
        this.analytics.trackView(event.url, title);
      }
    });
  }

  updateLanguage(): void {
    this.doc.documentElement.lang = this.translate.getCurrentLang() ?? 'en';
  }
}
