import {Component, ViewChild} from '@angular/core';
import {Platform, Nav} from 'ionic-angular';
import {StatusBar, Splashscreen, Keyboard} from 'ionic-native';

import {HomePage} from '../pages/home/home';
//import {GoogleAnalytics} from 'ionic-native';


@Component({
    templateUrl: 'app.html'
})
export class KatsuApp {
    rootPage = HomePage;
    @ViewChild(Nav) nav: Nav;

    constructor(platform: Platform) {
        platform.ready().then(() => {
            // Okay, so the platform is ready and our plugins are available.
            // Here you can do any higher level native things you might need.
            StatusBar.styleDefault();
            Splashscreen.hide();
            Keyboard.disableScroll(true);
        });
    }

    /**
     * Subscribe to event transmitters
     */
    ngAfterViewInit() {
        this.nav.viewDidEnter.subscribe((data) => {
            console.log(data.instance.constructor.name);
            //GoogleAnalytics.startTrackerWithId('UA-92834344-1').then(() => {
                //GoogleAnalytics.trackView(data.instance.constructor.name)
            //}).catch(e => console.log('Error starting GoogleAnalytics', e));
        });
    }
}
