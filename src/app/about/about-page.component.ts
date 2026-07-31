import { Component } from '@angular/core';
import {
  IonButton,
  IonButtons,
  IonMenuButton,
  IonContent,
  IonHeader,
  IonIcon,
  IonToolbar,
} from '@ionic/angular/standalone';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-about',
  templateUrl: './about-page.component.html',
  styleUrls: ['./about-page.component.scss'],
  imports: [
    IonButton,
    IonButtons,
    IonMenuButton,
    IonContent,
    IonHeader,
    IonIcon,
    IonToolbar,
    TranslatePipe,
  ],
})
export class AboutPageComponent {}
