import { Component, OnInit } from '@angular/core';
import { NavController, Platform } from '@ionic/angular';
import { GoogleAnalytics } from '@ionic-native/google-analytics/ngx';

@Component({
  selector: 'app-information',
  templateUrl: './information.page.html',
  styleUrls: ['./information.page.scss'],
})
export class InformationPage implements OnInit {

  constructor(
    public platform: Platform,
    private google: GoogleAnalytics,
  ) { }

  ngOnInit() {
    console.log('ionViewDidLoad InformationPage');
    this.platform.ready().then(() => {
      this.google.trackView('Information Page');
    });
  }

}
