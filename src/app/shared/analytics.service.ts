import { Injectable } from '@angular/core';
import {GoogleTagManagerService} from "angular-google-tag-manager";
declare const ga: any;

@Injectable({ providedIn: 'root' })
  export class AnalyticsService {
    constructor(
    private gtmService: GoogleTagManagerService,
  ) { }

  setTracker(tracker: any) {
    // if (!localStorage.getItem('ga:clientId') ) {
    //   localStorage.setItem( 'ga:clientId', tracker.get('clientId') );
    // }
  }

  startTrackerWithId(id: string) {
    // ga('create', {
    //   storage: 'none',
    //   trackingId: id,
    //   clientId: localStorage.getItem('ga:clientId'),
    // });
    // ga('set', 'checkProtocolTask', null);
    // ga('set', 'transportUrl', 'https://www.google-analytics.com/collect');
    // ga(this.setTracker);
  }

  trackView(pageUrl: string, screenName: string) {
    const gtmTag = {
      event: 'page',
      pageName: pageUrl
    };
    this.gtmService.pushTag(gtmTag);
    console.log(gtmTag);

    // ga('set', {
    //   page: pageUrl,
    //   title: screenName,
    // });
    // ga('send', 'pageview');
  }

  trackEvent(category: string, action: string, label?: string, value?: number) {
    // push GTM data layer with a custom event
    const gtmTag = {
      event: 'event',
      data: {
        eventCategory: category,
        eventLabel: label,
        eventAction: action,
        eventValue: value,
      },
    };
    this.gtmService.pushTag(gtmTag);
    console.log(gtmTag);

    // ga('send', 'event', {
    //   eventCategory: category,
    //   eventLabel: label,
    //   eventAction: action,
    //   eventValue: value,
    // });
  }
}
