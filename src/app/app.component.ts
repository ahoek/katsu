import { Component, DOCUMENT, inject } from '@angular/core';
import { NavigationStart, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { Title } from '@angular/platform-browser';
import {
  IonApp,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonMenu,
  IonMenuToggle,
  IonNote,
  IonRouterLink,
  IonRouterOutlet,
  IonToolbar,
} from '@ionic/angular/standalone';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import {
  alertCircle,
  arrowBack,
  arrowForward,
  barcodeOutline,
  briefcaseOutline,
  brushOutline,
  checkmarkCircle,
  chevronDown,
  close,
  closeCircle,
  codeWorkingOutline,
  helpCircleOutline,
  languageOutline,
  logoGithub,
  logoPaypal,
  mailOutline,
  moonOutline,
  optionsOutline,
  pencilOutline,
  personCircleOutline,
  playBackOutline,
  phonePortraitOutline,
  playForwardOutline,
  repeatOutline,
  settingsOutline,
  shirtOutline,
  shuffleOutline,
  volumeHighOutline,
} from 'ionicons/icons';

import en from '../assets/i18n/en.json';
import nl from '../assets/i18n/nl.json';

import { AnalyticsService } from './shared/analytics.service';
import { SettingsService } from './shared/settings.service';
import { ThemeService } from './shared/theme.service';
import { UpdateService } from './shared/update.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  imports: [
    IonApp,
    IonContent,
    IonHeader,
    IonIcon,
    IonItem,
    IonLabel,
    IonList,
    IonMenu,
    IonMenuToggle,
    IonNote,
    IonRouterLink,
    IonRouterOutlet,
    IonToolbar,
    RouterLink,
    RouterLinkActive,
    TranslatePipe,
  ],
})
export class AppComponent {
  private readonly analytics = inject(AnalyticsService);
  private readonly translate = inject(TranslateService);
  private readonly router = inject(Router);
  private readonly title = inject(Title);
  private readonly doc = inject(DOCUMENT);
  private readonly updates = inject(UpdateService);
  private readonly settings = inject(SettingsService);
  private readonly theme = inject(ThemeService);

  constructor() {
    this.updates.start();
    addIcons({
      alertCircle, arrowBack, arrowForward, barcodeOutline, briefcaseOutline, brushOutline,
      checkmarkCircle, chevronDown, close, closeCircle, codeWorkingOutline, helpCircleOutline,
      languageOutline, logoGithub, logoPaypal, mailOutline, moonOutline, optionsOutline,
      pencilOutline, personCircleOutline, phonePortraitOutline, playBackOutline,
      playForwardOutline, repeatOutline, settingsOutline, shirtOutline, shuffleOutline,
      volumeHighOutline,
    });
    this.initializeApp();
  }

  initializeApp() {
    // Redirect old hash URLs (e.g. /#/information) to their path equivalent
    if (location.hash.startsWith('#/')) {
      this.router.navigateByUrl(location.hash.substring(1), { replaceUrl: true });
    }

    this.settings.userSettings().then(() => {
      this.theme.apply(this.settings.theme);
      // A stored language choice outlives the browser-language guess below.
      this.translate.use(this.settings.language);
    });

    // Translations are bundled with the app so they can never be stale
    // relative to the code (e.g. a service worker mid-update).
    this.translate.setTranslation('en', en);
    this.translate.setTranslation('nl', nl);
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
